/* SourciaVera - GA4 key events + floating WhatsApp button. Loaded (deferred) by every page.
 * Sends nothing to GA4 unless gtag.js is loaded, which only happens on the production hostname
 * (see the Google tag block in each page's <head>), so previews, localhost and file:// stay out of GA4.
 *
 *   whatsapp_click  a click on a wa.me link; parameter button_location says where it was:
 *                     floating     the floating button added below
 *                     article_cta  inside a .cta-box / .cta-btns block (article action area, other CTA boxes)
 *                     footer       inside <footer>
 *                     other        any other wa.me link on a page (home page sections etc.)
 *   email_click     a click on a mailto: link
 *   generate_lead   svTrackLead(formId), called by the page's form handler only after Formspree
 *                   confirms the submission (response.ok); a failed submission sends nothing
 *
 * PDF downloads are recorded by GA4 Enhanced Measurement (file_download), so they are not sent from here.
 *
 * Floating WhatsApp button (every page that loads this file, i.e. every page, so new pages get it by default):
 *   - bottom right, 56px under 768px wide and 44px above; inline SVG, WhatsApp green, no external library
 *   - pre-filled message with the current page title so the owner can see which page the visitor came from
 *   - sits above the cookie banner while it is showing, hides itself while it would cover a button, a form field,
 *     a footer link or while a form field has focus / the cookie preferences are open
 */
(function () {
  'use strict';
  var PROD_HOST = 'sourciavera.com';
  var GA4_ID = 'G-X40LT2MS4X';
  var WA_NUMBER = '8613688057230';   // +86 13688057230

  function send(name, params) {
    if (location.hostname !== PROD_HOST || typeof window.gtag !== 'function') return;
    params.send_to = GA4_ID;               // GA4 only: do not forward these events to the Google Ads tag that shares gtag.js
    params.transport_type = 'beacon';      // survives the jump to the WhatsApp app / new tab
    try { window.gtag('event', name, params); } catch (e) { /* analytics must never break the page */ }
  }

  window.svTrackLead = function (formId) {
    send('generate_lead', { form_location: location.pathname, form_id: formId || '' });
  };

  function waLocation(a) {
    var d = a.getAttribute('data-wa-location');
    if (d) return d;
    if (a.closest('footer')) return 'footer';
    if (a.closest('.cta-box, .cta-btns')) return 'article_cta';
    return 'other';
  }

  function onLinkClick(e) {
    var el = e.target;
    var a = el && el.closest ? el.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) {
      send('email_click', { link_url: 'mailto:' + href.replace(/^mailto:/i, '').split('?')[0] });
    } else if (a.hostname === 'wa.me') {
      send('whatsapp_click', { link_url: 'https://wa.me' + a.pathname, button_location: waLocation(a) });
    }
  }

  document.addEventListener('click', onLinkClick, true);
  document.addEventListener('auxclick', function (e) { if (e.button === 1) onLinkClick(e); }, true);

  /* ------------------------------------------------------------ floating WhatsApp button */
  var ES = /^es/i.test(document.documentElement.lang || '') || /^\/es(\/|$)/.test(location.pathname);
  var LABEL = ES ? 'Escríbanos por WhatsApp' : 'Chat on WhatsApp';
  var ICON = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" aria-hidden="true" focusable="false"><path fill="#fff" d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/></svg>';
  var CSS = '.sv-wa{position:fixed;right:max(16px,env(safe-area-inset-right));bottom:calc(var(--sv-wa-lift,0px) + 16px + env(safe-area-inset-bottom));' +
    'width:56px;height:56px;border-radius:50%;background:#25D366;display:flex;align-items:center;justify-content:center;box-shadow:0 3px 12px rgba(0,0,0,.3);' +
    'z-index:9000;text-decoration:none;transition:opacity .2s ease,transform .2s ease,bottom .2s ease;-webkit-tap-highlight-color:transparent}' +
    '.sv-wa svg{width:30px;height:30px;display:block}' +
    '.sv-wa:focus-visible{outline:3px solid #0D2240;outline-offset:3px}' +
    '.sv-wa.sv-wa-off{opacity:0;transform:translateY(10px) scale(.9);pointer-events:none}' +
    '@media(min-width:768px){.sv-wa{width:44px;height:44px;right:max(24px,env(safe-area-inset-right));bottom:calc(var(--sv-wa-lift,0px) + 24px + env(safe-area-inset-bottom))}.sv-wa svg{width:24px;height:24px}}' +
    '@media(prefers-reduced-motion:reduce){.sv-wa{transition:none}}' +
    '@media print{.sv-wa{display:none}}';
  var COVER = 'a[class*="btn"], button, input, select, textarea, footer a, .cm a';   // things the button must never sit on
  var btn, covered = [], raf = 0;

  function pageTitle() {
    var t = (document.title || '').replace(/\s+[|–—-]\s+SourciaVera\s*$/i, '').replace(/["“”]/g, "'").replace(/\s+/g, ' ').trim();
    return t.length > 120 ? t.slice(0, 117) + '...' : t;
  }

  function message() {
    var t = pageTitle();
    return ES ? 'Hola, estoy leyendo "' + t + '" y tengo una consulta.' : 'Hi, I\'m reading "' + t + '" and have a question.';
  }

  function refreshHref() {
    btn.href = 'https://wa.me/' + WA_NUMBER + '?text=' + encodeURIComponent(message());
  }

  function lift() {            // keep clear of the cookie banner (vanilla-cookieconsent bar) while it is showing
    var h = 0, root = document.documentElement;
    if (root.classList.contains('show--consent')) {
      var cm = document.querySelector('#cc-main .cm');
      if (cm) {
        var r = cm.getBoundingClientRect();
        if (r.height > 0 && r.bottom > window.innerHeight - 4) h = Math.max(0, window.innerHeight - r.top);
      }
    }
    root.style.setProperty('--sv-wa-lift', h + 'px');
  }

  function overlaps() {
    var a = btn.getBoundingClientRect(), pad = 10;
    for (var i = 0; i < covered.length; i++) {
      var r = covered[i].getBoundingClientRect();
      if (r.width && r.height && r.bottom > a.top - pad && r.top < a.bottom + pad && r.right > a.left - pad && r.left < a.right + pad) return true;
    }
    return false;
  }

  function update() {
    raf = 0;
    lift();
    var root = document.documentElement, ae = document.activeElement;
    var typing = ae && /^(INPUT|TEXTAREA|SELECT)$/.test(ae.tagName) && ae.type !== 'checkbox' && ae.type !== 'radio';
    var off = typing || root.classList.contains('disable--interaction') || overlaps();
    btn.classList.toggle('sv-wa-off', !!off);
    btn.tabIndex = off ? -1 : 0;
  }

  function schedule() { if (!raf) raf = window.requestAnimationFrame(update); }

  function init() {
    if (btn || !document.body) return;
    var s = document.createElement('style');
    s.textContent = CSS;
    document.head.appendChild(s);
    btn = document.createElement('a');
    btn.className = 'sv-wa';
    btn.id = 'sv-wa-float';
    btn.target = '_blank';
    btn.rel = 'noopener';
    btn.setAttribute('aria-label', LABEL);
    btn.title = LABEL;
    btn.setAttribute('data-wa-location', 'floating');
    btn.innerHTML = ICON;
    refreshHref();
    btn.addEventListener('click', refreshHref, true);          // title may have changed since load
    document.body.appendChild(btn);
    covered = Array.prototype.slice.call(document.querySelectorAll(COVER));
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    window.addEventListener('orientationchange', schedule);
    document.addEventListener('focusin', schedule);
    document.addEventListener('focusout', function () { window.setTimeout(schedule, 50); });
    if (window.MutationObserver) {
      new MutationObserver(function () {      // cookie banner appears / is dismissed, preferences modal opens
        covered = Array.prototype.slice.call(document.querySelectorAll(COVER));
        schedule();
      }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'], childList: false });
    }
    window.addEventListener('load', function () { covered = Array.prototype.slice.call(document.querySelectorAll(COVER)); schedule(); });
    document.addEventListener('transitionend', schedule, true);   // cookie banner slides in / out
    document.addEventListener('animationend', schedule, true);
    window.setTimeout(schedule, 800);          // banner is created a moment after load
    window.setTimeout(schedule, 2500);
    window.setTimeout(schedule, 5000);
    schedule();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
