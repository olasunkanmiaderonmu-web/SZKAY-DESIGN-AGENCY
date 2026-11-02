// ===== Navbar behaviour: condense + shadow on scroll, and scroll progress line =====
(function () {
  var header = document.querySelector('.site-header');
  if (!header) return;

  var ticking = false;

  function update() {
    var scrollY = window.scrollY || window.pageYOffset;
    var maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    var progress = maxScroll > 0 ? Math.min(scrollY / maxScroll, 1) : 0;

    header.classList.toggle('is-scrolled', scrollY > 30);
    header.style.setProperty('--progress', progress.toFixed(4));
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(update);
      ticking = true;
    }
  }

  update();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
})();

// ===== Scroll reveal for page sections =====
(function () {
  var root = document.documentElement;
  var items = document.querySelectorAll('[data-reveal]');
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();
  if (!('IntersectionObserver' in window)) return;
  root.classList.add('js');
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.15, rootMargin: '0px 0px -40px 0px' });
  items.forEach(function (el) { io.observe(el); });
})();


// ===== Hero logo: cut the icon into tiles and assemble it piece by piece =====
(function () {
  var stage = document.getElementById('logoStage');
  var navLogo = document.querySelector('.logo-img');
  if (!stage || !navLogo) return;

  var src = navLogo.getAttribute('src');
  var N = 6, tiles = [], busy = false;
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var rnd = function (n) { return (Math.random() - 0.5) * n; };

  function scatter() {
    stage.classList.remove('is-assembled');
    tiles.forEach(function (t) {
      t.style.transitionDelay = '0s';
      t.style.setProperty('--x', rnd(700) + 'px');
      t.style.setProperty('--y', rnd(700) + 'px');
      t.style.setProperty('--r', rnd(600) + 'deg');
      t.style.setProperty('--s', (0.2 + Math.random() * 1.5).toFixed(2));
    });
  }

  function assemble() {
    tiles.forEach(function (t) {
      t.style.transitionDelay = (Math.random() * 0.7 + t.dataset.order * 0.025).toFixed(2) + 's';
    });
    void stage.offsetWidth; // make sure the scattered state is painted first
    stage.classList.add('is-assembled');
  }

  function replay() {
    if (busy || reduce) return;
    busy = true;
    scatter();
    setTimeout(assemble, 900);
    setTimeout(function () { busy = false; }, 3200);
  }

  var img = new Image();
  img.onload = function () {
    stage.style.setProperty('--ar', img.naturalWidth / img.naturalHeight);
    stage.style.setProperty('--img', 'url("' + src + '")');
    for (var r = 0; r < N; r++) {
      for (var c = 0; c < N; c++) {
        var t = document.createElement('span');
        t.className = 'tile';
        t.dataset.order = r + c;
        t.style.left = (c / N * 100) + '%';
        t.style.top = (r / N * 100) + '%';
        t.style.width = 'calc(' + (100 / N) + '% + 1px)';
        t.style.height = 'calc(' + (100 / N) + '% + 1px)';
        t.style.backgroundSize = (N * 100) + '% ' + (N * 100) + '%';
        t.style.backgroundPosition = (c / (N - 1) * 100) + '% ' + (r / (N - 1) * 100) + '%';
        stage.appendChild(t);
        tiles.push(t);
      }
    }
    if (reduce) { stage.classList.add('is-assembled'); return; }
    scatter();
    setTimeout(assemble, 700);
    setInterval(replay, 12000);
    stage.addEventListener('click', replay);
    stage.addEventListener('mouseenter', replay);
  };
  img.src = src;
})();

// ===== Back-to-top button =====
(function () {
  var btn = document.getElementById('toTop');
  if (!btn) return;
  window.addEventListener('scroll', function () {
    btn.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// ===== Hero headline: wrap each word so it can rise in one by one =====
(function () {
  var title = document.querySelector('.hero-title');
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  var words = title.textContent.trim().split(/\s+/);
  title.setAttribute('aria-label', title.textContent.trim());
  title.innerHTML = words.map(function (w, i) {
    return '<span class="word" aria-hidden="true" style="--i:' + i + '">' + w + '</span>';
  }).join(' ');
})();

// ===== Hero parallax: the graphic drifts slightly with the pointer =====
(function () {
  var hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  hero.addEventListener('pointermove', function (e) {
    var r = hero.getBoundingClientRect();
    hero.style.setProperty('--px', ((e.clientX - r.left) / r.width - 0.5) * 2);
    hero.style.setProperty('--py', ((e.clientY - r.top) / r.height - 0.5) * 2);
  });
  hero.addEventListener('pointerleave', function () {
    hero.style.setProperty('--px', 0);
    hero.style.setProperty('--py', 0);
  });
})();

// ===== Cards: light follows the cursor =====
(function () {
  document.querySelectorAll('.card-x').forEach(function (card) {
    card.addEventListener('pointermove', function (e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      card.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();

// ===== Buttons: slight magnetic pull toward the cursor =====
(function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  document.querySelectorAll('.btn-fill, .nav-cta').forEach(function (btn) {
    btn.addEventListener('pointermove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.18;
      var y = (e.clientY - r.top - r.height / 2) * 0.3;
      btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + (y - 2).toFixed(1) + 'px)';
    });
    btn.addEventListener('pointerleave', function () { btn.style.transform = ''; });
  });
})();