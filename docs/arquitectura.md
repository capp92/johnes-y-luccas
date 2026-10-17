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
```

### Generador (`build.py`)

- Front matter obligatorio: `title`, `description`, `path` (vacío = home; `equipo-trabajo/` = subpágina),
  `nav` (`inicio|nosotros|testimonios|servicios|contacto`, marca el ítem activo del menú).
  Opcionales: `body_class`, `search_title`, `keywords`, `search: no` (excluir del buscador).
- Variables disponibles: todo el front matter + `root` (ruta relativa a la raíz: `./`, `../`, …),
  `canonical`, `site-url`, `nav-*` / `cur-*` (clase y `aria-current` del menú).
- Los links internos son **relativos** (`{{root}}equipo-trabajo/`): el sitio funciona en la raíz de un
  dominio, en una subcarpeta (GitHub Pages de proyecto) y abriendo los archivos con `file://`
  (`site.js` agrega `index.html` a los links cuando no hay servidor).
- `python3 build.py --check` falla si algún archivo generado quedó desactualizado.

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
| negrita de DIN Next Light (sintética) | Barlow 500 | La "negrita" de Wix es sintética sobre la Light; visualmente ≈ 500. |
| Helvetica W01 Roman (solo mensaje del formulario) | Helvetica/Arial del sistema | Misma razón de licencia. |
| Anton, Cormorant Garamond Light, Roboto Bold, Barlow | **los mismos archivos que sirve Wix** | Son OFL/Apache. Se usan las versiones exactas de Wix (Anton v11, etc.): con la versión actual de Google Fonts, Anton quedaba 3,5 px más abajo. |
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

Los números 01/02/03 tienen el "floatIn" de Wix: 1200 ms, sube 60 px y aparece, curva
`cubic-bezier(0.445, 0.05, 0.55, 0.95)`. Se dispara con `IntersectionObserver` (clase `.is-in`).
La clase `js` se agrega en el `<head>` para que no parpadeen antes de animarse.

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

`build.py` admite valores por defecto: `{{variable|valor}}`.

## Diferencias deliberadas con el original

| Qué | Original | Copia | Motivo |
|---|---|---|---|
| Segundo teléfono del header | muestra 5857 pero el link marca **5851** | marca 5857 | error del original |
| Imágenes de las tarjetas 02 y 03 (home) | enlazan a *Contabilidad Financiera* | toda la tarjeta enlaza a su servicio | error del original |
| Buscador | widget de terceros (InstantSearch+) en iframe | buscador propio sobre las páginas del sitio | el widget depende de Wix |
| Formularios | los envía Wix | `mailto:` o un endpoint configurable | no hay backend (ver README) |
| Formulario de la home en móvil | oculto | visible | es el principal punto de contacto |
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
