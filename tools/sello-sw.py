"""Sella el service worker de la plataforma al publicar (lo corre GitHub Actions, ver .github/workflows/pages.yml).

- VERSION = prefijo + código del commit: cada publicación es una versión nueva, sin subirla a mano.
- ARCHIVOS = todos los archivos publicados de la carpeta: ninguno puede quedar por fuera de la precarga.

Uso: python3 tools/sello-sw.py <carpeta publicada de la plataforma> <sha del commit>
"""
import os
import re
import sys

EXTENSIONES = ('.html', '.js', '.css', '.png', '.jpg', '.svg', '.ico', '.webmanifest', '.json', '.woff2')


def main(carpeta, sha):
    ruta_sw = os.path.join(carpeta, 'sw.js')
    with open(ruta_sw, encoding='utf-8') as f:
        sw = f.read()

    archivos = []
    for raiz, _, nombres in os.walk(carpeta):
        for n in nombres:
            rel = os.path.relpath(os.path.join(raiz, n), carpeta).replace(os.sep, '/')
            if rel != 'sw.js' and n != 'package.json' and rel.lower().endswith(EXTENSIONES):
                archivos.append(rel)
    archivos.sort()
    lista = ",\n".join(["  './'"] + [f"  '{a}'" for a in archivos])

    prefijo = re.search(r"const VERSION = '([a-z-]+)-", sw)
    prefijo = prefijo.group(1) if prefijo else 'cartera-asesor'
    sw, n1 = re.subn(r"const VERSION = '[^']*';", f"const VERSION = '{prefijo}-{sha[:10]}';", sw, count=1)
    sw, n2 = re.subn(r"const ARCHIVOS = \[[\s\S]*?\];", f"const ARCHIVOS = [\n{lista},\n];", sw, count=1)
    if n1 != 1 or n2 != 1:
        sys.exit('No se encontró VERSION o ARCHIVOS en sw.js')

    with open(ruta_sw, 'w', encoding='utf-8') as f:
        f.write(sw)
    print(f'sw.js sellado: {prefijo}-{sha[:10]} · {len(archivos)} archivos en precarga')


if __name__ == '__main__':
    main(sys.argv[1], sys.argv[2])
