import { NextResponse } from 'next/server'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Join Our Care Team — Vitalis HealthCare Services</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;1,9..40,300&display=swap" rel="stylesheet"/>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --green-dark:   #2D5A1B;
    --green-mid:    #4A7C2F;
    --green-bright: #7AB52A;
    --green-lime:   #9DCF3A;
    --green-light:  #EBF5DF;
    --green-pale:   #F4FAF0;
    --text:         #1A2E10;
    --muted:        #5A7050;
    --border:       #C8DDB8;
    --bg:           #F2F8EC;
    --white:        #FFFFFF;
    --red:          #DC2626;
    --gold:         #B8860B;
    --gold-light:   #FDF8E7;
  }

  html { scroll-behavior: smooth; }
  body {
    font-family: 'DM Sans', sans-serif;
    background: var(--bg);
    color: var(--text);
    min-height: 100vh;
  }

  /* ── HERO ─────────────────────────────────── */
  .hero {
    background: linear-gradient(160deg, #0A1A05 0%, #1A3A0A 40%, #2D5A1B 100%);
    position: relative; overflow: hidden;
    padding: 48px 24px 72px;
    text-align: center;
  }
  .hero::before {
    content: ''; position: absolute;
    width: 800px; height: 800px; border-radius: 50%;
    background: radial-gradient(circle, rgba(122,181,42,0.15) 0%, transparent 65%);
    top: -300px; right: -200px; pointer-events: none;
  }
  .hero::after {
    content: ''; position: absolute;
    width: 500px; height: 500px; border-radius: 50%;
    background: radial-gradient(circle, rgba(157,207,58,0.1) 0%, transparent 65%);
    bottom: -150px; left: -100px; pointer-events: none;
  }

  /* Logo */
  .hero-logo {
    display: inline-block;
    margin-bottom: 28px;
    position: relative;
  }
  .logo-mark-wrap {
    display: flex; align-items: center; gap: 14px;
    background: rgba(255,255,255,0.07);
    border: 1px solid rgba(157,207,58,0.35);
    border-radius: 14px;
    padding: 12px 22px 12px 16px;
    backdrop-filter: blur(4px);
  }
  .logo-icon {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, var(--green-bright), var(--green-lime));
    border-radius: 11px;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
    box-shadow: 0 4px 14px rgba(122,181,42,0.4);
  }
  .logo-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 600;
    color: #fff; letter-spacing: 0.01em; line-height: 1.2;
  }
  .logo-tag {
    font-size: 11px; color: rgba(255,255,255,0.5);
    letter-spacing: 0.08em; text-transform: uppercase;
    margin-top: 2px;
  }
  .hero-logo img {
    height: 90px;
    display: block;
    mix-blend-mode: screen;
    filter: brightness(1.15) saturate(1.2);
  }

  .hero h1 {
    font-family: 'Cormorant Garamond', serif;
    font-size: clamp(34px, 5.5vw, 58px);
    font-weight: 500;
    color: #fff;
    line-height: 1.12;
    letter-spacing: -0.01em;
    margin-bottom: 14px;
    position: relative;
  }
  .hero h1 em {
    font-style: italic;
    color: var(--green-lime);
  }
  .hero p {
    font-size: 15.5px;
    color: rgba(255,255,255,0.62);
    max-width: 500px; margin: 0 auto 28px;
    line-height: 1.75; font-weight: 300;
  }
  .hero-divider {
    width: 60px; height: 2px;
    background: linear-gradient(90deg, transparent, var(--green-lime), transparent);
    margin: 0 auto 28px;
  }
  .hero-badges {
    display: flex; flex-wrap: wrap; gap: 8px; justify-content: center;
    position: relative;
  }
  .badge {
    background: rgba(122,181,42,0.15);
    border: 1px solid rgba(157,207,58,0.3);
    border-radius: 20px; padding: 5px 14px;
    font-size: 12.5px; color: rgba(255,255,255,0.82);
    display: flex; align-items: center; gap: 5px;
  }

  /* ── PROGRESS ──────────────────────────────── */
  .progress-bar {
    background: var(--white);
    border-bottom: 1px solid var(--border);
    padding: 14px 24px;
    position: sticky; top: 0; z-index: 100;
    box-shadow: 0 2px 12px rgba(45,90,27,0.08);
  }
  .progress-inner {
    max-width: 720px; margin: 0 auto;
    display: flex; align-items: center;
  }
  .step {
    display: flex; align-items: center; gap: 7px;
    flex: 1; font-size: 12px;
    color: var(--muted); font-weight: 400;
  }
  .step.active { color: var(--green-dark); font-weight: 600; }
  .step.done { color: var(--green-mid); }
  .step-num {
    width: 24px; height: 24px; border-radius: 50%;
    background: var(--border); color: var(--muted);
    font-size: 11px; font-weight: 700;
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; transition: all 0.3s;
  }
  .step.active .step-num { background: var(--green-bright); color: #fff; }
  .step.done .step-num { background: var(--green-dark); color: #fff; }
  .step-line {
    flex: 1; height: 2px; background: var(--border);
    margin: 0 6px; max-width: 36px; transition: background 0.3s;
  }
  .step-line.done { background: var(--green-dark); }

  /* ── FORM SHELL ──────────────────────────── */
  .form-shell {
    max-width: 720px; margin: 0 auto;
    padding: 28px 24px 80px;
  }

  /* ── PANELS ──────────────────────────────── */
  .panel {
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px; overflow: hidden;
    margin-bottom: 24px; display: none;
    animation: fadeUp 0.35s ease;
    box-shadow: 0 2px 16px rgba(45,90,27,0.06);
  }
  .panel.active { display: block; }
  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(10px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  .panel-header {
    background: linear-gradient(135deg, var(--green-dark), var(--green-mid));
    padding: 20px 28px;
    display: flex; align-items: center; gap: 14px;
    position: relative; overflow: hidden;
  }
  .panel-header::after {
    content: ''; position: absolute;
    right: -20px; top: -20px;
    width: 100px; height: 100px; border-radius: 50%;
    background: rgba(157,207,58,0.12); pointer-events: none;
  }
  .panel-icon {
    width: 42px; height: 42px;
    background: rgba(255,255,255,0.15);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 20px; flex-shrink: 0;
  }
  .panel-title {
    font-family: 'Cormorant Garamond', serif;
    font-size: 22px; font-weight: 600; color: #fff;
  }
  .panel-sub { font-size: 12.5px; color: rgba(255,255,255,0.6); margin-top: 2px; }
  .panel-body { padding: 28px; }

  /* ── FORM ELEMENTS ───────────────────────── */
  .row { display: grid; gap: 16px; margin-bottom: 16px; }
  .row.cols-2 { grid-template-columns: 1fr 1fr; }
  .row.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
  @media (max-width: 560px) {
    .row.cols-2, .row.cols-3 { grid-template-columns: 1fr; }
    .step-label { display: none; }
  }

  .field { display: flex; flex-direction: column; gap: 5px; }
  .field label {
    font-size: 11.5px; font-weight: 600;
    color: var(--green-dark);
    letter-spacing: 0.06em; text-transform: uppercase;
  }
  .field label span { color: var(--red); margin-left: 2px; }
  .field input, .field select, .field textarea {
    border: 1.5px solid var(--border); border-radius: 9px;
    padding: 10px 14px; font-size: 14px;
    font-family: 'DM Sans', sans-serif; color: var(--text);
    background: #fff; transition: border-color 0.2s, box-shadow 0.2s;
    outline: none; width: 100%;
  }
  .field input:focus, .field select:focus, .field textarea:focus {
    border-color: var(--green-bright);
    box-shadow: 0 0 0 3px rgba(122,181,42,0.15);
  }
  .field input.error, .field select.error { border-color: var(--red); }
  .field textarea { min-height: 100px; resize: vertical; }
  .field .hint { font-size: 11px; color: var(--muted); margin-top: 1px; }

  /* ── CHIP SELECTORS ──────────────────────── */
  .chips-label {
    font-size: 11.5px; font-weight: 600; color: var(--green-dark);
    letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 9px;
  }
  .chips-label span { font-weight: 400; color: var(--muted); font-size: 11px; text-transform: none; letter-spacing: 0; margin-left: 6px; }
  .chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 20px; }
  .chip {
    padding: 6px 14px; border-radius: 20px;
    border: 1.5px solid var(--border); background: #fff;
    font-size: 13px; cursor: pointer; user-select: none;
    color: var(--muted); transition: all 0.18s;
    font-family: 'DM Sans', sans-serif;
  }
  .chip:hover { border-color: var(--green-bright); color: var(--green-mid); }
  .chip.selected {
    background: var(--green-light); border-color: var(--green-bright);
    color: var(--green-dark); font-weight: 600;
  }
  .chip.cred.selected {
    background: linear-gradient(135deg, #E8F5D8, #D4EBB8);
    border-color: var(--green-mid); color: var(--green-dark);
  }

  /* ── SECTION DIVIDERS ────────────────────── */
  .section-label {
    font-size: 10px; font-weight: 700;
    text-transform: uppercase; letter-spacing: 0.12em;
    color: var(--green-bright);
    padding: 0 0 8px;
    border-bottom: 1px solid var(--green-light);
    margin: 22px 0 14px;
  }

  /* ── TOGGLE SWITCHES ─────────────────────── */
  .toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 20px; }
  @media (max-width: 400px) { .toggles { grid-template-columns: 1fr; } }
  .toggle-item {
    display: flex; align-items: center; gap: 11px;
    background: var(--green-pale); border: 1.5px solid var(--border);
    border-radius: 10px; padding: 11px 14px;
    cursor: pointer; transition: all 0.18s;
  }
  .toggle-item:hover { border-color: var(--green-bright); }
  .toggle-item.on { background: var(--green-light); border-color: var(--green-bright); }
  .toggle-item input { display: none; }
  .toggle-dot {
    width: 32px; height: 18px; background: var(--border);
    border-radius: 9px; position: relative; flex-shrink: 0;
    transition: background 0.2s;
  }
  .toggle-dot::after {
    content: ''; position: absolute;
    width: 12px; height: 12px; border-radius: 50%;
    background: #fff; top: 3px; left: 3px;
    transition: transform 0.2s;
    box-shadow: 0 1px 3px rgba(0,0,0,0.2);
  }
  .toggle-item.on .toggle-dot { background: var(--green-bright); }
  .toggle-item.on .toggle-dot::after { transform: translateX(14px); }
  .toggle-text { font-size: 13px; font-weight: 500; color: var(--text); }
  .toggle-text small { display: block; font-size: 11px; color: var(--muted); font-weight: 400; }

  /* ── NAVIGATION BUTTONS ──────────────────── */
  .nav-row {
    display: flex; justify-content: space-between; align-items: center;
    margin-top: 28px; padding-top: 20px;
    border-top: 1px solid var(--green-light);
  }
  .btn {
    padding: 11px 26px; border-radius: 9px;
    font-size: 14px; font-weight: 600;
    font-family: 'DM Sans', sans-serif;
    cursor: pointer; border: none;
    transition: all 0.2s;
    display: flex; align-items: center; gap: 7px;
  }
  .btn-primary {
    background: var(--green-bright); color: #fff;
    box-shadow: 0 4px 14px rgba(122,181,42,0.35);
  }
  .btn-primary:hover {
    background: var(--green-mid); transform: translateY(-1px);
    box-shadow: 0 6px 20px rgba(74,124,47,0.4);
  }
  .btn-primary:disabled { background: var(--border); color: var(--muted); box-shadow: none; cursor: not-allowed; transform: none; }
  .btn-ghost {
    background: transparent; color: var(--muted);
    border: 1.5px solid var(--border);
  }
  .btn-ghost:hover { border-color: var(--green-mid); color: var(--green-dark); }
  .btn-submit {
    background: linear-gradient(135deg, var(--green-dark), var(--green-mid));
    color: #fff; box-shadow: 0 4px 14px rgba(45,90,27,0.35);
    padding: 13px 34px; font-size: 15px;
  }
  .btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,90,27,0.45); }
  .btn-submit:disabled { background: var(--border); color: var(--muted); box-shadow: none; cursor: not-allowed; transform: none; }

  /* ── SUCCESS ──────────────────────────────── */
  #success {
    display: none; text-align: center;
    padding: 60px 32px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 16px;
    box-shadow: 0 2px 16px rgba(45,90,27,0.06);
  }
  .success-icon {
    width: 84px; height: 84px;
    background: linear-gradient(135deg, var(--green-bright), var(--green-lime));
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 38px; margin: 0 auto 20px;
    box-shadow: 0 8px 28px rgba(122,181,42,0.35);
  }
  #success h2 {
    font-family: 'Cormorant Garamond', serif;
    font-size: 34px; font-weight: 600;
    color: var(--green-dark); margin-bottom: 12px;
  }
  #success p {
    font-size: 15px; color: var(--muted);
    max-width: 400px; margin: 0 auto; line-height: 1.75;
  }
  #success .success-logo {
    margin-top: 32px; padding-top: 24px;
    border-top: 1px solid var(--green-light);
  }
  #success .success-logo img { height: 36px; opacity: 0.7; }

  /* ── ERROR ────────────────────────────────── */
  .form-error {
    background: #FEF2F2; border: 1px solid #FECACA;
    border-radius: 9px; padding: 11px 16px;
    font-size: 13.5px; color: var(--red);
    margin-top: 14px; display: none;
  }

  /* ── REVIEW ───────────────────────────────── */
  .review-row {
    display: flex; justify-content: space-between;
    padding: 9px 0; border-bottom: 1px solid var(--green-light);
    font-size: 13.5px;
  }
  .review-row:last-child { border-bottom: none; }
  .review-label { color: var(--muted); }
  .review-value { font-weight: 500; text-align: right; max-width: 60%; color: var(--green-dark); }

  /* ── FOOTER ───────────────────────────────── */
  .form-footer {
    text-align: center; padding: 32px 24px;
    font-size: 12px; color: var(--muted);
  }
  .footer-logo-wrap {
    display: inline-flex; align-items: center; gap: 12px;
    background: var(--white);
    border: 1px solid var(--border);
    border-radius: 12px;
    padding: 12px 22px 12px 14px;
    box-shadow: 0 2px 8px rgba(45,90,27,0.06);
  }
  .footer-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, var(--green-bright), var(--green-lime));
    border-radius: 9px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px; flex-shrink: 0;
  }
  .footer-name {
    font-family: 'Cormorant Garamond', serif;
    font-size: 16px; font-weight: 600;
    color: var(--green-dark); line-height: 1.3;
  }
  .footer-sub {
    font-size: 11px; color: var(--muted);
    margin-top: 2px; letter-spacing: 0.01em;
  }
</style>
</head>
<body>

<!-- HERO -->
<div class="hero">
  <div class="hero-logo">
    <div class="logo-mark-wrap">
      <div class="logo-icon">⌖</div>
      <div class="logo-words">
        <div class="logo-name">Vitalis HealthCare</div>
        <div class="logo-tag">Services, LLC</div>
      </div>
    </div>
  </div>
  <div class="hero-divider"></div>
  <h1>Join Our <em>Care Team</em></h1>
  <p>We're looking for compassionate, skilled caregivers across Maryland. Complete this application and our team will be in touch within 1–2 business days.</p>
  <div class="hero-badges">
    <span class="badge">🗺️ Serving All of Maryland</span>
    <span class="badge">📋 Maryland OHCQ Licensed</span>
    <span class="badge">💳 Private Pay & Insurance</span>
    <span class="badge">🏥 MD Medicaid Waiver Provider</span>
    <span class="badge">⚡ Flexible Schedules</span>
    <span class="badge">🌟 RSA Level 3 · License #3879R</span>
  </div>
</div>

<!-- PROGRESS -->
<div class="progress-bar">
  <div class="progress-inner">
    <div class="step active" id="step-ind-1">
      <div class="step-num">1</div>
      <span class="step-label">Personal</span>
    </div>
    <div class="step-line" id="line-1"></div>
    <div class="step" id="step-ind-2">
      <div class="step-num">2</div>
      <span class="step-label">Credentials</span>
    </div>
    <div class="step-line" id="line-2"></div>
    <div class="step" id="step-ind-3">
      <div class="step-num">3</div>
      <span class="step-label">Availability</span>
    </div>
    <div class="step-line" id="line-3"></div>
    <div class="step" id="step-ind-4">
      <div class="step-num">4</div>
      <span class="step-label">Skills</span>
    </div>
    <div class="step-line" id="line-4"></div>
    <div class="step" id="step-ind-5">
      <div class="step-num">5</div>
      <span class="step-label">Review</span>
    </div>
  </div>
</div>

<!-- FORM -->
<div class="form-shell">

  <!-- STEP 1: PERSONAL INFO -->
  <div class="panel active" id="panel-1">
    <div class="panel-header">
      <div class="panel-icon">👤</div>
      <div>
        <div class="panel-title">Personal Information</div>
        <div class="panel-sub">Tell us who you are and how to reach you</div>
      </div>
    </div>
    <div class="panel-body">
      <div class="row cols-2">
        <div class="field">
          <label>Full Name <span>*</span></label>
          <input type="text" id="name" placeholder="Jane Smith"/>
        </div>
        <div class="field">
          <label>Gender <span style="color:var(--muted);font-weight:400;text-transform:none;letter-spacing:0">(optional)</span></label>
          <select id="gender">
            <option value="unspecified">Prefer not to say</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="non_binary">Non-binary</option>
          </select>
        </div>
      </div>
      <div class="row cols-2">
        <div class="field">
          <label>Email Address <span>*</span></label>
          <input type="email" id="email" placeholder="jane@email.com"/>
        </div>
        <div class="field">
          <label>Phone Number <span>*</span></label>
          <input type="tel" id="phone" placeholder="(301) 555-0100"/>
        </div>
      </div>
      <div class="section-label">Home Address</div>
      <div class="row">
        <div class="field">
          <label>Street Address</label>
          <input type="text" id="address" placeholder="123 Main Street"/>
        </div>
      </div>
      <div class="row cols-3">
        <div class="field">
          <label>City</label>
          <input type="text" id="city" placeholder="Silver Spring"/>
        </div>
        <div class="field">
          <label>State</label>
          <select id="state">
            <option value="MD" selected>Maryland</option>
            <option value="VA">Virginia</option>
            <option value="DC">Washington DC</option>
          </select>
        </div>
        <div class="field">
          <label>ZIP Code</label>
          <input type="text" id="zip" placeholder="20901"/>
        </div>
      </div>
      <div class="form-error" id="err-1"></div>
      <div class="nav-row">
        <span></span>
        <button class="btn btn-primary" onclick="goTo(2)">Next: Credentials →</button>
      </div>
    </div>
  </div>

  <!-- STEP 2: CREDENTIALS -->
  <div class="panel" id="panel-2">
    <div class="panel-header">
      <div class="panel-icon">🏅</div>
      <div>
        <div class="panel-title">Credentials & Experience</div>
        <div class="panel-sub">Your professional qualifications</div>
      </div>
    </div>
    <div class="panel-body">
      <div class="chips-label">Primary Credential <span style="color:var(--red)">*</span></div>
      <div class="chips" id="cred-chips">
        <div class="chip cred" data-val="UA">Unlicensed Aide (UA/HHA)</div>
        <div class="chip cred" data-val="CNA">CNA</div>
        <div class="chip cred" data-val="GNA">GNA</div>
        <div class="chip cred" data-val="CMT">CMT</div>
        <div class="chip cred" data-val="LPN">LPN</div>
        <div class="chip cred" data-val="RN">RN</div>
        <div class="chip cred" data-val="PT">Physical Therapist</div>
        <div class="chip cred" data-val="OT">Occupational Therapist</div>
        <div class="chip cred" data-val="ST">Speech Therapist</div>
      </div>

      <div class="chips-label">Additional Credentials <span>select all that apply</span></div>
      <div class="chips" id="addl-cred-chips">
        <div class="chip cred" data-val="CNA">CNA</div>
        <div class="chip cred" data-val="GNA">GNA</div>
        <div class="chip cred" data-val="CMT">CMT</div>
        <div class="chip cred" data-val="LPN">LPN</div>
        <div class="chip cred" data-val="RN">RN</div>
        <div class="chip cred" data-val="CPR">CPR Certified</div>
        <div class="chip cred" data-val="FIRST_AID">First Aid</div>
      </div>

      <div class="row cols-2">
        <div class="field">
          <label>License / Certification Number</label>
          <input type="text" id="license_number" placeholder="MD-CNA-12345"/>
          <span class="hint">Leave blank if not applicable</span>
        </div>
        <div class="field">
          <label>Years of Experience</label>
          <select id="years_experience">
            <option value="">Select range</option>
            <option value="Less than 1 year">Less than 1 year</option>
            <option value="1-2 years">1–2 years</option>
            <option value="3-5 years">3–5 years</option>
            <option value="6-10 years">6–10 years</option>
            <option value="10+ years">10+ years</option>
          </select>
        </div>
      </div>
      <div class="form-error" id="err-2"></div>
      <div class="nav-row">
        <button class="btn btn-ghost" onclick="goTo(1)">← Back</button>
        <button class="btn btn-primary" onclick="goTo(3)">Next: Availability →</button>
      </div>
    </div>
  </div>

  <!-- STEP 3: AVAILABILITY -->
  <div class="panel" id="panel-3">
    <div class="panel-header">
      <div class="panel-icon">📅</div>
      <div>
        <div class="panel-title">Availability</div>
        <div class="panel-sub">When can you work?</div>
      </div>
    </div>
    <div class="panel-body">
      <div class="chips-label">Preferred Days <span>select all that apply</span></div>
      <div class="chips" id="day-chips">
        <div class="chip" data-val="monday">Monday</div>
        <div class="chip" data-val="tuesday">Tuesday</div>
        <div class="chip" data-val="wednesday">Wednesday</div>
        <div class="chip" data-val="thursday">Thursday</div>
        <div class="chip" data-val="friday">Friday</div>
        <div class="chip" data-val="saturday">Saturday</div>
        <div class="chip" data-val="sunday">Sunday</div>
      </div>
      <div class="chips-label">Preferred Shifts <span>select all that apply</span></div>
      <div class="chips" id="shift-chips">
        <div class="chip" data-val="morning">🌅 Morning (6am–2pm)</div>
        <div class="chip" data-val="afternoon">☀️ Afternoon (2pm–10pm)</div>
        <div class="chip" data-val="evening">🌙 Evening (4pm–12am)</div>
        <div class="chip" data-val="overnight">🌃 Overnight (10pm–6am)</div>
        <div class="chip" data-val="live_in">🏠 Live-In</div>
        <div class="chip" data-val="flexible">🔄 Flexible / Any</div>
      </div>
      <div class="row cols-2">
        <div class="field">
          <label>Service Radius (miles)</label>
          <select id="service_radius_miles">
            <option value="5">Up to 5 miles</option>
            <option value="10">Up to 10 miles</option>
            <option value="15" selected>Up to 15 miles</option>
            <option value="20">Up to 20 miles</option>
            <option value="30">Up to 30 miles</option>
            <option value="50">Up to 50 miles</option>
          </select>
        </div>
        <div class="field">
          <label>Available to Start</label>
          <select id="available_start">
            <option value="immediately">Immediately</option>
            <option value="1_week">Within 1 week</option>
            <option value="2_weeks">Within 2 weeks</option>
            <option value="1_month">Within 1 month</option>
          </select>
        </div>
      </div>
      <div class="form-error" id="err-3"></div>
      <div class="nav-row">
        <button class="btn btn-ghost" onclick="goTo(2)">← Back</button>
        <button class="btn btn-primary" onclick="goTo(4)">Next: Skills →</button>
      </div>
    </div>
  </div>

  <!-- STEP 4: SKILLS -->
  <div class="panel" id="panel-4">
    <div class="panel-header">
      <div class="panel-icon">💪</div>
      <div>
        <div class="panel-title">Skills & Capabilities</div>
        <div class="panel-sub">Help us match you to the right clients</div>
      </div>
    </div>
    <div class="panel-body">
      <div class="section-label">Clinical Skills</div>
      <div class="chips" id="skill-chips">
        <div class="chip" data-val="Vent Care">Vent Care</div>
        <div class="chip" data-val="Trach Care">Trach Care</div>
        <div class="chip" data-val="Wound Care">Wound Care</div>
        <div class="chip" data-val="G-Tube">G-Tube</div>
        <div class="chip" data-val="IV Therapy">IV Therapy</div>
        <div class="chip" data-val="Catheter Care">Catheter Care</div>
        <div class="chip" data-val="Colostomy Care">Colostomy Care</div>
        <div class="chip" data-val="Feeding Tube">Feeding Tube</div>
        <div class="chip" data-val="Oxygen Therapy">Oxygen Therapy</div>
        <div class="chip" data-val="Medication Management">Medication Management</div>
        <div class="chip" data-val="Vital Signs">Vital Signs</div>
      </div>
      <div class="section-label">Specialties</div>
      <div class="chips" id="specialty-chips">
        <div class="chip" data-val="Pediatrics">Pediatrics</div>
        <div class="chip" data-val="Geriatrics">Geriatrics</div>
        <div class="chip" data-val="Dementia Care">Dementia Care</div>
        <div class="chip" data-val="Alzheimer's">Alzheimer's</div>
        <div class="chip" data-val="Behavioral Health">Behavioral Health</div>
        <div class="chip" data-val="Autism">Autism</div>
        <div class="chip" data-val="Developmental Disabilities">Developmental Disabilities</div>
        <div class="chip" data-val="Hospice / Palliative">Hospice / Palliative</div>
        <div class="chip" data-val="Oncology">Oncology</div>
        <div class="chip" data-val="Cardiac Care">Cardiac Care</div>
        <div class="chip" data-val="Diabetes Management">Diabetes Management</div>
        <div class="chip" data-val="Stroke Recovery">Stroke Recovery</div>
        <div class="chip" data-val="Post-Surgical">Post-Surgical</div>
        <div class="chip" data-val="Orthopedic">Orthopedic</div>
        <div class="chip" data-val="Spinal care">Spinal care</div>
      </div>
      <div class="section-label">Personal Care &amp; ADLs</div>
      <div class="chips" id="adl-chips">
        <div class="chip" data-val="Bathing assistance (tub/shower)">Bathing assistance (tub/shower)</div>
        <div class="chip" data-val="Bedpan / commode assistance">Bedpan / commode assistance</div>
        <div class="chip" data-val="Incontinence care">Incontinence care</div>
        <div class="chip" data-val="Peri care">Peri care</div>
        <div class="chip" data-val="Feeding assistance">Feeding assistance</div>
        <div class="chip" data-val="Dressing assistance">Dressing assistance</div>
        <div class="chip" data-val="Oral hygiene &amp; grooming">Oral hygiene &amp; grooming</div>
        <div class="chip" data-val="Turn &amp; reposition">Turn &amp; reposition</div>
        <div class="chip" data-val="Range of motion exercises">Range of motion exercises</div>
        <div class="chip" data-val="General ADL assistance">General ADL assistance</div>
      </div>
      <div class="section-label">Capabilities & Attributes</div>
      <div class="toggles">
        <div class="toggle-item" onclick="toggleItem(this,'has_car')">
          <input type="checkbox" id="has_car"/>
          <div class="toggle-dot"></div>
          <div class="toggle-text">🚗 Has a car<small>Can drive to client locations</small></div>
        </div>
        <div class="toggle-item" onclick="toggleItem(this,'spanish_speaking')">
          <input type="checkbox" id="spanish_speaking"/>
          <div class="toggle-dot"></div>
          <div class="toggle-text">🗣️ Spanish speaking<small>Bilingual English/Spanish</small></div>
        </div>
        <div class="toggle-item" onclick="toggleItem(this,'hoyer_lift')">
          <input type="checkbox" id="hoyer_lift"/>
          <div class="toggle-dot"></div>
          <div class="toggle-text">🏋️ Hoyer lift trained<small>Can operate hoyer lift</small></div>
        </div>
        <div class="toggle-item" onclick="toggleItem(this,'wheelchair_transfer')">
          <input type="checkbox" id="wheelchair_transfer"/>
          <div class="toggle-dot"></div>
          <div class="toggle-text">♿ Wheelchair transfer<small>Safe patient transfer</small></div>
        </div>
        <div class="toggle-item" onclick="toggleItem(this,'meal_prep')">
          <input type="checkbox" id="meal_prep"/>
          <div class="toggle-dot"></div>
          <div class="toggle-text">🍽️ Meal preparation<small>Can prepare client meals</small></div>
        </div>
        <div class="toggle-item" onclick="toggleItem(this,'total_care')">
          <input type="checkbox" id="total_care"/>
          <div class="toggle-dot"></div>
          <div class="toggle-text">🤲 Total care<small>Full ADL/personal care</small></div>
        </div>
      </div>
      <div class="section-label">Other Languages &amp; Mobility</div>
      <div class="chips" id="extra-chips">
        <div class="chip" data-val="French speaking">French speaking</div>
        <div class="chip" data-val="Sign language">Sign language</div>
        <div class="chip" data-val="Fall prevention">Fall prevention</div>
        <div class="chip" data-val="Ambulation assist">Ambulation assist</div>
        <div class="chip" data-val="Transfer assist">Transfer assist</div>
      </div>
      <div class="section-label">Additional Information</div>
      <div class="field">
        <label>Anything else we should know?</label>
        <textarea id="notes" placeholder="Languages spoken, special certifications, care philosophy, references, or anything else you'd like us to know..."></textarea>
      </div>
      <div class="form-error" id="err-4"></div>
      <div class="nav-row">
        <button class="btn btn-ghost" onclick="goTo(3)">← Back</button>
        <button class="btn btn-primary" onclick="goTo(5)">Review Application →</button>
      </div>
    </div>
  </div>

  <!-- STEP 5: REVIEW -->
  <div class="panel" id="panel-5">
    <div class="panel-header">
      <div class="panel-icon">✅</div>
      <div>
        <div class="panel-title">Review Your Application</div>
        <div class="panel-sub">Confirm everything looks correct before submitting</div>
      </div>
    </div>
    <div class="panel-body">
      <div id="review-content"></div>
      <div style="background:var(--gold-light);border:1px solid #E8D090;border-radius:10px;padding:16px 20px;margin:20px 0;font-size:13.5px;color:#6B5500;display:flex;gap:12px;align-items:flex-start">
        <span style="font-size:20px;flex-shrink:0">📋</span>
        <div>
          <strong>What happens next?</strong><br/>
          After submitting, our team will review your application within 1–2 business days and reach out via email or phone to complete onboarding. Your profile is created immediately and activated once verified.
        </div>
      </div>
      <div class="form-error" id="err-5"></div>
      <div class="nav-row">
        <button class="btn btn-ghost" onclick="goTo(4)">← Edit</button>
        <button class="btn btn-submit" id="submit-btn" onclick="submitForm()">
          Submit Application →
        </button>
      </div>
    </div>
  </div>

  <!-- SUCCESS -->
  <div id="success">
    <div class="success-icon">✓</div>
    <h2>Application Submitted!</h2>
    <p>Thank you for applying to join the Vitalis HealthCare care team. We'll review your application and reach out within 1–2 business days.</p>
    <div style="margin-top:24px;padding:16px;background:var(--green-pale);border-radius:10px;font-size:13px;color:var(--muted)">
      Questions? Call us or email <strong style="color:var(--green-dark)">team@vitalishealthcare.com</strong>
    </div>
    <div class="success-logo">
      <div style="font-family:'Cormorant Garamond',serif;font-size:20px;font-weight:600;color:var(--green-dark);">Vitalis HealthCare Services, LLC</div>
      <div style="font-size:12px;color:var(--muted);margin-top:4px;letter-spacing:0.05em">RSA Level 3 · License #3879R · Silver Spring, MD</div>
    </div>
  </div>

</div>

<!-- FOOTER -->
<div class="form-footer">
  <div class="footer-logo-wrap">
    <div class="footer-icon">⌖</div>
    <div>
      <div class="footer-name">Vitalis HealthCare Services, LLC</div>
      <div class="footer-sub">8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910 &nbsp;·&nbsp; RSA Level 3 · License #3879R</div>
    </div>
  </div>
</div>

<script>
const state = {
  currentStep: 1,
  primaryCred: '',
  additionalCreds: [],
  days: [],
  shifts: [],
  skills: [],
}

function initChips(containerId, stateKey, single = false) {
  const container = document.getElementById(containerId)
  if (!container) return
  container.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.val
      if (single) {
        container.querySelectorAll('.chip').forEach(c => c.classList.remove('selected'))
        state[stateKey] = val
        chip.classList.add('selected')
      } else {
        if (!Array.isArray(state[stateKey])) state[stateKey] = []
        if (state[stateKey].includes(val)) {
          state[stateKey] = state[stateKey].filter(v => v !== val)
          chip.classList.remove('selected')
        } else {
          state[stateKey].push(val)
          chip.classList.add('selected')
        }
      }
    })
  })
}

initChips('cred-chips', 'primaryCred', true)
initChips('addl-cred-chips', 'additionalCreds', false)
initChips('day-chips', 'days', false)
initChips('shift-chips', 'shifts', false)
initChips('skill-chips', 'skills', false)
initChips('specialty-chips', 'skills', false)
initChips('adl-chips', 'skills', false)
initChips('extra-chips', 'skills', false)

function toggleItem(el, field) {
  el.classList.toggle('on')
  const cb = el.querySelector('input[type=checkbox]')
  if (cb) cb.checked = !cb.checked
}

function goTo(step) {
  if (step > state.currentStep && !validate(state.currentStep)) return
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'))
  document.getElementById(\`panel-\${step}\`).classList.add('active')
  for (let i = 1; i <= 5; i++) {
    const ind = document.getElementById(\`step-ind-\${i}\`)
    ind.classList.remove('active', 'done')
    if (i === step) ind.classList.add('active')
    else if (i < step) ind.classList.add('done')
    if (i < 5) document.getElementById(\`line-\${i}\`).classList.toggle('done', i < step)
  }
  state.currentStep = step
  window.scrollTo({ top: 0, behavior: 'smooth' })
  if (step === 5) buildReview()
}

function validate(step) {
  const err = document.getElementById(\`err-\${step}\`)
  err.style.display = 'none'
  if (step === 1) {
    if (!document.getElementById('name').value.trim()) { showErr(err, 'Please enter your full name.'); return false }
    const email = document.getElementById('email').value.trim()
    if (!email || !email.includes('@')) { showErr(err, 'Please enter a valid email address.'); return false }
    if (!document.getElementById('phone').value.trim()) { showErr(err, 'Please enter your phone number.'); return false }
  }
  if (step === 2 && !state.primaryCred) { showErr(err, 'Please select your primary credential.'); return false }
  return true
}

function showErr(el, msg) {
  el.textContent = msg; el.style.display = 'block'
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
}

function buildReview() {
  const rows = [
    ['Name', document.getElementById('name').value],
    ['Email', document.getElementById('email').value],
    ['Phone', document.getElementById('phone').value],
    ['Location', [document.getElementById('city').value, document.getElementById('state').value].filter(Boolean).join(', ')],
    ['Primary Credential', state.primaryCred],
    ['Additional Credentials', state.additionalCreds.join(', ') || '—'],
    ['License #', document.getElementById('license_number').value || '—'],
    ['Experience', document.getElementById('years_experience').value || '—'],
    ['Preferred Shifts', state.shifts.join(', ') || '—'],
    ['Preferred Days', state.days.join(', ') || '—'],
    ['Service Area', document.getElementById('service_radius_miles').value + ' miles'],
    ['Skills Selected', state.skills.length ? state.skills.length + ' skills/specialties' : 'None'],
    ['Has Car', document.getElementById('has_car').checked ? 'Yes' : 'No'],
    ['Spanish Speaking', document.getElementById('spanish_speaking').checked ? 'Yes' : 'No'],
    ['Hoyer Lift', document.getElementById('hoyer_lift').checked ? 'Yes' : 'No'],
    ['Wheelchair Transfer', document.getElementById('wheelchair_transfer').checked ? 'Yes' : 'No'],
    ['Notes', document.getElementById('notes').value || '—'],
  ]
  document.getElementById('review-content').innerHTML = rows.map(([label, value]) =>
    \`<div class="review-row"><span class="review-label">\${label}</span><span class="review-value">\${value || '—'}</span></div>\`
  ).join('')
}

async function submitForm() {
  const btn = document.getElementById('submit-btn')
  const err = document.getElementById('err-5')
  btn.disabled = true; btn.textContent = 'Submitting...'; err.style.display = 'none'
  const payload = {
    name: document.getElementById('name').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim() || 'Silver Spring',
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value.trim(),
    gender: document.getElementById('gender').value || 'unspecified',
    credential_type: state.primaryCred,
    additional_credentials: state.additionalCreds,
    license_number: document.getElementById('license_number').value.trim(),
    years_experience: document.getElementById('years_experience').value,
    skills: state.skills,
    preferred_days: state.days,
    shift_preferences: state.shifts,
    service_radius_miles: parseInt(document.getElementById('service_radius_miles').value),
    has_car: document.getElementById('has_car').checked,
    spanish_speaking: document.getElementById('spanish_speaking').checked,
    hoyer_lift: document.getElementById('hoyer_lift').checked,
    wheelchair_transfer: document.getElementById('wheelchair_transfer').checked,
    meal_prep: document.getElementById('meal_prep').checked,
    total_care: document.getElementById('total_care').checked,
    notes: document.getElementById('notes').value.trim(),
  }
  try {
    const res = await fetch('/api/providers/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Submission failed')
    document.getElementById('panel-5').style.display = 'none'
    document.getElementById('success').style.display = 'block'
    window.scrollTo({ top: 0, behavior: 'smooth' })
  } catch (e) {
    showErr(err, e.message || 'Something went wrong. Please try again.')
    btn.disabled = false; btn.textContent = 'Submit Application →'
  }
}
</script>
</body>
</html>`

export async function GET() {
  return new NextResponse(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
