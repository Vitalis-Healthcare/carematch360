import { NextResponse } from 'next/server'

const HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>In-Home Care Services — Vitalis HealthCare Services</title>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,500;0,600;1,400;1,500;1,600&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap" rel="stylesheet"/>
<style>
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
:root {
  --green-dark:   #2D5A1B;
  --green-mid:    #4A7C2F;
  --green-bright: #7AB52A;
  --green-lime:   #9DCF3A;
  --green-light:  #EBF5DF;
  --green-pale:   #F4FAF0;
  --warm-white:   #FDFCF8;
  --text:         #1A2E10;
  --muted:        #5A7050;
  --border:       #C8DDB8;
  --bg:           #F2F8EC;
  --white:        #FFFFFF;
  --red:          #DC2626;
  --gold:         #B8860B;
  --gold-bg:      #FDF8E7;
  --gold-border:  #E8D090;
}
html { scroll-behavior: smooth; }
body { font-family: 'DM Sans', sans-serif; background: var(--warm-white); color: var(--text); }

/* ── NAV ─────────────────────────────────────── */
.nav {
  position: fixed; top: 0; left: 0; right: 0; z-index: 200;
  background: rgba(26,58,10,0.96);
  backdrop-filter: blur(12px);
  border-bottom: 1px solid rgba(157,207,58,0.2);
  padding: 14px 40px;
  display: flex; align-items: center; justify-content: space-between;
}
.nav-logo { display: flex; align-items: center; gap: 10px; }
.nav-icon {
  width: 34px; height: 34px;
  background: linear-gradient(135deg, var(--green-bright), var(--green-lime));
  border-radius: 8px;
  display: flex; align-items: center; justify-content: center;
  font-size: 16px;
}
.nav-name {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px; font-weight: 600; color: #ffffff;
}
.nav-cta {
  background: var(--green-bright); color: #fff;
  border: none; border-radius: 8px;
  padding: 9px 20px; font-size: 13.5px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: background 0.2s;
  text-decoration: none; display: inline-block;
}
.nav-cta:hover { background: var(--green-mid); }

/* ── HERO ────────────────────────────────────── */
.hero {
  min-height: 100vh;
  background: linear-gradient(160deg, #061205 0%, #132B08 35%, #1F4210 60%, #2D5A1B 100%);
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  padding: 100px 24px 80px; text-align: center; position: relative; overflow: hidden;
}
.hero::before {
  content: ''; position: absolute;
  width: 900px; height: 900px; border-radius: 50%;
  background: radial-gradient(circle, rgba(122,181,42,0.12) 0%, transparent 65%);
  top: -200px; right: -200px; pointer-events: none;
}
.hero::after {
  content: ''; position: absolute;
  width: 600px; height: 600px; border-radius: 50%;
  background: radial-gradient(circle, rgba(157,207,58,0.08) 0%, transparent 65%);
  bottom: -100px; left: -100px; pointer-events: none;
}
.hero-tag {
  display: inline-flex; align-items: center; gap: 8px;
  background: rgba(122,181,42,0.15); border: 1px solid rgba(157,207,58,0.3);
  border-radius: 20px; padding: 6px 18px;
  font-size: 12.5px; color: var(--green-lime);
  letter-spacing: 0.06em; text-transform: uppercase;
  font-weight: 600; margin-bottom: 28px; position: relative;
}
.hero h1 {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(42px, 7vw, 80px);
  font-weight: 500; color: #fff;
  line-height: 1.08; letter-spacing: -0.02em;
  margin-bottom: 12px; position: relative;
}
.hero h1 em { font-style: italic; color: var(--green-lime); }
.hero h1 span { display: block; }
.hero-sub {
  font-size: clamp(16px, 2vw, 19px);
  color: rgba(255,255,255,0.6);
  max-width: 560px; margin: 0 auto 40px;
  line-height: 1.75; font-weight: 300; position: relative;
}
.hero-badges {
  display: flex; flex-wrap: wrap; gap: 8px;
  justify-content: center; margin-bottom: 52px; position: relative;
}
.badge {
  background: rgba(255,255,255,0.08); border: 1px solid rgba(255,255,255,0.15);
  border-radius: 20px; padding: 6px 16px;
  font-size: 12.5px; color: rgba(255,255,255,0.8);
  display: flex; align-items: center; gap: 6px;
}
.hero-actions { display: flex; gap: 14px; flex-wrap: wrap; justify-content: center; position: relative; }
.btn-hero-primary {
  background: var(--green-bright); color: #fff;
  border: none; border-radius: 10px;
  padding: 16px 36px; font-size: 16px; font-weight: 600;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  box-shadow: 0 6px 24px rgba(122,181,42,0.4);
  transition: all 0.2s; text-decoration: none; display: inline-block;
}
.btn-hero-primary:hover { background: var(--green-mid); transform: translateY(-2px); box-shadow: 0 10px 30px rgba(74,124,47,0.5); }
.btn-hero-ghost {
  background: rgba(255,255,255,0.08); color: rgba(255,255,255,0.85);
  border: 1px solid rgba(255,255,255,0.2); border-radius: 10px;
  padding: 16px 36px; font-size: 16px; font-weight: 500;
  cursor: pointer; font-family: 'DM Sans', sans-serif;
  transition: all 0.2s; text-decoration: none; display: inline-block;
}
.btn-hero-ghost:hover { background: rgba(255,255,255,0.14); }
.hero-scroll {
  position: absolute; bottom: 32px; left: 50%; transform: translateX(-50%);
  color: rgba(255,255,255,0.35); font-size: 22px;
  animation: bounce 2s infinite;
}
@keyframes bounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }

/* ── TRUST STRIP ─────────────────────────────── */
.trust-strip {
  background: var(--white); border-bottom: 1px solid var(--border);
  padding: 20px 40px;
  display: flex; align-items: center; justify-content: center;
  gap: 40px; flex-wrap: wrap;
}
.trust-item {
  display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: var(--muted); font-weight: 500;
}
.trust-item span.icon {
  width: 28px; height: 28px;
  background: var(--green-light); border-radius: 6px;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}

/* ── WHY VITALIS ─────────────────────────────── */
.why-section { padding: 80px 24px; background: var(--warm-white); }
.section-inner { max-width: 1000px; margin: 0 auto; }
.section-eyebrow {
  font-size: 11px; font-weight: 700; letter-spacing: 0.12em;
  text-transform: uppercase; color: var(--green-bright);
  margin-bottom: 12px;
}
.section-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: clamp(30px, 4vw, 46px); font-weight: 500;
  color: var(--green-dark); line-height: 1.2;
  letter-spacing: -0.01em; margin-bottom: 14px;
}
.section-sub {
  font-size: 16px; color: var(--muted); line-height: 1.75;
  max-width: 560px; margin-bottom: 52px;
}
.why-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 24px; }
@media(max-width:700px){ .why-grid{grid-template-columns:1fr;} }
.why-card {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 16px; padding: 28px;
  transition: box-shadow 0.2s, transform 0.2s;
}
.why-card:hover { box-shadow: 0 8px 32px rgba(45,90,27,0.1); transform: translateY(-3px); }
.why-icon {
  width: 48px; height: 48px;
  background: linear-gradient(135deg, var(--green-light), #D4EBB8);
  border-radius: 12px; display: flex; align-items: center; justify-content: center;
  font-size: 22px; margin-bottom: 16px;
}
.why-card h3 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 20px; font-weight: 600; color: var(--green-dark);
  margin-bottom: 8px;
}
.why-card p { font-size: 14px; color: var(--muted); line-height: 1.7; }

/* ── SERVICES STRIP ──────────────────────────── */
.services { background: linear-gradient(135deg, var(--green-dark), var(--green-mid)); padding: 60px 24px; }
.services-inner { max-width: 1000px; margin: 0 auto; }
.services-title {
  font-family: 'Cormorant Garamond', serif;
  font-size: 34px; font-weight: 500; color: #fff;
  text-align: center; margin-bottom: 36px;
}
.services-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
@media(max-width:700px){ .services-grid{grid-template-columns:1fr 1fr;} }
@media(max-width:400px){ .services-grid{grid-template-columns:1fr;} }
.service-item {
  background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.15);
  border-radius: 12px; padding: 18px 20px;
  display: flex; align-items: center; gap: 12px;
  color: #fff;
}
.service-item .si { font-size: 22px; flex-shrink: 0; }
.service-item .sl { font-size: 14px; font-weight: 500; }
.service-item .sd { font-size: 12px; color: rgba(255,255,255,0.6); margin-top: 2px; }

/* ── PROCESS ─────────────────────────────────── */
.process { padding: 80px 24px; background: var(--bg); }
.process-steps { display: grid; grid-template-columns: repeat(4,1fr); gap: 24px; margin-top: 48px; }
@media(max-width:700px){ .process-steps{grid-template-columns:1fr 1fr;} }
@media(max-width:400px){ .process-steps{grid-template-columns:1fr;} }
.process-step { text-align: center; }
.step-num-circle {
  width: 52px; height: 52px; border-radius: 50%;
  background: linear-gradient(135deg, var(--green-bright), var(--green-lime));
  color: #fff; font-size: 20px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 16px;
  box-shadow: 0 4px 14px rgba(122,181,42,0.35);
}
.process-step h4 {
  font-family: 'Cormorant Garamond', serif;
  font-size: 18px; font-weight: 600; color: #ffffff; margin-bottom: 8px;
}
.process-step p { font-size: 13px; color: var(--muted); line-height: 1.6; }

/* ── FORM SECTION ────────────────────────────── */
.form-section { padding: 80px 24px; background: var(--warm-white); }
.form-intro { text-align: center; margin-bottom: 48px; }
.form-shell { max-width: 720px; margin: 0 auto; }

/* ── PANELS ──────────────────────────────────── */
.progress-wrap {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px 24px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(45,90,27,0.05);
}
.progress-inner { display: flex; align-items: center; }
.step { display: flex; align-items: center; gap: 7px; flex: 1; font-size: 12px; color: var(--muted); }
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
.step-line { flex: 1; height: 2px; background: var(--border); margin: 0 6px; max-width: 36px; transition: background 0.3s; }
.step-line.done { background: var(--green-dark); }

.panel {
  background: var(--white); border: 1px solid var(--border);
  border-radius: 16px; overflow: hidden; display: none;
  animation: fadeUp 0.35s ease;
  box-shadow: 0 2px 16px rgba(45,90,27,0.06);
}
.panel.active { display: block; }
@keyframes fadeUp { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
.panel-header {
  background: linear-gradient(135deg, var(--green-dark), var(--green-mid));
  padding: 20px 28px; display: flex; align-items: center; gap: 14px;
  position: relative; overflow: hidden;
}
.panel-header::after {
  content: ''; position: absolute; right: -20px; top: -20px;
  width: 100px; height: 100px; border-radius: 50%;
  background: rgba(157,207,58,0.12);
}
.panel-icon { width: 42px; height: 42px; background: rgba(255,255,255,0.15); border-radius: 10px; display: flex; align-items: center; justify-content: center; font-size: 20px; flex-shrink: 0; }
.panel-title { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 600; color: #fff; }
.panel-sub { font-size: 12.5px; color: rgba(255,255,255,0.6); margin-top: 2px; }
.panel-body { padding: 28px; }

/* ── FORM ELEMENTS ───────────────────────────── */
.row { display: grid; gap: 16px; margin-bottom: 16px; }
.row.cols-2 { grid-template-columns: 1fr 1fr; }
.row.cols-3 { grid-template-columns: 1fr 1fr 1fr; }
@media(max-width:560px){ .row.cols-2,.row.cols-3{grid-template-columns:1fr;} }
.field { display: flex; flex-direction: column; gap: 5px; }
.field label { font-size: 11.5px; font-weight: 600; color: var(--green-dark); letter-spacing: 0.06em; text-transform: uppercase; }
.field label span.req { color: var(--red); margin-left: 2px; }
.field input,.field select,.field textarea {
  border: 1.5px solid var(--border); border-radius: 9px;
  padding: 10px 14px; font-size: 14px;
  font-family: 'DM Sans', sans-serif; color: var(--text);
  background: #fff; outline: none; width: 100%;
  transition: border-color 0.2s, box-shadow 0.2s;
}
.field input:focus,.field select:focus,.field textarea:focus {
  border-color: var(--green-bright);
  box-shadow: 0 0 0 3px rgba(122,181,42,0.15);
}
.field textarea { min-height: 90px; resize: vertical; }
.field .hint { font-size: 11px; color: var(--muted); margin-top: 1px; }
.section-label { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.12em; color: var(--green-bright); padding: 0 0 8px; border-bottom: 1px solid var(--green-light); margin: 22px 0 14px; }

/* ── CHIPS ───────────────────────────────────── */
.chips-label { font-size: 11.5px; font-weight: 600; color: var(--green-dark); letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 9px; }
.chips-label span { font-weight: 400; color: var(--muted); font-size: 11px; text-transform: none; letter-spacing: 0; margin-left: 6px; }
.chips { display: flex; flex-wrap: wrap; gap: 7px; margin-bottom: 20px; }
.chip { padding: 7px 15px; border-radius: 20px; border: 1.5px solid var(--border); background: #fff; font-size: 13px; cursor: pointer; user-select: none; color: var(--muted); transition: all 0.18s; font-family: 'DM Sans', sans-serif; }
.chip:hover { border-color: var(--green-bright); color: var(--green-mid); }
.chip.selected { background: var(--green-light); border-color: var(--green-bright); color: var(--green-dark); font-weight: 600; }

/* ── TOGGLES ─────────────────────────────────── */
.toggles { display: grid; grid-template-columns: 1fr 1fr; gap: 9px; margin-bottom: 20px; }
@media(max-width:400px){ .toggles{grid-template-columns:1fr;} }
.toggle-item { display: flex; align-items: center; gap: 11px; background: var(--green-pale); border: 1.5px solid var(--border); border-radius: 10px; padding: 11px 14px; cursor: pointer; transition: all 0.18s; }
.toggle-item:hover { border-color: var(--green-bright); }
.toggle-item.on { background: var(--green-light); border-color: var(--green-bright); }
.toggle-item input { display: none; }
.toggle-dot { width: 32px; height: 18px; background: var(--border); border-radius: 9px; position: relative; flex-shrink: 0; transition: background 0.2s; }
.toggle-dot::after { content: ''; position: absolute; width: 12px; height: 12px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: transform 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.2); }
.toggle-item.on .toggle-dot { background: var(--green-bright); }
.toggle-item.on .toggle-dot::after { transform: translateX(14px); }
.toggle-text { font-size: 13px; font-weight: 500; color: var(--text); }
.toggle-text small { display: block; font-size: 11px; color: var(--muted); font-weight: 400; }

/* ── NAV BUTTONS ─────────────────────────────── */
.nav-row { display: flex; justify-content: space-between; align-items: center; margin-top: 28px; padding-top: 20px; border-top: 1px solid var(--green-light); }
.btn { padding: 11px 26px; border-radius: 9px; font-size: 14px; font-weight: 600; font-family: 'DM Sans', sans-serif; cursor: pointer; border: none; transition: all 0.2s; display: flex; align-items: center; gap: 7px; }
.btn-primary { background: var(--green-bright); color: #fff; box-shadow: 0 4px 14px rgba(122,181,42,0.35); }
.btn-primary:hover { background: var(--green-mid); transform: translateY(-1px); }
.btn-primary:disabled { background: var(--border); color: var(--muted); box-shadow: none; cursor: not-allowed; transform: none; }
.btn-ghost { background: transparent; color: var(--muted); border: 1.5px solid var(--border); }
.btn-ghost:hover { border-color: var(--green-mid); color: var(--green-dark); }
.btn-submit { background: linear-gradient(135deg, var(--green-dark), var(--green-mid)); color: #fff; box-shadow: 0 4px 14px rgba(45,90,27,0.35); padding: 13px 34px; font-size: 15px; }
.btn-submit:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(45,90,27,0.45); }
.btn-submit:disabled { background: var(--border); color: var(--muted); box-shadow: none; cursor: not-allowed; transform: none; }

/* ── ERROR ───────────────────────────────────── */
.form-error { background: #FEF2F2; border: 1px solid #FECACA; border-radius: 9px; padding: 11px 16px; font-size: 13.5px; color: var(--red); margin-top: 14px; display: none; }

/* ── REVIEW ──────────────────────────────────── */
.review-row { display: flex; justify-content: space-between; padding: 9px 0; border-bottom: 1px solid var(--green-light); font-size: 13.5px; }
.review-row:last-child { border-bottom: none; }
.review-label { color: var(--muted); }
.review-value { font-weight: 500; text-align: right; max-width: 60%; color: var(--green-dark); }

/* ── SUCCESS ─────────────────────────────────── */
#success { display: none; text-align: center; padding: 60px 32px; background: var(--white); border: 1px solid var(--border); border-radius: 16px; box-shadow: 0 2px 16px rgba(45,90,27,0.06); }
.success-icon { width: 84px; height: 84px; background: linear-gradient(135deg, var(--green-bright), var(--green-lime)); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 38px; margin: 0 auto 20px; box-shadow: 0 8px 28px rgba(122,181,42,0.35); }
#success h2 { font-family: 'Cormorant Garamond', serif; font-size: 34px; font-weight: 600; color: var(--green-dark); margin-bottom: 12px; }
#success p { font-size: 15px; color: var(--muted); max-width: 440px; margin: 0 auto; line-height: 1.75; }
.success-next { background: var(--green-pale); border: 1px solid var(--border); border-radius: 12px; padding: 20px 24px; margin-top: 28px; text-align: left; }
.success-next h4 { font-size: 13.5px; font-weight: 600; color: var(--green-dark); margin-bottom: 10px; }
.success-step { display: flex; gap: 10px; align-items: flex-start; margin-bottom: 10px; font-size: 13px; color: var(--muted); }
.success-step-num { width: 20px; height: 20px; background: var(--green-bright); color: #fff; border-radius: 50%; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 1px; }

/* ── FOOTER ──────────────────────────────────── */
.footer { background: var(--green-dark); padding: 48px 24px 32px; text-align: center; }
.footer-logo-wrap { display: inline-flex; align-items: center; gap: 12px; margin-bottom: 20px; }
.footer-icon { width: 36px; height: 36px; background: linear-gradient(135deg, var(--green-bright), var(--green-lime)); border-radius: 9px; display: flex; align-items: center; justify-content: center; font-size: 18px; }
.footer-name { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 600; color: #fff; }
.footer-tag { font-size: 11px; color: rgba(255,255,255,0.45); margin-top: 1px; letter-spacing: 0.04em; }
.footer-info { font-size: 12.5px; color: rgba(255,255,255,0.45); line-height: 1.8; }
.footer-info a { color: rgba(255,255,255,0.6); text-decoration: none; }

/* ── URGENCY CALLOUT ─────────────────────────── */
.urgency-bar { background: var(--gold-bg); border: 1px solid var(--gold-border); border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; display: flex; gap: 12px; align-items: center; font-size: 13.5px; color: #6B5500; }

@media(max-width:600px){
  .nav { padding: 12px 20px; }
  .trust-strip { gap: 16px; padding: 16px 20px; }
  .trust-strip .label { display: none; }
  .step-label { display: none; }
}
</style>
</head>
<body>

<!-- NAV -->
<nav class="nav">
  <div class="nav-logo">
    <div class="nav-icon">⌖</div>
    <div class="nav-name">Vitalis HealthCare</div>
  </div>
  <div style="display:flex;align-items:center;gap:14px">
    <a href="tel:+12407166874" style="display:flex;align-items:center;gap:7px;color:rgba(255,255,255,0.92);font-size:14px;font-weight:600;text-decoration:none;letter-spacing:0.01em;white-space:nowrap">
      <span style="font-size:16px">📞</span> 240.716.6874
    </a>
    <a class="nav-cta" href="#get-care">Get Care →</a>
  </div>
</nav>

<!-- HERO -->
<section class="hero">
  <div class="hero-tag">🏥 Maryland's Trusted Home Care Agency</div>
  <h1>
    <span>Care That Comes</span>
    <span>to <em>Your Home</em></span>
  </h1>
  <p class="hero-sub">Compassionate, skilled caregivers matched to your loved one's exact needs — so they can live with dignity, comfort, and independence.</p>

  <div class="hero-badges">
    <span class="badge">🗺️ Serving All of Maryland</span>
    <span class="badge">📋 Maryland OHCQ Licensed</span>
    <span class="badge">💳 Private Pay & LTC Insurance</span>
    <span class="badge">⭐ CareScout Approved Provider</span>
    <span class="badge">🏅 RSA L3: License #3879R</span>
  </div>
  <div class="hero-actions">
    <a href="#get-care" class="btn-hero-primary">Request Care Now</a>
    <a href="tel:+12407166874" class="btn-hero-ghost">📞 Call Us Today</a>
  </div>
  <div class="hero-scroll">↓</div>
</section>

<!-- TRUST STRIP -->
<div class="trust-strip">
  <div class="trust-item"><span class="icon">✓</span> <span class="label">Licensed & Insured</span></div>
  <div class="trust-item"><span class="icon">⚡</span> <span class="label">24-Hour Response</span></div>
  <div class="trust-item"><span class="icon">🤝</span> <span class="label">Free Consultation</span></div>
  <div class="trust-item"><span class="icon">🛡️</span> <span class="label">Background Checked Caregivers</span></div>
  <div class="trust-item"><span class="icon">⭐</span> <span class="label">CareScout Approved</span></div>
</div>

<!-- WHY VITALIS -->
<section class="why-section">
  <div class="section-inner">
    <div class="section-eyebrow">Why families choose us</div>
    <h2 class="section-title">Care That Goes Beyond the Visit</h2>
    <p class="section-sub">We don't just send caregivers — we match your loved one with someone who fits their personality, schedule, and clinical needs.</p>
    <div class="why-grid">
      <div class="why-card">
        <div class="why-icon">🎯</div>
        <h3>Precision Matching</h3>
        <p>Our smart matching system finds caregivers who fit your loved one's specific needs, location, schedule, and personal preferences.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">🏅</div>
        <h3>Vetted Professionals</h3>
        <p>Every caregiver is background-checked, credential-verified, and trained. CNAs, GNAs, CMTs, LPNs, RNs — we have the full spectrum.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">📞</div>
        <h3>Dedicated Coordinator</h3>
        <p>Your personal care coordinator is reachable 7 days a week. No call centers, no automated menus — a real person who knows your family.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">💳</div>
        <h3>All Payer Types</h3>
        <p>We accept Private Pay, Long-Term Care Insurance, Maryland Medicaid Waiver, CareFirst, and more. We help you navigate your benefits.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">⚡</div>
        <h3>Fast Start</h3>
        <p>From inquiry to first visit in as little as 48 hours for routine cases. Emergency placement available when you need it most.</p>
      </div>
      <div class="why-card">
        <div class="why-icon">🔄</div>
        <h3>Flexible Schedules</h3>
        <p>A few hours a week or full-time live-in care — we flex to your needs. Schedules adjust as your loved one's needs change over time.</p>
      </div>
    </div>
  </div>
</section>

<!-- SERVICES -->
<section class="services">
  <div class="services-inner">
    <div class="services-title">Services We Provide</div>
    <div class="services-grid">
      <div class="service-item"><div class="si">🏠</div><div><div class="sl">Companion Care</div><div class="sd">Companionship, errands, light housekeeping</div></div></div>
      <div class="service-item"><div class="si">🤲</div><div><div class="sl">Personal Care</div><div class="sd">Bathing, dressing, grooming, ADLs</div></div></div>
      <div class="service-item"><div class="si">💉</div><div><div class="sl">Skilled Nursing</div><div class="sd">LPN/RN-level clinical care at home</div></div></div>
      <div class="service-item"><div class="si">🧠</div><div><div class="sl">Memory Care</div><div class="sd">Dementia, Alzheimer's specialist care</div></div></div>
      <div class="service-item"><div class="si">🏋️</div><div><div class="sl">Rehab Support</div><div class="sd">PT/OT/ST follow-up & recovery care</div></div></div>
      <div class="service-item"><div class="si">🌙</div><div><div class="sl">Live-In Care</div><div class="sd">24-hour on-site caregiver support</div></div></div>
    </div>
  </div>
</section>

<!-- PROCESS -->
<section class="process">
  <div class="section-inner">
    <div style="text-align:center">
      <div class="section-eyebrow">How it works</div>
      <h2 class="section-title">From Inquiry to Care in 4 Steps</h2>
    </div>
    <div class="process-steps">
      <div class="process-step">
        <div class="step-num-circle">1</div>
        <h4>Tell Us Your Needs</h4>
        <p>Complete our short intake form. Takes about 5 minutes and helps us understand exactly what you need.</p>
      </div>
      <div class="process-step">
        <div class="step-num-circle">2</div>
        <h4>Free Consultation</h4>
        <p>Your care coordinator calls within 24 hours to discuss your situation and answer all your questions.</p>
      </div>
      <div class="process-step">
        <div class="step-num-circle">3</div>
        <h4>Caregiver Match</h4>
        <p>We identify the best-fit caregiver based on credentials, proximity, skills, and your preferences.</p>
      </div>
      <div class="process-step">
        <div class="step-num-circle">4</div>
        <h4>Care Begins</h4>
        <p>Your caregiver starts — and your coordinator stays in touch to make sure everything is perfect.</p>
      </div>
    </div>
  </div>
</section>

<!-- INTAKE FORM -->
<section class="form-section" id="get-care">
  <div class="form-intro">
    <div class="section-eyebrow">Get started today</div>
    <h2 class="section-title">Request Care for Your Loved One</h2>
    <p style="font-size:16px;color:var(--muted);max-width:500px;margin:0 auto;line-height:1.7">Fill out this short form and your care coordinator will follow up within 24 hours — no obligation, no pressure.</p>
  </div>

  <div class="form-shell">
    <!-- Progress -->
    <div class="progress-wrap">
      <div class="progress-inner">
        <div class="step active" id="step-ind-1"><div class="step-num">1</div><span class="step-label">Contact</span></div>
        <div class="step-line" id="line-1"></div>
        <div class="step" id="step-ind-2"><div class="step-num">2</div><span class="step-label">Recipient</span></div>
        <div class="step-line" id="line-2"></div>
        <div class="step" id="step-ind-3"><div class="step-num">3</div><span class="step-label">Care Needs</span></div>
        <div class="step-line" id="line-3"></div>
        <div class="step" id="step-ind-4"><div class="step-num">4</div><span class="step-label">Schedule</span></div>
        <div class="step-line" id="line-4"></div>
        <div class="step" id="step-ind-5"><div class="step-num">5</div><span class="step-label">Review</span></div>
      </div>
    </div>

    <!-- STEP 1: YOUR CONTACT INFO -->
    <div class="panel active" id="panel-1">
      <div class="panel-header">
        <div class="panel-icon">👤</div>
        <div>
          <div class="panel-title">Your Contact Information</div>
          <div class="panel-sub">Who should we call to discuss care options?</div>
        </div>
      </div>
      <div class="panel-body">
        <div class="row cols-2">
          <div class="field">
            <label>Your Full Name <span class="req">*</span></label>
            <input type="text" id="contact_name" placeholder="Mary Johnson"/>
          </div>
          <div class="field">
            <label>Relationship to Recipient <span class="req">*</span></label>
            <select id="contact_relationship">
              <option value="">Select relationship</option>
              <option value="Self">Self (the care recipient)</option>
              <option value="Spouse / Partner">Spouse / Partner</option>
              <option value="Adult Child">Adult Child</option>
              <option value="Sibling">Sibling</option>
              <option value="Parent">Parent</option>
              <option value="Power of Attorney">Power of Attorney</option>
              <option value="Case Manager">Case Manager / Social Worker</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>
        <div class="row cols-2">
          <div class="field">
            <label>Your Email <span class="req">*</span></label>
            <input type="email" id="contact_email" placeholder="mary@email.com"/>
          </div>
          <div class="field">
            <label>Your Phone <span class="req">*</span></label>
            <input type="tel" id="contact_phone" placeholder="240.716.6874"/>
          </div>
        </div>
        <div class="urgency-bar">
          <span style="font-size:20px">⚡</span>
          <div><strong>How soon do you need care?</strong></div>
        </div>
        <div class="chips" id="urgency-chips">
          <div class="chip" data-val="emergency">🔴 Emergency — within 24hrs</div>
          <div class="chip" data-val="urgent">🟡 Urgent — within 1 week</div>
          <div class="chip" data-val="routine">🟢 Planning ahead — 2+ weeks</div>
        </div>
        <div class="form-error" id="err-1"></div>
        <div class="nav-row">
          <span></span>
          <button class="btn btn-primary" onclick="goTo(2)">Next: Care Recipient →</button>
        </div>
      </div>
    </div>

    <!-- STEP 2: CARE RECIPIENT -->
    <div class="panel" id="panel-2">
      <div class="panel-header">
        <div class="panel-icon">🏠</div>
        <div>
          <div class="panel-title">About the Care Recipient</div>
          <div class="panel-sub">Who will be receiving care?</div>
        </div>
      </div>
      <div class="panel-body">
        <div class="row cols-2">
          <div class="field">
            <label>Recipient's Full Name</label>
            <input type="text" id="name" placeholder="Robert Johnson (or same as above)"/>
            <span class="hint">Leave blank if same as contact</span>
          </div>
          <div class="field">
            <label>Date of Birth</label>
            <input type="date" id="dob"/>
          </div>
        </div>
        <div class="row cols-2">
          <div class="field">
            <label>Gender</label>
            <select id="gender">
              <option value="">Prefer not to say</option>
              <option value="female">Female</option>
              <option value="male">Male</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div class="field">
            <label>Caregiver Gender Preference</label>
            <select id="gender_preference">
              <option value="no_preference">No preference</option>
              <option value="female">Female caregiver preferred</option>
              <option value="male">Male caregiver preferred</option>
            </select>
          </div>
        </div>
        <div class="section-label">Care Location</div>
        <div class="row">
          <div class="field">
            <label>Street Address</label>
            <input type="text" id="address" placeholder="123 Main Street"/>
          </div>
        </div>
        <div class="row cols-3">
          <div class="field">
            <label>City <span class="req">*</span></label>
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
        <div class="form-error" id="err-2"></div>
        <div class="nav-row">
          <button class="btn btn-ghost" onclick="goTo(1)">← Back</button>
          <button class="btn btn-primary" onclick="goTo(3)">Next: Care Needs →</button>
        </div>
      </div>
    </div>

    <!-- STEP 3: CARE NEEDS -->
    <div class="panel" id="panel-3">
      <div class="panel-header">
        <div class="panel-icon">💊</div>
        <div>
          <div class="panel-title">Care Needs</div>
          <div class="panel-sub">Help us understand what type of care is required</div>
        </div>
      </div>
      <div class="panel-body">
        <div class="chips-label">Type of Care Needed <span class="req" style="color:var(--red)">*</span></div>
        <div class="chips" id="care-chips">
          <div class="chip" data-val="companion_care">🏠 Companion Care<br/><small style="font-size:10px;color:var(--muted)">Errands, companionship</small></div>
          <div class="chip" data-val="personal_care">🤲 Personal Care<br/><small style="font-size:10px;color:var(--muted)">Bathing, dressing, ADLs</small></div>
          <div class="chip" data-val="skilled_nursing">💉 Skilled Nursing<br/><small style="font-size:10px;color:var(--muted)">LPN/RN-level care</small></div>
          <div class="chip" data-val="physical_therapy">🏋️ Physical Therapy</div>
          <div class="chip" data-val="occupational_therapy">🖐️ Occupational Therapy</div>
          <div class="chip" data-val="speech_therapy">🗣️ Speech Therapy</div>
        </div>

        <div class="chips-label">Conditions / Diagnoses <span>select all that apply</span></div>
        <div class="chips" id="condition-chips">
          <div class="chip" data-val="dementia">Dementia</div>
          <div class="chip" data-val="alzheimers">Alzheimer's</div>
          <div class="chip" data-val="parkinson">Parkinson's</div>
          <div class="chip" data-val="stroke">Stroke Recovery</div>
          <div class="chip" data-val="diabetes">Diabetes</div>
          <div class="chip" data-val="cardiac">Cardiac Condition</div>
          <div class="chip" data-val="copd">COPD / Respiratory</div>
          <div class="chip" data-val="cancer">Cancer</div>
          <div class="chip" data-val="developmental">Developmental Disability</div>
          <div class="chip" data-val="autism">Autism</div>
          <div class="chip" data-val="post_surgical">Post-Surgical Recovery</div>
          <div class="chip" data-val="hospice">Hospice / Palliative</div>
          <div class="chip" data-val="other_condition">Other</div>
        </div>

        <div class="section-label">Special Requirements</div>
        <div class="toggles">
          <div class="toggle-item" onclick="toggleItem(this,'req_car')">
            <input type="checkbox" id="req_car"/><div class="toggle-dot"></div>
            <div class="toggle-text">🚗 Caregiver needs a car<small>Transportation to appointments</small></div>
          </div>
          <div class="toggle-item" onclick="toggleItem(this,'req_spanish')">
            <input type="checkbox" id="req_spanish"/><div class="toggle-dot"></div>
            <div class="toggle-text">🗣️ Spanish speaking<small>Primary language is Spanish</small></div>
          </div>
          <div class="toggle-item" onclick="toggleItem(this,'req_hoyer')">
            <input type="checkbox" id="req_hoyer"/><div class="toggle-dot"></div>
            <div class="toggle-text">🏋️ Hoyer lift needed<small>Patient requires lift transfer</small></div>
          </div>
          <div class="toggle-item" onclick="toggleItem(this,'req_wheelchair')">
            <input type="checkbox" id="req_wheelchair"/><div class="toggle-dot"></div>
            <div class="toggle-text">♿ Wheelchair transfer<small>Assistance with transfers</small></div>
          </div>
          <div class="toggle-item" onclick="toggleItem(this,'req_meals')">
            <input type="checkbox" id="req_meals"/><div class="toggle-dot"></div>
            <div class="toggle-text">🍽️ Meal preparation<small>Caregiver to prepare meals</small></div>
          </div>
          <div class="toggle-item" onclick="toggleItem(this,'req_total')">
            <input type="checkbox" id="req_total"/><div class="toggle-dot"></div>
            <div class="toggle-text">🤲 Total care needed<small>Full ADL assistance required</small></div>
          </div>
        </div>

        <div class="section-label">Insurance / Payer</div>
        <div class="chips" id="payer-chips">
          <div class="chip" data-val="private_pay">Private Pay</div>
          <div class="chip" data-val="long_term_care">Long-Term Care Insurance</div>
          <div class="chip" data-val="medicaid_waiver">Maryland Medicaid Waiver</div>
          <div class="chip" data-val="carefirst">CareFirst</div>
          <div class="chip" data-val="medicare">Medicare</div>
          <div class="chip" data-val="other_insurance">Other Insurance</div>
          <div class="chip" data-val="unsure">Not sure yet</div>
        </div>

        <div class="form-error" id="err-3"></div>
        <div class="nav-row">
          <button class="btn btn-ghost" onclick="goTo(2)">← Back</button>
          <button class="btn btn-primary" onclick="goTo(4)">Next: Schedule →</button>
        </div>
      </div>
    </div>

    <!-- STEP 4: SCHEDULE -->
    <div class="panel" id="panel-4">
      <div class="panel-header">
        <div class="panel-icon">📅</div>
        <div>
          <div class="panel-title">Schedule & Timing</div>
          <div class="panel-sub">When and how often is care needed?</div>
        </div>
      </div>
      <div class="panel-body">
        <div class="chips-label">Schedule Type</div>
        <div class="chips" id="schedule-chips">
          <div class="chip" data-val="one_time">One-time visit</div>
          <div class="chip" data-val="recurring">Recurring schedule</div>
          <div class="chip" data-val="flexible">Flexible / variable</div>
          <div class="chip" data-val="live_in">Live-in care</div>
        </div>
        <div class="row cols-3">
          <div class="field">
            <label>Hours per Day</label>
            <select id="hours_per_day">
              <option value="">Select</option>
              <option value="2">2 hours</option>
              <option value="4">4 hours</option>
              <option value="6">6 hours</option>
              <option value="8">8 hours</option>
              <option value="12">12 hours</option>
              <option value="24">24 hours / Live-in</option>
            </select>
          </div>
          <div class="field">
            <label>Days per Week</label>
            <select id="days_per_week">
              <option value="">Select</option>
              <option value="1">1 day</option>
              <option value="2">2 days</option>
              <option value="3">3 days</option>
              <option value="4">4 days</option>
              <option value="5">5 days</option>
              <option value="6">6 days</option>
              <option value="7">7 days</option>
            </select>
          </div>
          <div class="field">
            <label>Preferred Start Date</label>
            <input type="date" id="start_date"/>
          </div>
        </div>
        <div class="section-label">Additional Notes</div>
        <div class="field">
          <label>Anything else we should know?</label>
          <textarea id="additional_notes" placeholder="Specific medical needs, preferred caregiver traits, access instructions, family dynamics, or any other details that would help us find the right match..."></textarea>
        </div>
        <div class="form-error" id="err-4"></div>
        <div class="nav-row">
          <button class="btn btn-ghost" onclick="goTo(3)">← Back</button>
          <button class="btn btn-primary" onclick="goTo(5)">Review Request →</button>
        </div>
      </div>
    </div>

    <!-- STEP 5: REVIEW -->
    <div class="panel" id="panel-5">
      <div class="panel-header">
        <div class="panel-icon">✅</div>
        <div>
          <div class="panel-title">Review Your Request</div>
          <div class="panel-sub">Confirm everything looks correct</div>
        </div>
      </div>
      <div class="panel-body">
        <div id="review-content"></div>
        <div style="background:var(--gold-bg);border:1px solid var(--gold-border);border-radius:10px;padding:16px 20px;margin:20px 0;font-size:13.5px;color:#6B5500;display:flex;gap:12px;align-items:flex-start">
          <span style="font-size:20px;flex-shrink:0">📞</span>
          <div>
            <strong>What happens next?</strong><br/>
            Your care coordinator will call you within 24 hours — sooner for urgent needs. The consultation is completely free with no obligation.
          </div>
        </div>
        <div class="form-error" id="err-5"></div>
        <div class="nav-row">
          <button class="btn btn-ghost" onclick="goTo(4)">← Edit</button>
          <button class="btn btn-submit" id="submit-btn" onclick="submitForm()">
            Submit Care Request →
          </button>
        </div>
      </div>
    </div>

    <!-- SUCCESS -->
    <div id="success">
      <div class="success-icon">🏠</div>
      <h2>Request Received!</h2>
      <p>Thank you for trusting Vitalis HealthCare Services. Your care coordinator will be in touch within 24 hours.</p>
      <div class="success-next">
        <h4>What to expect:</h4>
        <div class="success-step"><div class="success-step-num">1</div>Your coordinator will call the number you provided within 24 hours.</div>
        <div class="success-step"><div class="success-step-num">2</div>We'll discuss care needs in detail and answer all your questions.</div>
        <div class="success-step"><div class="success-step-num">3</div>We match your loved one with the ideal caregiver from our network.</div>
        <div class="success-step"><div class="success-step-num">4</div>Care begins — with ongoing coordinator support every step of the way.</div>
      </div>
      <div style="margin-top:20px;font-size:13px;color:var(--muted)">
        Need immediate assistance? Call <strong style="color:var(--green-dark)">240.716.6874</strong>
      </div>
    </div>
  </div>
</section>

<!-- FOOTER -->
<footer class="footer">
  <div class="footer-logo-wrap">
    <div class="footer-icon">⌖</div>
    <div>
      <div class="footer-name">Vitalis HealthCare Services, LLC</div>
      <div class="footer-tag">RSA Level 3 · License #3879R</div>
    </div>
  </div>
  <div class="footer-info">
    8757 Georgia Avenue, Suite 440, Silver Spring, MD 20910<br/>
    Maryland OHCQ Licensed &nbsp;·&nbsp; MD Medicaid Waiver Provider &nbsp;·&nbsp; CareScout Approved<br/>
    <a href="mailto:team@vitalishealthcare.com">team@vitalishealthcare.com</a>
  </div>
</footer>

<script>
const state = {
  currentStep: 1,
  urgency: '',
  care_level: '',
  conditions: [],
  payer_types: [],
  schedule_type: '',
}

function initChips(id, key, single=false) {
  const c = document.getElementById(id)
  if (!c) return
  c.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const val = chip.dataset.val
      if (single) {
        c.querySelectorAll('.chip').forEach(x => x.classList.remove('selected'))
        state[key] = val; chip.classList.add('selected')
      } else {
        if (!Array.isArray(state[key])) state[key] = []
        if (state[key].includes(val)) {
          state[key] = state[key].filter(v => v !== val); chip.classList.remove('selected')
        } else { state[key].push(val); chip.classList.add('selected') }
      }
    })
  })
}

initChips('urgency-chips', 'urgency', true)
initChips('care-chips', 'care_level', true)
initChips('condition-chips', 'conditions', false)
initChips('payer-chips', 'payer_types', false)
initChips('schedule-chips', 'schedule_type', true)

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
    ind.classList.remove('active','done')
    if (i === step) ind.classList.add('active')
    else if (i < step) ind.classList.add('done')
    if (i < 5) document.getElementById(\`line-\${i}\`).classList.toggle('done', i < step)
  }
  state.currentStep = step
  document.getElementById('get-care').scrollIntoView({ behavior: 'smooth' })
  if (step === 5) buildReview()
}

function validate(step) {
  const err = document.getElementById(\`err-\${step}\`)
  err.style.display = 'none'
  if (step === 1) {
    if (!document.getElementById('contact_name').value.trim()) { showErr(err, 'Please enter your name.'); return false }
    if (!document.getElementById('contact_relationship').value) { showErr(err, 'Please select your relationship to the care recipient.'); return false }
    const email = document.getElementById('contact_email').value.trim()
    if (!email || !email.includes('@')) { showErr(err, 'Please enter a valid email address.'); return false }
    if (!document.getElementById('contact_phone').value.trim()) { showErr(err, 'Please enter your phone number.'); return false }
  }
  if (step === 2) {
    if (!document.getElementById('city').value.trim()) { showErr(err, 'Please enter the city where care is needed.'); return false }
  }
  if (step === 3) {
    if (!state.care_level) { showErr(err, 'Please select at least one type of care needed.'); return false }
  }
  return true
}

function showErr(el, msg) { el.textContent = msg; el.style.display = 'block'; el.scrollIntoView({behavior:'smooth',block:'nearest'}) }

const CARE_LABELS = {
  companion_care:'Companion Care', personal_care:'Personal Care',
  skilled_nursing:'Skilled Nursing', physical_therapy:'Physical Therapy',
  occupational_therapy:'Occupational Therapy', speech_therapy:'Speech Therapy',
}
const URGENCY_LABELS = { emergency:'Emergency (within 24hrs)', urgent:'Urgent (within 1 week)', routine:'Planning ahead (2+ weeks)' }

function buildReview() {
  const rows = [
    ['Contact', document.getElementById('contact_name').value],
    ['Relationship', document.getElementById('contact_relationship').value],
    ['Email', document.getElementById('contact_email').value],
    ['Phone', document.getElementById('contact_phone').value],
    ['Urgency', URGENCY_LABELS[state.urgency] || '—'],
    ['Recipient', document.getElementById('name').value || 'Same as contact'],
    ['Location', [document.getElementById('city').value, document.getElementById('state').value].filter(Boolean).join(', ')],
    ['Care Type', CARE_LABELS[state.care_level] || '—'],
    ['Conditions', state.conditions.join(', ') || 'None specified'],
    ['Payer', state.payer_types.join(', ') || '—'],
    ['Schedule', state.schedule_type || '—'],
    ['Hours/Day', document.getElementById('hours_per_day').value || '—'],
    ['Days/Week', document.getElementById('days_per_week').value || '—'],
    ['Start Date', document.getElementById('start_date').value || '—'],
    ['Spanish needed', document.getElementById('req_spanish').checked ? 'Yes' : 'No'],
    ['Has car needed', document.getElementById('req_car').checked ? 'Yes' : 'No'],
    ['Notes', document.getElementById('additional_notes').value || '—'],
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
    contact_name: document.getElementById('contact_name').value.trim(),
    contact_relationship: document.getElementById('contact_relationship').value,
    contact_email: document.getElementById('contact_email').value.trim(),
    contact_phone: document.getElementById('contact_phone').value.trim(),
    urgency: state.urgency,
    name: document.getElementById('name').value.trim(),
    dob: document.getElementById('dob').value,
    gender: document.getElementById('gender').value,
    address: document.getElementById('address').value.trim(),
    city: document.getElementById('city').value.trim(),
    state: document.getElementById('state').value,
    zip: document.getElementById('zip').value.trim(),
    gender_preference: document.getElementById('gender_preference').value,
    care_level: state.care_level,
    care_needs: [state.care_level].filter(Boolean),
    conditions: state.conditions.join(', '),
    payer_types: state.payer_types,
    schedule_type: state.schedule_type,
    hours_per_day: document.getElementById('hours_per_day').value,
    days_per_week: document.getElementById('days_per_week').value,
    start_date: document.getElementById('start_date').value,
    requires_car: document.getElementById('req_car').checked,
    requires_meal_prep: document.getElementById('req_meals').checked,
    requires_spanish: document.getElementById('req_spanish').checked,
    requires_hoyer_lift: document.getElementById('req_hoyer').checked,
    requires_wheelchair: document.getElementById('req_wheelchair').checked,
    additional_notes: document.getElementById('additional_notes').value.trim(),
  }

  try {
    const res = await fetch('/api/clients/inquire', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.error || 'Submission failed')
    document.getElementById('panel-5').style.display = 'none'
    window.location.href = '/thank-you'
  } catch(e) {
    showErr(err, e.message || 'Something went wrong. Please try again.')
    btn.disabled = false; btn.textContent = 'Submit Care Request →'
  }
}
</script>
</body>
</html>
`

export async function GET() {
  return new NextResponse(HTML, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
