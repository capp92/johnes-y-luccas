#!/usr/bin/env python3
"""Genera el sitio estático de Johnes & Luccas a partir de _src/.

Uso (desde la raíz del repo):
    python3 build.py           # regenera todas las páginas
    python3 build.py --check   # falla (exit 1) si algún HTML generado está desactualizado

Cómo funciona (detalle en docs/arquitectura.md):
  - _src/layout.html     esqueleto común: <head>, header, footer, barra móvil.
  - _src/partials/*.html bloques reutilizables, se incluyen con {{> nombre clave="valor"}}.
  - _src/pages/*.html    una página por archivo, con front matter entre líneas '---'.
  - {{variable}} se reemplaza por el valor del front matter, de los argumentos del
    partial o de las variables que calcula este script (root, canonical, nav-*, ...).
    {{variable|valor}} usa "valor" si la variable no está definida.

Los .html generados se commitean (la raíz del repo es el sitio publicable), pero
NO se editan a mano: cada uno lleva un comentario que apunta a su fuente.

Solo librería estándar.
"""
from __future__ import annotations

import html
import json
import re
import sys
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent
SRC = ROOT / "_src"
SITE_URL = "https://www.johnesyluccas.cl"  # dominio canónico (og:url, canonical)
NAV_KEYS = ["inicio", "nosotros", "testimonios", "servicios", "contacto"]

# Sitio en construcción: en _src/pages, lo que va entre <!-- en-construccion --> y <!-- /en-construccion -->
# se reemplaza por el letrero (_src/partials/en-construccion.html) y no llega al HTML publicado.
# Con False se publica todo el contenido (los marcadores se borran).
EN_CONSTRUCCION = True
CONSTRUCCION_RE = re.compile(r"<!--\s*en-construccion\s*-->.*?<!--\s*/en-construccion\s*-->", re.S)
CONSTRUCCION_MARCAS_RE = re.compile(r"[ \t]*<!--\s*/?en-construccion\s*-->[ \t]*\n?")
REQUIRED_META = ["title", "description", "path", "nav"]

PARTIAL_RE = re.compile(r"\{\{>\s*([\w-]+)((?:\s+[\w-]+=\"[^\"]*\")*)\s*\}\}")
ARG_RE = re.compile(r"([\w-]+)=\"([^\"]*)\"")
VAR_RE = re.compile(r"\{\{\s*([\w-]+)(?:\|([^}]*))?\s*\}\}")


def parse_page(path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8")
    m = re.match(r"^---\n(.*?)\n---\n(.*)$", text, re.S)
    if not m:
        raise SystemExit(f"{path}: falta el front matter (bloque entre '---').")
    meta: dict[str, str] = {}
    for line in m.group(1).splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, _, value = line.partition(":")
        meta[key.strip()] = value.strip()
    missing = [k for k in REQUIRED_META if k not in meta]
    if missing:
        raise SystemExit(f"{path}: faltan claves en el front matter: {', '.join(missing)}")
    return meta, m.group(2)


def render(template: str, ctx: dict[str, str], source: str, depth: int = 0) -> str:
    if depth > 10:
        raise SystemExit(f"{source}: partials anidados demasiado profundo (¿ciclo?)")

    def include(m: re.Match) -> str:
        name = m.group(1)
        args = dict(ARG_RE.findall(m.group(2)))
        partial = SRC / "partials" / f"{name}.html"
        if not partial.exists():
            raise SystemExit(f"{source}: no existe el partial '{name}' ({partial})")
        return render(partial.read_text(encoding="utf-8"), {**ctx, **args}, f"partials/{name}.html", depth + 1)

    out = PARTIAL_RE.sub(include, template)

    def var(m: re.Match) -> str:
        key, default = m.group(1), m.group(2)
        if key in ctx:
            return ctx[key]
        if default is not None:
            return default
        raise SystemExit(f"{source}: variable sin definir {{{{{key}}}}}")

    return VAR_RE.sub(var, out)


def page_context(meta: dict[str, str], src_name: str) -> dict[str, str]:
    path = meta["path"].strip("/")
    depth = 0 if not path else path.count("/") + 1
    ctx = dict(meta)
    ctx["title"] = html.escape(meta["title"])
    ctx["description"] = html.escape(meta["description"])
    ctx["root"] = "../" * depth if depth else "./"
    ctx["canonical"] = f"{SITE_URL}/{path + '/' if path else ''}"
    ctx["canonical-enc"] = quote(ctx["canonical"], safe="")  # para ?url= de los botones de compartir
    ctx["site-url"] = SITE_URL
    ctx["source"] = f"_src/pages/{src_name}"
    ctx["body-class"] = meta.get("body_class", "")
    for key in NAV_KEYS:
        active = meta["nav"] == key
        ctx[f"nav-{key}"] = " is-active" if active else ""
        ctx[f"cur-{key}"] = ' aria-current="page"' if active else ""
    return ctx


def search_index(pages: list[tuple[dict[str, str], str]]) -> str:
    """Índice del buscador del header (assets/js/search-index.js)."""
    entries = []
    for meta, _ in pages:
        if meta.get("search", "si") == "no":
            continue
        entries.append({
            "t": meta.get("search_title") or meta["title"].split(" | ")[0],
            "u": meta["path"].strip("/") + ("/" if meta["path"].strip("/") else ""),
            "d": meta["description"],
            "k": meta.get("keywords", ""),
        })
    body = json.dumps(entries, ensure_ascii=False, indent=1)
    return ("// Generado por build.py a partir del front matter de _src/pages/ — no editar a mano.\n"
            f"window.JL_SEARCH_INDEX = {body};\n")


def build() -> dict[Path, str]:
    layout = (SRC / "layout.html").read_text(encoding="utf-8")
    pages = []
    for src in sorted((SRC / "pages").glob("*.html")):
        meta, body = parse_page(src)
        pages.append((meta, body))
        meta["_src"] = src.name
    outputs: dict[Path, str] = {}
    for meta, body in pages:
        ctx = page_context(meta, meta["_src"])
        if EN_CONSTRUCCION:
            body = CONSTRUCCION_RE.sub("{{> en-construccion}}", body)
        else:
            body = CONSTRUCCION_MARCAS_RE.sub("", body)
        if CONSTRUCCION_MARCAS_RE.search(body):  # quedó un marcador suelto: no publicar a medias
            raise SystemExit(f"{ctx['source']}: marcador en-construccion sin su pareja")
        ctx["content"] = render(body, ctx, ctx["source"]).strip("\n")
        out_html = render(layout, ctx, "layout.html")
        path = meta["path"].strip("/")
        out_file = ROOT / path / "index.html" if path else ROOT / "index.html"
        if out_file in outputs:
            raise SystemExit(f"Dos páginas generan el mismo archivo: {out_file}")
        outputs[out_file] = out_html
    outputs[ROOT / "assets" / "js" / "search-index.js"] = search_index(pages)
    return outputs


def main() -> int:
    check = "--check" in sys.argv
    outputs = build()
    stale = []
    for out_file, content in outputs.items():
        current = out_file.read_text(encoding="utf-8") if out_file.exists() else None
        if current == content:
            continue
        if check:
            stale.append(out_file)
        else:
            out_file.parent.mkdir(parents=True, exist_ok=True)
            out_file.write_text(content, encoding="utf-8")
            print(f"escrito  {out_file.relative_to(ROOT)}")
    if check:
        if stale:
            print("Desactualizados (corre `python3 build.py`):")
            for f in stale:
                print(f"  {f.relative_to(ROOT)}")
            return 1
        print(f"OK: {len(outputs)} archivos al día.")
        return 0
    print(f"Listo: {len(outputs)} archivos generados.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
