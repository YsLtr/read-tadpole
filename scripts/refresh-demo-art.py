"""Swap the pre-rename logo out of the bundled UI screenshots.

`src/assets/demo/*.png` are picture-frame mockups of the extension's in-page UI.
The two older ones still carried the previous project's emerald emblem. This
script finds that emblem, erases it against the surrounding surface, and paints
the ReadTadpole mark in its place: a cream disc carrying the deep-teal tadpole,
matching the toolbar icon.

Run from the repository root after `scripts/generate-icons.py`:

    python scripts/refresh-demo-art.py
"""

from __future__ import annotations

import importlib.util
from collections import Counter
from pathlib import Path

from PIL import Image, ImageDraw

SCRIPTS = Path(__file__).resolve().parent
_spec = importlib.util.spec_from_file_location("generate_icons", SCRIPTS / "generate-icons.py")
assert _spec and _spec.loader
generate_icons = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(generate_icons)

CREAM = generate_icons.CREAM
INK = generate_icons.INK
ROTATION_DEG = generate_icons.ROTATION_DEG
SUPERSAMPLE = generate_icons.SUPERSAMPLE
draw_tadpole = generate_icons.draw_tadpole

ROOT = SCRIPTS.parent
DEMO = ROOT / "src" / "assets" / "demo"

# The retired emblem's only saturated colour, and how far a pixel may drift from
# it and still count as part of the mark.
OLD_EMBLEM = (48, 194, 140)
OLD_EMBLEM_TOLERANCE = 40

# Share of the disc the tadpole fills, so the mark keeps the same breathing room
# it has inside the square toolbar icon.
MARK_COVERAGE = 0.72
ERASE_PADDING = 2


def emblem_pixels(image: Image.Image) -> list[tuple[int, int]]:
    width, height = image.size
    pixels = image.load()
    hits: list[tuple[int, int]] = []
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            if a < 8:
                continue
            if (
                abs(r - OLD_EMBLEM[0]) + abs(g - OLD_EMBLEM[1]) + abs(b - OLD_EMBLEM[2])
                <= OLD_EMBLEM_TOLERANCE
            ):
                hits.append((x, y))
    return hits


def surface_colour(image: Image.Image, box: tuple[int, int, int, int]) -> tuple[int, int, int]:
    """The most common opaque colour on the ring just outside `box`."""
    x0, y0, x1, y1 = box
    pad = 4
    crop = image.crop((x0 - pad, y0 - pad, x1 + pad + 1, y1 + pad + 1)).convert("RGBA")
    width, height = crop.size
    pixels = crop.load()
    ring = Counter()
    for y in range(height):
        for x in range(width):
            if pad <= x < width - pad and pad <= y < height - pad:
                continue
            r, g, b, a = pixels[x, y]
            if a > 200:
                ring[(r, g, b)] += 1
    return ring.most_common(1)[0][0]


def paint_mark(canvas: int, radius: float) -> Image.Image:
    """A cream disc carrying the ink tadpole, drawn on a transparent canvas."""
    size = canvas * SUPERSAMPLE
    centre = size / 2
    disc_radius = radius * SUPERSAMPLE

    tadpole = draw_tadpole(size, INK, CREAM, draw_eye=True)
    bbox = tadpole.getbbox()
    tadpole = tadpole.crop(bbox).rotate(ROTATION_DEG, expand=True, resample=Image.BICUBIC)
    bbox = tadpole.getbbox()
    tadpole = tadpole.crop(bbox)

    target = round(disc_radius * 2 * MARK_COVERAGE)
    factor = min(target / tadpole.width, target / tadpole.height)
    tadpole = tadpole.resize(
        (max(1, round(tadpole.width * factor)), max(1, round(tadpole.height * factor))),
        Image.LANCZOS,
    )

    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(layer).ellipse(
        (centre - disc_radius, centre - disc_radius, centre + disc_radius, centre + disc_radius),
        fill=CREAM,
    )
    layer.alpha_composite(tadpole, ((size - tadpole.width) // 2, (size - tadpole.height) // 2))
    return layer.resize((canvas, canvas), Image.LANCZOS)


def replace_emblem(path: Path) -> str:
    image = Image.open(path).convert("RGBA")
    hits = emblem_pixels(image)
    if not hits:
        return f"{path.name}: no retired emblem found"

    xs = [x for x, _ in hits]
    ys = [y for _, y in hits]
    x0, x1 = min(xs), max(xs)
    y0, y1 = min(ys), max(ys)
    centre_x = (x0 + x1) / 2
    centre_y = (y0 + y1) / 2
    radius = max(x1 - x0, y1 - y0) / 2

    surface = surface_colour(image, (x0, y0, x1, y1))

    # Erase the retired emblem, antialiased fringe included, back to the surface
    # it sat on. Only pixels that differ from that surface are touched, so the
    # card seams around it survive.
    pixels = image.load()
    erase_radius = radius + ERASE_PADDING
    for y in range(int(centre_y - erase_radius) - 1, int(centre_y + erase_radius) + 2):
        for x in range(int(centre_x - erase_radius) - 1, int(centre_x + erase_radius) + 2):
            if not (0 <= x < image.width and 0 <= y < image.height):
                continue
            if (x - centre_x) ** 2 + (y - centre_y) ** 2 > erase_radius**2:
                continue
            r, g, b, a = pixels[x, y]
            if a < 8:
                continue
            if abs(r - surface[0]) + abs(g - surface[1]) + abs(b - surface[2]) <= 24:
                continue
            pixels[x, y] = (*surface, a)

    box = round(radius * 2) + 2
    mark = paint_mark(box, radius)
    image.alpha_composite(
        mark,
        (round(centre_x - box / 2), round(centre_y - box / 2)),
    )

    image.save(path, optimize=True)
    return (
        f"{path.name}: replaced the retired emblem at "
        f"({round(centre_x)}, {round(centre_y)}) r={radius:.1f}"
    )


def main() -> None:
    targets = sorted(DEMO.glob("*.png"))
    if not targets:
        raise SystemExit(f"no demo screenshots in {DEMO}")
    for path in targets:
        print(replace_emblem(path))


if __name__ == "__main__":
    main()
