/* =====================================================
   ABOUT PAGE  (loads AFTER index.js)
   index.js already handles: navbar scroll state, progress line,
   reveal-on-scroll, headline word animation, back-to-top, footer year.
   ===================================================== */

// ===== Mission / Vision / Promise tabs =====
(function () {
  var tabs = [].slice.call(document.querySelectorAll('.ab-tab'));
  var panels = [].slice.call(document.querySelectorAll('.ab-panel'));
  if (!tabs.length || tabs.length !== panels.length) return;

  function select(tab, focus) {
    tabs.forEach(function (t, i) {
      var on = t === tab;
      t.setAttribute('aria-selected', on ? 'true' : 'false');
      t.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
      panels[i].classList.toggle('is-active', on);
    });
    if (focus) tab.focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener('click', function () { select(tab, false); });

    // Arrow keys / Home / End move between tabs
    tab.addEventListener('keydown', function (e) {
      var to = null;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') to = tabs[(i + 1) % tabs.length];
      else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') to = tabs[(i - 1 + tabs.length) % tabs.length];
      else if (e.key === 'Home') to = tabs[0];
      else if (e.key === 'End') to = tabs[tabs.length - 1];
      if (to) { e.preventDefault(); select(to, true); }
    });
  });

  select(tabs[0], false);
})();

// ===== Story image: tilts slightly toward the pointer =====
(function () {
  var visual = document.querySelector('.about-visual');
  var frame = visual && visual.querySelector('.about-frame');
  if (!frame) return;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!window.matchMedia('(hover: hover)').matches) return;

  visual.addEventListener('pointermove', function (e) {
    var r = visual.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;   // -0.5 .. 0.5
    var y = (e.clientY - r.top) / r.height - 0.5;
    frame.style.setProperty('--rx', (x * 8).toFixed(2) + 'deg');
    frame.style.setProperty('--ry', (-y * 8).toFixed(2) + 'deg');
  });

  visual.addEventListener('pointerleave', function () {
    frame.style.setProperty('--rx', '0deg');
    frame.style.setProperty('--ry', '0deg');
  });
})();