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

  // ===== Project pop-up: shows ONE project, and the arrows move through ITS images =====
  var modalEl = document.getElementById('projectModal');
  if (!modalEl) return;

  var media = modalEl.querySelector('.pf-media');
  var img = document.getElementById('pfImg');
  var caption = document.getElementById('pfCaption');
  var kicker = document.getElementById('pfKicker');
  var title = document.getElementById('projectModalTitle');
  var desc = document.getElementById('pfDesc');
  var tags = document.getElementById('pfTags');
  var counter = document.getElementById('pfCounter');
  var prev = document.getElementById('pfPrev');
  var next = document.getElementById('pfNext');
  var cta = document.getElementById('pfCta');
  // project category -> value of the Service menu on the contact form
  var serviceFor = {
    'websites': 'website-development',
    'brand-identity': 'brand-identity',
    'flyers': 'flyer-designs',
    'social-media': 'social-media-design',
    'digital-products': 'digital-products'
  };

  var slides = [];   // the images of the project that is open
  var current = 0;   // which slide is showing
  var token = 0;     // makes sure fast clicks never leave the image half-faded

  // Reads the slides from the <img> tags inside the card's <div class="pf-slides">
  function readSlides(card) {
    var out = [].map.call(card.querySelectorAll('.pf-slides img'), function (n) {
      return {
        src: n.getAttribute('src'),
        alt: n.getAttribute('alt') || '',
        caption: n.getAttribute('data-caption') || ''
      };
    });
    if (!out.length) {  // no slides listed: fall back to the card's own image
      var thumb = card.querySelector('.work-thumb img');
      if (thumb) out.push({ src: thumb.getAttribute('src'), alt: thumb.getAttribute('alt') || '', caption: '' });
    }
    return out;
  }

  // Project details: filled ONCE when the pop-up opens and never touched by the arrows
  function fillDetails(card) {
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
    var cat = card.closest('.pf-item').getAttribute('data-category');
    cta.href = 'contact.html?service=' + (serviceFor[cat] || 'other');

    var fit = card.getAttribute('data-fit') === 'contain' ? 'contain' : 'cover';
    media.style.setProperty('--pf-fit', fit);
    media.style.setProperty('--pf-ratio', fit === 'contain' ? '16 / 9' : '4 / 3');
  }

  // Only the image (and its small label + counter) changes
  function showSlide(i, animate) {
    var s = slides[i];
    var t = ++token;

    var apply = function () {
      if (t !== token) return;
      var done = function () { if (t === token) media.classList.remove('is-swapping'); };
      img.onload = done;
      img.onerror = done;
      img.src = s.src;
      img.alt = s.alt;
      caption.textContent = s.caption;
      caption.hidden = !s.caption;
      counter.textContent = (i + 1) + ' / ' + slides.length;
      if (img.complete) done();
    };

    if (!animate || reduce) { apply(); return; }
    media.classList.add('is-swapping');
    setTimeout(apply, 250);
  }

  function step(dir) {
    if (slides.length < 2) return;
    current = (current + dir + slides.length) % slides.length;
    showSlide(current, true);
  }

  modalEl.addEventListener('show.bs.modal', function (e) {
    var card = e.relatedTarget && e.relatedTarget.closest('.pf-card');
    if (!card) return;
    slides = readSlides(card);
    current = 0;
    fillDetails(card);
    showSlide(0, false);
    slides.forEach(function (s) { new Image().src = s.src; });  // warm up the other images

    var many = slides.length > 1;
    prev.hidden = next.hidden = counter.hidden = !many;
  });

  prev.addEventListener('click', function () { step(-1); });
  next.addEventListener('click', function () { step(1); });

  document.addEventListener('keydown', function (e) {
    if (!modalEl.classList.contains('show')) return;
    if (e.key === 'ArrowLeft') step(-1);
    if (e.key === 'ArrowRight') step(1);
  });

  // Swipe left / right on the image (phones and tablets)
  var startX = null;
  media.addEventListener('touchstart', function (e) { startX = e.changedTouches[0].clientX; }, { passive: true });
  media.addEventListener('touchend', function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX;
    startX = null;
    if (Math.abs(dx) > 50) step(dx < 0 ? 1 : -1);
  }, { passive: true });
})();