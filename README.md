# johnes-y-luccas

Copia estática del sitio de **Johnes & Luccas** (estudio contable) — original en Wix:
<https://www.johnesyluccas.cl>. HTML + CSS + JS sin dependencias, con todas las imágenes y fuentes
descargadas al repo.

> Última revisión: 2026-10-17

## Estado

Las 16 páginas del sitio están copiadas. Se compararon contra el original con capturas a 1440 px (diff de
píxeles por región) y se revisaron en móvil (390 px) sin desborde horizontal. Lo que difiere es deliberado
o de tipografía: ver [docs/arquitectura.md](docs/arquitectura.md), "Diferencias deliberadas".

| Página | Ruta | Estado |
|---|---|---|
| Inicio | `/` | ✅ |
| Equipo de trabajo | `/equipo-trabajo/` | ✅ |
| Por qué elegirnos | `/por-que-elegirnos/` | ✅ |
| Testimonios | `/testimonios/` | ✅ |
| Servicios | `/servicios-contabilidad/` | ✅ |
| 01 Contabilidad financiera y asesoría tributaria | `/contabilidad-financiera-tributaria/` | ✅ (incluye popup "Contáctanos") |
| 02 Contraloría contable y financiera | `/contraloria-contable-y-financiera/` | ✅ |
| 03 Consultoría | `/consultoria/` | ✅ |
| Contacto | `/contacto/` | ✅ (mapa de Google en lugar del de Wix) |
| Preguntas frecuentes | `/faq-contabilidad/` | ✅ (pestañas y buscador funcionan) |
| Trabaja con nosotros | `/trabaja-con-nosotros/` | ✅ |
| Formulario de postulación | `/formulario-postulacion-contador/` | ✅ **solo visual: no envía** (ver Formularios) |
| Gracias (después del popup) | `/gracias-contacto-servicios/` | ✅ (sin header ni footer, como en Wix) |
| Noticias (blog) | `/noticias-contabilidad-chile/` | ✅ |
| Entrada: correos falsos | `/post/se-informa-la-circulacion-de-correos-electronicos-falsos/` | ✅ (texto resumido) |
| Entrada: app e-Factura del SII | `/post/sii-lanza-nueva-aplicacion-movil-que-permite-emitir-y-validar-facturas-a-traves-del-celular/` | ✅ (texto resumido) |

**Contenido que el original nunca completó** (se copió tal cual; lo tiene que definir el estudio): las
respuestas de la pestaña "Contabilidad" de Preguntas frecuentes ("Enter your answer here"), los cargos
"Puesto 1/2/3" del formulario de postulación, la URL de LinkedIn de la barra móvil y los enlaces de los
íconos sociales del popup.

## Verlo en local

```bash
python3 -m http.server 8000      # desde la raíz del repo
# abrir http://localhost:8000
```

También funciona abriendo `index.html` directo en el navegador (sin servidor).

## Editar

Los `.html` de la raíz y de cada carpeta **se generan**; no se editan a mano.

```bash
# 1. editar _src/pages/<pagina>.html, _src/layout.html o assets/css/site.css
python3 build.py            # 2. regenerar
python3 build.py --check    # (opcional) verifica que lo generado esté al día
```

Imágenes y fuentes nuevas: agregarlas a `tools/assets.json` y correr `python3 tools/descargar_assets.py`.

## Publicar

La raíz del repo es el sitio publicable: sirve en cualquier hosting estático (nginx/Caddy en Easypanel,
GitHub Pages, Netlify…). Las URLs son carpetas (`/equipo-trabajo/`), igual que en el original pero con
`/` final. Los `canonical` y `og:url` apuntan a `https://www.johnesyluccas.cl` (constante `SITE_URL` en
`build.py`).

Las entradas del blog tenían URLs con tildes en Wix y aquí no. Si el sitio reemplaza al original en el
mismo dominio, redirigir las antiguas (ejemplo para nginx; comprobar después con `curl -I`):

```nginx
location = "/post/se-informa-la-circulación-de-correos-electrónicos-falsos" {
  return 301 /post/se-informa-la-circulacion-de-correos-electronicos-falsos/;
}
location = "/post/sii-lanza-nueva-aplicación-móvil-que-permite-emitir-y-validar-facturas-a-través-del-celular" {
  return 301 /post/sii-lanza-nueva-aplicacion-movil-que-permite-emitir-y-validar-facturas-a-traves-del-celular/;
}
```

## Formularios

| Formulario | Dónde | Qué hace |
|---|---|---|
| "Contáctenos" (Inicio, Por qué elegirnos, Testimonios, Servicios), Contacto y popup "CONTÁCTANOS" (páginas de servicio) | `_src/partials/form-contacto.html`, `contacto-hoy.html`, `dialogo-contacto.html`, `_src/pages/contacto.html` | Sin backend, abren el programa de correo del visitante con el mensaje armado hacia `contacto@johnesyluccas.cl`. Para recibirlos directamente, poner en `FORM_ENDPOINT` (al inicio de `assets/js/site.js`) la URL de un servicio que acepte `POST` de `FormData` (Formspree, un endpoint propio, etc.). Con endpoint, el popup redirige a `/gracias-contacto-servicios/`, como en Wix. |
| Postulación | `_src/pages/formulario-postulacion-contador.html` | **Solo visual, no envía nada** (decisión de Cristóbal, 2026-10-17). Para activarlo: agregar `data-contact-form` al `<form>` y `type="submit"` al botón "Enviar"; desde ahí funciona igual que los demás. |

## Documentación

| Documento | Léelo cuando… |
|---|---|
| [docs/arquitectura.md](docs/arquitectura.md) | vayas a tocar el código: estructura, generador, tipografías y licencias, parallax, versión móvil, diferencias deliberadas con el original, checklists |
| [docs/referencia-original/](docs/referencia-original/) | quieras comparar con cómo se veía el sitio Wix |
| [tools/assets.json](tools/assets.json) | necesites saber de dónde salió una imagen o fuente (URL original en Wix) |

## Derechos

Los textos, fotos y logo son de Johnes & Luccas. Las dos entradas del blog republicaban comunicados del
SII: aquí van resumidas con enlace a la fuente, no copiadas. Las fuentes incluidas son OFL/Apache (Anton,
Barlow, Cormorant Garamond, Roboto, Open Sans) y Optimus Princeps (subida por el dueño del sitio a Wix).
DIN Next y Helvetica, que usa el original, **no** se incluyen porque su licencia es exclusiva de Wix.
