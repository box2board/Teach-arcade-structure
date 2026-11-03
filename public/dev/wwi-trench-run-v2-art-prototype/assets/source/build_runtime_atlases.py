"""Convert the approved source artwork sheets to compact browser runtime atlases."""

from pathlib import Path
from PIL import Image

HERE = Path(__file__).resolve().parent
RUNTIME = HERE.parent / "runtime"
RUNTIME.mkdir(parents=True, exist_ok=True)

for stem in ("character", "obstacle", "terrain", "props", "background"):
    source = HERE / f"{stem}-atlas.webp"
    target = RUNTIME / f"{stem}-atlas.webp"
    with Image.open(source) as image:
        image.save(target, "WEBP", quality=90, method=6, lossless=False)
        print(f"{target.name}: {image.width}x{image.height} -> {target.stat().st_size:,} bytes")
