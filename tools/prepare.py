from pathlib import Path
import urllib.request
import json

root = Path(__file__).resolve().parents[1]
(root / 'vendor').mkdir(exist_ok=True)
(root / 'research').mkdir(exist_ok=True)
assets = {
    'three.module.js': 'https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js',
    'THREE-LICENSE.txt': 'https://cdn.jsdelivr.net/npm/three@0.170.0/LICENSE'
}
for name, url in assets.items():
    content = urllib.request.urlopen(url, timeout=35).read()
    (root / 'vendor' / name).write_bytes(content)
    print(f'{name}: {len(content)} bytes')
refs = {
    'nilo-readme.txt': 'https://raw.githubusercontent.com/ColinLeung-NiloCat/UnityURPToonLitShaderExample/master/README.md',
    'three-toon.html': 'https://threejs.org/docs/api/en/materials/MeshToonMaterial.html',
}
for name, url in refs.items():
    try:
        content = urllib.request.urlopen(url, timeout=25).read()
        (root / 'research' / name).write_bytes(content)
        print(f'{name}: {len(content)} bytes')
    except Exception as exc:
        print(f'{name}: {exc}')
