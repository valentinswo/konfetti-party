"""Importiert KI-Bilder für den 20€ Draft.

Aufruf:  python3 tools/bilder-import.py <paket-id> "<Name des Dings>=<pfad/zum/bild.png>" ...
Beispiel: python3 tools/bilder-import.py garten "Hot Tub=~/Downloads/hottub.png"

- schneidet transparente Ränder ab, verkleinert auf max. 512 px, speichert als WebP
- legt die Datei unter img/draft/<paket>/<slug>.webp ab
- trägt sie in js/data/draft-images.js ein (Name → Pfad)
"""
import json, os, re, sys
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST = os.path.join(ROOT, "js/data/draft-images.js")

def slug(s):
    s = s.lower().replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]+", "-", s).strip("-")

def load():
    if not os.path.exists(MANIFEST): return {}
    txt = open(MANIFEST, encoding="utf-8").read()
    return json.loads(re.search(r"=\s*(\{.*\});", txt, re.S).group(1))

def save(m):
    with open(MANIFEST, "w", encoding="utf-8") as f:
        f.write("// 🖼️ Bilder für den 20€ Draft (Name des Dings → Bilddatei).\n")
        f.write("// Wird von tools/bilder-import.py gepflegt. Dinge ohne Bild zeigen ihre Emoji-Szene.\n")
        f.write("const DRAFT_IMAGES = " + json.dumps(dict(sorted(m.items())), ensure_ascii=False, indent=1) + ";\n")
        f.write('if (typeof module !== "undefined") module.exports = DRAFT_IMAGES;\n')

def convert(src, dst, size=512):
    im = Image.open(src).convert("RGBA")
    bbox = im.getchannel("A").point(lambda a: 255 if a > 8 else 0).getbbox()
    if bbox: im = im.crop(bbox)
    w, h = im.size; pad = int(max(w, h) * 0.04)
    canvas = Image.new("RGBA", (w + 2 * pad, h + 2 * pad), (0, 0, 0, 0)); canvas.paste(im, (pad, pad))
    canvas.thumbnail((size, size), Image.LANCZOS)
    canvas.save(dst, "WEBP", quality=82, method=6)

if __name__ == "__main__":
    pack, pairs = sys.argv[1], sys.argv[2:]
    m = load()
    os.makedirs(os.path.join(ROOT, "img/draft", pack), exist_ok=True)
    for p in pairs:
        name, path = p.split("=", 1)
        rel = f"img/draft/{pack}/{slug(name)}.webp"
        convert(os.path.expanduser(path), os.path.join(ROOT, rel))
        m[name] = rel
        print(f"✅ {name} → {rel} ({os.path.getsize(os.path.join(ROOT, rel)) // 1024} KB)")
    save(m)
