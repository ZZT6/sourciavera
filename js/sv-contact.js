/* Contact form (home #contact and /contact): service preselect, intl-tel-input (lazy), Formspree submit. */
(function () {
  var form = document.getElementById('contact-form');
  var ES = function () { return document.documentElement.lang === 'es'; };
  var SERVICES = { 'Verificación de fábrica': 'Factory Verification', 'Negociación y compra': 'Negotiation & Procurement', 'Socio de Compras (largo plazo)': 'Procurement Partner (long-term)' };
  window.svApplyService = function (p) {
    if (!p || !form) return;
    var cats = ['construction', 'auto-parts', 'badges', 'other'];
    if (cats.indexOf(p) !== -1) document.getElementById('category-hidden').value = p;
    else document.getElementById('service-hidden').value = SERVICES[p] || p;
    var el = document.getElementById('contact') || document.getElementById('contacto');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };
  if (!form) return;
  var p = new URLSearchParams(location.search).get('service');
  if (!p) { try { var r = JSON.parse(localStorage.getItem('sv-service') || 'null'); localStorage.removeItem('sv-service'); if (r && r.v && Date.now() - r.t < 900000) p = r.v; } catch (e) {} }
  if (p) window.svApplyService(p);

  var iti = null, tel = document.getElementById('f-wa');
  function loadIti() {
    if (iti || !tel || window.__itiLoading) return; window.__itiLoading = true;
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/npm/intl-tel-input@24.5.0/build/js/intlTelInput.min.js';
    s.onload = function () { try { iti = window.intlTelInput(tel, { initialCountry: 'mx', separateDialCode: true, nationalMode: true }); } catch (e) {} };
    document.head.appendChild(s);
  }
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (en) { if (en[0].isIntersecting) { loadIti(); io.disconnect(); } }, { rootMargin: '300px' });
    io.observe(form);
  } else loadIti();
  form.addEventListener('focusin', loadIti, { once: true });

  var btn = document.getElementById('submit-btn'), ok = document.getElementById('form-success');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!form.reportValidity()) return;
    var wa = tel ? tel.value.replace(/[^\d]/g, '') : '';
    var full = '';
    if (wa) { var dial = iti && iti.getSelectedCountryData ? iti.getSelectedCountryData().dialCode : ''; full = '+' + (dial || '') + wa; tel.value = full; }
    document.getElementById('contact-hidden').value = full || document.getElementById('f-email').value;
    var label = btn.textContent;
    btn.textContent = ES() ? 'Enviando...' : 'Sending...'; btn.disabled = true;
    try {
      var res = await fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } });
      if (res.ok) {
        window.svTrackLead && window.svTrackLead('contact-form');
        form.reset(); btn.style.display = 'none'; ok.classList.remove('is-hidden');
        ok.textContent = ES() ? '✓ Recibido — te contactamos en menos de 24h' : "✓ Received — we'll contact you within 24h";
        setTimeout(function () { location.href = ES() ? '/blog/es' : '/blog'; }, 2500);
      } else { btn.textContent = ES() ? 'Error — intenta de nuevo' : 'Error — try again'; btn.disabled = false; }
    } catch (err) { btn.textContent = ES() ? 'Error — intenta de nuevo' : 'Error — try again'; btn.disabled = false; }
  });
})();
