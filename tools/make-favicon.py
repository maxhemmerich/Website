#!/usr/bin/env python
"""tools/make-favicon.py — the committed generator for the site's favicon pair.

Writes BOTH files from one 16x16 pixel-art mark, so `favicon.ico` (repo root) and
`assets/favicon.svg` can never drift apart:

    python tools/make-favicon.py

The mark is the pixel "M" monogram in the rave palette (plan §3 tokens: --rave-void
#07060f, --rave-magenta #ff2ea6, --rave-cyan #22e3ff), drawn on the same 16x16 grid
as the desktop icon set (assets/icons/*.svg, owner A) and as flat <rect>/path pixel
geometry — no gradients, no anti-aliasing, no external font.

favicon.ico carries 16/32/48 px frames. PIL is required (available here).
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)

VOID = (7, 6, 15)        # --rave-void     #07060f
MAGENTA = (255, 46, 166)  # --rave-magenta  #ff2ea6
CYAN = (34, 227, 255)     # --rave-cyan     #22e3ff

# 16x16 pixel grid. 'M' = magenta stroke, '.' = empty (the void tile shows through).
GRID = [
    "................",
    "................",
    "..MM........MM..",
    "..MMM......MMM..",
    "..MMMM....MMMM..",
    "..MM.MM..MM.MM..",
    "..MM..MMMM..MM..",
    "..MM...MM...MM..",
    "..MM........MM..",
    "..MM........MM..",
    "..MM........MM..",
    "..MM........MM..",
    "..MM........MM..",
    "..MM........MM..",
    "................",
    "................",
]


def pixmap():
    """16x16 RGB pixmap: void tile, cyan drop-shadow offset (+1,+1), magenta M on top."""
    n = 16
    px = [[VOID for _ in range(n)] for _ in range(n)]
    for y, row in enumerate(GRID):
        for x, c in enumerate(row):
            if c == "M":
                if x + 1 < n and y + 1 < n:
                    px[y + 1][x + 1] = CYAN
    for y, row in enumerate(GRID):
        for x, c in enumerate(row):
            if c == "M":
                px[y][x] = MAGENTA
    return px


def runs(px, colour):
    """Horizontal runs of `colour`, as [y, x0, x1] triples (inclusive)."""
    out = []
    for y, row in enumerate(px):
        x = 0
        while x < len(row):
            if row[x] == colour:
                x0 = x
                while x + 1 < len(row) and row[x + 1] == colour:
                    x += 1
                out.append((y, x0, x))
            x += 1
    return out


def hexs(rgb):
    return "#%02x%02x%02x" % rgb


def svg_d(px, colour):
    """One compact path: a rect per horizontal run, in 16x16 user units."""
    d = []
    for y, x0, x1 in runs(px, colour):
        w = x1 - x0 + 1
        d.append("M%d %dh%dv1h-%dz" % (x0, y, w, w))
    return "".join(d)


def write_svg(path):
    px = pixmap()
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"'
        ' role="img" aria-label="Max Hemmerich">\n'
        '  <title>Max Hemmerich</title>\n'
        '  <rect width="16" height="16" fill="%s"/>\n'
        '  <path fill="%s" shape-rendering="crispEdges" d="%s"/>\n'
        '  <path fill="%s" shape-rendering="crispEdges" d="%s"/>\n'
        '</svg>\n' % (hexs(VOID), hexs(CYAN), svg_d(px, CYAN), hexs(MAGENTA), svg_d(px, MAGENTA))
    )
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(svg)
    return len(svg.encode("utf-8"))


def write_ico(path):
    from PIL import Image

    px = pixmap()
    small = Image.new("RGB", (16, 16))
    small.putdata([px[y][x] for y in range(16) for x in range(16)])
    big = small.resize((48, 48), Image.NEAREST)
    big.save(path, format="ICO", sizes=[(16, 16), (32, 32), (48, 48)])
    return os.path.getsize(path)


def main():
    svg = os.path.join(REPO, "assets", "favicon.svg")
    ico = os.path.join(REPO, "favicon.ico")
    os.makedirs(os.path.dirname(svg), exist_ok=True)
    print("assets/favicon.svg  %d B" % write_svg(svg))
    print("favicon.ico         %d B (16/32/48)" % write_ico(ico))
    return 0


if __name__ == "__main__":
    sys.exit(main())
