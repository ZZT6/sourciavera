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
/* Phones: long secondary paragraphs are clamped (full text stays in the DOM) with a Read more toggle; extra FAQ items start collapsed. */
(function () {
  if (!(window.matchMedia && window.matchMedia('(max-width:700px)').matches)) return;
  var es = function () { return document.documentElement.lang === 'es'; };
  function label(open) { return es() ? (open ? 'Leer menos' : 'Leer más') : (open ? 'Read less' : 'Read more'); }
  function btn(target, hideCls) {
    var b = document.createElement('button');
    b.type = 'button'; b.className = 'm-rm'; b.textContent = label(false); b.setAttribute('aria-expanded', 'false');
    b.addEventListener('click', function () {
      var open = !target.classList.contains('open');
      target.classList.toggle('open', open); b.setAttribute('aria-expanded', open ? 'true' : 'false'); b.textContent = label(open);
      if (hideCls) document.querySelectorAll('.' + hideCls).forEach(function (e) { e.classList.toggle('m-show', open); });
    });
    return b;
  }
  function init() {
    document.querySelectorAll('.sv2 .m-cl').forEach(function (el) {
      if (el.closest('a') || el.nextElementSibling && el.nextElementSibling.classList.contains('m-rm')) return;
      if (el.scrollHeight > el.clientHeight + 2) el.parentNode.insertBefore(btn(el), el.nextSibling);
    });
    var items = document.querySelectorAll('.sv2 .faq-item');
    if (items.length > 4) {
      var last = items[items.length - 1].parentNode;
      for (var i = 4; i < items.length; i++) items[i].classList.add('m-hide');
      var b = document.createElement('button'); b.type = 'button'; b.className = 'm-rm m-rm-faq'; b.setAttribute('aria-expanded', 'false');
      var t = function (o) { return es() ? (o ? 'Menos preguntas' : 'Más preguntas') : (o ? 'Fewer questions' : 'More questions'); };
      b.textContent = t(false);
      b.addEventListener('click', function () {
        var o = !items[4].classList.contains('m-show');
        document.querySelectorAll('.m-hide').forEach(function (e) { e.classList.toggle('m-show', o); });
        b.setAttribute('aria-expanded', o ? 'true' : 'false'); b.textContent = t(o);
      });
      last.parentNode.insertBefore(b, last.nextSibling);
    }
  }
  var SEL = '.intro p,.who-intro,.who-founder-text,.path-card>p,.testimonial-text,.rc-inner>p,.c-intro';
  document.querySelectorAll('.sv2').forEach(function (r) { r.querySelectorAll(SEL).forEach(function (e) { e.classList.add('m-cl'); }); });
  if (document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
