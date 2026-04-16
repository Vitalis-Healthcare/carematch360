/**
 * Shared send helper for the coordinator notification email.
 *
 * Extracted from app/api/providers/apply/route.ts in v2.7.16 so that
 * both the original apply-form POST and the admin retry endpoint
 * invoke the EXACT same render + send code path. Any future change
 * to the email (template, attachments, Resend SDK shape) happens in
 * one place.
 *
 * Assets: logoDataUrl + fonts are passed IN by the caller. They are
 * loaded once at the caller's module scope (see apply/route.ts) so
 * Vercel's Node File Trace bundles public/branding and public/fonts
 * with the function. Do NOT try to load them here — indirect file
 * reads in imported modules are not reliably traced.
 *
 * Returns either a success tuple or a tagged error. The caller
 * decides whether to log to email_send_failures.
 */

import { renderApplyNotificationHtml } from './apply-notification-html'
import {
  ApplyNotificationPdf,
  type FontBundle,
} from './apply-notification-pdf'
import type { ApplicantData } from './types'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import React from 'react'

export type SendApplyNotificationParams = {
  applicant: ApplicantData
  coordinatorEmail: string
  fromEmail: string
  appUrl: string
  resendKey: string
  logoDataUrl: string
  fonts: FontBundle
}

export type SendApplyNotificationResult =
  | { ok: true; subject: string }
  | { ok: false; subject: string; error: string }

export async function sendApplyNotification(
  p: SendApplyNotificationParams
): Promise<SendApplyNotificationResult> {
  const locationForSubject =
    [p.applicant.city, p.applicant.state].filter(Boolean).join(' ') || 'MD'
  const subject = `New Provider Application — ${p.applicant.name} (${p.applicant.credential_type}, ${locationForSubject})`

  try {
    const logoUrl = `${p.appUrl}/branding/vitalis-logo.png`
    const portalUrl = `${p.appUrl}/providers/${p.applicant.id}`

    const html = renderApplyNotificationHtml(p.applicant, { logoUrl, portalUrl })

    let pdfBuffer: Buffer
    try {
      const pdfElement = React.createElement(ApplyNotificationPdf, {
        applicant: p.applicant,
        logoDataUrl: p.logoDataUrl,
        fonts: p.fonts,
      }) as unknown as React.ReactElement<DocumentProps>
      pdfBuffer = await renderToBuffer(pdfElement)
    } catch (pdfErr: any) {
      console.error('[send-apply] PDF generation failed:', pdfErr?.message || pdfErr)
      if (pdfErr?.stack) console.error('[send-apply] PDF stack:', pdfErr.stack)
      pdfBuffer = Buffer.alloc(0)
    }

    const safeName =
      p.applicant.name.replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '') ||
      'Applicant'
    const datestamp = new Date().toISOString().slice(0, 10).replace(/-/g, '')
    const pdfFilename = `Vitalis-Application-${safeName}-${datestamp}.pdf`

    const { Resend } = await import('resend')
    const resend = new Resend(p.resendKey)

    // Resend SDK v3.x — snake_case reply_to. See pitfall #17.
    const sendPayload: any = {
      from: p.fromEmail,
      to: p.coordinatorEmail,
      reply_to: p.applicant.email,
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
      return {
        ok: false,
        subject,
        error: `Resend error: ${JSON.stringify((sendResult as any).error)}`,
      }
    }

    return { ok: true, subject }
  } catch (err: any) {
    return {
      ok: false,
      subject,
      error: err?.message || String(err) || 'Unknown send error',
    }
  }
}
