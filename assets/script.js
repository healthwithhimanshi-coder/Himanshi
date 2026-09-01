/* ============================================================
   Health with Himanshi — shared behaviour for every page.
   Every block below checks that its elements exist first, so
   this one file can be safely loaded on pages that don't use
   the tabs or the contact form.
   ============================================================ */
(function () {
  'use strict';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* --- image placeholders: hide the fallback only once a real photo loads --- */
  document.querySelectorAll('.frame img').forEach(function (img) {
    function ok() { img.classList.add('loaded'); }
    if (img.complete && img.naturalWidth > 0) ok();
    else img.addEventListener('load', ok);
    img.addEventListener('error', function () { img.style.opacity = '0'; });
  });

  /* --- sticky header + mobile CTA --- */
  var header = document.querySelector('.site-header');
  var cta = document.getElementById('mobileCta');
  if (cta) document.body.classList.add('has-cta');
  function onScroll() {
    var y = window.scrollY;
    if (header) header.classList.toggle('is-stuck', y > 12);
    if (cta) cta.classList.toggle('show', y > 420);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- mobile drawer --- */
  var btn = document.getElementById('menuBtn');
  var drawer = document.getElementById('drawer');
  if (btn && drawer) {
    var setMenu = function (open) {
      drawer.classList.toggle('open', open);
      btn.setAttribute('aria-expanded', String(open));
      btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
      document.body.style.overflow = open ? 'hidden' : '';
    };
    btn.addEventListener('click', function () { setMenu(!drawer.classList.contains('open')); });
    drawer.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && drawer.classList.contains('open')) { setMenu(false); btn.focus(); }
    });
  }

  /* --- scroll reveal --- */
  var items = document.querySelectorAll('.rv, .step');
  if (reduce || !('IntersectionObserver' in window)) {
    items.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    items.forEach(function (el) { io.observe(el); });
  }

  /* --- specialisations: accessible tabs (specialisations.html) --- */
  var specTabs = Array.prototype.slice.call(document.querySelectorAll('.spec-tab'));
  var specPanels = Array.prototype.slice.call(document.querySelectorAll('.spec-panel'));
  if (specTabs.length) {
    var centerTab = function (tab) {
      /* keeps the chosen chip visible on mobile, without moving the page itself */
      var strip = tab.parentNode;
      if (!strip || strip.scrollWidth <= strip.clientWidth) return;
      var left = tab.offsetLeft - (strip.clientWidth - tab.offsetWidth) / 2;
      strip.scrollTo({ left: Math.max(0, left), behavior: reduce ? 'auto' : 'smooth' });
    };
    var selectSpec = function (i, moveFocus) {
      specTabs.forEach(function (t, n) {
        var on = (n === i);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (specPanels[n]) specPanels[n].classList.toggle('active', on);
      });
      centerTab(specTabs[i]);
      if (moveFocus) specTabs[i].focus();
    };
    specTabs.forEach(function (tab, i) {
      tab.addEventListener('click', function () { selectSpec(i); });
      tab.addEventListener('keydown', function (e) {
        var next = null;
        if (e.key === 'ArrowRight') next = (i + 1) % specTabs.length;
        if (e.key === 'ArrowLeft') next = (i - 1 + specTabs.length) % specTabs.length;
        if (e.key === 'Home') next = 0;
        if (e.key === 'End') next = specTabs.length - 1;
        if (next !== null) { e.preventDefault(); selectSpec(next, true); }
      });
    });
    /* open a condition directly from a link like specialisations.html#pcos.
       The fragment is a real tab id, so the browser handles the scroll itself
       and this only has to switch the panel. */
    var hashMap = { '#t2d': 0, '#t1d': 1, '#prediabetes': 2, '#pcos': 3, '#gut': 4, '#weight': 5, '#cholesterol': 6 };
    var openFromHash = function () {
      var i = hashMap[location.hash];
      if (typeof i === 'number') selectSpec(i);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
  }

  /* --- condition links carry the topic through to the enquiry form --- */
  document.querySelectorAll('[data-topic]').forEach(function (el) {
    el.addEventListener('click', function () {
      var wanted = el.getAttribute('data-topic') || '';
      var sel = document.getElementById('topic');
      if (sel) {
        /* same page as the form: set it directly */
        Array.prototype.slice.call(sel.options).forEach(function (o) {
          if (o.text.trim().toLowerCase() === wanted.trim().toLowerCase()) sel.value = o.value;
        });
        var msg = document.getElementById('msg');
        if (msg) setTimeout(function () { msg.focus({ preventScroll: true }); }, 700);
      } else {
        /* different page: hand it over so contact.html can pick it up */
        try { sessionStorage.setItem('hwh-topic', wanted); } catch (err) { /* private mode */ }
      }
    });
  });

  /* --- contact form --- */
  var form = document.getElementById('contactForm');
  if (form) {
    var topicSel = document.getElementById('topic');
    /* apply a topic chosen on another page */
    if (topicSel) {
      var carried = null;
      try { carried = sessionStorage.getItem('hwh-topic'); } catch (err) { /* private mode */ }
      if (carried) {
        Array.prototype.slice.call(topicSel.options).forEach(function (o) {
          if (o.text.trim().toLowerCase() === carried.trim().toLowerCase()) topicSel.value = o.value;
        });
        try { sessionStorage.removeItem('hwh-topic'); } catch (err) { /* ignore */ }
      }
    }

    var note = document.getElementById('formNote');
    var sendBtn = form.querySelector('button[type="submit"]');
    var nextField = document.getElementById('_next');
    var here = location.origin + location.pathname;
    if (nextField) nextField.value = here + '?sent=1#contact';
    if (location.search.indexOf('sent=1') > -1) {
      note.className = 'form-note ok';
      note.textContent = 'Thank you. Your message is on its way, and Himanshi will be in touch.';
      history.replaceState(null, '', here + '#contact');
    }
    var fail = function (msg, focusId) {
      note.className = 'form-note err';
      note.textContent = msg;
      if (focusId) document.getElementById(focusId).focus();
    };
    var nativeSend = function () {
      var f = document.createElement('form');
      f.method = 'POST';
      f.action = form.action.replace('/ajax/', '/');
      new FormData(form).forEach(function (v, k) {
        var i = document.createElement('input');
        i.type = 'hidden'; i.name = k; i.value = v;
        f.appendChild(i);
      });
      document.body.appendChild(f);
      f.submit();
    };
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var need = ['fname', 'lname', 'email'].filter(function (id) { return !document.getElementById(id).value.trim(); });
      if (need.length) return fail('Add your name and email so Himanshi can write back.', need[0]);
      var email = document.getElementById('email').value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return fail('That email address looks incomplete.', 'email');
      var phone = document.getElementById('phone').value.replace(/[^0-9]/g, '');
      if (phone && (phone.length < 7 || phone.length > 15)) return fail('That mobile number looks off. Please check the digits.', 'phone');
      note.className = 'form-note';
      note.textContent = 'Sending your message';
      sendBtn.setAttribute('aria-busy', 'true');
      var timer = setTimeout(nativeSend, 8000);
      fetch(form.action, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      })
        .then(function (r) { return r.json().catch(function () { return {}; }); })
        .then(function (d) {
          clearTimeout(timer);
          if (d.success === 'true' || d.success === true) {
            form.reset();
            note.className = 'form-note ok';
            note.textContent = 'Thank you. Your message is on its way, and Himanshi will be in touch.';
            sendBtn.removeAttribute('aria-busy');
          } else {
            nativeSend();
          }
        })
        .catch(function () {
          clearTimeout(timer);
          nativeSend();
        });
    });
  }
})();
