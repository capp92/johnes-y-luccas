/* Johnes & Luccas — comportamiento del sitio (sin dependencias).
 *
 * Contenido:
 *   1. Parallax de fondos (réplica del efecto "Parallax" de Wix)
 *   2. Animaciones de entrada "floatIn"/"fadeIn"
 *   3. Menú: submenús accesibles + menú móvil a pantalla completa
 *      (+ popup de contacto, pestañas/buscador de FAQ y "copiar enlace" del blog)
 *   4. Botón "volver arriba" (móvil)
 *   5. Buscador del header (índice en assets/js/search-index.js)
 *   6. Formularios de contacto (endpoint configurable o mailto)
 *   7. Navegación al abrir los archivos con file:// (sin servidor)
 */
(function () {
  'use strict';

  /* Configuración de formularios -------------------------------------------
   * FORM_ENDPOINT vacío => los formularios abren el programa de correo
   * (mailto) con el mensaje armado. Para recibirlos sin intervención del
   * usuario, poner aquí la URL de un servicio que acepte POST de FormData
   * (p. ej. Formspree o un endpoint propio). Ver README, "Formularios".
   */
  var FORM_ENDPOINT = '';
  var CONTACT_EMAIL = 'contacto@johnesyluccas.cl';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var desktopMq = window.matchMedia('(min-width: 980px)');
  root.classList.add('js');

  /* 1. Parallax -------------------------------------------------------------
   * Wix: la imagen de fondo mide max(alto de la sección, alto del viewport) y
   * su borde superior queda en 0.2 × (top de la sección en el viewport).
   * Relativo a la sección: translateY = -0.8 × sección.top. Medido sobre el
   * original (ver docs/arquitectura.md). Solo escritorio, como en Wix.
   */
  var parallaxItems = Array.prototype.map.call(document.querySelectorAll('.parallax'), function (section) {
    return { section: section, img: section.querySelector('.parallax__img') };
  }).filter(function (item) { return item.img; });
  var parallaxTicking = false;

  function updateParallax() {
    parallaxTicking = false;
    var active = desktopMq.matches && !reduceMotion;
    var vh = window.innerHeight;
    parallaxItems.forEach(function (item) {
      if (!active) { item.img.style.transform = ''; return; }
      var rect = item.section.getBoundingClientRect();
      if (rect.bottom < -vh || rect.top > vh * 2) return;
      item.img.style.transform = 'translate3d(0,' + (-0.8 * rect.top).toFixed(1) + 'px,0)';
    });
  }
  function requestParallax() {
    if (!parallaxTicking) { parallaxTicking = true; window.requestAnimationFrame(updateParallax); }
  }
  if (parallaxItems.length) {
    window.addEventListener('scroll', requestParallax, { passive: true });
    window.addEventListener('resize', requestParallax);
    updateParallax();
  }

  /* 2. Animaciones de entrada ("floatIn" y "fadeIn" de Wix) ------------------- */
  var floaters = document.querySelectorAll('.float-in, .fade-in');
  if (floaters.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      Array.prototype.forEach.call(floaters, function (el) { el.classList.add('is-in'); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add('is-in'); io.unobserve(entry.target); }
        });
      }, { threshold: 0.15 });
      Array.prototype.forEach.call(floaters, function (el) { io.observe(el); });
    }
  }

  /* 3. Menú ----------------------------------------------------------------- */
  var menuToggle = document.querySelector('[data-menu-toggle]');
  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    if (menuToggle) {
      menuToggle.setAttribute('aria-expanded', String(open));
      menuToggle.querySelector('.visually-hidden').textContent = open ? 'Cerrar menú' : 'Abrir menú';
    }
  }
  if (menuToggle) {
    menuToggle.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
    document.querySelectorAll('.main-nav a').forEach(function (a) {
      a.addEventListener('click', function () { setMenu(false); });
    });
    desktopMq.addEventListener('change', function () { setMenu(false); });
  }
  // "NOSOTROS" no es un link en el original: abre su submenú con clic/teclado.
  document.querySelectorAll('[data-submenu-toggle]').forEach(function (btn) {
    var li = btn.closest('.has-submenu');
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = !li.classList.contains('is-open');
      li.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });
  document.addEventListener('click', function () {
    document.querySelectorAll('.has-submenu.is-open').forEach(function (li) {
      li.classList.remove('is-open');
      var b = li.querySelector('[data-submenu-toggle]');
      if (b) b.setAttribute('aria-expanded', 'false');
    });
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
      setMenu(false);
      document.querySelectorAll('.has-submenu.is-open').forEach(function (li) { li.classList.remove('is-open'); });
    }
  });
  // Al cruzar el breakpoint (achicar la ventana, girar una tablet) el menú cambia de layout y sus
  // fundidos mostrarían un instante el menú móvil o los submenús. Sin transiciones mientras dura.
  var resizeTimer;
  window.addEventListener('resize', function () {
    root.classList.add('no-anim');
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () { root.classList.remove('no-anim'); }, 200);
  });

  /* Popup "CONTÁCTANOS" de las páginas de servicio (<dialog> nativo) ----------- */
  document.querySelectorAll('[data-open-dialog]').forEach(function (btn) {
    var dlg = document.getElementById(btn.getAttribute('data-open-dialog'));
    if (!dlg || typeof dlg.showModal !== 'function') return;
    btn.addEventListener('click', function (e) { e.preventDefault(); dlg.showModal(); });
  });
  document.querySelectorAll('dialog').forEach(function (dlg) {
    dlg.addEventListener('click', function (e) {
      // Clic en el fondo (fuera del contenido) o en el botón cerrar
      if (e.target === dlg || e.target.closest('[data-close-dialog]')) dlg.close();
    });
  });

  /* Blog: botón "copiar enlace" de la barra de compartir (_src/partials/post-share.html) */
  document.querySelectorAll('[data-copy-link]').forEach(function (btn) {
    var status = btn.parentNode.querySelector('.post-share__status');
    var timer;
    btn.addEventListener('click', function () {
      var url = btn.getAttribute('data-copy-link') || window.location.href;
      function show(msg) {
        if (!status) return;
        status.textContent = msg;
        clearTimeout(timer);
        timer = setTimeout(function () { status.textContent = ''; }, 2500);
      }
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(url).then(function () { show('Enlace copiado'); }, function () { window.prompt('Copie el enlace:', url); });
      } else {
        window.prompt('Copie el enlace:', url);
      }
    });
  });

  /* Preguntas frecuentes: pestañas + buscador (el acordeón es <details>, sin JS) */
  document.querySelectorAll('[data-faq]').forEach(function (faq) {
    var tabs = Array.prototype.slice.call(faq.querySelectorAll('[role="tab"]'));
    var panels = tabs.map(function (t) { return document.getElementById(t.getAttribute('aria-controls')); });
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = i === j;
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panels[j].hidden = !on;
      });
      if (focus) tabs[i].focus();
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          e.preventDefault();
          select((i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length, true);
        }
      });
    });
    var input = faq.querySelector('[data-faq-search]');
    var results = faq.querySelector('[data-faq-results]');
    if (!input) return;
    input.addEventListener('input', function () {
      var q = normalize(input.value).trim();
      var words = q ? q.split(/\s+/) : [];
      var count = 0;
      faq.classList.toggle('is-searching', words.length > 0);
      faq.querySelectorAll('.faq-item').forEach(function (item) {
        var hay = normalize(item.textContent);
        var match = words.every(function (w) { return hay.indexOf(w) !== -1; });
        item.hidden = words.length > 0 && !match;
        if (words.length && match) count++;
      });
      results.hidden = !words.length;
      results.textContent = count === 1 ? '1 resultado' : count + ' resultados';
    });
  });

  /* 4. Volver arriba (móvil) -------------------------------------------------- */
  function onScrollState() { root.classList.toggle('is-scrolled', window.scrollY > 300); }
  window.addEventListener('scroll', onScrollState, { passive: true });
  onScrollState();

  /* 5. Buscador ----------------------------------------------------------------- */
  var searchForm = document.querySelector('[data-search]');
  var pageRoot = root.getAttribute('data-root') || './';
  function normalize(s) {
    return (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  }
  if (searchForm && window.JL_SEARCH_INDEX) {
    var input = searchForm.querySelector('input');
    var list = searchForm.querySelector('.site-search__results');
    var results = [];
    var selected = -1;
    var render = function () {
      list.innerHTML = '';
      var q = normalize(input.value).trim();
      if (!q) { list.hidden = true; return; }
      var words = q.split(/\s+/);
      results = window.JL_SEARCH_INDEX.map(function (p) {
        var title = normalize(p.t), hay = normalize(p.t + ' ' + p.d + ' ' + p.k);
        var score = 0;
        for (var i = 0; i < words.length; i++) {
          if (hay.indexOf(words[i]) === -1) return null;
          score += title.indexOf(words[i]) !== -1 ? 2 : 1;
        }
        return { p: p, score: score };
      }).filter(Boolean).sort(function (a, b) { return b.score - a.score; }).slice(0, 7);
      if (!results.length) {
        var li = document.createElement('li');
        li.className = 'is-empty';
        li.textContent = 'Sin resultados';
        list.appendChild(li);
      }
      results.forEach(function (r, i) {
        var li = document.createElement('li');
        var a = document.createElement('a');
        a.href = pageRoot + r.p.u;
        a.setAttribute('role', 'option');
        a.textContent = r.p.t;
        var small = document.createElement('small');
        small.textContent = r.p.d;
        a.appendChild(small);
        if (i === selected) a.className = 'is-selected';
        li.appendChild(a);
        list.appendChild(li);
      });
      list.hidden = false;
    };
    input.addEventListener('input', function () { selected = -1; render(); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();
        if (!results.length) return;
        selected = (selected + (e.key === 'ArrowDown' ? 1 : -1) + results.length) % results.length;
        render();
      } else if (e.key === 'Escape') {
        list.hidden = true;
      }
    });
    searchForm.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!results.length) return;
      window.location.href = pageRoot + results[Math.max(selected, 0)].p.u;
    });
    document.addEventListener('click', function (e) {
      if (!searchForm.contains(e.target)) list.hidden = true;
    });
  }

  /* 6. Formularios de contacto ---------------------------------------------------- */
  document.querySelectorAll('[data-contact-form]').forEach(function (form) {
    var status = form.querySelector('.form__status');
    var submit = form.querySelector('[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.reportValidity()) return;
      var data = new FormData(form);
      data.append('origen', form.getAttribute('data-origin') || document.title);
      status.classList.remove('is-error');

      if (!FORM_ENDPOINT) {
        var subject = data.get('asunto') || form.getAttribute('data-subject') ||
          ('Contacto desde el sitio web (' + data.get('origen') + ')');
        // Cuerpo del correo: cada campo con su rótulo (data-label o aria-label); el mensaje va al final.
        var lines = [];
        var seen = {};
        Array.prototype.forEach.call(form.elements, function (el) {
          if (!el.name || seen[el.name] || el.name === 'mensaje' || el.name === 'asunto' || el.type === 'submit') return;
          seen[el.name] = true;
          var value = data.getAll(el.name).join(', ');
          if (!value) return;
          var label = el.getAttribute('data-label') || el.getAttribute('aria-label') || el.name;
          lines.push(label + ': ' + value);
        });
        var body = lines.join('\n') + (data.get('mensaje') ? '\n\n' + data.get('mensaje') : '');
        window.location.href = 'mailto:' + CONTACT_EMAIL + '?subject=' + encodeURIComponent(subject) +
          '&body=' + encodeURIComponent(body);
        status.textContent = 'Se abrió tu programa de correo para enviar el mensaje.';
        return;
      }

      submit.disabled = true;
      fetch(FORM_ENDPOINT, { method: 'POST', body: data, headers: { Accept: 'application/json' } })
        .then(function (res) {
          if (!res.ok) throw new Error('HTTP ' + res.status);
          var redirect = form.getAttribute('data-redirect');
          if (redirect) { window.location.href = pageRoot + redirect; return; }
          form.reset();
          status.textContent = form.getAttribute('data-success') || '¡Gracias! Mensaje enviado.';
        })
        .catch(function () {
          status.classList.add('is-error');
          status.textContent = 'No se pudo enviar. Escríbenos a ' + CONTACT_EMAIL;
        })
        .then(function () { submit.disabled = false; });
    });
  });

  /* 7. file:// ----------------------------------------------------------------------
   * Los links apuntan a carpetas ("equipo-trabajo/") para tener URLs limpias en
   * el servidor. Abriendo el HTML directo desde el disco eso muestra el listado
   * de la carpeta, así que agregamos "index.html".
   */
  if (window.location.protocol === 'file:') {
    document.querySelectorAll('a[href]').forEach(function (a) {
      var href = a.getAttribute('href');
      if (/^(?:[a-z]+:|#|\/\/)/i.test(href)) return;
      var hash = '';
      var i = href.indexOf('#');
      if (i !== -1) { hash = href.slice(i); href = href.slice(0, i); }
      if (href === '' || href.slice(-1) === '/') a.setAttribute('href', href + 'index.html' + hash);
    });
  }
})();
