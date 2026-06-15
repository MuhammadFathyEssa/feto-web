"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function LandingPage() {
  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Nav scroll state
    const nav = document.getElementById("nav");
    const onScroll = () => nav?.classList.toggle("scrolled", window.scrollY > 20);
    window.addEventListener("scroll", onScroll);

    // Reveal on scroll
    const io = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => io.observe(el));

    // Count-up
    const countUp = (el: HTMLElement) => {
      const target = +(el.dataset.count || "0");
      let cur = 0; const step = target / 40;
      const tick = () => { cur += step; if (cur < target) { el.textContent = String(Math.floor(cur)); requestAnimationFrame(tick); } else el.textContent = String(target); };
      tick();
    };
    const cio = new IntersectionObserver(
      (es) => es.forEach((e) => { if (e.isIntersecting) { countUp(e.target as HTMLElement); cio.unobserve(e.target); } }),
      { threshold: 0.5 }
    );
    document.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => cio.observe(el));

    // Constellation engine
    type COpts = { density?: number; link?: number; speed?: number; goldEvery?: number; min?: number; max?: number };
    const cleanups: Array<() => void> = [];
    function constellation(canvas: HTMLCanvasElement | null, opts: COpts = {}) {
      if (!canvas) return;
      const ctx = canvas.getContext("2d"); if (!ctx) return;
      let W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2), t = 0, raf = 0, running = true;
      type N = { x: number; y: number; vx: number; vy: number; r: number; gold: boolean };
      let nodes: N[] = [];
      const density = opts.density || 0.00009, LINK = opts.link || 130, speed = opts.speed || 0.18, goldEvery = opts.goldEvery || 14;
      const seed = () => {
        const n = Math.max(opts.min || 26, Math.min(opts.max || 72, Math.floor(W * H * density)));
        nodes = Array.from({ length: n }, (_, i) => ({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - 0.5) * speed, vy: (Math.random() - 0.5) * speed, r: Math.random() * 1.6 + 0.6, gold: i % goldEvery === 0 }));
      };
      const resize = () => {
        const p = canvas.parentElement!; W = p.clientWidth; H = p.clientHeight;
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = W * dpr; canvas.height = H * dpr; canvas.style.width = W + "px"; canvas.style.height = H + "px";
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0); seed();
      };
      const draw = () => {
        ctx.clearRect(0, 0, W, H); t += 0.016;
        for (let i = 0; i < nodes.length; i++) for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i], b = nodes[j], dx = a.x - b.x, dy = a.y - b.y, d = Math.hypot(dx, dy);
          if (d < LINK) { ctx.strokeStyle = `rgba(150,170,210,${(1 - d / LINK) * 0.2})`; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke(); }
        }
        for (const n of nodes) {
          n.x += n.vx; n.y += n.vy;
          if (n.x < 0 || n.x > W) n.vx *= -1; if (n.y < 0 || n.y > H) n.vy *= -1;
          if (n.gold) { const p = (Math.sin(t * 1.6 + n.x) + 1) / 2; ctx.beginPath(); ctx.fillStyle = `rgba(224,169,85,${0.5 + p * 0.4})`; ctx.shadowColor = "rgba(224,169,85,.8)"; ctx.shadowBlur = 3 + p * 4; ctx.arc(n.x, n.y, n.r + 0.6, 0, 7); ctx.fill(); ctx.shadowBlur = 0; }
          else { ctx.beginPath(); ctx.fillStyle = "rgba(180,195,225,.45)"; ctx.arc(n.x, n.y, n.r, 0, 7); ctx.fill(); }
        }
      };
      const loop = () => { if (!running) return; draw(); raf = requestAnimationFrame(loop); };
      const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!reduced) { running = true; loop(); } };
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", onVis);
      resize(); reduced ? draw() : loop();
      cleanups.push(() => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); });
    }
    constellation(document.getElementById("constellation") as HTMLCanvasElement, { max: 80 });
    constellation(document.getElementById("cta-constellation") as HTMLCanvasElement, { max: 50, density: 0.00007 });

    // Orbit visual
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
        for (let i = 0; i < N; i++) {
          const ring = 1 + (i % 3); const ang = (i / N) * Math.PI * 2 + t * (ring % 2 ? 1 : -1) * (1.4 / ring); const rad = Math.min(W, H) * 0.13 * ring; const x = cx + Math.cos(ang) * rad, y = cy + Math.sin(ang) * rad;
          ctx.beginPath(); ctx.strokeStyle = `rgba(224,169,85,${0.14 - ring * 0.02})`; ctx.lineWidth = 0.7; ctx.moveTo(cx, cy); ctx.lineTo(x, y); ctx.stroke();
          const pulse = (Math.sin(t * 30 + i) + 1) / 2; ctx.beginPath(); ctx.fillStyle = `rgba(197,202,216,${0.6 + pulse * 0.4})`; ctx.arc(x, y, 2.4, 0, 7); ctx.fill();
        }
      };
      const loop = () => { if (!running) return; draw(); raf = requestAnimationFrame(loop); };
      const onVis = () => { if (document.hidden) { running = false; cancelAnimationFrame(raf); } else if (!reduced) { running = true; loop(); } };
      window.addEventListener("resize", resize);
      document.addEventListener("visibilitychange", onVis);
      resize(); reduced ? draw() : loop();
      cleanups.push(() => { running = false; cancelAnimationFrame(raf); window.removeEventListener("resize", resize); document.removeEventListener("visibilitychange", onVis); });
    })();

    return () => {
      window.removeEventListener("scroll", onScroll);
      io.disconnect(); cio.disconnect();
      cleanups.forEach((fn) => fn());
    };
  }, []);

  return (
    <div className="feto-landing">
      <nav id="nav">
        <div className="nav-in">
          <a className="logo" href="#top">
            <span className="logo-mark"><span className="logo-dot" /></span>
            <span className="logo-txt">FeTo</span>
          </a>
          <div className="nav-links">
            <a href="#platform">Platform</a>
            <a href="#agents">Agents</a>
            <a href="#security">Security</a>
            <a href="#impact">Impact</a>
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
                <span className="eyebrow">Arabic-native · Banking-grade</span>
                <h1>The executive mind,<br /><em>multiplied.</em></h1>
                <p className="hero-lede">FeTo is an intelligence platform where thirteen specialized AI agents reason together — in Arabic and English — for the institutions that run the region.</p>
                <div className="hero-actions">
                  <Link href="/login" className="btn-primary">Request access</Link>
                  <a href="#platform" className="btn-ghost">See the platform</a>
                </div>
                <div className="hero-meta">
                  <div className="item"><span className="n serif">13</span><span className="l">Specialized agents</span></div>
                  <div className="item"><span className="n serif">96<span style={{ fontSize: 18 }}>/100</span></span><span className="l">CTO assessment</span></div>
                  <div className="item"><span className="n serif">0</span><span className="l">Critical findings</span></div>
                </div>
              </div>
              <div className="hero-card">
                <div className="hc-head">
                  <span className="hc-title">Council session</span>
                  <span className="hc-live">Live</span>
                </div>
                <div className="hc-agent"><span className="hc-ico">⚖</span><div><div className="hc-name">Strategy Advisor</div><div className="hc-role">Market timing · risk</div></div><span className="hc-status">reasoning</span></div>
                <div className="hc-agent"><span className="hc-ico">🛡</span><div><div className="hc-name">Security Analyst</div><div className="hc-role">CBE framework · OWASP</div></div><span className="hc-status">verified</span></div>
                <div className="hc-agent"><span className="hc-ico">📊</span><div><div className="hc-name">Data Synthesist</div><div className="hc-role">Signals · forecasting</div></div><span className="hc-status">drafting</span></div>
                <div className="hc-agent"><span className="hc-ico">✍</span><div><div className="hc-name">Content Director</div><div className="hc-role">Executive voice</div></div><span className="hc-status">ready</span></div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="trust">
        <div className="wrap">
          <p className="trust-label">Built to the standards that govern regulated institutions</p>
          <div className="trust-row">
            <span className="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>CBE Financial Cybersecurity Framework</span>
            <span className="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>OWASP WSTG Aligned</span>
            <span className="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>TLS 1.3 · Zero-trust access</span>
            <span className="badge"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>PCI-DSS 4.0 mapped</span>
          </div>
        </div>
      </div>

      <section id="platform">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">The platform</span>
            <h2>Not a chatbot. A reasoning institution.</h2>
            <p>Most AI tools answer questions. FeTo convenes a council — specialized agents that debate, verify, and converge on decisions your leadership can act on. Each agent carries deep domain context; together they think like a seasoned executive team.</p>
          </div>
          <div className="grid-3">
            <div className="card reveal">
              <div className="card-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M12 2v4M12 18v4M2 12h4M18 12h4M5 5l3 3M16 16l3 3M19 5l-3 3M8 16l-3 3" /></svg></div>
              <h3>Thirteen minds, one mandate</h3>
              <p>Strategy, security, data, finance, content, and more — each a specialist, orchestrated through a council layer that synthesizes a single decisive recommendation.</p>
            </div>
            <div className="card reveal">
              <div className="card-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M3 12h4l2-7 4 14 2-7h6" /></svg></div>
              <h3>Arabic at the core</h3>
              <p>Not translated, native. FeTo reasons, writes, and presents in fluent executive Arabic and English — built for the boardrooms of Cairo, Riyadh, and the Gulf.</p>
            </div>
            <div className="card reveal">
              <div className="card-ico"><svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /><path d="M9 12l2 2 4-4" /></svg></div>
              <h3>Banking-grade by design</h3>
              <p>Hardened across every build iteration, mapped to the CBE Financial Cybersecurity Framework, and audited to a 96/100 CTO assessment — security is the foundation, not a feature.</p>
            </div>
          </div>
        </div>
      </section>

      <div className="wrap"><div className="divider" /></div>

      <section id="agents">
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
            <div className="split-visual reveal">
              <canvas className="orbit-canvas" id="orbit" />
            </div>
          </div>
        </div>
      </section>

      <section className="metrics">
        <div className="wrap">
          <div className="metrics-grid">
            <div className="metric reveal"><div className="n serif" data-count="13">13</div><div className="l">Specialized agents</div><div className="s">orchestrated in concert</div></div>
            <div className="metric reveal"><div className="n serif" data-count="96">96</div><div className="l">CTO assessment score</div><div className="s">out of 100</div></div>
            <div className="metric reveal"><div className="n serif">2</div><div className="l">Languages, native</div><div className="s">Arabic &amp; English</div></div>
            <div className="metric reveal"><div className="n serif">0</div><div className="l">Critical vulnerabilities</div><div className="s">independent scan</div></div>
          </div>
        </div>
      </section>

      <section id="security">
        <div className="wrap">
          <div className="sec-head reveal">
            <span className="eyebrow">Security &amp; compliance</span>
            <h2>Trust is the product.</h2>
            <p>FeTo was built for institutions that cannot afford to be wrong about security. Every layer is hardened, every standard mapped, every claim independently verifiable.</p>
          </div>
          <div className="sec-grid">
            <div className="sec-chip reveal"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>CBE Framework</div><div className="d">Mapped to the Central Bank of Egypt Financial Cybersecurity Framework, December 2021.</div></div>
            <div className="sec-chip reveal"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M9 12l2 2 4-4" /></svg>OWASP WSTG</div><div className="d">Web Security Testing Guide aligned, validated by an internal pentester agent.</div></div>
            <div className="sec-chip reveal"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>Zero-trust access</div><div className="d">Role-based access control, sliding sessions, idle timeout, httpOnly tokens.</div></div>
            <div className="sec-chip reveal"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 13l4 4L19 7" /></svg>TLS 1.3 + HSTS</div><div className="d">Modern transport security, HSTS preload, full security-header coverage.</div></div>
            <div className="sec-chip reveal"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2v20M2 12h20" /></svg>PCI-DSS 4.0</div><div className="d">Controls mapped against PCI-DSS 4.0.1 for payment-adjacent contexts.</div></div>
            <div className="sec-chip reveal"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9" /><path d="M12 8v4l3 2" /></svg>Continuous scanning</div><div className="d">On-demand passive reconnaissance and OWASP-aligned reporting, built in.</div></div>
            <div className="sec-chip reveal"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16v12H4z" /><path d="M8 20h8" /></svg>Audit logging</div><div className="d">Every privileged action recorded — accountable, traceable, reviewable.</div></div>
            <div className="sec-chip reveal"><div className="t"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" /></svg>Data residency</div><div className="d">PII handling aligned with Egypt Law 151/2020 and regional requirements.</div></div>
          </div>
        </div>
      </section>

      <div className="wrap"><div className="divider" /></div>

      <section id="impact">
        <div className="wrap">
          <div className="sec-head center reveal">
            <span className="eyebrow">Impact</span>
            <h2>From inbox to boardroom in minutes.</h2>
          </div>
          <div className="case reveal">
            <blockquote className="case-quote">&ldquo;FeTo compressed work that took my team days into a single afternoon — <em>without lowering the bar</em> on rigor or security.&rdquo;</blockquote>
            <div className="case-by">
              <span className="case-av">MF</span>
              <div>
                <div className="case-name">Dr. Muhammad Fathy</div>
                <div className="case-title">CEO &amp; Founder, FeTo Executive Intelligence Platform</div>
              </div>
            </div>
            <div className="case-metrics">
              <div className="case-metric"><div className="n serif">10×</div><div className="l">Faster executive drafting</div></div>
              <div className="case-metric"><div className="n serif">13</div><div className="l">Domains covered by one platform</div></div>
              <div className="case-metric"><div className="n serif">24/7</div><div className="l">Always-on intelligence</div></div>
            </div>
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
              <Link href="/login" className="btn-primary">Request access</Link>
              <a href="#platform" className="btn-ghost">Explore the platform</a>
            </div>
          </div>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div className="foot-grid">
            <div className="foot-brand">
              <a className="logo" href="#top">
                <span className="logo-mark"><span className="logo-dot" /></span>
                <span className="logo-txt">FeTo</span>
              </a>
              <p>An Arabic-native executive intelligence platform, built for the institutions that lead the region.</p>
            </div>
            <div className="foot-col">
              <h4>Platform</h4>
              <a href="#platform">Overview</a>
              <a href="#agents">The council</a>
              <a href="#security">Security</a>
              <a href="#impact">Impact</a>
            </div>
            <div className="foot-col">
              <h4>Company</h4>
              <a href="#">About</a>
              <a href="#">Leadership</a>
              <a href="#">Contact</a>
            </div>
            <div className="foot-col">
              <h4>Access</h4>
              <Link href="/login">Sign in</Link>
              <Link href="/login">Request access</Link>
            </div>
          </div>
          <div className="foot-bottom">
            <p>© 2026 FeTo Executive Intelligence Platform. All rights reserved.</p>
            <p className="foot-rtl">منصّة ذكاء تنفيذي عربية · مبنية بمعايير بنكية</p>
          </div>
        </div>
      </footer>

      <style jsx global>{`
        .feto-landing{--void:#040d1a;--indigo-deep:#0c1430;--indigo:#1b2552;--bronze:#3a2917;--gold:#e0a955;--gold-bright:#eab667;--cream:#f0ebe0;--mist:#c5cad8;--slate:#8a93a8;--slate-dim:#5a6478;--line:#1a2550;--line-soft:#141d3a;--r-sm:10px;--r:14px;--r-lg:20px;--r-xl:28px;--maxw:1200px;--gutter:24px;--ease:cubic-bezier(.22,.61,.36,1);background:var(--void);color:var(--cream);font-family:'Inter',system-ui,sans-serif;line-height:1.6;overflow-x:hidden}
        .feto-landing *{box-sizing:border-box;margin:0;padding:0}
        .feto-landing .serif{font-family:'Playfair Display',Georgia,serif}
        .feto-landing a{color:inherit;text-decoration:none}
        .feto-landing .eyebrow{font-size:12px;letter-spacing:.22em;text-transform:uppercase;color:var(--gold);font-weight:500}
        .feto-landing .wrap{max-width:var(--maxw);margin:0 auto;padding:0 var(--gutter)}
        .feto-landing nav{position:fixed;top:0;left:0;right:0;z-index:100;transition:all .4s var(--ease)}
        .feto-landing nav.scrolled{background:rgba(4,13,26,.72);backdrop-filter:blur(18px);border-bottom:1px solid var(--line-soft)}
        .feto-landing .nav-in{max-width:var(--maxw);margin:0 auto;padding:18px var(--gutter);display:flex;align-items:center;justify-content:space-between}
        .feto-landing .logo{display:flex;align-items:center;gap:11px}
        .feto-landing .logo-mark{width:30px;height:30px;border-radius:50%;border:1px solid rgba(224,169,85,.45);display:flex;align-items:center;justify-content:center;flex:0 0 auto}
        .feto-landing .logo-dot{width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 10px 2px rgba(224,169,85,.55)}
        .feto-landing .logo-txt{font-family:'Playfair Display',serif;font-style:italic;font-size:22px;color:var(--cream)}
        .feto-landing .nav-links{display:flex;align-items:center;gap:36px}
        .feto-landing .nav-links a{font-size:14px;color:var(--mist);transition:color .2s}
        .feto-landing .nav-links a:hover{color:var(--cream)}
        .feto-landing .nav-cta{padding:9px 20px;border-radius:var(--r-sm);background:var(--gold);color:var(--void)!important;font-size:14px;font-weight:600;transition:all .25s var(--ease)}
        .feto-landing .nav-cta:hover{background:var(--gold-bright);transform:translateY(-1px)}
        @media(max-width:860px){.feto-landing .nav-links{gap:18px}.feto-landing .nav-links a:not(.nav-cta){display:none}}
        .feto-landing .hero{position:relative;min-height:100vh;display:flex;align-items:center;overflow:hidden}
        .feto-landing .hero-bg{position:absolute;inset:0;background:radial-gradient(130% 110% at 12% 8%,var(--indigo) 0%,var(--indigo-deep) 38%,var(--void) 68%),radial-gradient(120% 120% at 92% 0%,var(--bronze) 0%,rgba(58,41,23,0) 46%)}
        .feto-landing #constellation{position:absolute;inset:0}
        .feto-landing .hero-vignette{position:absolute;inset:0;background:radial-gradient(80% 80% at 50% 50%,transparent 40%,rgba(4,13,26,.55) 100%);pointer-events:none}
        .feto-landing .hero-content{position:relative;z-index:5;width:100%}
        .feto-landing .hero-grid{display:grid;grid-template-columns:1.15fr .85fr;gap:60px;align-items:center}
        @media(max-width:980px){.feto-landing .hero-grid{grid-template-columns:1fr;gap:40px}}
        .feto-landing .hero h1{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(40px,6vw,76px);line-height:1.04;letter-spacing:-.01em;color:var(--cream)}
        .feto-landing .hero h1 em{font-style:italic;color:var(--gold)}
        .feto-landing .hero-lede{margin-top:26px;font-size:clamp(16px,1.5vw,19px);color:var(--mist);max-width:36ch;line-height:1.65}
        .feto-landing .hero-actions{margin-top:38px;display:flex;gap:14px;flex-wrap:wrap}
        .feto-landing .btn-primary{padding:15px 30px;border-radius:var(--r);background:var(--gold);color:var(--void)!important;font-size:15px;font-weight:600;transition:all .28s var(--ease);box-shadow:0 14px 40px -12px rgba(224,169,85,.55)}
        .feto-landing .btn-primary:hover{background:var(--gold-bright);transform:translateY(-2px);box-shadow:0 20px 50px -12px rgba(224,169,85,.7)}
        .feto-landing .btn-ghost{padding:15px 30px;border-radius:var(--r);border:1px solid var(--line);color:var(--cream);font-size:15px;font-weight:500;transition:all .28s var(--ease)}
        .feto-landing .btn-ghost:hover{border-color:rgba(224,169,85,.5);background:rgba(224,169,85,.05)}
        .feto-landing .hero-meta{margin-top:46px;display:flex;gap:30px;flex-wrap:wrap}
        .feto-landing .hero-meta .item{display:flex;flex-direction:column;gap:3px}
        .feto-landing .hero-meta .n{font-family:'Playfair Display',serif;font-size:30px;color:var(--cream);line-height:1}
        .feto-landing .hero-meta .l{font-size:12px;color:var(--slate);letter-spacing:.04em}
        .feto-landing .hero-card{position:relative;background:linear-gradient(160deg,rgba(27,37,82,.5),rgba(12,20,48,.35));border:1px solid var(--line);border-radius:var(--r-xl);padding:28px;backdrop-filter:blur(12px);box-shadow:0 30px 80px -30px rgba(0,0,0,.7)}
        @media(max-width:980px){.feto-landing .hero-card{display:none}}
        .feto-landing .hc-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px}
        .feto-landing .hc-title{font-size:13px;color:var(--slate);letter-spacing:.05em}
        .feto-landing .hc-live{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--gold)}
        .feto-landing .hc-live::before{content:"";width:6px;height:6px;border-radius:50%;background:var(--gold);box-shadow:0 0 8px 2px rgba(224,169,85,.6);animation:fpulse 2s infinite}
        @keyframes fpulse{0%,100%{opacity:1}50%{opacity:.4}}
        .feto-landing .hc-agent{display:flex;align-items:center;gap:12px;padding:11px 0;border-bottom:1px solid var(--line-soft)}
        .feto-landing .hc-agent:last-child{border-bottom:none}
        .feto-landing .hc-ico{width:32px;height:32px;border-radius:9px;background:rgba(224,169,85,.1);border:1px solid rgba(224,169,85,.22);display:flex;align-items:center;justify-content:center;font-size:14px;flex:0 0 auto}
        .feto-landing .hc-name{font-size:13.5px;color:var(--cream);font-weight:500}
        .feto-landing .hc-role{font-size:11.5px;color:var(--slate)}
        .feto-landing .hc-status{margin-left:auto;font-size:10px;color:var(--gold);font-family:'JetBrains Mono',monospace}
        .feto-landing section{position:relative;padding:120px 0}
        .feto-landing .sec-head{max-width:680px;margin-bottom:64px}
        .feto-landing .sec-head.center{margin-left:auto;margin-right:auto;text-align:center}
        .feto-landing .sec-head h2{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(30px,4vw,48px);line-height:1.1;margin-top:18px;letter-spacing:-.01em}
        .feto-landing .sec-head p{margin-top:18px;font-size:17px;color:var(--mist);line-height:1.65}
        .feto-landing .divider{height:1px;background:linear-gradient(90deg,transparent,var(--line),transparent)}
        .feto-landing .trust{padding:54px 0;border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
        .feto-landing .trust-label{text-align:center;font-size:12px;letter-spacing:.18em;text-transform:uppercase;color:var(--slate-dim);margin-bottom:30px}
        .feto-landing .trust-row{display:flex;align-items:center;justify-content:center;gap:54px;flex-wrap:wrap;opacity:.8}
        .feto-landing .trust-row .badge{display:flex;align-items:center;gap:9px;font-size:14px;color:var(--mist);font-weight:500}
        .feto-landing .trust-row .badge svg{color:var(--gold)}
        .feto-landing .grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:22px}
        @media(max-width:900px){.feto-landing .grid-3{grid-template-columns:1fr}}
        .feto-landing .card{position:relative;background:linear-gradient(160deg,rgba(12,20,48,.55),rgba(7,16,33,.4));border:1px solid var(--line);border-radius:var(--r-lg);padding:32px;transition:all .4s var(--ease);overflow:hidden}
        .feto-landing .card::before{content:"";position:absolute;inset:0;background:radial-gradient(120% 80% at 0% 0%,rgba(224,169,85,.07),transparent 50%);opacity:0;transition:opacity .4s}
        .feto-landing .card:hover{border-color:rgba(224,169,85,.3);transform:translateY(-4px)}
        .feto-landing .card:hover::before{opacity:1}
        .feto-landing .card-ico{width:48px;height:48px;border-radius:13px;background:rgba(224,169,85,.1);border:1px solid rgba(224,169,85,.25);display:flex;align-items:center;justify-content:center;color:var(--gold);margin-bottom:22px}
        .feto-landing .card h3{font-size:20px;font-weight:600;color:var(--cream);margin-bottom:11px;letter-spacing:-.01em}
        .feto-landing .card p{font-size:15px;color:var(--slate);line-height:1.6}
        .feto-landing .split{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
        @media(max-width:900px){.feto-landing .split{grid-template-columns:1fr;gap:40px}}
        .feto-landing .split h2{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(28px,3.5vw,42px);line-height:1.12;letter-spacing:-.01em}
        .feto-landing .split p{margin-top:20px;font-size:16.5px;color:var(--mist);line-height:1.7}
        .feto-landing .split-list{margin-top:28px;display:flex;flex-direction:column;gap:16px}
        .feto-landing .split-list .li{display:flex;gap:13px;align-items:flex-start}
        .feto-landing .split-list .li .tick{width:22px;height:22px;border-radius:7px;background:rgba(224,169,85,.12);border:1px solid rgba(224,169,85,.3);display:flex;align-items:center;justify-content:center;flex:0 0 auto;margin-top:2px}
        .feto-landing .split-list .li .tick svg{color:var(--gold)}
        .feto-landing .split-list .li span{font-size:15.5px;color:var(--mist);line-height:1.55}
        .feto-landing .split-visual{position:relative;aspect-ratio:1/1;border-radius:var(--r-xl);overflow:hidden;border:1px solid var(--line);background:radial-gradient(120% 120% at 30% 20%,var(--indigo),var(--indigo-deep) 55%,var(--void))}
        .feto-landing .orbit-canvas{position:absolute;inset:0}
        .feto-landing .metrics{background:linear-gradient(160deg,var(--indigo-deep),var(--void));border-top:1px solid var(--line-soft);border-bottom:1px solid var(--line-soft)}
        .feto-landing .metrics-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:30px}
        @media(max-width:820px){.feto-landing .metrics-grid{grid-template-columns:repeat(2,1fr);gap:40px 20px}}
        .feto-landing .metric{text-align:center}
        .feto-landing .metric .n{font-family:'Playfair Display',serif;font-size:clamp(40px,5vw,58px);color:var(--gold);line-height:1;letter-spacing:-.02em}
        .feto-landing .metric .l{margin-top:12px;font-size:14px;color:var(--mist)}
        .feto-landing .metric .s{margin-top:4px;font-size:12px;color:var(--slate-dim)}
        .feto-landing .case{background:linear-gradient(160deg,rgba(27,37,82,.4),rgba(12,20,48,.25));border:1px solid var(--line);border-radius:var(--r-xl);padding:clamp(32px,5vw,60px);position:relative;overflow:hidden}
        .feto-landing .case::after{content:"";position:absolute;top:-40%;right:-10%;width:50%;height:180%;background:radial-gradient(circle,rgba(224,169,85,.08),transparent 60%);pointer-events:none}
        .feto-landing .case-quote{font-family:'Playfair Display',serif;font-size:clamp(22px,3vw,34px);line-height:1.35;color:var(--cream);font-weight:400;max-width:22ch;position:relative;z-index:2}
        .feto-landing .case-quote em{font-style:italic;color:var(--gold)}
        .feto-landing .case-by{margin-top:30px;display:flex;align-items:center;gap:14px}
        .feto-landing .case-av{width:46px;height:46px;border-radius:50%;background:linear-gradient(135deg,var(--gold),var(--bronze));display:flex;align-items:center;justify-content:center;font-family:'Playfair Display',serif;font-size:18px;color:var(--void);font-weight:600}
        .feto-landing .case-name{font-size:15px;color:var(--cream);font-weight:600}
        .feto-landing .case-title{font-size:13px;color:var(--slate)}
        .feto-landing .case-metrics{margin-top:40px;display:grid;grid-template-columns:repeat(3,1fr);gap:24px;position:relative;z-index:2}
        @media(max-width:680px){.feto-landing .case-metrics{grid-template-columns:1fr;gap:20px}}
        .feto-landing .case-metric .n{font-family:'Playfair Display',serif;font-size:34px;color:var(--gold);line-height:1}
        .feto-landing .case-metric .l{margin-top:6px;font-size:13px;color:var(--slate)}
        .feto-landing .sec-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
        @media(max-width:900px){.feto-landing .sec-grid{grid-template-columns:repeat(2,1fr)}}
        @media(max-width:520px){.feto-landing .sec-grid{grid-template-columns:1fr}}
        .feto-landing .sec-chip{background:rgba(12,20,48,.5);border:1px solid var(--line);border-radius:var(--r);padding:20px;transition:all .3s var(--ease)}
        .feto-landing .sec-chip:hover{border-color:rgba(224,169,85,.3)}
        .feto-landing .sec-chip .t{font-size:13px;color:var(--cream);font-weight:600;margin-bottom:5px;display:flex;align-items:center;gap:8px}
        .feto-landing .sec-chip .t svg{color:var(--gold)}
        .feto-landing .sec-chip .d{font-size:12.5px;color:var(--slate);line-height:1.5}
        .feto-landing .cta-final{position:relative;text-align:center;overflow:hidden}
        .feto-landing .cta-bg{position:absolute;inset:0;background:radial-gradient(100% 100% at 50% 0%,var(--indigo),var(--void) 60%)}
        .feto-landing #cta-constellation{position:absolute;inset:0;opacity:.6}
        .feto-landing .cta-inner{position:relative;z-index:3;max-width:720px;margin:0 auto}
        .feto-landing .cta-inner h2{font-family:'Playfair Display',serif;font-weight:500;font-size:clamp(34px,5vw,60px);line-height:1.08;letter-spacing:-.01em}
        .feto-landing .cta-inner h2 em{font-style:italic;color:var(--gold)}
        .feto-landing .cta-inner p{margin-top:22px;font-size:18px;color:var(--mist);max-width:48ch;margin-left:auto;margin-right:auto}
        .feto-landing .cta-actions{margin-top:40px;display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
        .feto-landing footer{border-top:1px solid var(--line-soft);padding:70px 0 40px}
        .feto-landing .foot-grid{display:grid;grid-template-columns:1.6fr 1fr 1fr 1fr;gap:40px;margin-bottom:54px}
        @media(max-width:820px){.feto-landing .foot-grid{grid-template-columns:1fr 1fr;gap:36px}}
        .feto-landing .foot-brand .logo{margin-bottom:18px}
        .feto-landing .foot-brand p{font-size:14px;color:var(--slate);max-width:30ch;line-height:1.6}
        .feto-landing .foot-col h4{font-size:12px;letter-spacing:.12em;text-transform:uppercase;color:var(--slate-dim);margin-bottom:18px}
        .feto-landing .foot-col a{display:block;font-size:14px;color:var(--mist);margin-bottom:12px;transition:color .2s}
        .feto-landing .foot-col a:hover{color:var(--gold)}
        .feto-landing .foot-bottom{display:flex;align-items:center;justify-content:space-between;padding-top:30px;border-top:1px solid var(--line-soft);flex-wrap:wrap;gap:14px}
        .feto-landing .foot-bottom p{font-size:13px;color:var(--slate-dim)}
        .feto-landing .foot-rtl{font-size:13px;color:var(--slate);direction:rtl}
        .feto-landing .reveal{opacity:0;transform:translateY(24px);transition:opacity .7s var(--ease),transform .7s var(--ease)}
        .feto-landing .reveal.in{opacity:1;transform:none}
        @media(prefers-reduced-motion:reduce){.feto-landing .reveal{opacity:1;transform:none;transition:none}.feto-landing *{animation:none!important}}
      `}</style>
    </div>
  );
}
