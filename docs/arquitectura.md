# Arquitectura y decisiones — copia del sitio Johnes & Luccas

> Última revisión: 2026-10-17. Fuente única de verdad para *cómo* está construida la copia y *por qué*.
> Si este documento no coincide con el código, el código manda: corrige este archivo en el mismo cambio.

## Qué es

Copia estática (HTML + CSS + JS, sin dependencias) de `https://www.johnesyluccas.cl`, que originalmente
está hecha en **Wix** (editor clásico, layout fijo de 980 px). El objetivo es fidelidad visual máxima
al original en escritorio y una versión móvil equivalente a la móvil de Wix.

## Cómo se hizo (y cómo repetirlo)

1. Se abrió el original en Chrome (DevTools MCP) a 1440×900 y se extrajeron del **DOM renderizado**:
   posiciones (`getBoundingClientRect`), estilos computados, HTML interno de cada bloque de texto,
   variables de tema de Wix (`--color_N`, `--font_N`) e imágenes (`data-image-info` de `wow-image`).
2. Se reconstruyó cada sección con HTML semántico y CSS propio, usando esas coordenadas.
3. Se comparó contra el original con capturas a la misma posición de scroll y un diff de píxeles por
   región (offset óptimo dx/dy). Criterio: desplazamiento 0 (±0,5 px) en todas las regiones.
   Las diferencias residuales son de forma de letra (ver Tipografías).

Capturas del original (para comparar si el sitio Wix deja de existir): [`docs/referencia-original/`](referencia-original/).

## Estructura

```
index.html, <slug>/index.html   ← GENERADOS por build.py (no editar a mano)
_src/layout.html                ← <head>, header, footer, barra de acciones móvil (común a todas)
_src/partials/*.html            ← bloques reutilizables: {{> nombre clave="valor"}}
_src/pages/*.html               ← una página por archivo, con front matter
assets/css/site.css             ← todos los estilos (escritorio + móvil)
assets/js/site.js               ← parallax, animaciones, menú, buscador, formularios
assets/js/search-index.js       ← GENERADO por build.py (índice del buscador)
assets/img/, assets/fonts/      ← descargados con tools/descargar_assets.py
tools/assets.json               ← manifiesto: de qué URL de Wix salió cada asset
build.py                        ← generador (solo librería estándar de Python)
_config.yml                     ← GitHub Pages: qué NO publicar (docs/, tools/, build.py, *.md)
```

### Generador (`build.py`)

- Front matter obligatorio: `title`, `description`, `path` (vacío = home; `equipo-trabajo/` = subpágina),
  `nav` (`inicio|nosotros|testimonios|servicios|contacto`, marca el ítem activo del menú).
  Opcionales: `body_class`, `search_title`, `keywords`, `search: no` (excluir del buscador).
- Variables disponibles: todo el front matter + `root` (ruta relativa a la raíz: `./`, `../`, …),
  `canonical`, `canonical-enc` (la misma URL codificada para `?url=`, la usan los botones de compartir
  del blog), `site-url`, `nav-*` / `cur-*` (clase y `aria-current` del menú). Los partials heredan las
  variables de la página que los incluye.
- Los links internos son **relativos** (`{{root}}equipo-trabajo/`): el sitio funciona en la raíz de un
  dominio, en una subcarpeta (GitHub Pages de proyecto) y abriendo los archivos con `file://`
  (`site.js` agrega `index.html` a los links cuando no hay servidor).
- `python3 build.py --check` falla si algún archivo generado quedó desactualizado.
- **Modo "en construcción"** (`EN_CONSTRUCCION` en `build.py`): lo que en una página va entre
  `<!-- en-construccion -->` y `<!-- /en-construccion -->` se reemplaza por `{{> en-construccion}}` antes de
  renderizar, así que no llega al HTML publicado. Con `False` solo se borran los marcadores y la salida es
  idéntica a la de antes del letrero (verificado contra el commit `0282472`). Un marcador sin pareja detiene
  el build, para no publicar a medias. Por qué en el build y no con CSS: con CSS el contenido igual quedaría
  en el HTML (buscadores, "ver código fuente").

## Diseño

### Colores (tema Wix → variables CSS)

| Variable | Hex | Wix | Uso |
|---|---|---|---|
| `--c-humo` | `#f7f7f7` | color_11 | fondo de página, texto claro |
| `--c-gris` | `#969c9d` | color_12 | placeholders, "J" y "L" del monograma |
| `--c-gris-medio` | `#656b6c` | color_13 | fondo de la sección de contacto |
| `--c-tinta` | `#333a3b` | color_14 | header, footer, texto principal |
| `--c-celeste` | `#b0e6eb` | color_16 | números/leyendas 01 y 03 |
| `--c-turquesa-medio` | `#62bbc3` | color_18 | bordes de botones, hover del menú |
| `--c-turquesa` | `#00a0af` | color_19 | color de marca |
| `--c-petroleo` | `#005058` | color_20 | número/leyenda 02 |

### Tipografías y licencias

| En el original (Wix) | En la copia | Por qué |
|---|---|---|
| DIN Next W01 Light (texto general) | **Barlow 300** como familia `"Barlow DIN"` | DIN Next es de Monotype, licenciada por Wix solo para sitios en Wix: no se puede copiar. Barlow (OFL) es de estilo DIN y mide lo mismo (608 px vs 606 px en una línea de prueba). |
| negrita de DIN Next Light (sintética) | Barlow 400 (`--w-texto-bold`) | La "negrita" de Wix es sintética sobre la Light; en ancho y grosor ≈ Barlow 400. |
| Helvetica W01 Roman (solo mensaje del formulario) | Helvetica/Arial del sistema | Misma razón de licencia. |
| Anton, Cormorant Garamond Light, Roboto Bold, Barlow | **los mismos archivos que sirve Wix** | Son OFL/Apache. Se usan las versiones exactas de Wix (Anton v11, etc.): con la versión actual de Google Fonts, Anton quedaba 3,5 px más abajo. |
| Open Sans (cita en cursiva de las páginas de servicio; formulario de 123FormBuilder) | las copias que sirve Wix (itálica y regular) | Apache 2.0. La regular solo la usa la réplica del formulario de postulación. |
| Optimus Princeps (logo) | el mismo archivo | Fuente subida por el dueño del sitio a Wix. |

**Métricas de "Barlow DIN".** DIN Next Light tiene ascent 85 % / descent 35 %; Barlow 100 % / 20 %
(medido en el navegador). Con la misma `line-height`, Barlow dibujaba 0,15 em más abajo (2,4 px a 16 px).
Los `@font-face` de "Barlow DIN" usan `ascent-override: 85%; descent-override: 35%` y con eso todo el
texto cae en la misma posición que en el original. **No aplicar** esos overrides a la familia `"Barlow"`
(400): en el original el subtítulo del hero ya es Barlow real.

### Parallax (hero de la home y testimonio)

Réplica del efecto "Parallax" de Wix, medido sobre el original:

- La imagen mide `max(alto original de la sección, 100vh)`.
- Su borde superior queda en `0,2 × (top de la sección en el viewport)`; relativo a la sección:
  `translateY = -0,8 × section.getBoundingClientRect().top` (ver `updateParallax` en `site.js`).
- Solo en escritorio y sin `prefers-reduced-motion` (Wix tampoco lo aplica en móvil).
- Consecuencia buscada: en pantallas de menos de ~813 px de alto, al cargar la home aparece una franja
  celeste bajo la foto del hero (fondo turquesa al 50 %). En el original también pasa.

La sección hero de Wix mide 776 px pero la siguiente la tapa 139 px: aquí mide 637 px y la imagen
conserva los 776 px (`--parallax-media-h`).

### Animación de entrada

Los números 01/02/03 de la home tienen el "floatIn" de Wix (`.float-in`: 1200 ms, sube 60 px y aparece) y
los títulos de los banners de servicio y de Preguntas frecuentes el "fadeIn" (`.fade-in`: 1200 ms, solo
opacidad). Curva `cubic-bezier(0.445, 0.05, 0.55, 0.95)`. Se disparan con `IntersectionObserver` (clase
`.is-in`). La clase `js` se agrega en el `<head>` para que no parpadeen antes de animarse.

### Móvil (< 980 px)

La versión móvil de Wix es un layout de **320 px escalado** al ancho del teléfono. En CSS:
`--m = min(100vw / 320, 1.6px)` y todas las medidas móviles se expresan como `calc(N * var(--m))`,
con N = píxeles del layout de Wix. Así el resultado es proporcional al original en cualquier teléfono.

## Componentes reutilizables

| Componente | Dónde | Notas |
|---|---|---|
| Banner de subpágina | `.page-banner` en cada página | Foto sobre fondo turquesa (`--banner-op`), monograma `{{> jl-badge}}` y título. Alto/posiciones por página con `--banner-h`, `--badge-x/y`, `--title-x/y`. |
| Escenario posicionado | `.stage` + hijos `.at` | Réplica del layout absoluto de Wix: cada hijo lleva `--x/--y/--w/--h` en px medidos. En móvil pasa a flujo normal (`position: static`). |
| Contáctenos hoy | `_src/partials/contacto-hoy.html` | Parámetros: `subtitulo`, `origen`, y opcionales `alto`, `opacidad`, `titulo-y`, `tel-y`, `form-x` (varían 1-3 px entre páginas en el original). |
| Formulario | `_src/partials/form-contacto.html` | Ver README, "Formularios". |
| Plantilla de servicio | clases `.svc-*` | Las 3 páginas de servicio comparten estructura; columnas y alturas van inline (`--cols`, `--h`, `--mt`, `--mb`). |
| Popup "CONTÁCTANOS" | `_src/partials/dialogo-contacto.html` | `<dialog>` nativo; lo abren los botones con `data-open-dialog="contacto-dialog"`. Sin JS el botón lleva a `/contacto/`. |
| Comillas de testimonio | `_src/partials/comillas.html` | El vector original está rotado 180° (comillas de cierre). |
| Preguntas frecuentes | `[data-faq]` en `faq-contabilidad.html` | Pestañas `role="tab"` (flechas ←/→), acordeón con `<details>` (sin JS) y buscador que filtra `.faq-item` sin distinguir tildes. |
| Formulario de postulación | `.app-form` | Réplica del widget de 123FormBuilder (Open Sans, grises `#4c4c4c`). **Solo visual**: sin `data-contact-form` y con el botón `type="button"`; ver README, "Formularios". |
| Blog: lista y entrada | `.blog`, `.post-card`, `.post`, `.recent-posts` | Medidas del original. En la entrada, los párrafos van sin margen y se separan con una línea vacía de 27 px, como en Wix. Autor/fecha (`.post-meta`) dejan 32 px para el avatar (en Wix es un gravatar en blanco). |
| Compartir entrada | `_src/partials/post-share.html` | Facebook, X y LinkedIn por URL (`canonical-enc`) + botón "copiar enlace" (`data-copy-link` en `site.js`). Solo comparten bien con el sitio publicado en su dominio. |
| Página sin header ni footer | `body_class: page-gracias` | Las "landing pages" de Wix ocultan el header y el footer; el CSS hace lo mismo con esa clase. |
| Letrero "Sitio en construcción" | `_src/partials/en-construccion.html` (lo inserta `build.py`) | No es del original. Sección clara como "Áreas de servicios", monograma J&L y letrero con la textura de hormigón de las tarjetas bajo el gris de marca, con cinta de obra turquesa/negra (`::before`/`::after`). Si va justo después de un `.page-banner`, el monograma se oculta para no repetirlo. |

`build.py` admite valores por defecto: `{{variable|valor}}`.

## Diferencias deliberadas con el original

| Qué | Original | Copia | Motivo |
|---|---|---|---|
| Segundo teléfono del header | muestra 5857 pero el link marca **5851** | marca 5857 | error del original |
| Imágenes de las tarjetas 02 y 03 (home) | enlazan a *Contabilidad Financiera* | toda la tarjeta enlaza a su servicio | error del original |
| Buscador | widget de terceros (InstantSearch+) en iframe | buscador propio sobre las páginas del sitio | el widget depende de Wix |
| Formularios | los envía Wix | `mailto:` o un endpoint configurable | no hay backend (ver README) |
| Formularios de la home y de Contacto en móvil | ocultos | visibles | son el principal punto de contacto |
| Mapa de Contacto | widget de mapa de Wix | `<iframe>` de Google Maps con las mismas coordenadas | el widget depende de Wix |
| Formulario de postulación | widget de 123FormBuilder (iframe ligado a la cuenta de Wix, con banner publicitario de 123FormBuilder) | réplica visual con los mismos campos, **sin envío** | decisión de Cristóbal (2026-10-17); para activarlo, ver README |
| Entradas del blog | republicaban textualmente comunicados del SII | resumen propio (bajada, imagen, párrafos) con enlace a la fuente | no copiar textos completos de terceros |
| URLs de las entradas | con tildes (`/post/se-informa-la-circulación-…`) | sin tildes y con `/` final | URLs ASCII más robustas; al publicar, redirigir las antiguas (README, "Publicar") |
| Blog: contadores de visitas y comentarios, "me gusta", comentarios, menú ⋮ y lupa de búsqueda | widgets de Wix | omitidos | dependen del backend de Wix; el buscador del header cubre el sitio |
| Botones de compartir de la entrada | botones de Wix | enlaces directos a Facebook/X/LinkedIn + copiar enlace | mismo comportamiento sin Wix |
| Acción "LinkedIn" (barra móvil) | sin URL configurada | igual, deshabilitada | falta la URL real |
| Encabezados | el logo es `<h1>` en todas las páginas | el logo es un link; cada página tiene su propio `<h1>` | SEO / accesibilidad |
| LinkedIn de los socios (Equipo, móvil) | los íconos están intercambiados entre Cristián y Gonzalo | cada uno con su persona | error del original |
| Íconos sociales del popup | solo Facebook tiene enlace y apunta a `facebook.com/wix` (resto de la plantilla) | íconos sin enlace | falta la URL real |
| Número del banner de servicios (01/02/03) | enlaza a la página 01 en las tres páginas | texto sin enlace | error del original |
| "Conozca además…" (servicios) | enlaza a Contraloría desde las tres páginas | texto sin enlace; las tarjetas de al lado sí enlazan | error del original |
| Orden móvil de páginas de servicio | Wix baja la frase destacada y la caja "Contáctenos" a después de "Ventajas" | quedan junto a "Áreas de alcance" | evitar duplicar contenido |

## Checklists

**Agregar o editar una página**
1. Crear/editar `_src/pages/<slug>.html` con su front matter (`path: <slug>/`).
2. Imágenes nuevas: agregarlas a `tools/assets.json` y correr `python3 tools/descargar_assets.py`.
3. Estilos propios de la página: bloque nuevo en `assets/css/site.css` (escritorio y móvil).
4. `python3 build.py` y revisar con `python3 -m http.server`.
5. Si la página debe aparecer en el menú o el footer: editar `_src/layout.html`.

**Poner o quitar una página "en construcción"**
1. Tapar: en `_src/pages/<pagina>.html`, encerrar lo que no debe verse entre `<!-- en-construccion -->` y
   `<!-- /en-construccion -->` (hoy: todo lo que sigue al hero en `index.html` y al banner en
   `equipo-trabajo.html` y `por-que-elegirnos.html`).
2. Destapar una página: borrar sus dos marcadores. Destapar todo: `EN_CONSTRUCCION = False` en `build.py`.
3. `python3 build.py`, revisar escritorio y móvil, y actualizar la tabla de estado del README.

**Agregar una entrada al blog**
1. Crear `_src/pages/post-<nombre>.html` copiando una entrada existente: `path: post/<slug-sin-tildes>/`,
   `nav: ninguno`, `body_class: page-post`, `search_title` y `keywords` para el buscador.
2. Imagen: agregarla a `tools/assets.json` (carpeta `assets/img/blog/`) y correr `python3 tools/descargar_assets.py`.
3. Agregar su `.post-card` al principio de `_src/pages/noticias-contabilidad-chile.html` (Wix ordena de la más nueva a la más antigua).
4. Actualizar el bloque "Entradas recientes" de las otras entradas (cada una muestra las demás).
5. `python3 build.py` y revisar en `http://localhost:8000/noticias-contabilidad-chile/`.

**Cambiar un dato de contacto (teléfono, mail, dirección)**
Aparece en: `_src/layout.html` (header, footer, barra móvil, JSON-LD), `_src/pages/index.html`
(sección Contáctenos), `assets/js/site.js` (`CONTACT_EMAIL`) y en las páginas de contacto.
Buscar con `grep -rn "3220 5850" _src assets/js` y luego `python3 build.py`.

## Cicatrices (cosas que mordieron)

- `html { scroll-behavior: smooth }` también anima los `window.scrollTo()` programáticos: en scripts de
  medición usar `{ behavior: 'instant' }`.
- En móvil, `visibility: visible` en el submenú le ganaba al `hidden` del menú cerrado y dejaba links
  invisibles pero clickeables encima de la página. Usar `visibility: inherit`.
- Las fuentes de Google Fonts actuales no tienen las mismas métricas que las versiones que sirve Wix.
- Al extraer, revisar siempre `transform` y `opacity` de cada componente: las comillas de Testimonios están rotadas 180° y los
  títulos de los banners de servicio tienen un `fadeIn` de 1200 ms (si se miden a mitad de animación salen con opacidad 0,75).
- En móvil, un `.at` que se vuelve `position: relative` heredaba `left: var(--x)` de escritorio y se salía 500 px de la
  pantalla. El bloque móvil de `.at` resetea `left/top: auto`.
- Los textos de Wix traen cadenas de `&nbsp;` ("validar&nbsp;su&nbsp;planificación…") que no caben en columnas angostas:
  en móvil `body { overflow-wrap: break-word }`.
- En un `<dialog>` el orden de tabulación es el del DOM: los campos del popup van Nombre, E-mail, Mensaje y la grilla CSS
  los acomoda.
- Al cruzar el breakpoint de 980 px (achicar la ventana, girar una tablet), los fundidos del menú dejaban ver un instante el
  menú móvil a pantalla completa o los submenús de escritorio. `site.js` agrega `.no-anim` a `<html>` mientras dura el
  `resize` y el CSS anula esas transiciones. Lo destapó la captura de página completa de DevTools (ver la siguiente).
- Las capturas de página completa de DevTools/Puppeteer (`fullPage`) redimensionan la página a 1×1 y de vuelta: disparan
  `resize`, cruzan el breakpoint y cambian `100vh` (el parallax sale distinto). Para comparar con el original, usar capturas
  del viewport en la misma posición de scroll.
- El "·" (U+00B7) de Barlow se dibuja en la línea base, igual que un punto. Los separadores de autor/fecha del blog son
  puntos de 2×2 px hechos con CSS.
- Wix carga widgets al hacer scroll (p. ej. los comentarios del blog): la altura de la página original cambia después
  de bajar (2695 → 2990 px en una entrada). Medir alturas recién cargada la página o después de recorrerla, pero no mezclar
  las dos cosas.
