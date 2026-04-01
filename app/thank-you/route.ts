import { NextResponse } from 'next/server'

export async function GET() {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Request Received — Vitalis HealthCare</title>
  <link rel="preconnect" href="https://fonts.googleapis.com"/>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    :root {
      --green-dark: #2D5A1B; --green-mid: #3D7A24; --green-bright: #7AB52A;
      --green-lime: #A8D640; --green-pale: #F4FAF0; --white: #FFFFFF;
      --border: #D4E8C2; --muted: #5A7050; --text: #1A2E0F;
    }
    body { font-family: 'DM Sans', sans-serif; background: #F7FAF4; color: var(--text); min-height: 100vh; display: flex; flex-direction: column; }
    nav { background: var(--green-dark); padding: 0 32px; height: 64px; display: flex; align-items: center; justify-content: space-between; }
    .nav-brand { display: flex; align-items: center; gap: 10px; color: #fff; font-weight: 600; font-size: 17px; text-decoration: none; }
    .nav-logo { width: 32px; height: 32px; background: var(--green-bright); border-radius: 8px; display: flex; align-items: center; justify-content: center; font-size: 16px; }
    .nav-phone { color: #fff; font-size: 14px; font-weight: 500; text-decoration: none; display: flex; align-items: center; gap: 6px; }
    main { flex: 1; display: flex; align-items: center; justify-content: center; padding: 60px 20px; }
    .card { background: var(--white); border: 1px solid var(--border); border-radius: 20px; padding: 60px 48px; max-width: 560px; width: 100%; text-align: center; box-shadow: 0 4px 24px rgba(45,90,27,0.08); }
    .icon { width: 88px; height: 88px; background: linear-gradient(135deg, var(--green-bright), var(--green-lime)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 40px; margin: 0 auto 28px; box-shadow: 0 8px 28px rgba(122,181,42,0.35); }
    h1 { font-family: 'Cormorant Garamond', serif; font-size: 38px; font-weight: 600; color: var(--green-dark); margin-bottom: 14px; }
    .sub { font-size: 16px; color: var(--muted); line-height: 1.75; max-width: 400px; margin: 0 auto 36px; }
    .steps { background: var(--green-pale); border: 1px solid var(--border); border-radius: 14px; padding: 24px 28px; text-align: left; margin-bottom: 36px; }
    .steps h4 { font-size: 13px; font-weight: 700; color: var(--green-dark); text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 16px; }
    .step { display: flex; gap: 12px; align-items: flex-start; margin-bottom: 12px; font-size: 14px; color: var(--muted); line-height: 1.5; }
    .step:last-child { margin-bottom: 0; }
    .step-num { width: 22px; height: 22px; background: var(--green-bright); color: #fff; border-radius: 50%; font-size: 11px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }
    .btn { display: inline-block; background: var(--green-dark); color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px; }
    .urgent { margin-top: 28px; font-size: 13px; color: var(--muted); }
    .urgent a { color: var(--green-dark); font-weight: 600; text-decoration: none; }
    footer { background: var(--green-dark); color: rgba(255,255,255,0.7); text-align: center; padding: 24px 20px; font-size: 12px; }
    footer strong { color: #fff; }
  </style>
</head>
<body>
  <nav>
    <a href="/" class="nav-brand">
      <div class="nav-logo">🏠</div>
      Vitalis HealthCare
    </a>
    <a href="tel:+12407166874" class="nav-phone">📞 240.716.6874</a>
  </nav>

  <main>
    <div class="card">
      <div class="icon">🏠</div>
      <h1>Request Received!</h1>
      <p class="sub">Thank you for trusting Vitalis HealthCare Services. Your care coordinator will be in touch within 24 hours.</p>

      <div class="steps">
        <h4>What happens next</h4>
        <div class="step"><div class="step-num">1</div>Your coordinator will call the number you provided within 24 hours.</div>
        <div class="step"><div class="step-num">2</div>We'll discuss care needs in detail and answer all your questions.</div>
        <div class="step"><div class="step-num">3</div>We match your loved one with the ideal caregiver from our network.</div>
        <div class="step"><div class="step-num">4</div>Care begins — with ongoing coordinator support every step of the way.</div>
      </div>

      <a href="/" class="btn">← Back to Home</a>

      <p class="urgent">Need immediate assistance? Call <a href="tel:+12407166874">240.716.6874</a></p>
    </div>
  </main>

  <footer>
    <strong>Vitalis HealthCare Services, LLC</strong> &nbsp;·&nbsp; RSA Level 3 · License #3879R<br/>
    8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910
  </footer>
</body>
</html>`
  return new NextResponse(html, { headers: { 'Content-Type': 'text/html' } })
}
