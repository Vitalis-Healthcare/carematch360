import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'
import { renderApplyNotificationHtml } from '@/lib/email/apply-notification-html'
import { ApplyNotificationPdf } from '@/lib/email/apply-notification-pdf'
import type { ApplicantData } from '@/lib/email/types'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import React from 'react'

export const runtime = 'nodejs' // @react-pdf/renderer requires Node, not Edge
export const maxDuration = 30   // PDF + font fetch can take a few seconds on cold start

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

    // Compose the notes column with the [APPLICATION] prefix (matches
    // existing convention — the email template strips it back out).
    const notesColumnValue = notes
      ? `[APPLICATION] Years exp: ${years_experience || 'N/A'}\n\n${notes}`
      : `[APPLICATION] Years exp: ${years_experience || 'N/A'}`

    // Insert provider row
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

    // Build the shared ApplicantData object (raw applicant notes, not the
    // prefixed DB value).
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
      notes: notes || null, // raw, no prefix
      submitted_at: new Date(),
    }

    // Notify coordinator — soft failure pattern.
    // Any error here is logged to email_send_failures; the applicant
    // still sees success because their record IS saved.
    const coordinatorEmail = process.env.COORDINATOR_EMAIL
    const resendKey        = process.env.RESEND_API_KEY
    const fromEmail        = process.env.RESEND_FROM_EMAIL
    const appUrl           = process.env.NEXT_PUBLIC_APP_URL || ''

    let notified = false

    if (coordinatorEmail && resendKey && fromEmail) {
      try {
        // Build subject, HTML, and PDF
        const locationForSubject = [city, state].filter(Boolean).join(' ') || 'MD'
        const subject = `New Provider Application — ${name} (${credential_type}, ${locationForSubject})`

        const logoUrl = `${appUrl}/branding/vitalis-logo.png`
        const portalUrl = `${appUrl}/providers/${provider.id}`

        const html = renderApplyNotificationHtml(applicant, { logoUrl, portalUrl })

        // Generate PDF — logo is passed as a URL; @react-pdf/renderer will
        // fetch it at render time. If it fails, PDF generation falls back
        // to a blank space rather than throwing.
        let pdfBuffer: Buffer
        try {
          const pdfElement = React.createElement(ApplyNotificationPdf, {
            applicant,
            logoDataUrl: logoUrl,
          }) as unknown as React.ReactElement<DocumentProps>
          pdfBuffer = await renderToBuffer(pdfElement)
        } catch (pdfErr) {
          // Log but don't abort — send the email without the attachment
          // rather than losing the whole notification.
          console.error('[apply] PDF generation failed:', pdfErr)
          pdfBuffer = Buffer.alloc(0)
        }

        // Sanitize name for filename
        const safeName = name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') || 'Applicant'
        const datestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
        const pdfFilename = `Vitalis-Application-${safeName}-${datestamp}.pdf`

        const { Resend } = await import('resend')
        const resend = new Resend(resendKey)

        const sendPayload: any = {
          from: fromEmail,
          to: coordinatorEmail,
          replyTo: coordinatorEmail,
          subject,
          html,
        }

        if (pdfBuffer.length > 0) {
          sendPayload.attachments = [
            {
              filename: pdfFilename,
              content: pdfBuffer,
            },
          ]
        }

        const sendResult = await resend.emails.send(sendPayload)

        // Resend SDK returns { data, error } — not all errors throw
        if (sendResult && (sendResult as any).error) {
          throw new Error(
            `Resend error: ${JSON.stringify((sendResult as any).error)}`
          )
        }

        notified = true
      } catch (sendErr: any) {
        // Log the failure — never throws to client, this is soft failure
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
              // Keep the raw applicant fields so v2.7.16 retry can re-render
              applicant_snapshot: {
                ...applicant,
                submitted_at: applicant.submitted_at.toISOString(),
              },
            },
            related_provider_id: provider.id,
          })
        } catch (logErr) {
          // Last-resort: Vercel function logs
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

// CORS preflight for external website submissions
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
