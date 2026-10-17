#!/usr/bin/env python3
"""Descarga las imágenes y fuentes del sitio original (Wix) según tools/assets.json.

Uso (desde la raíz del repo):
    python3 tools/descargar_assets.py            # descarga solo lo que falta
    python3 tools/descargar_assets.py --force    # vuelve a descargar todo

Por qué existe: el sitio se copió desde Wix y este manifiesto es la fuente única
de "de dónde salió cada asset". Las URLs de Wix aceptan transformaciones
(/v1/fill/w_..,h_..) que usamos para bajar versiones web-optimizadas en vez de
los originales de 3-8 MB. El campo "original" guarda la URL sin transformar por
si alguna vez se necesita la máxima calidad.

Solo librería estándar. "convert": "jpg" usa `sips` (macOS) para pasar PNG a JPEG.
"""
from __future__ import annotations

import json
import re
import shutil
import subprocess
import sys
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "tools" / "assets.json"
UA = ("Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/129.0 Safari/537.36")


def fetch(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def google_font_url(family: str, weight: int, style: str) -> str:
    """Devuelve la URL woff2 del subset 'latin' de una fuente de Google Fonts."""
    ital = 1 if style == "italic" else 0
    fam = family.replace(" ", "+")
    css_url = f"https://fonts.googleapis.com/css2?family={fam}:ital,wght@{ital},{weight}&display=swap"
    css = fetch(css_url).decode("utf-8")
    # Cada bloque viene precedido por un comentario con el subset: /* latin */
    for m in re.finditer(r"/\*\s*([\w-]+)\s*\*/\s*@font-face\s*\{([^}]*)\}", css):
        if m.group(1) == "latin":
            return re.search(r"url\(([^)]+\.woff2)\)", m.group(2)).group(1)
    raise RuntimeError(f"No encontré subset latin para {family} {weight} {style}")


def save(dest: Path, data: bytes, convert: str | None) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    if convert == "jpg":
        tmp = dest.with_suffix(".tmp-src")
        tmp.write_bytes(data)
        subprocess.run(["sips", "-s", "format", "jpeg", "-s", "formatOptions", "85",
                        str(tmp), "--out", str(dest)], check=True, capture_output=True)
        tmp.unlink()
    else:
        dest.write_bytes(data)


def main() -> int:
    force = "--force" in sys.argv
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    if any(i.get("convert") == "jpg" for i in manifest.get("images", [])) and not shutil.which("sips"):
        print("Aviso: 'sips' no está disponible; las conversiones a JPEG van a fallar.")
    errors = 0
    jobs = []
    for item in manifest.get("images", []) + manifest.get("fonts", []):
        jobs.append((item["dest"], lambda i=item: i["src"], item.get("convert")))
    for gf in manifest.get("google_fonts", []):
        jobs.append((gf["dest"],
                     lambda g=gf: google_font_url(g["family"], g["weight"], g.get("style", "normal")),
                     None))
    for dest_rel, get_url, convert in jobs:
        dest = ROOT / dest_rel
        if dest.exists() and not force:
            continue
        try:
            url = get_url()
            save(dest, fetch(url), convert)
            print(f"ok   {dest_rel}  ({dest.stat().st_size // 1024} KB)")
        except Exception as exc:  # noqa: BLE001 - reportar y seguir con el resto
            errors += 1
            print(f"FAIL {dest_rel}: {exc}")
    print("Listo." if not errors else f"Terminó con {errors} errores.")
    return 1 if errors else 0


if __name__ == "__main__":
    sys.exit(main())
