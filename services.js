/* =====================================================
   SERVICES PAGE  (loads AFTER index.js)
   index.js already handles: navbar scroll state, progress line,
   reveal-on-scroll, headline word animation, back-to-top, footer year.
   ===================================================== */

// ===== Jump bar: highlight the chip for the section currently on screen =====
(function () {
  var chips = [].slice.call(document.querySelectorAll('.svc-chip'));
  var targets = [].slice.call(document.querySelectorAll('[data-spy]'));
  if (!chips.length || !targets.length || !('IntersectionObserver' in window)) return;

  var byId = {};
  chips.forEach(function (chip) {
    byId[chip.getAttribute('href').slice(1)] = chip;
  });

  function setActive(id) {
    var active = byId[id];
    chips.forEach(function (chip) {
      var on = chip === active;
      chip.classList.toggle('is-active', on);
      if (on) chip.setAttribute('aria-current', 'true');
      else chip.removeAttribute('aria-current');
    });

    // On small screens the chip row scrolls sideways: keep the active chip in view
    if (active) {
      var list = active.closest('.svc-jump-list');
      if (list && list.scrollWidth > list.clientWidth) {
        list.scrollTo({
          left: active.offsetLeft - (list.clientWidth - active.offsetWidth) / 2,
          behavior: 'smooth'
        });
      }
    }
  }

  // A thin band across the upper-middle of the screen decides which section is "current"
  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) setActive(entry.target.id);
    });
  }, { rootMargin: '-35% 0px -55% 0px' });

  targets.forEach(function (t) { io.observe(t); });
})();

// ===== Arriving from another page with #section: land exactly on it =====
// (images and fonts can shift the layout while the page loads)
window.addEventListener('load', function () {
  if (!location.hash || location.hash.length < 2) return;
  var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
  if (target) target.scrollIntoView({ behavior: 'auto' });
});

// ===== Navbar: choosing a service while already on this page =====
(function () {
  var nav = document.getElementById('mainNav');
  var links = document.querySelectorAll('.mega-item, .mega-foot a');
  if (!nav || !links.length) return;

  links.forEach(function (link) {
    link.addEventListener('click', function (e) {
      var href = link.getAttribute('href') || '';
      var hashAt = href.indexOf('#');
      var menuIsOpen = nav.classList.contains('show');

      // Phone/tablet: close the menu FIRST, then jump, so the page does not shift afterwards
      if (menuIsOpen && hashAt > -1 && window.bootstrap) {
        e.preventDefault();
        var hash = href.slice(hashAt);

        var toggle = document.querySelector('.site-nav .dropdown-toggle');
        var dd = toggle && window.bootstrap.Dropdown.getInstance(toggle);
        if (dd) dd.hide();

        nav.addEventListener('hidden.bs.collapse', function () {
          location.hash = hash;
        }, { once: true });
        window.bootstrap.Collapse.getOrCreateInstance(nav).hide();
        return;
      }

      // Desktop: hide the hover menu until the pointer leaves it
      var dropdown = link.closest('.dropdown');
      if (dropdown) {
        dropdown.classList.add('is-closing');
        dropdown.addEventListener('mouseleave', function () {
          dropdown.classList.remove('is-closing');
        }, { once: true });
      }
    });
  });
})();