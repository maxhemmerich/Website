#!/usr/bin/env python
"""tools/make-favicon.py — the committed generator for the site's favicon pair.

Writes BOTH files from one 16x16 pixel-art mark, so `favicon.ico` (repo root) and
`assets/favicon.svg` can never drift apart:

    python tools/make-favicon.py

The mark is the pixel "M" monogram, drawn on the same 16x16 grid as the desktop
icon set (assets/icons/*.svg) and as flat <rect>/path pixel geometry — no
gradients, no anti-aliasing, no external font.

RECOLOURED 2026-09-30 (Max: "update the tab icon"). The mark was magenta-on-void
with a cyan drop shadow — the REJECTED dark build's rave palette (§3: --rave-void
#07060f, --rave-magenta #ff2ea6, --rave-cyan #22e3ff), which is what a near-black
square with pink pixels was doing in a tab next to a white, blue-accented page.
It now carries the shipping light theme: a solid --accent tile with the M knocked
out in white. Three candidates were rendered at 16/32/48px on both a light and a
dark tab bar and Max picked this one; flat beat the drop-shadow variant because at
16px the shadow muddies the counter of the M. SHADOW below is candidate B's
--accent-strong offset, kept as one constant so the alternative is a one-line
re-run rather than a re-draw.

favicon.ico carries 16/32/48 px frames. PIL is required (available here).
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)

TILE = (27, 111, 245)     # --accent         #1B6FF5
MARK = (255, 255, 255)    # --bg             #FFFFFF, knocked out of the tile
SHADOW = None             # candidate B: (11, 85, 204) --accent-strong

# 16x16 pixel grid. 'M' = the mark, '.' = the tile.
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
    """16x16 RGB pixmap: the tile, the optional offset shadow, the mark on top."""
    n = 16
    px = [[TILE for _ in range(n)] for _ in range(n)]
    if SHADOW:
        for y, row in enumerate(GRID):
            for x, c in enumerate(row):
                if c == "M" and x + 1 < n and y + 1 < n:
                    px[y + 1][x + 1] = SHADOW
    for y, row in enumerate(GRID):
        for x, c in enumerate(row):
            if c == "M":
                px[y][x] = MARK
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
    parts = [
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16"'
        ' role="img" aria-label="Max Hemmerich">',
        '  <title>Max Hemmerich</title>',
        '  <rect width="16" height="16" fill="%s"/>' % hexs(TILE),
    ]
    if SHADOW:
        parts.append('  <path fill="%s" shape-rendering="crispEdges" d="%s"/>' % (hexs(SHADOW), svg_d(px, SHADOW)))
    parts.append('  <path fill="%s" shape-rendering="crispEdges" d="%s"/>' % (hexs(MARK), svg_d(px, MARK)))
    parts.append("</svg>")
    svg = "\n".join(parts) + "\n"
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
