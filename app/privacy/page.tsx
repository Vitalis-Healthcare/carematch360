import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy — Vitalis HealthCare Services',
  description:
    'Privacy policy for CareMatch360 and Vitalis HealthCare Services, including how we collect, use, and protect provider and client information.',
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

export default function PrivacyPolicyPage() {
  const effectiveDate = 'April 8, 2026'

  return (
    <>
      <link
        rel="preconnect"
        href="https://fonts.googleapis.com"
      />
      <link
        rel="preconnect"
        href="https://fonts.gstatic.com"
        crossOrigin=""
      />
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
        {/* Header bar */}
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

        {/* Main content */}
        <main
          style={{
            maxWidth: 820,
            margin: '0 auto',
            padding: '48px 24px 80px',
          }}
        >
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
              Privacy Policy
            </h1>
            <p
              style={{
                color: COLORS.muted,
                fontSize: 14,
                marginBottom: 32,
              }}
            >
              Effective date: {effectiveDate}
            </p>

            <Section title="Who we are">
              <p>
                Vitalis HealthCare Services LLC (&quot;Vitalis,&quot; &quot;we,&quot; &quot;our&quot;) is a Maryland-licensed home
                care agency (RSA Level 3, License #3879R) headquartered at 8757 Georgia Avenue, Suite 440,
                Silver Spring, MD 20910. We operate CareMatch360, a provider-client matching and dispatch
                platform used by Vitalis case coordinators and contracted home care providers.
              </p>
              <p>
                This Privacy Policy explains what information we collect through CareMatch360, the
                apply.vitalishealthcare.com provider application, and related Vitalis services, and how that
                information is used, stored, and protected.
              </p>
            </Section>

            <Section title="Information we collect">
              <p>We collect the following categories of information from home care providers who apply to or work with Vitalis:</p>
              <ul style={ulStyle}>
                <li><strong>Contact information</strong> — full name, email address, mobile phone number, and mailing address.</li>
                <li><strong>Professional credentials</strong> — certifications (CNA, HHA, GNA, CMT, RN, LPN), license numbers, training records, and years of experience.</li>
                <li><strong>Work availability</strong> — days, hours, geographic service area, and case preferences.</li>
                <li><strong>Employment eligibility</strong> — background check consent, right-to-work documentation, and references, where required by Maryland law.</li>
                <li><strong>Communication preferences</strong> — your consent to receive SMS and email notifications about case opportunities.</li>
                <li><strong>Platform activity</strong> — which case notifications you receive, which you respond to, and basic access logs (timestamps and session data).</li>
              </ul>
              <p>
                For clients and their families, we collect information necessary to match appropriate care
                providers, including care needs, schedule, and location. Client health information is
                handled under separate procedures consistent with applicable federal and Maryland privacy
                laws.
              </p>
            </Section>

            <Section title="How we use your information">
              <p>We use the information we collect to:</p>
              <ul style={ulStyle}>
                <li>Match providers to client cases based on credentials, availability, and location.</li>
                <li>Send case-opportunity notifications by SMS and email to providers who have opted in.</li>
                <li>Record provider responses (accept, decline, questions) and keep a record of each dispatch.</li>
                <li>Verify credentials and eligibility to work in Maryland home care settings.</li>
                <li>Comply with federal, state, and local laws, including Maryland Department of Health requirements and Baltimore City Health Department contract obligations.</li>
                <li>Operate, secure, and improve CareMatch360 and our related systems.</li>
              </ul>
            </Section>

            <Section title="SMS notifications and opt-in">
              <p>
                When you apply to become a Vitalis provider, you may choose to receive case-opportunity
                notifications by SMS text message. SMS consent is <strong>optional and opt-in</strong>. You
                can decline SMS notifications at application time and still be considered for cases by
                email and phone.
              </p>
              <p>
                If you opt in, Vitalis sends SMS messages only when a case becomes available that matches
                your credentials and service area. Messages contain case details and a link you can tap to
                indicate availability. Message frequency varies based on case volume and your match rate.
              </p>
              <p>
                <strong>Your mobile number and SMS opt-in information are never sold, rented, or shared
                with third parties for their own marketing purposes.</strong> We share information only
                with service providers that help us operate CareMatch360 (for example, our SMS delivery
                provider and email provider), and only to the extent needed to deliver notifications you
                have opted in to receive. See our{' '}
                <a href="/sms-terms" style={linkStyle}>SMS Program Terms</a> for full details about the
                notification program, including HELP and STOP keywords.
              </p>
            </Section>

            <Section title="How we share information">
              <p>We do not sell your personal information. We share it only in these limited situations:</p>
              <ul style={ulStyle}>
                <li><strong>Service providers</strong> acting on our behalf — including hosting, database, email delivery, and SMS delivery providers — under contracts that require them to protect your information.</li>
                <li><strong>Clients and their authorized representatives</strong>, when you are matched to or assigned to a case, and only to the extent needed to coordinate care.</li>
                <li><strong>Regulators and government agencies</strong>, when required by Maryland Department of Health, Baltimore City Health Department, or other authorities with lawful authority over home care operations.</li>
                <li><strong>Legal and safety purposes</strong>, when we believe in good faith that disclosure is necessary to comply with the law, enforce our terms, or protect the rights, safety, or property of Vitalis, our providers, our clients, or the public.</li>
              </ul>
            </Section>

            <Section title="How we protect your information">
              <p>
                CareMatch360 runs on secure, encrypted infrastructure. Access to provider and client
                information is restricted to authorized Vitalis staff and contracted service providers
                with a need to know. We use industry-standard safeguards — including encrypted connections
                (HTTPS), access controls, and audit logging — to protect against unauthorized access,
                disclosure, alteration, or destruction of your information.
              </p>
              <p>
                No system is perfectly secure. If we become aware of a security incident that affects your
                information, we will notify you and applicable regulators as required by law.
              </p>
            </Section>

            <Section title="How long we keep information">
              <p>
                We keep provider and applicant information for as long as you are active with Vitalis plus
                a reasonable period afterward to satisfy legal, tax, audit, and contractual obligations.
                Dispatch and response logs are retained for operational and compliance review. You may
                request deletion of your information at any time, subject to legal retention requirements.
              </p>
            </Section>

            <Section title="Your choices">
              <ul style={ulStyle}>
                <li><strong>Opt out of SMS notifications</strong> at any time by replying STOP to any Vitalis case-notification message. You may also email us to opt out.</li>
                <li><strong>Opt out of emails</strong> by replying to any notification email asking to be removed, or by contacting us directly.</li>
                <li><strong>Access or correct your information</strong> by contacting us at the email below.</li>
                <li><strong>Request deletion</strong> of your account and information, subject to legal and contractual retention obligations.</li>
              </ul>
            </Section>

            <Section title="Children">
              <p>
                CareMatch360 and the Vitalis provider application are not directed to children under 18.
                We do not knowingly collect personal information from children.
              </p>
            </Section>

            <Section title="Changes to this policy">
              <p>
                We may update this Privacy Policy from time to time. When we make material changes, we
                will update the effective date at the top of this page and, where appropriate, notify
                providers directly.
              </p>
            </Section>

            <Section title="Contact us">
              <p>
                If you have questions about this Privacy Policy or how your information is handled,
                contact us at:
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
              <a href="/sms-terms" style={linkStyle}>
                SMS Program Terms
              </a>{' '}
              for details about text message notifications.
            </div>
          </div>
        </main>
      </div>
    </>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 28 }}>
      <h2
        style={{
          fontFamily: "'Cormorant Garamond', Georgia, serif",
          fontSize: 24,
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

const ulStyle: React.CSSProperties = {
  paddingLeft: 22,
  marginTop: 8,
  marginBottom: 12,
}

const linkStyle: React.CSSProperties = {
  color: COLORS.greenMid,
  textDecoration: 'underline',
  fontWeight: 500,
}
