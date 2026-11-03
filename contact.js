/* =====================================================
   CONTACT PAGE  (loads AFTER the EmailJS SDK and index.js)
   index.js already handles: navbar scroll state, progress line,
   reveal-on-scroll, headline word animation, back-to-top, footer year.

   EmailJS is the "backend": the browser sends the form straight to
   EmailJS, which emails it to you. No server of your own is needed.
   ===================================================== */

(function () {
  'use strict';

  // =====================================================
  //  1. EMAILJS SETTINGS  (paste your own values here)
  //     Dashboard: https://dashboard.emailjs.com
  //       publicKey  -> Account > General > Public Key
  //       serviceId  -> Email Services > your connected mailbox
  //       templateId -> Email Templates > your template
  // =====================================================
  var EMAILJS = {
    publicKey: 'YOUR_PUBLIC_KEY',
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID'
  };

  var COOLDOWN_MS = 30000; // minimum wait between two messages from the same browser
  var MAX_LENGTH = 1000;   // keep in step with maxlength on the textarea

  var form = document.getElementById('contactForm');
  if (!form) return;

  var card = document.getElementById('contactCard');
  var alertBox = document.getElementById('ctAlert');
  var alertText = document.getElementById('ctAlertText');
  var submitBtn = document.getElementById('ctSubmit');
  var btnText = submitBtn.querySelector('.btn-text');
  var success = document.getElementById('ctSuccess');
  var successName = document.getElementById('ctSuccessName');
  var successEmail = document.getElementById('ctSuccessEmail');
  var again = document.getElementById('ctAgain');
  var counter = document.getElementById('ctCount');

  var fields = ['name', 'email', 'phone', 'service', 'message'];

  function isConfigured() {
    return EMAILJS.publicKey && EMAILJS.serviceId && EMAILJS.templateId &&
      !/^YOUR_/.test(EMAILJS.publicKey + EMAILJS.serviceId + EMAILJS.templateId);
  }

  // ---------- safe wrappers around localStorage (can be blocked in private modes) ----------
  function store(key, val) {
    try {
      if (val === undefined) return window.localStorage.getItem(key);
      window.localStorage.setItem(key, val);
    } catch (e) { /* ignore */ }
    return null;
  }

  // =====================================================
  //  2. VALIDATION
  // =====================================================
  var rules = {
    name: function (v) {
      return v.trim().length >= 2 ? '' : 'Please enter your name.';
    },
    email: function (v) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'Please enter a valid email address.';
    },
    phone: function (v) {
      v = v.trim();
      if (!v) return ''; // optional
      return /^\+?[\d\s().-]{7,20}$/.test(v) ? '' : 'Please enter a valid phone number, or leave it blank.';
    },
    service: function (v) {
      return v ? '' : 'Please choose the service you are interested in.';
    },
    message: function (v) {
      return v.trim().length >= 20 ? '' : 'Please tell us a little more (at least 20 characters).';
    }
  };

  function wrap(el) { return el.closest('.ct-field'); }

  function showError(el, msg) {
    var box = wrap(el);
    var err = box.querySelector('.ct-error');
    box.classList.toggle('has-error', !!msg);
    el.classList.toggle('is-invalid', !!msg);
    el.classList.toggle('is-valid', !msg && el.value.trim() !== '');
    el.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
  }

  function check(name) {
    var el = form.elements[name];
    var msg = rules[name](el.value);
    showError(el, msg);
    return !msg;
  }

  fields.forEach(function (name) {
    var el = form.elements[name];
    // validate when leaving a field; after an error, re-check live while typing
    el.addEventListener('blur', function () { check(name); });
    el.addEventListener('input', function () {
      if (el.classList.contains('is-invalid')) check(name);
    });
    el.addEventListener('change', function () { if (name === 'service') check(name); });
  });

  // live character counter on the message box
  function updateCount() {
    if (counter) counter.textContent = form.elements.message.value.length + ' / ' + MAX_LENGTH;
  }
  form.elements.message.addEventListener('input', updateCount);
  updateCount();

  // =====================================================
  //  3. PRE-SELECT THE SERVICE FROM THE URL
  //     e.g. contact.html?service=website-development
  // =====================================================
  (function () {
    var wanted = new URLSearchParams(window.location.search).get('service');
    if (!wanted) return;
    var select = form.elements.service;
    for (var i = 0; i < select.options.length; i++) {
      if (select.options[i].value === wanted) { select.value = wanted; break; }
    }
  })();

  // =====================================================
  //  4. UI HELPERS
  // =====================================================
  function showAlert(msg) {
    alertText.textContent = msg;
    alertBox.hidden = false;
    alertBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  function hideAlert() { alertBox.hidden = true; }

  function setLoading(on) {
    submitBtn.disabled = on;
    submitBtn.classList.toggle('is-loading', on);
    submitBtn.setAttribute('aria-busy', on ? 'true' : 'false');
    btnText.textContent = on ? 'Sending...' : 'Send message';
  }

  function showSuccess(name, email) {
    successName.textContent = name.split(/\s+/)[0];
    successEmail.textContent = email;
    card.classList.add('is-sent');
    success.hidden = false;
    // restart the checkmark animation
    success.classList.remove('is-shown');
    void success.offsetWidth;
    success.classList.add('is-shown');

    var top = card.getBoundingClientRect().top;
    if (top < 0) card.scrollIntoView({ block: 'start', behavior: 'smooth' });
    var heading = success.querySelector('h2');
    if (heading) heading.focus({ preventScroll: true });
  }

  // =====================================================
  //  5. SUBMIT  ->  EmailJS
  // =====================================================
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    hideAlert();

    // Honeypot: real people never see this field. If it is filled in, it is a bot,
    // so pretend everything worked and send nothing.
    if (form.elements.company_website.value) {
      showSuccess('there', 'your inbox');
      return;
    }

    // Validate everything and jump to the first problem
    var firstBad = null;
    fields.forEach(function (name) {
      if (!check(name) && !firstBad) firstBad = form.elements[name];
    });
    if (firstBad) { firstBad.focus(); return; }

    // Simple rate limit
    var last = Number(store('szkay_contact_last') || 0);
    if (Date.now() - last < COOLDOWN_MS) {
      showAlert('Please wait a few seconds before sending another message.');
      return;
    }

    if (!isConfigured()) {
      console.warn('EmailJS is not set up yet. Add your Public Key, Service ID and Template ID at the top of contact.js.');
      showAlert('The contact form has not been connected yet.');
      return;
    }

    if (!window.emailjs) {
      showAlert('The email service could not be loaded. Please check your connection and try again.');
      return;
    }

    var serviceSelect = form.elements.service;
    var name = form.elements.name.value.trim();
    var email = form.elements.email.value.trim();

    // These keys are the {{variables}} you use in your EmailJS template
    var params = {
      from_name: name,
      reply_to: email,
      phone: form.elements.phone.value.trim() || 'Not provided',
      service: serviceSelect.options[serviceSelect.selectedIndex].text,
      message: form.elements.message.value.trim(),
      sent_from: window.location.href,
      sent_at: new Date().toLocaleString()
    };

    setLoading(true);

    window.emailjs.send(EMAILJS.serviceId, EMAILJS.templateId, params, { publicKey: EMAILJS.publicKey })
      .then(function () {
        store('szkay_contact_last', String(Date.now()));
        setLoading(false);
        showSuccess(name, email);
      })
      .catch(function (err) {
        console.error('EmailJS error:', err);
        setLoading(false);
        var limited = err && err.status === 429;
        showAlert(limited
          ? 'We are receiving a lot of messages right now. Please try again in a few minutes.'
          : 'Sorry, your message could not be sent.');
      });
  });

  // "Send another message"
  again.addEventListener('click', function () {
    form.reset();
    fields.forEach(function (name) {
      var el = form.elements[name];
      el.classList.remove('is-invalid', 'is-valid');
      el.removeAttribute('aria-invalid');
      wrap(el).classList.remove('has-error');
    });
    updateCount();
    hideAlert();
    success.hidden = true;
    success.classList.remove('is-shown');
    card.classList.remove('is-sent');
    form.elements.name.focus();
  });
})();