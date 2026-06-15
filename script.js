/* BAN Coffee House — tasteful, 60fps motion. transform/opacity only. */
(function () {
  "use strict";

  var reduce = window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---- 1. Sticky condensing header (rAF-throttled scroll) ---- */
  var nav = document.querySelector("[data-nav]");
  if (nav) {
    var stuck = false;
    var ticking = false;
    function syncNav() {
      var shouldStick = window.scrollY > 40;
      if (shouldStick !== stuck) {
        stuck = shouldStick;
        nav.classList.toggle("is-stuck", stuck);
      }
      ticking = false;
    }
    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(syncNav);
      }
    }, { passive: true });
    syncNav();
  }

  /* If reduced motion: stop here, CSS already shows everything. */
  if (reduce || !("IntersectionObserver" in window)) {
    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      el.classList.add("is-in");
    });
    return;
  }

  /* ---- 2. Scroll reveal (fade + rise), with optional stagger delay ---- */
  var revealObs = new IntersectionObserver(function (entries, obs) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      var el = entry.target;
      var delay = parseInt(el.getAttribute("data-reveal-delay") || "0", 10);
      if (delay) el.style.transitionDelay = delay + "ms";
      el.classList.add("is-in");
      obs.unobserve(el);
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -8% 0px" });

  document.querySelectorAll("[data-reveal]").forEach(function (el) {
    revealObs.observe(el);
  });

  /* ---- 3. Gallery + hero parallax (transform only, rAF batched) ---- */
  var parallaxEls = Array.prototype.slice.call(
    document.querySelectorAll("[data-parallax]")
  );
  var hero = document.querySelector(".hero__photo");
  var active = [];

  var inViewObs = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      var el = entry.target;
      var i = active.indexOf(el);
      if (entry.isIntersecting && i === -1) active.push(el);
      else if (!entry.isIntersecting && i !== -1) active.splice(i, 1);
    });
    requestParallax();
  }, { threshold: 0 });

  parallaxEls.forEach(function (el) { inViewObs.observe(el); });

  var pTicking = false;
  function requestParallax() {
    if (!pTicking) { pTicking = true; requestAnimationFrame(updateParallax); }
  }
  function updateParallax() {
    pTicking = false;
    var vh = window.innerHeight;
    // gallery: subtle drift on the image inside each figure
    for (var n = 0; n < active.length; n++) {
      var el = active[n];
      var r = el.getBoundingClientRect();
      var progress = (r.top + r.height / 2 - vh / 2) / vh; // ~ -1..1
      // wait until the reveal transition has finished before driving parallax,
      // so the inline transform doesn't override the fade+rise reveal
      if (!el.classList.contains("is-in")) continue;
      var shift = Math.max(-14, Math.min(14, -progress * 14));
      // drift the figure itself so the img keeps its own hover-scale transform
      el.style.transform = "translate3d(0," + shift.toFixed(2) + "px,0)";
    }
    // hero photo: gentle lift as you leave the top
    if (hero) {
      var hShift = Math.max(0, Math.min(40, window.scrollY * 0.06));
      hero.style.transform = "translate3d(0,-" + hShift.toFixed(2) + "px,0)";
    }
  }
  window.addEventListener("scroll", requestParallax, { passive: true });
  window.addEventListener("resize", requestParallax, { passive: true });
  requestParallax();
})();
