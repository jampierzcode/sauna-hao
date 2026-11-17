// ===== Sauna Hao =====
const CONFIG = {
  whatsapp: '51960803660',
  saludo: 'Hola Sauna Hao 👋 vi su página web y quisiera más información.',
  abre: 12, cierra: 22, // horario Lima
};

const waLink = (t) => `https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(t)}`;
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];

// --- WhatsApp links
$$('[data-wa]').forEach((a) => { a.href = waLink(CONFIG.saludo); a.target = '_blank'; a.rel = 'noopener'; });

// --- Año
$$('[data-year]').forEach((el) => (el.textContent = new Date().getFullYear()));

// --- Hora de Lima
const limaNow = () => {
  const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Lima', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hour12: false })
    .formatToParts(new Date()).map((x) => [x.type, x.value]));
  return { date: `${p.year}-${p.month}-${p.day}`, h: +p.hour % 24, m: +p.minute };
};

// --- Abierto / cerrado
const status = $('[data-status]');
const paintStatus = () => {
  if (!status) return;
  const { h } = limaNow();
  const open = h >= CONFIG.abre && h < CONFIG.cierra;
  status.classList.toggle('is-closed', !open);
  status.querySelector('span').textContent = open ? 'Abierto ahora · hasta las 10 pm' : 'Hoy abrimos a las 12 pm';
};
paintStatus(); setInterval(paintStatus, 60000);

// --- Nav al hacer scroll
const nav = $('[data-nav]');
addEventListener('scroll', () => nav.classList.toggle('is-scrolled', scrollY > 30), { passive: true });

// --- Formulario de reserva -> WhatsApp
const form = $('[data-booking]');
const service = $('[data-service]');
const dateInput = $('[data-date]');
if (dateInput) { const t = limaNow().date; dateInput.min = t; dateInput.value = t; }

$$('[data-pick]').forEach((a) => a.addEventListener('click', () => { service.value = a.dataset.pick; }));

$$('[data-step]').forEach((b) => b.addEventListener('click', () => {
  const i = b.parentElement.querySelector('input');
  i.value = Math.min(20, Math.max(1, (+i.value || 1) + +b.dataset.step));
}));

form?.addEventListener('submit', (e) => {
  e.preventDefault();
  const d = Object.fromEntries(new FormData(form));
  const fecha = new Date(`${d.fecha}T12:00`).toLocaleDateString('es-PE', { weekday: 'long', day: 'numeric', month: 'long' });
  const [hh, mm] = d.hora.split(':'); const h12 = ((+hh + 11) % 12) + 1;
  const msg = [
    `Hola Sauna Hao 👋 quiero hacer una reserva:`,
    ``,
    `👤 Nombre: ${d.nombre}`,
    `✨ Servicio: ${d.servicio}`,
    `📅 Fecha: ${fecha}`,
    `🕐 Hora: ${h12}:${mm} ${+hh < 12 ? 'am' : 'pm'}`,
    `👥 Personas: ${d.personas}`,
    ``,
    `¿Tienen disponibilidad?`,
  ].join('\n');
  window.open(waLink(msg), '_blank', 'noopener');
});

// --- Tip del botón de WhatsApp
const wa = $('.wa-float');
setTimeout(() => { wa?.classList.add('is-open'); setTimeout(() => wa?.classList.remove('is-open'), 4500); }, 7000);

// ===== Vapor (canvas) =====
function steam(canvas) {
  const ctx = canvas.getContext('2d');
  let w, h, dpr, parts = [], running = true, raf;
  const resize = () => {
    dpr = Math.min(devicePixelRatio || 1, 1.5);
    w = canvas.width = canvas.offsetWidth * dpr; h = canvas.height = canvas.offsetHeight * dpr;
  };
  const make = (initial) => ({
    x: Math.random() * w, y: initial ? Math.random() * h : h + Math.random() * h * .3,
    r: (90 + Math.random() * 220) * dpr, vy: (.25 + Math.random() * .55) * dpr,
    vx: (Math.random() - .5) * .3 * dpr, a: 0, max: .05 + Math.random() * .09, t: Math.random() * 1000,
  });
  resize(); addEventListener('resize', resize);
  const count = innerWidth < 700 ? 14 : 26;
  for (let i = 0; i < count; i++) parts.push(make(true));
  const tick = () => {
    ctx.clearRect(0, 0, w, h);
    for (const p of parts) {
      p.t += .01; p.y -= p.vy; p.x += p.vx + Math.sin(p.t) * .4 * dpr;
      const life = p.y / h; p.a = Math.min(p.max, p.a + .002) * Math.min(1, life * 1.4);
      if (p.y + p.r < 0) Object.assign(p, make(false));
      const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
      g.addColorStop(0, `rgba(220,235,255,${p.a})`); g.addColorStop(1, 'rgba(220,235,255,0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
    }
    if (running) raf = requestAnimationFrame(tick);
  };
  tick();
  new IntersectionObserver(([en]) => {
    if (en.isIntersecting && !running) { running = true; tick(); }
    else if (!en.isIntersecting) { running = false; cancelAnimationFrame(raf); }
  }).observe(canvas);
}

// ===== Motion =====
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

window.addEventListener('DOMContentLoaded', () => {
  if (reduce || !window.gsap || !window.ScrollTrigger) {
    document.documentElement.classList.add('no-motion');
    return;
  }
  document.documentElement.classList.add('js-motion');
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Scroll suave
  let lenis;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.09 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach((a) => a.addEventListener('click', (e) => {
      const id = a.getAttribute('href'); if (id.length < 2) return;
      const el = $(id); if (!el) return;
      e.preventDefault(); lenis.scrollTo(el, { offset: -70 });
    }));
  }

  steam($('[data-steam]'));

  // --- Intro + hero
  const split = SplitText.create('[data-split]', { type: 'words', mask: 'words' });
  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
  tl.from('.intro__logo', { scale: .7, autoAlpha: 0, duration: .9 })
    .to('.intro__logo', { scale: 1.15, autoAlpha: 0, duration: .7, ease: 'power2.in' }, '+=.35')
    .to('.intro', { autoAlpha: 0, duration: .6 }, '-=.35')
    .from('.hero__bg img', { scale: 1.3, duration: 2.2 }, '-=.6')
    .from(split.words, { yPercent: 110, duration: 1.1, stagger: .055 }, '-=1.9')
    .from('[data-hero-in]', { autoAlpha: 0, y: 30, duration: 1, stagger: .12 }, '-=.8');

  // Hero parallax
  gsap.to('[data-hero-bg] img', { yPercent: 12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero__content', { yPercent: -15, autoAlpha: .2, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });

  // --- Marquee reacciona a la velocidad del scroll
  const track = $('[data-marquee]');
  ScrollTrigger.create({ onUpdate: (s) => { track.style.animationDuration = `${Math.max(10, 38 - Math.abs(s.getVelocity()) / 60)}s`; } });

  // --- Reveals genéricos
  $$('[data-reveal]').forEach((el) => gsap.from(el, { autoAlpha: 0, y: 40, duration: 1.1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 88%', once: true } }));
  $$('[data-stagger]').forEach((el) => gsap.from(el.children, { autoAlpha: 0, y: 28, duration: .9, ease: 'power3.out', stagger: .08, scrollTrigger: { trigger: el, start: 'top 85%', once: true } }));

  // --- Imágenes con cortina
  $$('[data-clip]').forEach((fig) => {
    const t = gsap.timeline({ scrollTrigger: { trigger: fig, start: 'top 85%', once: true } });
    t.from(fig, { clipPath: 'inset(100% 0% 0% 0% round 22px)', duration: 1.4, ease: 'expo.inOut' })
      .from(fig.querySelector('img'), { scale: 1.35, duration: 1.8, ease: 'expo.out' }, '-=1.1');
  });

  // --- Frase "señal" palabra por palabra con scroll
  const sig = SplitText.create('[data-words]', { type: 'words' });
  gsap.from(sig.words, { opacity: .12, stagger: .1, ease: 'none', scrollTrigger: { trigger: '.signal', start: 'top 70%', end: 'center 45%', scrub: true } });

  // --- Circuito: scroll horizontal fijado (desktop)
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px)', () => {
    const tr = $('[data-track]');
    const dist = () => tr.scrollWidth - innerWidth;
    const tween = gsap.to(tr, {
      x: () => -dist(), ease: 'none',
      scrollTrigger: { trigger: '[data-circuit]', pin: '.circuit__pin', start: 'top top', end: () => `+=${dist()}`, scrub: 1, invalidateOnRefresh: true },
    });
    gsap.to('[data-progress]', { scaleX: 1, ease: 'none', scrollTrigger: { trigger: '[data-circuit]', start: 'top top', end: () => `+=${dist()}`, scrub: true } });
    $$('.room img', tr).forEach((img) => gsap.fromTo(img, { xPercent: -8, scale: 1.15 }, { xPercent: 8, ease: 'none', scrollTrigger: { trigger: img.parentElement, containerAnimation: tween, start: 'left right', end: 'right left', scrub: true } }));
  });
  mm.add('(max-width: 899px)', () => {
    gsap.from('.room', { autoAlpha: 0, x: 60, duration: 1, stagger: .1, ease: 'power3.out', scrollTrigger: { trigger: '[data-track]', start: 'top 85%', once: true } });
  });

  // --- Footer gigante
  gsap.from('.footer__big', { yPercent: 40, autoAlpha: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 90%', once: true } });

  // --- Interacciones con mouse (solo puntero fino)
  if (matchMedia('(pointer: fine)').matches) {
    $$('.magnetic').forEach((b) => {
      const xTo = gsap.quickTo(b, 'x', { duration: .5, ease: 'power3' }), yTo = gsap.quickTo(b, 'y', { duration: .5, ease: 'power3' });
      b.addEventListener('pointermove', (e) => { const r = b.getBoundingClientRect(); xTo((e.clientX - r.left - r.width / 2) * .25); yTo((e.clientY - r.top - r.height / 2) * .35); });
      b.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
    });
    $$('[data-tilt]').forEach((c) => {
      c.addEventListener('pointermove', (e) => { const r = c.getBoundingClientRect(); const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; gsap.to(c, { rotateY: x * 12, rotateX: -y * 12, duration: .5, ease: 'power2.out' }); });
      c.addEventListener('pointerleave', () => gsap.to(c, { rotateX: 0, rotateY: 0, duration: .8, ease: 'elastic.out(1,.5)' }));
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
});
