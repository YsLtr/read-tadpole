"""Generate the ReadTadpole extension icons.

Run from the repository root:

    python scripts/generate-icons.py

The mark is a tadpole: a round head with a tapering tail, drawn from analytic
shapes so every size stays crisp. Inactive icons put a deep-teal tadpole on the
cream surface the UI uses; active icons put the same tadpole on the brand gold,
which is what the toolbar shows while the extension is translating a page.

Palette
-------
cream       the options/popup surface
brand gold  --rf-brand from src/assets/styles/theme.css, i.e. oklch(76.034% 0.12361 82.191)
ink         deep teal, >= 5:1 contrast against both surfaces
"""

from __future__ import annotations

import math
from pathlib import Path

from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "public" / "icon"
LOGO = ROOT / "src" / "assets" / "icons" / "read-tadpole.png"

CREAM = (246, 243, 231, 255)
INK = (20, 69, 63, 255)
BRAND = "oklch(76.034% 0.12361 82.191)"

SIZES = (16, 32, 48, 96, 128)
SUPERSAMPLE = 8
ROTATION_DEG = -24

# The in-app lockup is generated once, large enough to stay sharp when a doc
# surface or the subtitles button scales it up.
LOGO_SIZE = 256


def oklch_to_rgb(oklch: str) -> tuple[int, int, int]:
    """Convert an `oklch(L% C H)` string to 8-bit sRGB (D65)."""
    body = oklch[oklch.index("(") + 1 : oklch.rindex(")")]
    chunks = body.replace(",", " ").split()
    lightness = float(chunks[0].rstrip("%")) / 100
    chroma = float(chunks[1])
    hue = math.radians(float(chunks[2]))

    a = chroma * math.cos(hue)
    b = chroma * math.sin(hue)

    l_ = lightness + 0.3963377774 * a + 0.2158037573 * b
    m_ = lightness - 0.1055613458 * a - 0.0638541728 * b
    s_ = lightness - 0.0894841775 * a - 1.2914855480 * b

    l, m, s = l_**3, m_**3, s_**3

    linear = (
        4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
        -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
        -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s,
    )

    def encode(channel: float) -> int:
        channel = min(max(channel, 0.0), 1.0)
        srgb = (
            12.92 * channel
            if channel <= 0.0031308
            else 1.055 * channel ** (1 / 2.4) - 0.055
        )
        return round(srgb * 255)

    return tuple(encode(c) for c in linear)  # type: ignore[return-value]


GOLD = (*oklch_to_rgb(BRAND), 255)


def rounded_square(size: int, fill: tuple[int, int, int, int]) -> Image.Image:
    image = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(image).rounded_rectangle(
        (0, 0, size - 1, size - 1), radius=round(size * 0.22), fill=fill
    )
    return image


HEAD_AT = (0.355, 0.375)
HEAD_RADIUS = 0.140
TAIL_CTRL_1 = (0.560, 0.330)
TAIL_CTRL_2 = (0.705, 0.700)
TAIL_TIP = (0.880, 0.640)
TAIL_BASE_WIDTH = 0.160
TAIL_MIN_WIDTH = 0.050
EYE_AT = (0.392, 0.338)
EYE_RADIUS = 0.030


def tail_polygon(size: int) -> list[tuple[float, float]]:
    """Tapered tail from the head centre, with a flick at the tip."""

    def point(axis: int, t: float) -> float:
        p0 = HEAD_AT[axis] * size
        p1 = TAIL_CTRL_1[axis] * size
        p2 = TAIL_CTRL_2[axis] * size
        p3 = TAIL_TIP[axis] * size
        u = 1 - t
        return u**3 * p0 + 3 * u**2 * t * p1 + 3 * u * t**2 * p2 + t**3 * p3

    def tangent(axis: int, t: float) -> float:
        p0 = HEAD_AT[axis] * size
        p1 = TAIL_CTRL_1[axis] * size
        p2 = TAIL_CTRL_2[axis] * size
        p3 = TAIL_TIP[axis] * size
        u = 1 - t
        return 3 * u**2 * (p1 - p0) + 6 * u * t * (p2 - p1) + 3 * t**2 * (p3 - p2)

    steps = 160
    upper: list[tuple[float, float]] = []
    lower: list[tuple[float, float]] = []
    for index in range(steps + 1):
        t = index / steps
        x, y = point(0, t), point(1, t)
        dx, dy = tangent(0, t), tangent(1, t)
        length = math.hypot(dx, dy) or 1.0
        nx, ny = -dy / length, dx / length
        half = max(TAIL_MIN_WIDTH, TAIL_BASE_WIDTH * (1 - t) ** 0.80) * size / 2
        upper.append((x + nx * half, y + ny * half))
        lower.append((x - nx * half, y - ny * half))
    return upper + lower[::-1]


def draw_tadpole(
    size: int,
    ink: tuple[int, int, int, int],
    eye: tuple[int, int, int, int],
    draw_eye: bool,
) -> Image.Image:
    layer = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(layer)

    draw.polygon(tail_polygon(size), fill=ink)

    head_centre = (HEAD_AT[0] * size, HEAD_AT[1] * size)
    head_radius = HEAD_RADIUS * size
    draw.ellipse(
        (
            head_centre[0] - head_radius,
            head_centre[1] - head_radius,
            head_centre[0] + head_radius,
            head_centre[1] + head_radius,
        ),
        fill=ink,
    )

    if draw_eye:
        eye_centre = (EYE_AT[0] * size, EYE_AT[1] * size)
        eye_radius = EYE_RADIUS * size
        draw.ellipse(
            (
                eye_centre[0] - eye_radius,
                eye_centre[1] - eye_radius,
                eye_centre[0] + eye_radius,
                eye_centre[1] + eye_radius,
            ),
            fill=eye,
        )
    return layer


def render(size: int, active: bool) -> Image.Image:
    canvas = size * SUPERSAMPLE
    background = rounded_square(canvas, GOLD if active else CREAM)
    tadpole = draw_tadpole(
        canvas,
        INK,
        GOLD if active else CREAM,
        # Below 48 px an eye would eat a third of the head once antialiased, so
        # the smaller sizes rely on the silhouette alone.
        draw_eye=size >= 48,
    )
    # Normalise the mark to a fixed share of the canvas so every size carries the
    # same optical weight instead of inheriting the drawing's aspect ratio.
    bbox = tadpole.getbbox()
    if bbox:
        tadpole = tadpole.crop(bbox)
        # Tilt the mark so its long axis runs corner to corner: a horizontal
        # tadpole leaves most of a square icon empty.
        tadpole = tadpole.rotate(ROTATION_DEG, expand=True, resample=Image.BICUBIC)
        bbox = tadpole.getbbox()
        if bbox:
            tadpole = tadpole.crop(bbox)
        target = round(canvas * 0.78)
        scale = min(target / tadpole.width, target / tadpole.height)
        resized = tadpole.resize(
            (max(1, round(tadpole.width * scale)), max(1, round(tadpole.height * scale))),
            Image.LANCZOS,
        )
        tadpole = Image.new("RGBA", (canvas, canvas), (0, 0, 0, 0))
        tadpole.alpha_composite(
            resized,
            ((canvas - resized.width) // 2, (canvas - resized.height) // 2),
        )
    return Image.alpha_composite(background, tadpole).resize(
        (size, size), Image.LANCZOS
    )


def render_logo(size: int) -> Image.Image:
    """The lockup used inside the UI: the same cream tile as the toolbar icon.

    Reusing the tile rather than a bare mark keeps one silhouette across the
    toolbar, the subtitles button and any doc surface — the tadpole never has to
    rely on whatever happens to sit behind it.
    """
    return render(size, active=False)


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for size in SIZES:
        render(size, active=False).save(OUTPUT / f"{size}.png", optimize=True)
    for size in (16, 32, 48):
        render(size, active=True).save(OUTPUT / f"{size}-active.png", optimize=True)

    LOGO.parent.mkdir(parents=True, exist_ok=True)
    render_logo(LOGO_SIZE).save(LOGO, optimize=True)

    print(
        f"wrote {len(SIZES) + 3} icons to {OUTPUT.relative_to(ROOT)} "
        f"and the logo to {LOGO.relative_to(ROOT)}"
    )


if __name__ == "__main__":
    main()
