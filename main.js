(() => {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ───────── Neural network canvas ───────── */
  const canvas = document.getElementById("neural");
  const ctx = canvas.getContext("2d");
  const mouse = { x: -9999, y: -9999 };
  let nodes = [];
  let w = 0, h = 0, dpr = 1;
  let running = true;

  const LINK = 140;
  const MOUSE_R = 180;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = canvas.clientWidth;
    h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const count = Math.min(110, Math.floor((w * h) / 13000));
    nodes = Array.from({ length: count }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 1.4 + 0.6,
      hue: Math.random(), // 0 → violet, 1 → teal
      phase: Math.random() * Math.PI * 2,
    }));
  }

  // violet (139,124,255) → teal (79,209,197)
  const mix = (t, a) =>
    `rgba(${Math.round(139 - 60 * t)},${Math.round(124 + 85 * t)},${Math.round(255 - 58 * t)},${a})`;

  function frame(t) {
    if (!running) return;
    ctx.clearRect(0, 0, w, h);

    for (const n of nodes) {
      n.x += n.vx;
      n.y += n.vy;
      if (n.x < 0 || n.x > w) n.vx *= -1;
      if (n.y < 0 || n.y > h) n.vy *= -1;

      // gentle pull toward the cursor
      const dx = mouse.x - n.x, dy = mouse.y - n.y;
      const d = Math.hypot(dx, dy);
      if (d < MOUSE_R && d > 1) {
        n.x += (dx / d) * 0.25;
        n.y += (dy / d) * 0.25;
      }
    }

    // edges
    for (let i = 0; i < nodes.length; i++) {
      const a = nodes[i];
      for (let j = i + 1; j < nodes.length; j++) {
        const b = nodes[j];
        const dx = a.x - b.x, dy = a.y - b.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < LINK * LINK) {
          const alpha = (1 - Math.sqrt(d2) / LINK) * 0.28;
          ctx.strokeStyle = mix((a.hue + b.hue) / 2, alpha);
          ctx.lineWidth = 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
      // edges to cursor
      const md = Math.hypot(a.x - mouse.x, a.y - mouse.y);
      if (md < MOUSE_R) {
        ctx.strokeStyle = mix(a.hue, (1 - md / MOUSE_R) * 0.5);
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.stroke();
      }
    }

    // nodes (softly "firing")
    for (const n of nodes) {
      const glow = 0.55 + 0.45 * Math.sin(t / 900 + n.phase);
      ctx.fillStyle = mix(n.hue, 0.5 + glow * 0.5);
      ctx.beginPath();
      ctx.arc(n.x, n.y, n.r + glow * 0.6, 0, Math.PI * 2);
      ctx.fill();
    }

    requestAnimationFrame(frame);
  }

  resize();
  window.addEventListener("resize", resize);

  const hero = document.querySelector(".hero");
  hero.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = e.clientX - r.left;
    mouse.y = e.clientY - r.top;
  });
  hero.addEventListener("pointerleave", () => { mouse.x = mouse.y = -9999; });

  if (reduceMotion) {
    running = true;
    frame(0);
    running = false;
  } else {
    // pause the canvas when the hero is off-screen
    new IntersectionObserver(([entry]) => {
      const was = running;
      running = entry.isIntersecting;
      if (running && !was) requestAnimationFrame(frame);
    }).observe(hero);
    requestAnimationFrame(frame);
  }

  /* ───────── Typed roles ───────── */
  const roles = ["ML Engineer", "AI Engineer", "Data Scientist"];
  const typed = document.getElementById("typed");
  if (!reduceMotion) {
    let ri = 0, ci = roles[0].length, deleting = true;
    const tick = () => {
      const word = roles[ri];
      ci += deleting ? -1 : 1;
      typed.textContent = word.slice(0, ci);
      let delay = deleting ? 45 : 85;
      if (!deleting && ci === word.length) { deleting = true; delay = 2200; }
      else if (deleting && ci === 0) { deleting = false; ri = (ri + 1) % roles.length; delay = 350; }
      setTimeout(tick, delay);
    };
    setTimeout(tick, 2600);
  }

  /* ───────── Reveal on scroll ───────── */
  const reveals = document.querySelectorAll(".reveal");
  // stagger siblings inside the same parent
  reveals.forEach((el) => {
    const sibs = [...el.parentElement.children].filter((c) => c.classList.contains("reveal"));
    el.style.setProperty("--d", `${Math.min(sibs.indexOf(el), 6) * 0.07}s`);
  });
  const io = new IntersectionObserver(
    (entries) => entries.forEach((e) => {
      if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
    }),
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  reveals.forEach((el) => io.observe(el));

  /* ───────── Counters ───────── */
  const counters = document.querySelectorAll("[data-count]");
  const cio = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = +el.dataset.count;
      const suffix = el.dataset.suffix || "";
      const start = performance.now();
      const dur = reduceMotion ? 0 : 1400;
      const step = (now) => {
        const p = dur ? Math.min((now - start) / dur, 1) : 1;
        el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))) + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.6 });
  counters.forEach((c) => cio.observe(c));

  /* ───────── Project filters ───────── */
  const cards = document.querySelectorAll(".card");
  document.querySelectorAll(".filter").forEach((btn) => {
    btn.addEventListener("click", () => {
      document.querySelector(".filter.active").classList.remove("active");
      btn.classList.add("active");
      const f = btn.dataset.filter;
      cards.forEach((card) => {
        const show = f === "all" || card.dataset.tags.split(" ").includes(f);
        if (show) {
          card.classList.remove("hide");
          requestAnimationFrame(() => card.classList.remove("fade"));
        } else {
          card.classList.add("fade");
          setTimeout(() => card.classList.contains("fade") && card.classList.add("hide"), 300);
        }
      });
    });
  });

  /* ───────── Card spotlight ───────── */
  cards.forEach((card) => {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${e.clientX - r.left}px`);
      card.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });

  /* ───────── Screenshot galleries (cycle on hover) ───────── */
  document.querySelectorAll("[data-gallery]").forEach((media) => {
    const srcs = media.dataset.gallery.split(",").map((s) => s.trim());
    if (srcs.length < 2) return;
    const base = media.querySelector("img");
    const next = base.cloneNode();
    next.classList.add("next");
    media.appendChild(next);
    const dots = document.createElement("div");
    dots.className = "gallery-dots";
    dots.innerHTML = srcs.map((_, i) => `<span class="${i ? "" : "on"}"></span>`).join("");
    media.appendChild(dots);

    let i = 0, timer;
    const show = (k) => {
      i = k;
      next.src = srcs[i];
      next.onload = () => {
        next.style.opacity = 1;
        setTimeout(() => { base.src = srcs[i]; next.style.opacity = 0; }, 600);
      };
      [...dots.children].forEach((d, j) => d.classList.toggle("on", j === i));
    };
    const card = media.closest(".card");
    card.addEventListener("pointerenter", () => {
      if (reduceMotion) return;
      show((i + 1) % srcs.length);
      timer = setInterval(() => show((i + 1) % srcs.length), 1800);
    });
    card.addEventListener("pointerleave", () => clearInterval(timer));
    // warm the cache so the first swap is instant
    srcs.slice(1).forEach((s) => { new Image().src = s; });
  });

  /* ───────── Cursor glow ───────── */
  const glow = document.querySelector(".cursor-glow");
  if (!reduceMotion) {
    let gx = 0, gy = 0, tx = 0, ty = 0;
    window.addEventListener("pointermove", (e) => { tx = e.clientX; ty = e.clientY; });
    const follow = () => {
      gx += (tx - gx) * 0.12;
      gy += (ty - gy) * 0.12;
      glow.style.transform = `translate(${gx}px, ${gy}px)`;
      requestAnimationFrame(follow);
    };
    follow();
  }

  /* ───────── Nav ───────── */
  const nav = document.getElementById("nav");
  const onScroll = () => nav.classList.toggle("scrolled", window.scrollY > 20);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  const toggle = document.getElementById("navToggle");
  const links = document.getElementById("navLinks");
  toggle.addEventListener("click", () => {
    const open = links.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open);
    document.body.style.overflow = open ? "hidden" : "";
  });
  links.querySelectorAll("a").forEach((a) =>
    a.addEventListener("click", () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    })
  );
})();
