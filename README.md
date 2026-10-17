# johnes-y-luccas

Copia estática del sitio de **Johnes & Luccas** (estudio contable) — original en Wix:
<https://www.johnesyluccas.cl>. HTML + CSS + JS sin dependencias, con todas las imágenes y fuentes
descargadas al repo.

> Última revisión: 2026-10-17

## Estado

| Página | Ruta | Estado |
|---|---|---|
| Inicio | `/` | ✅ copiada y verificada contra el original (escritorio + móvil) |
| Resto del sitio (equipo, servicios, testimonios, contacto, FAQ, blog…) | `/<slug>/` | en progreso |

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

## Formularios

Sin backend, los formularios abren el programa de correo del visitante con el mensaje armado hacia
`contacto@johnesyluccas.cl`. Para recibirlos directamente, poner en `FORM_ENDPOINT` (al inicio de
`assets/js/site.js`) la URL de un servicio que acepte `POST` de `FormData` (Formspree, un endpoint
propio, etc.).

## Documentación

| Documento | Léelo cuando… |
|---|---|
| [docs/arquitectura.md](docs/arquitectura.md) | vayas a tocar el código: estructura, generador, tipografías y licencias, parallax, versión móvil, diferencias deliberadas con el original, checklists |
| [docs/referencia-original/](docs/referencia-original/) | quieras comparar con cómo se veía el sitio Wix |
| [tools/assets.json](tools/assets.json) | necesites saber de dónde salió una imagen o fuente (URL original en Wix) |

## Derechos

Los textos, fotos y logo son de Johnes & Luccas. Las fuentes incluidas son OFL/Apache (Anton, Barlow,
Cormorant Garamond, Roboto) y Optimus Princeps (subida por el dueño del sitio a Wix). DIN Next y
Helvetica, que usa el original, **no** se incluyen porque su licencia es exclusiva de Wix.
