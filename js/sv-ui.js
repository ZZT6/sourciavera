/* SourciaVera shared UI: mobile menu, back-to-top. No dependencies. */
(function () {
  var hd = document.getElementById('sv-header');
  if (hd) {
    var b = hd.querySelector('.sv-burger');
    function set(open) { hd.classList.toggle('sv-open', open); if (b) b.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    if (b) b.addEventListener('click', function () { set(!hd.classList.contains('sv-open')); });
    hd.querySelectorAll('.sv-menu a').forEach(function (a) { a.addEventListener('click', function () { set(false); }); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') set(false); });
  }
  document.addEventListener('click', function (e) {
    var t = e.target.closest && e.target.closest('[data-sv-top]');
    if (t) { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }
  });
})();
(function () {
  if (window.matchMedia && window.matchMedia('(max-width:700px)').matches)
    document.querySelectorAll('details.m-more').forEach(function (d) { d.removeAttribute('open'); });
})();
