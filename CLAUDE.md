# CLAUDE.md — enrutador

Copia estática del sitio Wix de Johnes & Luccas. Los HTML se generan con `python3 build.py` desde `_src/`:
nunca editar a mano `index.html` ni `<slug>/index.html`.

| Doc | Léelo cuando… |
|---|---|
| [README.md](README.md) | necesites correr, editar o publicar el sitio; estado por página |
| [docs/arquitectura.md](docs/arquitectura.md) | vayas a cambiar código: generador, CSS, fuentes/licencias, parallax, móvil, diferencias con el original, checklists y cicatrices |
| [tools/assets.json](tools/assets.json) | agregues o rastrees una imagen/fuente |

Antes de commitear: `python3 build.py --check`.
