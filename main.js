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
      const span = document.createElement("span");
      span.className = "w";
      span.style.setProperty("--i", i);
      span.style.setProperty("--base", `${base}ms`);
      span.textContent = word;
      el.append(span, i < words.length - 1 ? " " : "");
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

  /* ---------- Reveals on scroll ---------- */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("is-in"); io.unobserve(e.target); }
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  const startReveals = () => {
    document.querySelectorAll(".hero .fade-in").forEach((el) => el.classList.add("is-in"));
    document.querySelectorAll(".reveal-words, .reveal-up, .fade-in, .reveal-fade, .card, [data-wordmark]").forEach((el) => io.observe(el));
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

  /* ---------- Reservation form → WhatsApp ---------- */
  const form = document.querySelector("[data-reserve]");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll("input[required]").forEach((input) => {
      const bad = !input.value.trim();
      input.closest(".field").classList.toggle("is-error", bad);
      if (bad && ok) { input.focus(); ok = false; }
    });
    if (!ok) return;
    const d = new FormData(form);
    const msg = `Hello Shalimar, I'd like to reserve a table.\nName: ${d.get("name")}\nPhone: ${d.get("phone")}${d.get("guests") ? `\nGuests: ${d.get("guests")}` : ""}`;
    window.open(`https://wa.me/966549196656?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
  });

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
    document.querySelectorAll(".parallax-inner").forEach((el) => {
      gsap.fromTo(el, { yPercent: -5 }, { yPercent: 5, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true } });
    });

    // Wordmark: alternating letters climb at different rates.
    if (wordmark) {
      wordmark.querySelectorAll(".l").forEach((l, i) => {
        gsap.to(l, { y: () => (i % 2 ? -0.16 : -0.06) * l.offsetHeight, ease: "none", scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true } });
      });
    }

    // Plate travels behind the glass grid and turns with the page.
    const plate = document.querySelector(".featured__plate");
    if (plate) {
      gsap.fromTo(plate, { y: () => -plate.offsetHeight * 0.6, rotate: -40 }, {
        y: () => document.querySelector(".featured").offsetHeight - plate.offsetHeight * 0.4,
        rotate: 160, ease: "none",
        scrollTrigger: { trigger: ".featured", start: "top bottom", end: "bottom top", scrub: true, invalidateOnRefresh: true },
      });
      const ring = plate.querySelector(".featured__ring");
      if (ring) gsap.fromTo(ring, { rotate: 0 }, { rotate: -260, ease: "none", scrollTrigger: { trigger: ".featured", start: "top bottom", end: "bottom top", scrub: true } });
    }
  };

  /* ---------- Start ---------- */
  startReveals();
  initMotion();
})();
