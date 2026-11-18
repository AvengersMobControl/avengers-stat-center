"""Compare repo character art pixels with the leader's exact approved Library originals.
An optimized PNG byte stream may differ but RGBA pixels must match exactly.
"""
import hashlib
from pathlib import Path
from PIL import Image

EXPECTED = {
    "AV_ExplodonSpider.png": ("1254x1254", "5f5a0ebc276ae57f70ca2b99952a7477bc54aacd1bcbefa6085b10fc9a1415bb"),
    "AV_ExplodonTerrorist.png": ("1254x1254", "50099fcb36bc86558d387c4982f6754393c3de3a0fa342928889820e80812ffe"),
    "AV_KaboomStar.png": ("1254x1254", "53402a353a40f6651231263a6407c8c7abd404d02db3d6eab273f10f81c5a256"),
    "AV_RaccoonRocket.png": ("1254x1254", "ef75fdb2dbd7277a34c15e0deb1623a57952a52a1712434a7eeebbbf39ae48a0"),
}
root = Path(__file__).resolve().parents[1] / "assets" / "characters"
if __name__ == "__main__":
    for filename, (size, digest) in EXPECTED.items():
        image = Image.open(root / filename).convert("RGBA")
        actual = hashlib.sha256(image.tobytes()).hexdigest()
        dims = f"{image.width}x{image.height}"
        print(f"{filename}: dimensions={dims} pixels_sha256={actual} match={actual==digest and dims==size}")
        if actual != digest or dims != size:
            raise SystemExit("Character art does not match leader-approved source pixels; do not composite or dispatch")
