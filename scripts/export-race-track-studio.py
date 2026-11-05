#!/usr/bin/env python3
"""Build an offline review artifact without changing the modular source or site."""
from pathlib import Path
import base64
import json
import re
import sys
root = Path(__file__).resolve().parents[1]
studio = root / 'public/prototypes/race-track-studio'
imports = {}
modules = {f'ta-{f.stem}': f for f in studio.glob('*.js')}
modules['ta-three'] = root / 'public/assets/vendor/three-0.162.0/three.module.js'
modules['ta-orbit'] = root / 'public/assets/vendor/three-0.162.0/OrbitControls.js'
for name, path in modules.items():
    source = path.read_text()
    source = re.sub(r"(['\"])(?:../../assets/vendor/three-0\.162\.0/|\./)three\.module\.js\1", "'ta-three'", source)
    source = re.sub(r"(['\"])../../assets/vendor/three-0\.162\.0/OrbitControls\.js\1", "'ta-orbit'", source)
    for local in studio.glob('*.js'):
        source = source.replace(f'"./{local.name}"', f'"ta-{local.stem}"').replace(f"'./{local.name}'", f"'ta-{local.stem}'")
    imports[name] = 'data:text/javascript;base64,' + base64.b64encode(source.encode()).decode()
html = (studio/'index.html').read_text()
css = re.sub(r'@import\s+url\(.*?\);', '', (studio/'studio.css').read_text())
html = re.sub(r'<link[^>]+href="studio.css"[^>]*>', lambda _: '<style>'+css+'</style>', html)
html = re.sub(r'<script type="module" src="app.js"></script>', lambda _: '<script type="importmap">'+json.dumps({'imports': imports})+'</script><script type="module">import "ta-app";</script>', html)
output = Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/Race_Track_Studio_Playable.html')
output.write_text(html)
print(f'{output}: {len(html.encode()):,} bytes; {len(imports)} embedded modules')
