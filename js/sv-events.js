/* SourciaVera - GA4 key events. Loaded (deferred) by every page.
 * Sends nothing unless gtag.js is loaded, which only happens on the production hostname
 * (see the Google tag block in each page's <head>), so previews, localhost and file:// stay out of GA4.
 *
 *   whatsapp_click  a click on a wa.me link
 *   email_click     a click on a mailto: link
 *   generate_lead   svTrackLead(formId), called by the page's form handler only after Formspree
 *                   confirms the submission (response.ok); a failed submission sends nothing
 *
 * PDF downloads are recorded by GA4 Enhanced Measurement (file_download), so they are not sent from here.
 */
(function () {
  'use strict';
  var PROD_HOST = 'sourciavera.com';
  var GA4_ID = 'G-X40LT2MS4X';

  function send(name, params) {
    if (location.hostname !== PROD_HOST || typeof window.gtag !== 'function') return;
    params.send_to = GA4_ID;   // GA4 only: do not forward these events to the Google Ads tag that shares gtag.js
    try { window.gtag('event', name, params); } catch (e) { /* analytics must never break the page */ }
  }

  window.svTrackLead = function (formId) {
    send('generate_lead', { form_location: location.pathname, form_id: formId || '' });
  };

  function onLinkClick(e) {
    var el = e.target;
    var a = el && el.closest ? el.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (/^mailto:/i.test(href)) {
      send('email_click', { link_url: 'mailto:' + href.replace(/^mailto:/i, '').split('?')[0] });
    } else if (a.hostname === 'wa.me') {
      send('whatsapp_click', { link_url: 'https://wa.me' + a.pathname });
    }
  }

  document.addEventListener('click', onLinkClick, true);
  document.addEventListener('auxclick', function (e) { if (e.button === 1) onLinkClick(e); }, true);
})();
