import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { renderApplyNotificationHtml } from '@/lib/email/apply-notification-html'
import {
  ApplyNotificationPdf,
  type FontBundle,
} from '@/lib/email/apply-notification-pdf'
import type { ApplicantData } from '@/lib/email/types'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import React from 'react'
import { readFileSync } from 'fs'
import path from 'path'

export const runtime = 'nodejs'
export const maxDuration = 30

// ──────────────────────────────────────────────────────────────
// Asset loading
//
// We use static path.resolve(process.cwd(), 'public', ...) calls
// at module load so Vercel's Node File Trace bundles these assets
// with the serverless function. Reading lazily inside an imported
// module (lib/email/...) was NOT reliably traced — see research in
// https://vercel.com/kb/guide/how-can-i-use-files-in-serverless-functions
//
// next.config.js also sets experimental.outputFileTracingIncludes
// for public/fonts and public/branding as belt-and-suspenders.
// ──────────────────────────────────────────────────────────────

function loadAssetAsDataUri(relativePath: string, mime: string): string {
  try {
    const abs = path.resolve(process.cwd(), 'public', relativePath)
    const bytes = readFileSync(abs)
    return `data:${mime};base64,${bytes.toString('base64')}`
  } catch (err) {
    console.error(`[apply] Failed to load asset ${relativePath}:`, err)
    return ''
  }
}

// Load all PDF assets once at module load (amortized across requests
// on a warm function instance).
const LOGO_DATA_URI = loadAssetAsDataUri('branding/vitalis-logo.png', 'image/png')

const FONT_BUNDLE: FontBundle = {
  cormorant400:        loadAssetAsDataUri('fonts/cormorant-garamond-400.woff',        'font/woff'),
  cormorant400Italic:  loadAssetAsDataUri('fonts/cormorant-garamond-400-italic.woff', 'font/woff'),
  cormorant500:        loadAssetAsDataUri('fonts/cormorant-garamond-500.woff',        'font/woff'),
  cormorant600:        loadAssetAsDataUri('fonts/cormorant-garamond-600.woff',        'font/woff'),
  dmsans400:           loadAssetAsDataUri('fonts/dm-sans-400.woff',                   'font/woff'),
  dmsans500:           loadAssetAsDataUri('fonts/dm-sans-500.woff',                   'font/woff'),
  dmsans600:           loadAssetAsDataUri('fonts/dm-sans-600.woff',                   'font/woff'),
  dmsans700:           loadAssetAsDataUri('fonts/dm-sans-700.woff',                   'font/woff'),
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const {
      name, email, phone, address, city, state, zip, gender,
      credential_type, additional_credentials, license_number,
      years_experience, skills, preferred_days, shift_preferences,
      service_radius_miles, has_car, spanish_speaking, hoyer_lift,
      wheelchair_transfer, meal_prep, total_care, notes,
    } = body

    if (!name || !email || !phone || !credential_type) {
      return NextResponse.json(
        { error: 'Name, email, phone and credential are required' },
        { status: 400 }
      )
    }

    const db = createServiceClient()

    // Duplicate email check
    const { data: existing } = await db
      .from('providers')
      .select('id')
      .eq('email', email)
      .maybeSingle()
    if (existing) {
      return NextResponse.json(
        { error: 'A provider with this email already exists in our system.' },
        { status: 409 }
      )
    }

    const notesColumnValue = notes
      ? `[APPLICATION] Years exp: ${years_experience || 'N/A'}\n\n${notes}`
      : `[APPLICATION] Years exp: ${years_experience || 'N/A'}`

    const { data: provider, error: insertErr } = await db
      .from('providers')
      .insert({
        name,
        email,
        phone,
        address,
        city: city || 'Silver Spring',
        state: state || 'MD',
        zip,
        gender,
        credential_type,
        additional_credentials: additional_credentials || [],
        license_number,
        skills: skills || [],
        preferred_days: preferred_days || [],
        shift_preferences: shift_preferences || [],
        service_radius_miles: service_radius_miles || 15,
        has_car: has_car || false,
        spanish_speaking: spanish_speaking || false,
        hoyer_lift: hoyer_lift || false,
        wheelchair_transfer: wheelchair_transfer || false,
        meal_prep: meal_prep || false,
        total_care: total_care || false,
        available: false,
        status: 'inactive',
        notes: notesColumnValue,
      })
      .select()
      .single()

    if (insertErr || !provider) {
      return NextResponse.json(
        { error: insertErr?.message || 'Failed to save application' },
        { status: 400 }
      )
    }

    const applicant: ApplicantData = {
      id: provider.id,
      name,
      email,
      phone,
      address,
      city: city || 'Silver Spring',
      state: state || 'MD',
      zip,
      gender,
      credential_type,
      additional_credentials: additional_credentials || [],
      license_number,
      years_experience,
      skills: skills || [],
      preferred_days: preferred_days || [],
      shift_preferences: shift_preferences || [],
      service_radius_miles: service_radius_miles || 15,
      capabilities: {
        has_car: !!has_car,
        spanish_speaking: !!spanish_speaking,
        meal_prep: !!meal_prep,
        total_care: !!total_care,
        wheelchair_transfer: !!wheelchair_transfer,
        hoyer_lift: !!hoyer_lift,
      },
      notes: notes || null,
      submitted_at: new Date(),
    }

    const coordinatorEmail = process.env.COORDINATOR_EMAIL
    const resendKey        = process.env.RESEND_API_KEY
    const fromEmail        = process.env.RESEND_FROM_EMAIL
    const appUrl           = process.env.NEXT_PUBLIC_APP_URL || ''

    let notified = false

    if (coordinatorEmail && resendKey && fromEmail) {
      try {
        const locationForSubject = [city, state].filter(Boolean).join(' ') || 'MD'
        const subject = `New Provider Application — ${name} (${credential_type}, ${locationForSubject})`

        // Logo URL — used by the EMAIL template. Gmail/Outlook fetch via
        // image proxies, so it must be publicly reachable. /branding/
        // is whitelisted in middleware.ts as of v2.7.15-a.
        const logoUrl = `${appUrl}/branding/vitalis-logo.png`
        const portalUrl = `${appUrl}/providers/${provider.id}`

        const html = renderApplyNotificationHtml(applicant, { logoUrl, portalUrl })

        // Generate PDF. Fonts and logo are base64 data URIs loaded at
        // module load from public/fonts and public/branding.
        let pdfBuffer: Buffer
        try {
          const pdfElement = React.createElement(ApplyNotificationPdf, {
            applicant,
            logoDataUrl: LOGO_DATA_URI,
            fonts: FONT_BUNDLE,
          }) as unknown as React.ReactElement<DocumentProps>
          pdfBuffer = await renderToBuffer(pdfElement)
        } catch (pdfErr: any) {
          console.error('[apply] PDF generation failed:', pdfErr?.message || pdfErr)
          if (pdfErr?.stack) console.error('[apply] PDF stack:', pdfErr.stack)
          pdfBuffer = Buffer.alloc(0)
        }

        const safeName = name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Applicant'
        const datestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const pdfFilename = `Vitalis-Application-${safeName}-${datestamp}.pdf`

        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)

        // Reply-To = applicant's email. Resend SDK v3.x uses snake_case
        // `reply_to` — the camelCase `replyTo` form is a v4.x rename that
        // silently no-ops on v3. Pinned `resend@^3.2.0` in package.json
        // so we write the v3 form. If we ever bump to v4, change this
        // back to replyTo: email.
        const sendPayload: any = {
          from: fromEmail,
          to: coordinatorEmail,
          reply_to: email,
          subject,
          html,
        }

        if (pdfBuffer.length > 0) {
          sendPayload.attachments = [
            { filename: pdfFilename, content: pdfBuffer },
          ]
        }

        const sendResult = await resend.emails.send(sendPayload)

        if (sendResult && (sendResult as any).error) {
          throw new Error(
            `Resend error: ${JSON.stringify((sendResult as any).error)}`
          )
        }

        notified = true
      } catch (sendErr: any) {
        try {
          await db.from('email_send_failures').insert({
            recipient: coordinatorEmail,
            subject: `New Provider Application — ${name} (${credential_type})`,
            error_message: sendErr?.message || String(sendErr) || 'Unknown send error',
            payload: {
              kind: 'apply_notification',
              provider_id: provider.id,
              applicant_name: name,
              applicant_email: email,
              credential: credential_type,
              from_email: fromEmail,
              applicant_snapshot: {
                ...applicant,
                submitted_at: applicant.submitted_at.toISOString(),
              },
            },
            related_provider_id: provider.id,
          })
        } catch (logErr) {
          console.error('[apply] Failed to log email failure:', logErr)
          console.error('[apply] Original send error was:', sendErr)
        }
      }
    }

    return NextResponse.json({ success: true, id: provider.id, notified })
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Unexpected error' },
      { status: 500 }
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
