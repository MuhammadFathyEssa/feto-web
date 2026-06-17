"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.14 }
    );
    document.querySelectorAll(".reveal,.stagger").forEach((el) => io.observe(el));

    const countUp = (el: HTMLElement) => {
      const t = +(el.dataset.count || "0"); let c = 0; const s = t / 45;
      const tick = () => { c += s; if (c < t) { el.textContent = String(Math.floor(c)); requestAnimationFrame(tick); } else el.textContent = String(t); };
      tick();
    };
    const cio = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target as HTMLElement); cio.unobserve(e.target); } }),
      { threshold: 0.5 }
    );
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => cio.observe(el));

    const cardHandlers: Array<{ el: Element; fn: (e: Event) => void }> = [];
    document.querySelectorAll<HTMLElement>(".card").forEach((c) => {
      const fn = (e: Event) => {
        const ev = e as MouseEvent; const r = c.getBoundingClientRect();
        c.style.setProperty("--mx", ((ev.clientX - r.left) / r.width * 100) + "%");
        c.style.setProperty("--my", ((ev.clientY - r.top) / r.height * 100) + "%");
      };
      c.addEventListener("mousemove", fn); cardHandlers.push({ el: c, fn });
    });

    const cleanups: Array<() => void> = [];
    type COpts = { density?: number; link?: number; speed?: number; goldEvery?: number; min?: number; max?: number; interactive?: boolean };
    function constellation(canvas: HTMLCanvasElement | null, opts: COpts = {}) {
      if (!canvas) return;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), t = 0, raf = 0, running = true, mx = -9999, my = -9999;
      type N = { x: number; y: number; vx: number; vy: number; r: number; gold: boolean };
      let nodes: N[] = [];
      const density = opts.density || 0.00009, LINK = opts.link || 130, speed = opts.speed || 0.16, goldEvery = opts.goldEvery || 14, interactive = opts.interactive;
      const seed = () => { const n = Math.max(opts.min || 26, Math.min(opts.max || 74, Math.floor(W * H * density))); nodes = Array.from({ length: n }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed, r: Math.random() * 1.6 + 0.6, gold: i % goldEvery === 0 })); };
      const resize = () => { const p = canvas.parentElement!; W = p.clientWidth; H = p.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed(); };
      const onMove = (e: MouseEvent) => { const r = canvas.getBoundingClientRect(); mx = e.clientX - r.left; my = e.clientY - r.top; };
      const onLeave = () => { mx = -9999; my = -9999; };
      if (interactive && canvas.parentElement) { canvas.parentElement.addEventListener("mousemove", onMove); canvas.parentElement.addEventListener("mouseleave", onLeave); }
      const draw = () => {
        ctx.clearRect(0, 0, W, H); t += 0.016;
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) { const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy); if (d < LINK) { ctx.strokeStyle = `rgba(150,170,210,${(1 - d / LINK) * 0.2})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); } }
        for (const n of nodes) {
          n.x += n.vx; n.y += n.vy; if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
          let near = false;
          if (interactive) { const dm = Math.hypot(n.x - mx, n.y - my); if (dm < 120) { near = true; ctx.strokeStyle = `rgba(224,169,85,${(1 - dm / 120) * 0.4})`; ctx.lineWidth = 0.7; ctx.beginPath(); ctx.moveTo(n.x, n.y); ctx.lineTo(mx, my); ctx.stroke(); } }
          if (n.gold || near) { const p = (Math.sin(t * 1.6 + n.x) + 1) / 2; ctx.beginPath(); ctx.fillStyle = `rgba(224,169,85,${0.5 + p * 0.4})`; ctx.shadowColor = "rgba(224,169,85,.8)"; ctx.shadowBlur = 3 + p * 4; ctx.arc(n.x, n.y, n.r + 0.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
          else { ctx.beginPath(); ctx.fillStyle = "rgba(180,195,225,.45)"; ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill(); }
        }
      };
      const loop = () => { if (!running) return; draw(); raf = requestAnimationFrame(loop); };
      const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!reduced) { running = true; loop(); } };
      window.addEventListener("resize", resize); document.addEventListener("visibilitychange", onVis);
      resize(); reduced ? draw() : loop();
      cleanups.push(() => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); if (interactive && canvas.parentElement) { canvas.parentElement.removeEventListener("mousemove", onMove); canvas.parentElement.removeEventListener("mouseleave", onLeave); } });
    }
    constellation(document.getElementById("constellation") as HTMLCanvasElement, { max: 82, interactive: true });
    constellation(document.getElementById("cta-constellation") as HTMLCanvasElement, { max: 50, density: 0.00007 });

    (function () {
      const canvas = document.getElementById("orbit") as HTMLCanvasElement | null; if (!canvas) return;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), t = 0, raf = 0, running = true;
      const resize = () => { const p = canvas.parentElement!; W = p.clientWidth; H = p.clientHeight; dpr = Math.min(window.devicePixelRatio || 1, 2); canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px"; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); };
      const N = 13;
      const draw = () => {
        ctx.clearRect(0, 0, W, H); t += 0.004; const cx = W / 2, cy = H / 2;
        for (let r = 1; r <= 3; r++) { ctx.beginPath(); ctx.strokeStyle = `rgba(150,170,210,${0.08 / r + 0.02})`; ctx.lineWidth = 1; ctx.arc(cx, cy, Math.min(W, H) * 0.13 * r, 0, 7); ctx.stroke(); }
        ctx.beginPath(); ctx.fillStyle = "rgba(224,169,85,.95)"; ctx.shadowColor = "rgba(224,169,85,.9)"; ctx.shadowBlur = 22; ctx.arc(cx, cy, 7, 0, 7); ctx.fill(); ctx.shadowBlur = 0;
        for (let i = 0; i < N; i++) { const ring = 1 + (i % 3); const ang = (i / N) * Math.PI * 2 + t * (ring % 2 ? 1 : -1) * (1.4 / ring); const rad = Math.min(W, H) * 0.13 * ring; const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad; ctx.beginPath(); ctx.strokeStyle = `rgba(224,169,85,${0.14 - ring * 0.02})`; ctx.lineWidth = 0.7; ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke(); const pulse = (Math.sin(t * 30 + i) + 1) / 2; ctx.beginPath(); ctx.fillStyle = `rgba(197,202,216,${0.6 + pulse * 0.4})`; ctx.arc(x, y, 2.4, 0, 7); ctx.fill(); }
      };
      const loop = () => { if (!running) return; draw(); raf = requestAnimationFrame(loop); };
      const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!reduced) { running = true; loop(); } };
      window.addEventListener("resize", resize); document.addEventListener("visibilitychange", onVis);
      resize(); reduced ? draw() : loop();
      cleanups.push(() => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); });
    })();

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect(); cio.disconnect();
      cardHandlers.forEach(({ el, fn }) => el.removeEventListener("mousemove", fn));
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className="feto-landing">
      <nav id="nav">
        <div className="nav-in">
          <a className="logo" href="#top"><span className="logo-mark"><span className="logo-dot" /></span><span className="logo-txt">FeTo</span></a>
          <div className="nav-links">
            <a href="#platform">Platform</a><a href="#council">The Council</a><a href="#security">Security</a><a href="#vision">Vision</a>
            <Link href="/login" className="nav-cta">Sign in</Link>
          </div>
        </div>
      </nav>

      <header className="hero" id="top">
        <div className="hero-bg" />
        <canvas id="constellation" />
        <div className="hero-vignette" />
        <div className="hero-content">
          <div className="wrap">
            <div className="hero-grid">
              <div>
                <span className="eyebrow h-anim">Arabic-native · Banking-grade</span>
                <h1 style={{ marginTop: 18 }}><span className="h-anim d1" style={{ display: "block" }}>The executive mind,</span><span className="h-anim d2" style={{ display: "block" }}><em>multiplied.</em></span></h1>
                <p className="hero-lede h-anim d3">FeTo is an intelligence platform where thirteen specialized AI agents reason together — in Arabic and English — for the institutions that run the region.</p>
                <div className="hero-actions h-anim d4">
                  <Link href="/request-access" className="btn-primary">Request access</Link>
                  <a href="https://calendly.com/eng-mfathy" target="_blank" rel="noopener noreferrer" className="btn-ghost">Book a Demo</a>
                  <a href="#platform" className="btn-ghost" style={{fontSize:13,opacity:0.6}}>See the platform</a>
                </div>
                <div className="hero-meta h-anim d5">
                  <div className="item"><span className="n serif">13</span><span className="l">Specialized agents</span></div>
                  <div className="item"><span className="n serif">96<span style={{ fontSize: 18 }}>/100</span></span><span className="l">CTO assessment</span></div>
                  <div className="item"><span className="n serif">0</span><span className="l">Critical findings</span></div>
                </div>
              </div>
              <div className="hero-card h-anim d3">
                <div className="hc-head"><span className="hc-title">Council session</span><span className="hc-live">LIVE</span></div>
                <div className="hc-agent"><span className="hc-ico">⚖</span><div><div className="hc-name">Strategy Advisor</div><div className="hc-role">Market timing · risk</div></div><span className="hc-status">reasoning</span></div>
                <div className="hc-agent"><span className="hc-ico">🛡</span><div><div className="hc-name">Security Analyst</div><div className="hc-role">CBE · OWASP</div></div><span className="hc-status">verified</span></div>
                <div className="hc-agent"><span className="hc-ico">📊</span><div><div className="hc-name">Data Synthesist</div><div className="hc-role">Signals · forecasting</div></div><span className="hc-status">drafting</span></div>
                <div className="hc-agent"><span className="hc-ico">✍</span><div><div className="hc-name">Content Director</div><div className="hc-role">Executive voice</div></div><span className="hc-status">ready</span></div>
              </div>
            </div>
          </div>
        </div>
        <div className="scroll-cue h-anim d6"><div className="line" /><span>Scroll</span></div>
      </header>

      <div className="trust">
        <div className="wrap">
          <p className="trust-label">Built to the standards that govern regulated institutions</p>
          <div className="trust-row">
            <span className="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>CBE Financial Cybersecurity Framework</span>
            <span className="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>OWASP WSTG Aligned</span>
            <span className="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>TLS 1.3 · Zero-trust</span>
            <span className="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>PCI-DSS 4.0 mapped</span>
          </div>
        </div>
      </div>

      <section id="platform">
        <div className="wrap">
          <div className="sec-head reveal"><span className="eyebrow">The platform</span><h2>Not a chatbot. A reasoning institution.</h2><p>Most AI tools answer questions. FeTo convenes a council — specialized agents that debate, verify, and converge on decisions your leadership can act on. Each carries deep domain context; together they think like a seasoned executive team.</p></div>
          <div className="grid-3 stagger">
            <div className="card"><div className="card-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" /></svg></div><h3>Thirteen minds, one mandate</h3><p>Strategy, security, data, finance, content — each a specialist, orchestrated through a council layer that synthesizes a single decisive recommendation.</p></div>
            <div className="card"><div className="card-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h4l2-7 4 14 2-7h6" /></svg></div><h3>Arabic at the core</h3><p>Not translated, native. FeTo reasons, writes, and presents in fluent executive Arabic and English — built for the boardrooms of Cairo, Riyadh, and the Gulf.</p></div>
            <div className="card"><div className="card-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></svg></div><h3>Banking-grade by design</h3><p>Hardened across every build, mapped to the CBE Financial Cybersecurity Framework, audited to a 96/100 CTO assessment — security is the foundation, not a feature.</p></div>
          </div>
        </div>
      </section>

      <div className="wrap"><div className="divider" /></div>

      <section id="council">
        <div className="wrap">
          <div className="split">
            <div className="reveal">
              <span className="eyebrow">The council</span>
              <h2>Specialists that reason together.</h2>
              <p>A single question rarely has a single owner. FeTo routes each request to the agents that matter, lets them deliberate, and resolves their views into one clear answer — with the reasoning visible, never a black box.</p>
              <div className="split-list">
                <div className="li"><span className="tick"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 6l2.5 2.5L10 3" /></svg></span><span>Smart routing sends each task to the right specialist — no wasted compute, no generic answers.</span></div>
                <div className="li"><span className="tick"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 6l2.5 2.5L10 3" /></svg></span><span>A council layer reconciles competing recommendations into a single executive verdict.</span></div>
                <div className="li"><span className="tick"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 6l2.5 2.5L10 3" /></svg></span><span>Cost-optimized model orchestration — the right model for each step, cached intelligently.</span></div>
                <div className="li"><span className="tick"><svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="M2 6l2.5 2.5L10 3" /></svg></span><span>Available where executives already work — web, mobile, Telegram, and WhatsApp.</span></div>
              </div>
            </div>
            <div className="split-visual reveal"><canvas className="orbit-canvas" id="orbit" /><div className="orbit-label">13 agents · one council</div></div>
          </div>
        </div>
      </section>

      <section className="metrics">
        <div className="wrap">
          <div className="metrics-grid stagger">
            <div className="metric"><div className="n serif" data-count="13">13</div><div className="l">Specialized agents</div><div className="s">orchestrated in concert</div></div>
            <div className="metric"><div className="n serif" data-count="96">96</div><div className="l">CTO assessment score</div><div className="s">out of 100</div></div>
            <div className="metric"><div className="n serif">2</div><div className="l">Languages, native</div><div className="s">Arabic &amp; English</div></div>
            <div className="metric"><div className="n serif">0</div><div className="l">Critical vulnerabilities</div><div className="s">independent scan</div></div>
          </div>
        </div>
      </section>

      <section id="security">
        <div className="wrap">
          <div className="sec-head reveal"><span className="eyebrow">Security &amp; compliance</span><h2>Trust is the product.</h2><p>FeTo was built for institutions that cannot afford to be wrong about security. Every layer is hardened, every standard mapped, every claim independently verifiable.</p></div>
          <div className="sec-grid stagger">
            <div className="sec-chip"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>CBE Framework</div><div className="d">Mapped to the Central Bank of Egypt Financial Cybersecurity Framework, Dec 2021.</div></div>
            <div className="sec-chip"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>OWASP WSTG</div><div className="d">Web Security Testing Guide aligned, validated by an internal pentester agent.</div></div>
            <div className="sec-chip"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>Zero-trust access</div><div className="d">RBAC, sliding sessions, idle timeout, httpOnly tokens.</div></div>
            <div className="sec-chip"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>TLS 1.3 + HSTS</div><div className="d">Modern transport security, HSTS preload, full header coverage.</div></div>
            <div className="sec-chip"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>PCI-DSS 4.0</div><div className="d">Controls mapped against PCI-DSS 4.0.1 for payment-adjacent contexts.</div></div>
            <div className="sec-chip"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>Continuous scanning</div><div className="d">On-demand passive reconnaissance and OWASP-aligned reporting, built in.</div></div>
            <div className="sec-chip"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H4z" /><path d="M8 20h8" /></svg>Audit logging</div><div className="d">Every privileged action recorded — accountable, traceable, reviewable.</div></div>
            <div className="sec-chip"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>Data residency</div><div className="d">PII handling aligned with Egypt Law 151/2020 and regional requirements.</div></div>
          </div>
        </div>
      </section>

      <div className="wrap"><div className="divider" /></div>

      {/* ── Platform in Action ── */}
      <section className="platform-screens" style={{padding:"80px 0"}}>
        <div className="wrap">
          <div className="reveal" style={{textAlign:"center",marginBottom:48}}>
            <span className="eyebrow">Platform in action</span>
            <h2 style={{marginTop:12}}>Built for the way <em>executives actually work.</em></h2>
            <p style={{maxWidth:560,margin:"16px auto 0",color:"var(--slate)",lineHeight:1.7}}>Two of the thirteen agents — a glimpse of the council at work inside a real session.</p>
          </div>
          <div className="screens-grid reveal" style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:32,alignItems:"start"}}>
            <div className="screen-card" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:13,color:"var(--gold)",fontWeight:600,letterSpacing:1}}>CHAT INTERFACE</span>
              </div>
              <img src="/screenshots/chat.jpg" alt="FeTo executive chat interface" style={{width:"100%",display:"block"}} loading="lazy" />
              <div style={{padding:"16px 18px"}}>
                <p style={{fontSize:13,color:"var(--slate)",margin:0,lineHeight:1.6}}>A personalized session — FeTo knows the executive, their context, and their domain.</p>
              </div>
            </div>
            <div className="screen-card" style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:16,overflow:"hidden"}}>
              <div style={{padding:"14px 18px",borderBottom:"1px solid rgba(255,255,255,0.06)",display:"flex",alignItems:"center",gap:10}}>
                <span style={{fontSize:13,color:"var(--gold)",fontWeight:600,letterSpacing:1}}>RECRUITER AGENT</span>
              </div>
              <img src="/screenshots/recruiter.jpg" alt="FeTo Recruiter AI agent" style={{width:"100%",display:"block"}} loading="lazy" />
              <div style={{padding:"16px 18px"}}>
                <p style={{fontSize:13,color:"var(--slate)",margin:0,lineHeight:1.6}}>The Recruiter agent — evaluate CVs, generate JDs, run interview prep, compare candidates.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap"><div className="divider" /></div>

      {/* ── About the Founder ── */}
      <section className="founder-section" style={{padding:"80px 0"}}>
        <div className="wrap">
          <div className="founder-inner reveal" style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:48,alignItems:"center",maxWidth:860,margin:"0 auto"}}>
            <div className="founder-photo" style={{flexShrink:0}}>
              <img src="/founder-photo.jpg" alt="Dr. Muhammad Fathy — CEO & Founder, FeTo" style={{width:200,height:200,borderRadius:"50%",objectFit:"cover",objectPosition:"center top",border:"3px solid var(--gold)",display:"block"}} loading="lazy" />
            </div>
            <div>
              <span className="eyebrow">Built by an executive, for executives</span>
              <h2 style={{marginTop:12,fontSize:"clamp(1.4rem,3vw,2rem)"}}>The mind <em>behind the platform.</em></h2>
              <p style={{color:"var(--slate)",lineHeight:1.8,marginTop:14,fontSize:15}}>Dr. Muhammad Fathy is CEO &amp; Founder of FeTo and GM &amp; Head of Technology Services at one of Egypt&apos;s largest banks — 150 engineers, 200+ systems, 20 million customers. 25 years. Published author of 7 books. LEAP speaker. IDC Excellence Award 2025.</p>
              <p style={{color:"var(--slate)",lineHeight:1.8,marginTop:10,fontSize:15}}>FeTo was built from direct experience — the platform he needed and couldn&apos;t find.</p>
              <div style={{marginTop:22,display:"flex",gap:16,flexWrap:"wrap"}}>
                <a href="https://muhammadfathy.com" target="_blank" rel="noopener noreferrer" className="btn-ghost" style={{fontSize:13,padding:"8px 18px"}}>Full profile →</a>
                <a href="https://calendly.com/eng-mfathy" target="_blank" rel="noopener noreferrer" className="btn-primary" style={{fontSize:13,padding:"8px 18px"}}>Book a conversation</a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap"><div className="divider" /></div>

      <section id="vision" className="vision">
        <div className="wrap">
          <div className="vision-inner reveal">
            <span className="eyebrow">The vision</span>
            <p className="vision-statement" style={{ marginTop: 22 }}>An executive is only as strong as the counsel around them. FeTo gives every leader a <em>standing council</em> — tireless, specialized, and accountable — so the quality of a decision never depends on who happened to be in the room.</p>
            <p className="vision-sub">Intelligence that compounds. Reasoning you can audit. Built in Arabic, for the institutions shaping the region&rsquo;s next decade.</p>
          </div>
        </div>
      </section>

      <section className="cta-final">
        <div className="cta-bg" />
        <canvas id="cta-constellation" />
        <div className="wrap">
          <div className="cta-inner reveal">
            <h2>Intelligence worthy of<br />the <em>decisions you make.</em></h2>
            <p>FeTo is currently available to a select group of institutions and leaders. Request access and see what an executive council of AI agents can do.</p>
            <div className="cta-actions">
              <Link href="/request-access" className="btn-primary">Request access</Link>
              <a href="https://calendly.com/eng-mfathy" target="_blank" rel="noopener noreferrer" className="btn-ghost">Book a Demo</a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand"><a className="logo" href="#top"><span className="logo-mark"><span className="logo-dot" /></span><span className="logo-txt">FeTo</span></a><p>An Arabic-native executive intelligence platform, built for the institutions that lead the region.</p></div>
            <div className="foot-col"><h4>Platform</h4><a href="#platform">Overview</a><a href="#council">The council</a><a href="#security">Security</a><a href="#vision">Vision</a></div>
            <div className="foot-col"><h4>Company</h4><a href="#">About</a><a href="#">Leadership</a><a href="#">Contact</a></div>
            <div className="foot-col"><h4>Access</h4><Link href="/login">Sign in</Link><Link href="/request-access">Request access</Link></div>
          </div>
          <div className="foot-bottom"><p>© 2026 FeTo Executive Intelligence Platform. All rights reserved.</p><p className="foot-rtl">منصّة ذكاء تنفيذي عربية · مبنية بمعايير بنكية</p></div>
        </div>
      </footer>

      <style jsx global>{`
        .feto-landing{--void:#03080f;--ink:#070f1d;--indigo-deep:#0b1228;--indigo:#1a2350;--bronze:#3a2917;--gold:#e0a955;--gold-bright:#f0bd6e;--cream:#f4f0e6;--mist:#c8cdda;--slate:#878fa3;--slate-dim:#525b70;--line:#18204a;--line-soft:#10182f;--r-sm:10px;--r:14px;--r-lg:20px;--r-xl:28px;--maxw:1180px;--gutter:24px;--ease:cubic-bezier(.22,.61,.36,1);--ease-out:cubic-bezier(.16,1,.3,1);background:var(--void);color:var(--cream);font-family:'Inter',system-ui,sans-serif;line-height:1.6;overflow-x:hidden}
        .feto-landing *{box-sizing:border-box;margin:0;padding:0}
        .feto-landing .serif{font-family:'Playfair Display',Georgia,serif}
        .feto-landing a{color:inherit;text-decoration:none}
        .feto-landing .eyebrow{font-size:11.5px;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);font-weight:500}
        .feto-landing .wrap{max-width:var(--maxw);margin:0 auto;padding:0 var(--gutter)}
        .feto-landing nav{position:fixed;top:0;left:0;right:0;z-index:100;transition:all .5s var(--ease)}
        .feto-landing nav.scrolled{background:rgba(3,8,15,.7);backdrop-filter:blur(20px) saturate(1.4);border-bottom:1px solid var(--line-soft)}
        .feto-landing .nav-in{max-width:var(--maxw);margin:0 auto;padding:17px var(--gutter);display:flex;align-items:center;justify-content:space-between}
        .feto-landing .logo{display:flex;align-items:center;gap:11px}
        .feto-landing .logo-mark{width:30px;height:30px;border-radius:50%;border:1px solid rgba(224,169,85,.45);display:flex;align-items:center;justify-content:center;flex:0 0 auto;position:relative}
        .feto-landing .logo-mark::after{content:"";position:absolute;inset:-3px;border-radius:50%;border:1px solid rgba(224,169,85,.12)}
        .feto-landing .logo-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 10px 2px rgba(224,169,85,.55)}
        .feto-landing .logo-txt{font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:var(--cream)}
        .feto-landing .nav-links{display:flex;align-items:center;gap:38px}
        .feto-landing .nav-links a{font-size:13.5px;color:var(--mist);transition:color .2s;position:relative}
        .feto-landing .nav-links a:not(.nav-cta)::after{content:"";position:absolute;left:0;bottom:-5px;width:0;height:1px;background:var(--gold);transition:width .3s var(--ease)}
        .feto-landing .nav-links a:not(.nav-cta):hover::after{width:100%}
        .feto-landing .nav-links a:hover{color:var(--cream)}
        .feto-landing .nav-cta{padding:9px 20px;border-radius:var(--r-sm);background:var(--gold);color:var(--void)!important;font-size:13.5px;font-weight:600;transition:all .25s var(--ease)}
        .feto-landing .nav-cta:hover{background:var(--gold-bright);transform:translateY(-1px);box-shadow:0 8px 20px -8px rgba(224,169,85,.6)}
        @media(max-width:860px){.feto-landing .nav-links a:not(.nav-cta){display:none}}
        .feto-landing .hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden}
        .feto-landing .hero-bg{position:absolute;inset:0;background:radial-gradient(135% 115% at 10% 6%,var(--indigo) 0%,var(--indigo-deep) 36%,var(--void) 66%),radial-gradient(120% 120% at 94% 0%,var(--bronze) 0%,rgba(58,41,23,0) 44%)}
        .feto-landing #constellation{position:absolute;inset:0}
        .feto-landing .hero-vignette{position:absolute;inset:0;background:radial-gradient(78% 78% at 50% 46%,transparent 38%,rgba(3,8,15,.6) 100%);pointer-events:none}
        .feto-landing .hero-content{position:relative;z-index:5;width:100%}
        .feto-landing .hero-grid{display:grid;grid-template-columns:1.18fr .82fr;gap:64px;align-items:center}
        @media(max-width:980px){.feto-landing .hero-grid{grid-template-columns:1fr;gap:40px}}
        .feto-landing .hero h1{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(44px,6.6vw,86px);line-height:1.0;letter-spacing:-.015em;color:var(--cream)}
        .feto-landing .hero h1 em{font-style:italic;color:var(--gold)}
        .feto-landing .hero-lede{margin-top:28px;font-size:clamp(16px,1.5vw,19px);color:var(--mist);max-width:35ch;line-height:1.65}
        .feto-landing .hero-actions{margin-top:40px;display:flex;gap:14px;flex-wrap:wrap}
        .feto-landing .btn-primary{padding:15px 30px;border-radius:var(--r);background:var(--gold);color:var(--void)!important;font-size:15px;font-weight:600;transition:all .3s var(--ease);box-shadow:0 14px 40px -12px rgba(224,169,85,.55);position:relative;overflow:hidden}
        .feto-landing .btn-primary::after{content:"";position:absolute;inset:0;background:linear-gradient(120deg,transparent 30%,rgba(255,255,255,.25),transparent 70%);transform:translateX(-120%);transition:transform .7s var(--ease)}
        .feto-landing .btn-primary:hover{background:var(--gold-bright);transform:translateY(-2px);box-shadow:0 22px 52px -12px rgba(224,169,85,.72)}
        .feto-landing .btn-primary:hover::after{transform:translateX(120%)}
        .feto-landing .btn-ghost{padding:15px 30px;border-radius:var(--r);border:1px solid var(--line);color:var(--cream);font-size:15px;font-weight:500;transition:all .3s var(--ease)}
        .feto-landing .btn-ghost:hover{border-color:rgba(224,169,85,.5);background:rgba(224,169,85,.05);transform:translateY(-2px)}
        .feto-landing .hero-meta{margin-top:50px;display:flex;gap:34px;flex-wrap:wrap}
        .feto-landing .hero-meta .item{display:flex;flex-direction:column;gap:4px}
        .feto-landing .hero-meta .n{font-family:'Playfair Display',serif;font-size:32px;color:var(--cream);line-height:1}
        .feto-landing .hero-meta .l{font-size:12px;color:var(--slate);letter-spacing:.04em}
        .feto-landing .hero-card{position:relative;background:linear-gradient(160deg,rgba(26,35,80,.5),rgba(11,18,40,.32));border:1px solid var(--line);border-radius:var(--r-xl);padding:26px;backdrop-filter:blur(14px);box-shadow:0 34px 90px -34px rgba(0,0,0,.75)}
        @media(max-width:980px){.feto-landing .hero-card{display:none}}
        .feto-landing .hc-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:18px}
        .feto-landing .hc-title{font-size:12.5px;color:var(--slate);letter-spacing:.06em}
        .feto-landing .hc-live{display:flex;align-items:center;gap:6px;font-size:10.5px;color:var(--gold);font-family:'JetBrains Mono',monospace}
        .feto-landing .hc-live::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px 2px rgba(224,169,85,.6);animation:fpulse 2s infinite}
        @keyframes fpulse{0%,100%{opacity:1}50%{opacity:.35}}
        .feto-landing .hc-agent{display:flex;align-items:center;gap:12px;padding:10px 0;border-bottom:1px solid var(--line-soft)}
        .feto-landing .hc-agent:last-child{border-bottom:none}
        .feto-landing .hc-ico{width:32px;height:32px;border-radius:9px;background:rgba(224,169,85,.1);border:1px solid rgba(224,169,85,.22);display:flex;align-items:center;justify-content:center;font-size:14px;flex:0 0 auto}
        .feto-landing .hc-name{font-size:13px;color:var(--cream);font-weight:500}
        .feto-landing .hc-role{font-size:11px;color:var(--slate)}
        .feto-landing .hc-status{margin-left:auto;font-size:9.5px;color:var(--gold);font-family:'JetBrains Mono',monospace}
        .feto-landing .scroll-cue{position:absolute;bottom:30px;left:50%;transform:translateX(-50%);z-index:6;display:flex;flex-direction:column;align-items:center;gap:8px;opacity:.5}
        .feto-landing .scroll-cue span{font-size:10px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate)}
        .feto-landing .scroll-cue .line{width:1px;height:34px;background:linear-gradient(var(--gold),transparent);animation:scrolldrop 2.2s var(--ease) infinite}
        @keyframes scrolldrop{0%{transform:scaleY(0);transform-origin:top}45%{transform:scaleY(1);transform-origin:top}55%{transform:scaleY(1);transform-origin:bottom}100%{transform:scaleY(0);transform-origin:bottom}}
        .feto-landing section{position:relative;padding:128px 0}
        .feto-landing .sec-head{max-width:680px;margin-bottom:66px}
        .feto-landing .sec-head.center{margin-left:auto;margin-right:auto;text-align:center}
        .feto-landing .sec-head h2{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(31px,4.2vw,50px);line-height:1.08;margin-top:18px;letter-spacing:-.015em}
        .feto-landing .sec-head p{margin-top:18px;font-size:17px;color:var(--mist);line-height:1.65}
        .feto-landing .divider{height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent)}
        .feto-landing .trust{padding:52px 0;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
        .feto-landing .trust-label{text-align:center;font-size:11.5px;letter-spacing:.2em;text-transform:uppercase;color:var(--slate-dim);margin-bottom:32px}
        .feto-landing .trust-row{display:flex;align-items:center;justify-content:center;gap:50px;flex-wrap:wrap;opacity:.85}
        .feto-landing .trust-row .badge{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--mist);font-weight:500;transition:color .3s}
        .feto-landing .trust-row .badge:hover{color:var(--cream)}
        .feto-landing .trust-row .badge svg{color:var(--gold)}
        .feto-landing .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:20px}
        @media(max-width:900px){.feto-landing .grid-3{grid-template-columns:1fr}}
        .feto-landing .card{position:relative;background:linear-gradient(160deg,rgba(11,18,40,.55),rgba(7,15,29,.4));border:1px solid var(--line);border-radius:var(--r-lg);padding:32px;transition:all .45s var(--ease);overflow:hidden}
        .feto-landing .card::before{content:"";position:absolute;inset:0;background:radial-gradient(130% 80% at var(--mx,0%) var(--my,0%),rgba(224,169,85,.1),transparent 45%);opacity:0;transition:opacity .4s}
        .feto-landing .card:hover{border-color:rgba(224,169,85,.32);transform:translateY(-5px)}
        .feto-landing .card:hover::before{opacity:1}
        .feto-landing .card-ico{width:48px;height:48px;border-radius:13px;background:rgba(224,169,85,.1);border:1px solid rgba(224,169,85,.25);display:flex;align-items:center;justify-content:center;color:var(--gold);margin-bottom:22px;transition:all .4s var(--ease)}
        .feto-landing .card:hover .card-ico{background:rgba(224,169,85,.16);transform:scale(1.06)}
        .feto-landing .card h3{font-size:20px;font-weight:600;color:var(--cream);margin-bottom:11px;letter-spacing:-.01em}
        .feto-landing .card p{font-size:14.5px;color:var(--slate);line-height:1.62}
        .feto-landing .split{display:grid;grid-template-columns:1fr 1fr;gap:72px;align-items:center}
        @media(max-width:900px){.feto-landing .split{grid-template-columns:1fr;gap:40px}}
        .feto-landing .split h2{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(28px,3.6vw,44px);line-height:1.1;letter-spacing:-.015em}
        .feto-landing .split p{margin-top:20px;font-size:16.5px;color:var(--mist);line-height:1.7}
        .feto-landing .split-list{margin-top:30px;display:flex;flex-direction:column;gap:16px}
        .feto-landing .split-list .li{display:flex;gap:13px;align-items:flex-start}
        .feto-landing .split-list .li .tick{width:22px;height:22px;border-radius:7px;background:rgba(224,169,85,.12);border:1px solid rgba(224,169,85,.3);display:flex;align-items:center;justify-content:center;flex:0 0 auto;margin-top:2px}
        .feto-landing .split-list .li .tick svg{color:var(--gold)}
        .feto-landing .split-list .li span{font-size:15.5px;color:var(--mist);line-height:1.55}
        .feto-landing .split-visual{position:relative;aspect-ratio:1/1;border-radius:var(--r-xl);overflow:hidden;border:1px solid var(--line);background:radial-gradient(120% 120% at 30% 20%,var(--indigo),var(--indigo-deep) 55%,var(--void))}
        .feto-landing .orbit-canvas{position:absolute;inset:0}
        .feto-landing .orbit-label{position:absolute;bottom:20px;left:0;right:0;text-align:center;font-family:'JetBrains Mono',monospace;font-size:11px;color:var(--slate);letter-spacing:.1em}
        .feto-landing .metrics{background:linear-gradient(160deg,var(--indigo-deep),var(--void));border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
        .feto-landing .metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:30px}
        @media(max-width:820px){.feto-landing .metrics-grid{grid-template-columns:repeat(2,1fr);gap:44px 20px}}
        .feto-landing .metric{text-align:center}
        .feto-landing .metric .n{font-family:'Playfair Display',serif;font-size:clamp(42px,5vw,62px);color:var(--gold);line-height:1;letter-spacing:-.02em}
        .feto-landing .metric .l{margin-top:12px;font-size:14px;color:var(--mist)}
        .feto-landing .metric .s{margin-top:4px;font-size:12px;color:var(--slate-dim)}
        .feto-landing .vision{position:relative;overflow:hidden}
        .feto-landing .vision-inner{max-width:880px;margin:0 auto;text-align:center;position:relative;z-index:2}
        .feto-landing .vision-statement{font-family:'Playfair Display',serif;font-weight:400;font-size:clamp(26px,3.6vw,42px);line-height:1.32;color:var(--cream);letter-spacing:-.01em}
        .feto-landing .vision-statement em{font-style:italic;color:var(--gold)}
        .feto-landing .vision-sub{margin-top:30px;font-size:16px;color:var(--slate);max-width:54ch;margin-left:auto;margin-right:auto}
        .feto-landing .sec-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:14px}
        @media(max-width:900px){.feto-landing .sec-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:520px){.feto-landing .sec-grid{grid-template-columns:1fr}}
        .feto-landing .sec-chip{background:rgba(11,18,40,.5);border:1px solid var(--line);border-radius:var(--r);padding:20px;transition:all .35s var(--ease)}
        .feto-landing .sec-chip:hover{border-color:rgba(224,169,85,.3);transform:translateY(-3px)}
        .feto-landing .sec-chip .t{font-size:13px;color:var(--cream);font-weight:600;margin-bottom:6px;display:flex;align-items:center;gap:8px}
        .feto-landing .sec-chip .t svg{color:var(--gold)}
        .feto-landing .sec-chip .d{font-size:12.5px;color:var(--slate);line-height:1.5}
        .feto-landing .cta-final{position:relative;text-align:center;overflow:hidden}
        .feto-landing .cta-bg{position:absolute;inset:0;background:radial-gradient(100% 100% at 50% 0%,var(--indigo),var(--void) 58%)}
        .feto-landing #cta-constellation{position:absolute;inset:0;opacity:.55}
        .feto-landing .cta-inner{position:relative;z-index:3;max-width:740px;margin:0 auto}
        .feto-landing .cta-inner h2{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(36px,5.2vw,64px);line-height:1.06;letter-spacing:-.015em}
        .feto-landing .cta-inner h2 em{font-style:italic;color:var(--gold)}
        .feto-landing .cta-inner p{margin-top:22px;font-size:18px;color:var(--mist);max-width:48ch;margin-left:auto;margin-right:auto}
        .feto-landing .cta-actions{margin-top:42px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
        .feto-landing footer{border-top:1px solid var(--line-soft);padding:72px 0 40px}
        .feto-landing .foot-grid{display:grid;grid-template-columns:1.7fr 1fr 1fr 1fr;gap:40px;margin-bottom:54px}
        @media(max-width:820px){.feto-landing .foot-grid{grid-template-columns:1fr 1fr;gap:36px}}
        .feto-landing .foot-brand .logo{margin-bottom:18px}
        .feto-landing .foot-brand p{font-size:14px;color:var(--slate);max-width:30ch;line-height:1.6}
        .feto-landing .foot-col h4{font-size:11.5px;letter-spacing:.13em;text-transform:uppercase;color:var(--slate-dim);margin-bottom:18px}
        .feto-landing .foot-col a{display:block;font-size:14px;color:var(--mist);margin-bottom:12px;transition:color .2s}
        .feto-landing .foot-col a:hover{color:var(--gold)}
        .feto-landing .foot-bottom{display:flex;align-items:center;justify-content:space-between;padding-top:30px;border-top:1px solid var(--line-soft);flex-wrap:wrap;gap:14px}
        .feto-landing .foot-bottom p{font-size:13px;color:var(--slate-dim)}
        .feto-landing .foot-rtl{font-size:13px;color:var(--slate);direction:rtl}
        .feto-landing .reveal{opacity:0;transform:translateY(26px);transition:opacity .8s var(--ease-out),transform .8s var(--ease-out)}
        .feto-landing .reveal.in{opacity:1;transform:none}
        .feto-landing .stagger>*{opacity:0;transform:translateY(20px);transition:opacity .7s var(--ease-out),transform .7s var(--ease-out)}
        .feto-landing .stagger.in>*{opacity:1;transform:none}
        .feto-landing .stagger.in>*:nth-child(1){transition-delay:.05s}.feto-landing .stagger.in>*:nth-child(2){transition-delay:.13s}.feto-landing .stagger.in>*:nth-child(3){transition-delay:.21s}.feto-landing .stagger.in>*:nth-child(4){transition-delay:.29s}.feto-landing .stagger.in>*:nth-child(5){transition-delay:.37s}.feto-landing .stagger.in>*:nth-child(6){transition-delay:.45s}.feto-landing .stagger.in>*:nth-child(7){transition-delay:.53s}.feto-landing .stagger.in>*:nth-child(8){transition-delay:.61s}
        .feto-landing .h-anim{opacity:0;transform:translateY(22px);animation:heroIn .9s var(--ease-out) forwards}
        .feto-landing .h-anim.d1{animation-delay:.1s}.feto-landing .h-anim.d2{animation-delay:.2s}.feto-landing .h-anim.d3{animation-delay:.32s}.feto-landing .h-anim.d4{animation-delay:.44s}.feto-landing .h-anim.d5{animation-delay:.56s}.feto-landing .h-anim.d6{animation-delay:.68s}
        @keyframes heroIn{to{opacity:1;transform:none}}
        @media(prefers-reduced-motion:reduce){.feto-landing .reveal,.feto-landing .stagger>*,.feto-landing .h-anim{opacity:1!important;transform:none!important;animation:none!important}.feto-landing *{animation:none!important}}
      `}</style>
    </div>
  );
}
