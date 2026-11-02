/* =====================================================
   PORTFOLIO PAGE  (loads AFTER index.js)
   index.js already handles: navbar scroll state, progress line,
   reveal-on-scroll, headline word animation, back-to-top, footer year.
   ===================================================== */

(function () {
  var items = [].slice.call(document.querySelectorAll('.pf-item'));
  var chips = [].slice.call(document.querySelectorAll('.pf-chip'));
  var empty = document.getElementById('pfEmpty');
  if (!items.length || !chips.length) return;

  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ===== Category filter =====
  // Fill the little count badge on each chip
  chips.forEach(function (chip) {
    var f = chip.getAttribute('data-filter');
    var n = f === 'all' ? items.length : items.filter(function (i) { return i.getAttribute('data-category') === f; }).length;
    var badge = chip.querySelector('.pf-count');
    if (badge) badge.textContent = n;
  });

  function applyFilter(filter, instant) {
    chips.forEach(function (chip) {
      var on = chip.getAttribute('data-filter') === filter;
      chip.classList.toggle('is-active', on);
      chip.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    var shown = 0;
    items.forEach(function (item) {
      var match = filter === 'all' || item.getAttribute('data-category') === filter;
      clearTimeout(item._hideTimer);

      if (match) {
        // matching cards come back one after another
        if (!instant) item.style.setProperty('--d', (shown * 0.05).toFixed(2) + 's');
        shown++;
        if (item.classList.contains('d-none')) {
          item.classList.remove('d-none');
          void item.offsetWidth; // let the browser paint it before animating in
        }
        if (!instant) item.classList.add('is-visible');
        item.classList.remove('is-out');
      } else {
        if (!instant) item.style.setProperty('--d', '0s');
        item.classList.add('is-out');
        if (instant || reduce) item.classList.add('d-none');
        else item._hideTimer = setTimeout(function () { item.classList.add('d-none'); }, 400);
      }
    });

    if (empty) empty.hidden = shown > 0;
  }

  function setUrl(filter) {
    try {
      var url = filter === 'all' ? location.pathname : location.pathname + '?category=' + filter;
      history.replaceState(null, '', url);
    } catch (e) { /* file:// or restricted contexts: ignore */ }
  }

  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var filter = chip.getAttribute('data-filter');
      applyFilter(filter, false);
      setUrl(filter);
    });
  });

  // Arriving from another page with ?category=websites (etc.)
  var wanted = new URLSearchParams(location.search).get('category');
  var valid = chips.some(function (c) { return c.getAttribute('data-filter') === wanted; });
  applyFilter(valid ? wanted : 'all', true);

  // ===== Project modal =====
  var modalEl = document.getElementById('projectModal');
  if (!modalEl) return;

  var media = modalEl.querySelector('.pf-media');
  var img = document.getElementById('pfImg');
  var kicker = document.getElementById('pfKicker');
  var title = document.getElementById('projectModalTitle');
  var desc = document.getElementById('pfDesc');
  var tags = document.getElementById('pfTags');
  var counter = document.getElementById('pfCounter');
  var prev = document.getElementById('pfPrev');
  var next = document.getElementById('pfNext');

  var list = [];
  var index = 0;

  function visibleCards() {
    return items
      .filter(function (i) { return !i.classList.contains('d-none') && !i.classList.contains('is-out'); })
      .map(function (i) { return i.querySelector('.pf-card'); });
  }

  function fill(card, animate) {
    var set = function () {
      img.src = card.getAttribute('data-img');
      img.alt = card.getAttribute('data-alt') || card.getAttribute('data-title');
      kicker.textContent = card.getAttribute('data-label');
      title.textContent = card.getAttribute('data-title');
      desc.textContent = card.getAttribute('data-desc');
      tags.innerHTML = '';
      (card.getAttribute('data-tags') || '').split(',').forEach(function (t) {
        t = t.trim();
        if (!t) return;
        var li = document.createElement('li');
        li.textContent = t;
        tags.appendChild(li);
      });
      counter.textContent = (index + 1) + ' / ' + list.length;
    };

    if (!animate || reduce) { set(); return; }
    media.classList.add('is-swapping');
    setTimeout(function () {
      set();
      var done = function () { media.classList.remove('is-swapping'); };
      if (img.complete) done(); else img.onload = done;
    }, 250);
  }

  function step(dir) {
    if (list.length < 2) return;
    index = (index + dir + list.length) % list.length;
    fill(list[index], true);
  }

  modalEl.addEventListener('show.bs.modal', function (e) {
    list = visibleCards();
    index = Math.max(0, list.indexOf(e.relatedTarget));
    fill(list[index], false);
    var many = list.length > 1;
    prev.hidden = next.hidden = counter.hidden = !many;
  });

  prev.addEventListener('click', function () { step(-1); });
  next.addEventListener('click', function () { step(1); });

  document.addEventListener('keydown', function (e) {
    if (!modalEl.classList.contains('show')) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });
})();