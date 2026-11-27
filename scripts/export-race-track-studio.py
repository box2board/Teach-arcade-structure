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
ios_loader = r'''<script>
/* Build Blob-backed module URLs at runtime. This avoids iOS file-preview failures
   caused by very large data-URL modules while keeping the preview self-contained. */
(function startRaceStudio() {
  var map = JSON.parse(document.getElementById('embedded-modules').textContent).imports;
  var urls = {};
  var decoder = new TextDecoder();
  function decode(url) {
    var binary = atob(url.slice(url.indexOf(',') + 1));
    var bytes = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    return decoder.decode(bytes);
  }
  function moduleUrl(name, trail) {
    if (urls[name]) return urls[name];
    trail = trail || [];
    if (trail.indexOf(name) !== -1) throw new Error('Circular module: ' + name);
    var source = decode(map[name]);
    var nextTrail = trail.concat(name);
    source = source.replace(/(from\s*|import\s*)(["'])(ta-[\w-]+)\2/g,
      function (_, prefix, quote, dependency) {
        return prefix + quote + moduleUrl(dependency, nextTrail) + quote;
      });
    urls[name] = URL.createObjectURL(new Blob([source], { type: 'text/javascript' }));
    return urls[name];
  }
  Promise.resolve().then(function () {
    return import(moduleUrl('ta-app'));
  }).then(function () {
    requestAnimationFrame(function () { window.dispatchEvent(new Event('resize')); });
  }).catch(function (error) {
    var status = document.getElementById('studio-startup');
    if (status && status.textContent.startsWith('Loading')) {
      status.textContent = 'The 3D studio could not start here. Try opening the preview in Safari.';
    }
    console.error(error);
  });
})();
</script>'''
html = (studio/'index.html').read_text()
css = re.sub(r'@import\s+url\(.*?\);', '', (studio/'studio.css').read_text())
html = re.sub(r'<link[^>]+href="studio.css"[^>]*>', lambda _: '<style>'+css+'</style>', html)
html = re.sub(r'<script type="module" src="app.js"></script>', lambda _: '<script type="application/json" id="embedded-modules">'+json.dumps({'imports': imports})+'</script>'+ios_loader, html)
output = Path(sys.argv[1] if len(sys.argv)>1 else '/tmp/Race_Track_Studio_Playable.html')
output.write_text(html)
print(f'{output}: {len(html.encode()):,} bytes; {len(imports)} embedded modules')
