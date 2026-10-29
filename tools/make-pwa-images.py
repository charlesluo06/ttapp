"""Regenerates the app icons and the iPhone launch images from the chapter logo.

Run from the repo root after replacing frontend/public/logo.png (the letters only, on a
transparent background; a bigger original makes sharper icons):

    python tools/make-pwa-images.py

Needs Pillow (pip install pillow). Writes into frontend/public/icons and frontend/public/splash.
The launch image shows what the intro screen shows at its first frame: maroon, with the logo
gray, so the fill animation continues from what the person is already looking at.
"""

from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
PUBLIC = ROOT / "frontend" / "public"
MAROON = (92, 0, 0, 255)  # --color-maroon-700, #5c0000
LOGO = Image.open(PUBLIC / "logo.png").convert("RGBA")


def place(canvas: Image.Image, logo: Image.Image, width: int) -> None:
    height = round(logo.height * width / logo.width)
    scaled = logo.resize((width, height), Image.LANCZOS)
    canvas.alpha_composite(scaled, ((canvas.width - width) // 2, (canvas.height - height) // 2))


def icon(size: int, width_fraction: float, name: str) -> None:
    canvas = Image.new("RGBA", (size, size), MAROON)
    place(canvas, LOGO, round(size * width_fraction))
    canvas.convert("RGB").save(PUBLIC / "icons" / name, optimize=True)


def gray_logo() -> Image.Image:
    # Same look as the intro's first frame (CSS: grayscale, 60% opacity).
    alpha = LOGO.getchannel("A").point(lambda a: round(a * 0.6))
    gray = LOGO.convert("RGB").convert("L").convert("RGB")
    gray.putalpha(alpha)
    return gray


# iPhone screens in CSS pixels (width, height, pixel ratio). iOS picks the launch image whose
# media query matches the device exactly, so each size needs its own file.
IPHONES = [
    (440, 956, 3),  # 16 Pro Max
    (402, 874, 3),  # 16 Pro
    (430, 932, 3),  # 16 Plus, 15 Plus, 15 Pro Max, 14 Pro Max
    (428, 926, 3),  # 14 Plus, 13 Pro Max, 12 Pro Max
    (420, 912, 3),  # Air
    (393, 852, 3),  # 16, 15, 15 Pro, 14 Pro
    (390, 844, 3),  # 14, 13, 13 Pro, 12, 12 Pro
    (375, 812, 3),  # 13 mini, 12 mini, X, XS, 11 Pro
    (414, 896, 3),  # 11 Pro Max, XS Max
    (414, 896, 2),  # 11, XR
    (414, 736, 3),  # 8 Plus
    (375, 667, 2),  # 8, SE 2 and 3
    (320, 568, 2),  # SE 1
]


def splash() -> list[str]:
    out = PUBLIC / "splash"
    out.mkdir(exist_ok=True)
    logo = gray_logo()
    tags = []
    for w, h, ratio in IPHONES:
        canvas = Image.new("RGBA", (w * ratio, h * ratio), MAROON)
        # The intro draws the logo 224 CSS pixels wide, at most 60% of the screen width.
        place(canvas, logo, round(min(224, 0.6 * w) * ratio))
        name = f"{w * ratio}x{h * ratio}.png"
        canvas.convert("RGB").save(out / name, optimize=True)
        media = (
            f"(device-width: {w}px) and (device-height: {h}px) and "
            f"(-webkit-device-pixel-ratio: {ratio}) and (orientation: portrait)"
        )
        tags.append(f'<link rel="apple-touch-startup-image" media="{media}" href="/splash/{name}" />')
    return tags


if __name__ == "__main__":
    (PUBLIC / "icons").mkdir(exist_ok=True)
    icon(192, 0.76, "icon-192.png")
    icon(512, 0.76, "icon-512.png")
    icon(512, 0.64, "icon-maskable-512.png")  # smaller: phones may crop it into a circle
    icon(180, 0.72, "apple-touch-icon.png")
    icon(48, 0.80, "favicon-48.png")
    print("\n".join(splash()))
