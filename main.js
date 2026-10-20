/* Shalimar — page behaviour. Vanilla JS; GSAP + ScrollTrigger + Lenis from CDN
   are optional enhancements (the page works and reads without them). */
(() => {
  const root = document.documentElement;
  root.classList.remove("no-js");
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const desktop = () => window.matchMedia("(min-width: 1280px)").matches;

  /* ---------- Word splitting ---------- */
  document.querySelectorAll(".reveal-words").forEach((el) => {
    const words = el.textContent.trim().split(/\s+/);
    const base = Number(el.dataset.delay || 0) * 80;
    el.textContent = "";
    words.forEach((word, i) => {
      const mask = document.createElement("span");
      mask.className = "wm";
      const span = document.createElement("span");
      span.className = "w";
      span.style.setProperty("--i", i);
      span.style.setProperty("--base", `${base}ms`);
      span.textContent = word;
      mask.append(span);
      el.append(mask, i < words.length - 1 ? " " : "");
    });
  });

  const wordmark = document.querySelector("[data-wordmark]");
  if (wordmark) {
    const letters = [...wordmark.textContent];
    wordmark.textContent = "";
    letters.forEach((ch, i) => {
      const l = document.createElement("span");
      l.className = "l";
      l.style.setProperty("--i", i);
      l.textContent = ch;
      wordmark.append(l);
    });
  }

  /* ---------- Menu (static tabs + panels, rendered in the HTML for SEO) ---------- */
  const tabsBar = document.querySelector("[data-tabs]");
  const photo = document.querySelector("[data-menu-photo]");
  const pill = tabsBar && tabsBar.querySelector(".t-tabs-pill");
  const swapMs = () => parseFloat(getComputedStyle(root).getPropertyValue("--duration-fast")) || 250;

  const moveTo = (tab, animate) => {
    if (!pill || !tab) return;
    if (!animate) {
      const prev = pill.style.transition;
      pill.style.transition = "none";
      pill.style.transform = `translateX(${tab.offsetLeft - 3}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
      void pill.offsetWidth;
      pill.style.transition = prev;
    } else {
      pill.style.transform = `translateX(${tab.offsetLeft - 3}px)`;
      pill.style.width = `${tab.offsetWidth}px`;
    }
  };

  if (tabsBar) {
    const tabs = [...tabsBar.querySelectorAll(".t-tab")];
    const panelOf = (tab) => document.getElementById(tab.getAttribute("aria-controls"));
    const select = (tab, focus) => {
      if (tab.getAttribute("aria-selected") === "true") return;
      const current = tabs.find((t) => t.getAttribute("aria-selected") === "true");
      const from = current && panelOf(current);
      const to = panelOf(tab);
      tabs.forEach((t) => {
        const on = t === tab;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
      });
      if (focus) tab.focus();
      moveTo(tab, true);
      tab.scrollIntoView({ block: "nearest", inline: "nearest", behavior: reduce ? "auto" : "smooth" });
      if (from) from.classList.add("is-swapping");
      photo.classList.add("is-swapping");
      setTimeout(() => {
        if (from) { from.hidden = true; from.classList.remove("is-swapping"); }
        to.classList.add("is-swapping");
        to.hidden = false;
        photo.src = tab.dataset.photo;
        photo.alt = `${tab.textContent} at Shalimar Restaurant`;
        void to.offsetWidth;
        to.classList.remove("is-swapping");
        photo.classList.remove("is-swapping");
        if (window.ScrollTrigger) window.ScrollTrigger.refresh();
      }, swapMs());
    };
    tabs.forEach((tab, i) => {
      tab.addEventListener("click", () => select(tab, false));
      tab.addEventListener("keydown", (e) => {
        const step = { ArrowRight: 1, ArrowLeft: -1 }[e.key];
        if (e.key === "Home" || e.key === "End" || step) {
          e.preventDefault();
          const next = e.key === "Home" ? 0 : e.key === "End" ? tabs.length - 1 : (i + step + tabs.length) % tabs.length;
          select(tabs[next], true);
        }
      });
    });
    const active = () => tabs.find((t) => t.getAttribute("aria-selected") === "true") || tabs[0];
    requestAnimationFrame(() => moveTo(active(), false));
    window.addEventListener("resize", () => moveTo(active(), false));
    document.fonts && document.fonts.ready.then(() => moveTo(active(), false));
  }

  /* ---------- Featured plate: centred on the middle grid cell ---------- */
  const centrePlate = () => {
    const plate = document.querySelector(".featured__plate");
    const grid = document.querySelector(".featured__grid");
    if (!plate || !grid) return;
    plate.style.top = `${grid.offsetTop + grid.offsetHeight / 2 - plate.offsetHeight / 2}px`;
  };
  centrePlate();
  if (window.ResizeObserver) new ResizeObserver(centrePlate).observe(document.querySelector(".featured") || document.body);
  window.addEventListener("load", centrePlate);
  document.fonts && document.fonts.ready.then(centrePlate);

  /* ---------- Reveals on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  const startReveals = () => {
    document.querySelectorAll(".hero .fade-in, .hero .reveal-words").forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll(".hero").forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll(".reveal-words, .reveal-up, .fade-in, .reveal-fade, .reveal-img, .card, [data-wordmark], .bleed, .contact, .featured__plate").forEach((el) => io.observe(el));
  };
  document.querySelectorAll(".featured__grid .card").forEach((c, i) => c.style.setProperty("--d", i));

  /* ---------- Counters ---------- */
  const counterIO = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      counterIO.unobserve(e.target);
      const el = e.target;
      const to = Number(el.dataset.counter);
      const from = Number(el.dataset.from || 0);
      const suffix = el.dataset.suffix || "";
      if (reduce) { el.textContent = to + suffix; return; }
      const t0 = performance.now();
      const dur = 1400;
      const tick = (t) => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = Math.round(from + (to - from) * eased) + suffix;
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    });
  }, { threshold: 0.6 });
  document.querySelectorAll("[data-counter]").forEach((el) => counterIO.observe(el));

  /* ---------- Navigation ---------- */
  const nav = document.querySelector(".nav");
  const burger = nav.querySelector(".nav__burger");
  const panel = nav.querySelector(".nav__panel");
  const setOpen = (open) => {
    nav.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    burger.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    panel.setAttribute("aria-hidden", String(!open));
  };
  burger.addEventListener("click", () => setOpen(!nav.classList.contains("is-open")));
  panel.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setOpen(false)));
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") setOpen(false); });

  const year = document.querySelector("[data-year]");
  if (year) year.textContent = new Date().getFullYear();

  /* ---------- Smooth scroll + parallax (after libraries load) ---------- */
  let lenis = null;
  const initMotion = () => {
    if (reduce) return;
    if (window.Lenis) {
      lenis = new window.Lenis({ lerp: 0.1 });
      document.querySelectorAll('a[href^="#"]').forEach((a) => a.addEventListener("click", (e) => {
        const target = document.querySelector(a.getAttribute("href"));
        if (!target) return;
        e.preventDefault();
        lenis.scrollTo(target, { offset: 0 });
      }));
    }
    const { gsap, ScrollTrigger } = window;
    if (!gsap || !ScrollTrigger) {
      if (lenis) { const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); }; requestAnimationFrame(raf); }
      return;
    }
    gsap.registerPlugin(ScrollTrigger);
    if (lenis) {
      lenis.on("scroll", ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    }

    document.querySelectorAll(".parallax").forEach((el) => {
      const s = Number(el.dataset.speed || 0.15);
      const section = el.parentElement;
      const isHero = section.classList.contains("hero");
      gsap.fromTo(el, { yPercent: isHero ? 0 : -s * 40 }, { yPercent: s * 40, ease: "none", scrollTrigger: { trigger: section, start: isHero ? "top top" : "top bottom", end: "bottom top", scrub: true } });
    });
    // The kitchen is pinned (CSS sticky) on tablet and desktop: its photo
    // settles from a zoom and the copy drifts up as the section scrolls by.
    const kitchen = document.querySelector("#kitchen");
    const kitchenMedia = document.querySelector("[data-kitchen-media]");
    if (kitchen && kitchenMedia) {
      ScrollTrigger.matchMedia({
        "(min-width: 540px)": () => {
          gsap.fromTo(kitchenMedia, { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: kitchen, start: "top top", end: "bottom bottom", scrub: true } });
          gsap.fromTo(kitchen.querySelectorAll(".bleed__eyebrow, .bleed__body, .bleed__cta"), { y: 60 }, { y: -60, ease: "none", scrollTrigger: { trigger: kitchen, start: "top top", end: "bottom bottom", scrub: true } });
        },
      });
    }

    document.querySelectorAll(".parallax-inner").forEach((el) => {
      gsap.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });


    // Plate travels down behind the glass grid and turns with the page.
    const plate = document.querySelector(".featured__plate");
    if (plate) {
      const travel = () => document.querySelector(".featured").offsetHeight * 0.32;
      gsap.fromTo(plate, { y: () => -travel(), rotate: -60 }, {
        y: () => travel(), rotate: 120, ease: "none",
        scrollTrigger: { trigger: ".featured", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      });
      const ring = plate.querySelector(".featured__ring");
      if (ring) gsap.fromTo(ring, { rotate: 0 }, { rotate: -240, ease: "none", scrollTrigger: { trigger: ".featured", start: "top bottom", end: "bottom top", scrub: true } });
    }
  };

  /* ---------- Start ---------- */
  // Reveals start at once; smooth scroll and parallax wait for the CDN scripts
  // (deferred after this file, so they have run by DOMContentLoaded).
  startReveals();
  // This file is deferred, so it always runs before DOMContentLoaded fires.
  document.addEventListener("DOMContentLoaded", initMotion);
})();
