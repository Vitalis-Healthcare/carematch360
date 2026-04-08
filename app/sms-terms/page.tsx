import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'SMS Program Terms — Vitalis HealthCare Services',
  description:
    'Terms and conditions for the Vitalis HealthCare Case Notification SMS program, including message frequency, opt-in, opt-out, and support information.',
}

const COLORS = {
  greenDark: '#2D5A1B',
  greenMid: '#4A7C2F',
  greenBright: '#7AB52A',
  greenLight: '#EBF5DF',
  greenPale: '#F4FAF0',
  text: '#1A2E10',
  muted: '#5A7050',
  border: '#C8DDB8',
  bg: '#F2F8EC',
  white: '#FFFFFF',
}

export default function SmsTermsPage() {
  const effectiveDate = 'April 8, 2026'

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@300;400;500;600&display=swap"
        rel="stylesheet"
      />

      <div
        style={{
          minHeight: '100vh',
          background: COLORS.bg,
          fontFamily: "'DM Sans', system-ui, sans-serif",
          color: COLORS.text,
          lineHeight: 1.7,
        }}
      >
        <header
          style={{
            background: COLORS.greenDark,
            color: COLORS.white,
            padding: '28px 24px',
            borderBottom: `4px solid ${COLORS.greenBright}`,
          }}
        >
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <div
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 28,
                fontWeight: 600,
                letterSpacing: 0.3,
              }}
            >
              Vitalis HealthCare <span style={{ color: COLORS.greenBright }}>Services</span>
            </div>
            <div
              style={{
                fontSize: 13,
                opacity: 0.85,
                marginTop: 4,
                letterSpacing: 0.4,
                textTransform: 'uppercase',
              }}
            >
              CareMatch360 Provider Platform
            </div>
          </div>
        </header>

        <main style={{ maxWidth: 820, margin: '0 auto', padding: '48px 24px 80px' }}>
          <div
            style={{
              background: COLORS.white,
              border: `1px solid ${COLORS.border}`,
              borderRadius: 12,
              padding: '48px 56px',
              boxShadow: '0 2px 8px rgba(45, 90, 27, 0.06)',
            }}
          >
            <h1
              style={{
                fontFamily: "'Cormorant Garamond', Georgia, serif",
                fontSize: 42,
                fontWeight: 600,
                color: COLORS.greenDark,
                marginBottom: 8,
                lineHeight: 1.2,
              }}
            >
              SMS Program Terms
            </h1>
            <p style={{ color: COLORS.muted, fontSize: 14, marginBottom: 28 }}>
              Vitalis HealthCare Case Notifications · Effective {effectiveDate}
            </p>

            {/* Highlight box */}
            <div
              style={{
                background: COLORS.greenPale,
                border: `1px solid ${COLORS.border}`,
                borderLeft: `4px solid ${COLORS.greenBright}`,
                borderRadius: 8,
                padding: '18px 22px',
                marginBottom: 32,
                fontSize: 15,
              }}
            >
              <strong style={{ color: COLORS.greenDark }}>Program name:</strong> Vitalis HealthCare Case Notifications
              <br />
              <strong style={{ color: COLORS.greenDark }}>Operated by:</strong> Vitalis HealthCare Services LLC, a
              Maryland-licensed home care agency (RSA Level 3, License #3879R).
              <br />
              <strong style={{ color: COLORS.greenDark }}>Program purpose:</strong> notify approved home care providers
              about new case opportunities.
            </div>

            <Section title="1. Program description">
              <p>
                The Vitalis HealthCare Case Notifications program is an SMS text messaging service operated by Vitalis
                HealthCare Services LLC for the purpose of notifying approved home care providers — including Certified
                Nursing Assistants, Home Health Aides, Geriatric Nursing Assistants, Certified Medicine Technicians, and
                other contracted care workers — about new client case opportunities that match their credentials and
                service area.
              </p>
              <p>
                When you opt in, Vitalis case coordinators will send you a short text message when a case becomes
                available. Each message contains the basic case details (type of care, city, schedule) and a secure link
                you can tap to indicate YES (available), NO (not available), or to ask a question. Your response is
                recorded in the CareMatch360 dispatch system and helps the coordinator staff the case quickly.
              </p>
            </Section>

            <Section title="2. How to opt in">
              <p>
                You opt in to SMS notifications at the time you submit your provider application at
                apply.vitalishealthcare.com. The application includes an explicit consent checkbox for SMS notifications.
                Ticking the checkbox and submitting the application constitutes your consent to receive recurring text
                messages from Vitalis related to case opportunities.
              </p>
              <p>
                Providing consent is <strong>optional</strong>. You may decline SMS notifications and still apply to work
                with Vitalis — case opportunities will be sent by email and phone instead.
              </p>
            </Section>

            <Section title="3. Message frequency">
              <p>
                Message frequency varies based on case volume in your area and how closely your credentials match
                available cases. Most providers receive between a few messages per week and a few messages per day
                during busy staffing periods. Vitalis does not use this program for marketing, promotions, or any
                purpose other than case-opportunity notifications.
              </p>
            </Section>

            <Section title="4. Message and data rates">
              <p>
                <strong>Message and data rates may apply.</strong> Standard text messaging rates from your mobile carrier
                apply to all messages you send to or receive from the program. Vitalis does not charge a fee for the
                program itself. Check with your mobile carrier if you are unsure about your plan&apos;s text messaging
                rates.
              </p>
            </Section>

            <Section title="5. How to opt out — STOP keyword">
              <p>
                You can cancel the SMS service at any time by replying <strong>STOP</strong> to any message from the
                program. After you reply STOP, you will receive a one-time confirmation message acknowledging that you
                have been unsubscribed, and no further messages will be sent to your number from the program.
              </p>
              <p>
                If you opt out by mistake, you can rejoin the program by contacting Vitalis directly at the email or
                phone number in Section 8, or by submitting a new provider application.
              </p>
            </Section>

            <Section title="6. How to get help — HELP keyword">
              <p>
                If you need help at any time, reply <strong>HELP</strong> to any message from the program. You will
                receive an automatic response with information about the program and how to contact Vitalis support. You
                may also contact Vitalis directly using the information in Section 8.
              </p>
            </Section>

            <Section title="7. Carrier disclaimer and delivery">
              <p>
                Vitalis HealthCare Services LLC is not responsible for any delays, failures, or errors in message
                delivery caused by your mobile carrier. Carriers are not liable for delayed or undelivered messages.
                Message delivery depends on network conditions and carrier policies beyond our control. The program is
                available on most major U.S. mobile carriers, including AT&amp;T, T-Mobile, Verizon, US Cellular, Boost,
                Cricket, MetroPCS, and others. Carriers are not liable for delayed or undelivered messages.
              </p>
            </Section>

            <Section title="8. Support contact">
              <p>
                For questions or help with the Vitalis HealthCare Case Notifications program, contact us at:
              </p>
              <div
                style={{
                  background: COLORS.greenPale,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: 8,
                  padding: '18px 24px',
                  marginTop: 12,
                }}
              >
                <div style={{ fontWeight: 600, color: COLORS.greenDark, marginBottom: 6 }}>
                  Vitalis HealthCare Services LLC
                </div>
                <div>8757 Georgia Avenue, Suite 440</div>
                <div>Silver Spring, MD 20910</div>
                <div style={{ marginTop: 8 }}>
                  Email:{' '}
                  <a href="mailto:team@vitalishealthcare.com" style={linkStyle}>
                    team@vitalishealthcare.com
                  </a>
                </div>
                <div>Phone: (240) 716-6874</div>
              </div>
            </Section>

            <Section title="9. Privacy">
              <p>
                Information collected through the SMS program is handled in accordance with our{' '}
                <a href="/privacy" style={linkStyle}>
                  Privacy Policy
                </a>
                . Your mobile phone number and SMS opt-in information are never sold, rented, or shared with third
                parties for their marketing purposes. We share information only with the service providers needed to
                deliver the messages you have opted in to receive.
              </p>
            </Section>

            <Section title="10. Changes to these terms">
              <p>
                We may update these SMS Program Terms from time to time. When we make material changes, we will update
                the effective date at the top of this page. Continued participation in the program after changes are
                posted constitutes your acceptance of the updated terms.
              </p>
            </Section>

            <div
              style={{
                marginTop: 40,
                paddingTop: 24,
                borderTop: `1px solid ${COLORS.border}`,
                fontSize: 13,
                color: COLORS.muted,
                textAlign: 'center',
              }}
            >
              See also our{' '}
              <a href="/privacy" style={linkStyle}>
                Privacy Policy
              </a>
              .
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 26 }}>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 23,
          fontWeight: 600,
          color: COLORS.greenDark,
          marginBottom: 10,
          marginTop: 4,
        }}
      >
        {title}
      </h2>
      <div style={{ fontSize: 15.5, color: COLORS.text }}>{children}</div>
    </section>
  )
}

const linkStyle: React.CSSProperties = {
  color: COLORS.greenMid,
  textDecoration: 'underline',
  fontWeight: 500,
}
