import "@fontsource/montserrat/500.css";
import "@fontsource/montserrat/600.css";
import "@fontsource/montserrat/700.css";
import "@fontsource/montserrat/800.css";
import "@fontsource/source-sans-3/400.css";
import "@fontsource/source-sans-3/600.css";
import "lenis/dist/lenis.css";
import "./styles.css";

import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

const params = new URLSearchParams(location.search);
const posterMode = params.has("poster");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const cleanups = [];

/* ---------- Navigation ---------- */
function initNav() {
  const nav = document.querySelector("[data-nav]");
  const toggle = document.querySelector("[data-menu-toggle]");
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 24);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  const close = () => { nav.classList.remove("is-open"); toggle.setAttribute("aria-expanded", "false"); };
  toggle.addEventListener("click", () => {
    const open = !nav.classList.contains("is-open");
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.querySelectorAll(".nav__links a").forEach((a) => a.addEventListener("click", close));
  const onKey = (e) => { if (e.key === "Escape" && nav.classList.contains("is-open")) { close(); toggle.focus(); } };
  document.addEventListener("keydown", onKey);
  cleanups.push(() => { window.removeEventListener("scroll", onScroll); document.removeEventListener("keydown", onKey); });
}

/* ---------- Smooth scroll (Lenis, the only engine) ---------- */
let lenis = null;
function initSmoothScroll() {
  if (reduceMotion) return;
  lenis = new Lenis({ lerp: 0.09, smoothWheel: true, wheelMultiplier: 0.95 });
  lenis.on("scroll", ScrollTrigger.update);
  const tick = (time) => lenis.raf(time * 1000);
  gsap.ticker.add(tick);
  gsap.ticker.lagSmoothing(0);
  document.querySelectorAll('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const el = id.length > 1 && document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: id === "#inicio" ? 0 : -80, duration: 1.2 });
      history.replaceState(null, "", id);
      if (id !== "#inicio") el.setAttribute("tabindex", "-1"), el.focus({ preventScroll: true });
    });
  });
  cleanups.push(() => { gsap.ticker.remove(tick); lenis.destroy(); lenis = null; });
}

/* ---------- Split words (accessible) ---------- */
function splitWords(el) {
  if (el.dataset.splitReady) return el.querySelectorAll(".split-word");
  const text = el.textContent.trim();
  el.setAttribute("aria-label", text);
  el.textContent = "";
  text.split(/(\s+)/).forEach((part) => {
    if (!part.trim()) { el.appendChild(document.createTextNode(" ")); return; }
    const mask = document.createElement("span");
    const word = document.createElement("span");
    mask.className = "split-word-mask";
    mask.setAttribute("aria-hidden", "true");
    word.className = "split-word";
    word.textContent = part;
    mask.appendChild(word);
    el.appendChild(mask);
  });
  el.dataset.splitReady = "true";
  return el.querySelectorAll(".split-word");
}

/* ---------- Preloader + hero intro ---------- */
function runIntro() {
  const loader = document.querySelector("[data-preloader]");
  const title = document.querySelector("[data-hero-title]");
  const items = document.querySelectorAll("[data-hero-item]");
  document.body.classList.remove("is-loading");
  if (reduceMotion || posterMode) { loader?.remove(); return; }

  const words = splitWords(title);
  gsap.set(words, { yPercent: 110 });
  gsap.set(items, { autoAlpha: 0, y: 24 });

  const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
  if (loader) {
    tl.to(".pl-draw", { strokeDashoffset: 0, duration: 0.9, ease: "power2.inOut", stagger: 0.12 })
      .to(loader, { yPercent: -100, duration: 0.8, ease: "power4.inOut", onComplete: () => loader.remove() }, "+=0.05");
  }
  tl.to(words, { yPercent: 0, duration: 1.0, stagger: 0.05 }, loader ? "-=0.35" : 0)
    .to(items, { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.08, ease: "power3.out" }, "<0.2");

  // Never let the loader trap the page.
  const failsafe = setTimeout(() => { if (loader?.isConnected) { loader.remove(); tl.progress(1); } }, 3500);
  cleanups.push(() => clearTimeout(failsafe));
}

/* ---------- Scroll reveals ---------- */
function initReveals() {
  const heads = gsap.utils.toArray("[data-split-reveal]");
  const items = gsap.utils.toArray("[data-reveal-item]");
  if (reduceMotion) return;
  heads.forEach((el) => {
    const words = splitWords(el);
    gsap.fromTo(words, { yPercent: 110 }, {
      yPercent: 0, duration: 1.0, ease: "power4.out", stagger: 0.045,
      scrollTrigger: { trigger: el, start: "top 85%", once: true },
    });
  });
  items.forEach((el) => {
    gsap.fromTo(el, { autoAlpha: 0, y: 36 }, {
      autoAlpha: 1, y: 0, duration: 1.0, ease: "power4.out",
      scrollTrigger: { trigger: el, start: "top 88%", once: true },
    });
  });
}

/* ---------- Discipline stack ---------- */
function initStack() {
  if (reduceMotion) return;
  const cards = gsap.utils.toArray("[data-stack-card]");
  cards.forEach((card, i) => {
    const next = cards[i + 1];
    if (!next) return;
    gsap.to(card, {
      scale: 0.92 + i * 0.012, autoAlpha: 0.55, ease: "none",
      scrollTrigger: { trigger: next, start: "top 80%", end: "top 20%", scrub: 1, invalidateOnRefresh: true },
    });
  });
}

/* ---------- Journey spiral ---------- */
function initJourney() {
  const section = document.querySelector("[data-journey]");
  const track = section.querySelector("[data-spiral-track]");
  const prog = section.querySelector("[data-spiral-progress]");
  const nodesG = section.querySelector("[data-spiral-nodes]");
  const modules = [...section.querySelectorAll("[data-module]")];
  const NS = "http://www.w3.org/2000/svg";
  const cx = 200, cy = 200, turns = 2.2, a0 = 10, R = 186;
  const Tm = turns * 2 * Math.PI, b = (R - a0) / Tm;
  const pt = (t) => [cx + (a0 + b * t) * Math.cos(t - Math.PI / 2), cy + (a0 + b * t) * Math.sin(t - Math.PI / 2)];
  let d = "";
  for (let i = 0; i <= 360; i++) { const p = pt((Tm * i) / 360); d += (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }
  track.setAttribute("d", d);
  prog.setAttribute("d", d);
  const len = track.getTotalLength();
  const fracs = [0.18, 0.36, 0.54, 0.72, 0.9];
  const nodes = fracs.map((f, i) => {
    const p = track.getPointAtLength(f * len);
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "spiral-node");
    const c = document.createElementNS(NS, "circle");
    c.setAttribute("cx", p.x); c.setAttribute("cy", p.y); c.setAttribute("r", 15);
    const t = document.createElementNS(NS, "text");
    t.setAttribute("x", p.x); t.setAttribute("y", p.y + 1); t.textContent = i;
    g.append(c, t); nodesG.appendChild(g);
    return g;
  });
  prog.style.strokeDasharray = len;

  const setProgress = (f) => {
    prog.style.strokeDashoffset = len * (1 - f);
    let active = -1;
    fracs.forEach((nf, i) => { if (f >= nf - 0.02) active = i; });
    nodes.forEach((n, i) => n.classList.toggle("is-on", i <= active));
    modules.forEach((m, i) => m.classList.toggle("is-on", i === Math.max(0, active)));
  };

  if (reduceMotion) { setProgress(1); modules.forEach((m) => m.classList.add("is-on")); return; }
  section.classList.add("is-enhanced");
  setProgress(0.05);
  ScrollTrigger.create({
    trigger: section.querySelector(".modules"),
    start: "top 70%",
    end: "bottom 55%",
    scrub: 0.8,
    onUpdate: (self) => setProgress(0.05 + self.progress * 0.9),
  });
}

/* ---------- Hero field (Three.js, lazy) ---------- */
async function initField() {
  const canvas = document.querySelector("[data-field]");
  if (!canvas || (reduceMotion && !posterMode)) return;
  const test = document.createElement("canvas");
  if (!(test.getContext("webgl2") || test.getContext("webgl"))) return;
  try {
    const { createField } = await import("./field.js");
    const field = createField(canvas, posterMode ? { stillTime: 6.5 } : {});
    if (field) cleanups.push(() => field.destroy());
    if (posterMode) document.documentElement.classList.add("poster-ready");
  } catch (e) {
    canvas.remove();
  }
}

/* ---------- Waitlist form ---------- */
function initForm() {
  const form = document.querySelector("[data-waitlist]");
  if (!form) return;
  const email = form.querySelector("#email");
  const err = form.querySelector("#email-error");
  const btn = form.querySelector("[data-submit]");
  const label = form.querySelector("[data-submit-label]");
  const status = form.querySelector("[data-status]");
  const valid = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
  const setStatus = (msg, kind) => { status.textContent = msg; status.className = "form__status" + (kind ? " is-" + kind : ""); };

  email.addEventListener("input", () => {
    if (email.getAttribute("aria-invalid") === "true" && valid(email.value)) { email.removeAttribute("aria-invalid"); err.hidden = true; }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (!valid(email.value)) {
      email.setAttribute("aria-invalid", "true"); err.hidden = false; email.focus();
      setStatus("", null);
      return;
    }
    btn.disabled = true; label.textContent = "Enviando…"; setStatus("", null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.value.trim(), perfil: form.perfil.value }),
      });
      if (res.ok) {
        form.reset();
        setStatus("Listo. Te escribiremos cuando abramos acceso para tu perfil.", "ok");
      } else if (res.status === 400) {
        email.setAttribute("aria-invalid", "true"); err.hidden = false;
        setStatus("Revisa el correo e inténtalo otra vez.", "error");
      } else {
        throw new Error(String(res.status));
      }
    } catch {
      setStatus("No pudimos guardar tu registro. Intenta de nuevo en unos minutos.", "error");
    } finally {
      btn.disabled = false; label.textContent = "Quiero acceso";
    }
  });
}

/* ---------- Boot ---------- */
function boot() {
  if (posterMode) document.documentElement.classList.add("poster-mode");
  initNav();
  initSmoothScroll();
  initReveals();
  initStack();
  initJourney();
  initForm();
  runIntro();
  initField();
  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  window.addEventListener("load", () => ScrollTrigger.refresh(), { once: true });
  document.querySelectorAll("img, video").forEach((m) => m.addEventListener("load", () => ScrollTrigger.refresh(), { once: true }));
}

window.addEventListener("pagehide", () => {
  cleanups.splice(0).forEach((fn) => fn());
  ScrollTrigger.getAll().forEach((t) => t.kill());
});

boot();
