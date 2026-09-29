#!/usr/bin/env python
"""portrait-crop.py — re-crop assets/portrait.jpg from the 2268x4032 master.

W-85 fixes the shipped asset at 600x600 <=180KB, so every candidate is rendered to
that size and the winner is copied over assets/portrait.jpg. No upscaling: each crop
box is >=600px on both sides, so the 600 render is always a downscale.

Max's note, 2026-09-29: "centre the picture on my face, my forehead is cut off".
Measured on the master: head top y~1659, chin y~2320, head x 1260..1848 (centre 1554).
Candidates differ only in how much headroom they leave above the head top and how
centred the head's own centre is in the frame.
"""
import os
from PIL import Image

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(REPO, "assets", "portrait-raw.jpg")
OUT = os.path.join(REPO, ".buildloop", "tmp")

HEAD_TOP, CHIN = 1659, 2320
HEAD_CX = 1554

img = Image.open(RAW)
W, H = img.size
print("master", W, H)

# (name, size, head_cx_target_frac, headroom_frac)
CANDS = [
    ("a", 1488, 0.50, 0.22),
    ("b", 1488, 0.50, 0.14),
    ("c", 1700, 0.50, 0.20),
    ("d", 1300, 0.52, 0.26),
]

for name, size, cx_frac, headroom in CANDS:
    left = int(round(HEAD_CX - cx_frac * size))
    left = max(0, min(left, W - size))
    top = int(round(HEAD_TOP - headroom * size))
    top = max(0, min(top, H - size))
    box = (left, top, left + size, top + size)
    p = os.path.join(OUT, f"portrait-{name}.png")
    img.crop(box).resize((600, 600), Image.LANCZOS).save(p)
    print(f"{name} box={box} head_cx_frac={(HEAD_CX-left)/size:.3f} "
          f"head_top_frac={(HEAD_TOP-top)/size:.3f} -> {p}")
