#!/usr/bin/env python
"""tools/optimize-og.py — shrink the generated share card without changing its size.

Usage: python tools/optimize-og.py assets/og.png

1. Re-encodes losslessly (PIL `optimize=True`) and keeps the smaller file.
2. Only if the file is still over BUDGET, palette-quantises to 256 colours with
   Floyd-Steinberg dithering. The card is dark with smooth neon gradients, so the
   dither matters; width/height are never touched (W-59 decodes 1200x630).

Exit 0 on success, non-zero if PIL is missing (the caller treats that as a warning).
"""
import os
import sys

BUDGET = 240 * 1024

try:
    from PIL import Image
except ImportError:  # pragma: no cover
    sys.stderr.write("PIL unavailable\n")
    sys.exit(3)


def main():
    if len(sys.argv) < 2:
        sys.stderr.write("usage: optimize-og.py <png>\n")
        return 2
    p = sys.argv[1]
    before = os.path.getsize(p)
    w, h = Image.open(p).size

    im = Image.open(p).convert("RGB")
    im.save(p, "PNG", optimize=True)
    lossless = os.path.getsize(p)
    if lossless > before:
        sys.stdout.write("  lossless re-encode grew the file; keeping the original\n")
        return 1

    note = "lossless"
    if lossless > BUDGET:
        q = im.quantize(colors=256, method=Image.MEDIANCUT, dither=Image.FLOYDSTEINBERG)
        q.save(p, "PNG", optimize=True)
        note = "256-colour dithered"
    after = os.path.getsize(p)
    if Image.open(p).size != (w, h):
        sys.stderr.write("size changed!\n")
        return 4
    sys.stdout.write("  optimize: %d B -> %d B (%s), %dx%d\n" % (before, after, note, w, h))
    return 0


if __name__ == "__main__":
    sys.exit(main())
