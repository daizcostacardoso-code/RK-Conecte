from pathlib import Path
from PIL import Image, ImageDraw, ImageFont, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "assets" / "pwa"
ASSETS.mkdir(parents=True, exist_ok=True)
BACKGROUND = ASSETS / "launch-background.png"
RK_LOGO = ROOT / "imagens" / "logo.jpeg"
CONNECT_LOGO = ROOT / "assets" / "conecte-logo.png"

def font(size, bold=False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    try:
        return ImageFont.truetype(name, size)
    except OSError:
        return ImageFont.load_default()

def cover(image, size):
    ratio = max(size[0] / image.width, size[1] / image.height)
    resized = image.resize((round(image.width * ratio), round(image.height * ratio)), Image.Resampling.LANCZOS)
    left = (resized.width - size[0]) // 2
    top = (resized.height - size[1]) // 2
    return resized.crop((left, top, left + size[0], top + size[1]))

def contain(image, size):
    copy = image.copy()
    copy.thumbnail(size, Image.Resampling.LANCZOS)
    return copy

def launch(size):
    bg = cover(Image.open(BACKGROUND).convert("RGB"), size)
    scale = min(size) / 2048
    draw = ImageDraw.Draw(bg, "RGBA")
    card_w = int(min(size[0] * .82, 980 * scale))
    card_h = int(min(size[1] * .54, 1140 * scale))
    x = (size[0] - card_w) // 2
    y = int(size[1] * .47 - card_h / 2)
    radius = max(24, int(58 * scale))
    shadow = Image.new("RGBA", size, (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle((x, y + int(24 * scale), x + card_w, y + card_h + int(24 * scale)), radius, fill=(0, 0, 0, 105))
    bg = Image.alpha_composite(bg.convert("RGBA"), shadow.filter(ImageFilter.GaussianBlur(max(8, int(28 * scale)))))
    draw = ImageDraw.Draw(bg, "RGBA")
    draw.rounded_rectangle((x, y, x + card_w, y + card_h), radius, fill=(5, 28, 44, 238), outline=(255, 255, 255, 42), width=max(2, int(3 * scale)))

    rk = contain(Image.open(RK_LOGO).convert("RGB"), (int(card_w * .36), int(card_w * .36)))
    logo_x = x + (card_w - rk.width) // 2
    logo_y = y + int(card_h * .10)
    bg.paste(rk, (logo_x, logo_y))
    draw = ImageDraw.Draw(bg, "RGBA")
    title = "PREPARANDO O SISTEMA"
    title_font = font(max(16, int(43 * scale)), True)
    title_box = draw.textbbox((0, 0), title, font=title_font)
    draw.text((x + (card_w - (title_box[2] - title_box[0])) / 2, y + int(card_h * .51)), title, font=title_font, fill=(238, 250, 255, 255))
    sub = "Carregando informações essenciais"
    sub_font = font(max(13, int(27 * scale)))
    sub_box = draw.textbbox((0, 0), sub, font=sub_font)
    draw.text((x + (card_w - (sub_box[2] - sub_box[0])) / 2, y + int(card_h * .59)), sub, font=sub_font, fill=(190, 218, 231, 255))
    line_y = y + int(card_h * .68)
    draw.rounded_rectangle((x + int(card_w * .13), line_y, x + int(card_w * .87), line_y + max(7, int(12 * scale))), 99, fill=(255, 255, 255, 28))
    draw.rounded_rectangle((x + int(card_w * .13), line_y, x + int(card_w * .56), line_y + max(7, int(12 * scale))), 99, fill=(64, 201, 220, 255))

    conecte = contain(Image.open(CONNECT_LOGO).convert("RGB"), (int(card_w * .48), int(card_h * .16)))
    conecte_y = y + int(card_h * .77)
    bg.paste(conecte, (x + (card_w - conecte.width) // 2, conecte_y))
    return bg.convert("RGB")

outputs = {
    "launch-1170x2532.png": (1170, 2532),
    "launch-1290x2796.png": (1290, 2796),
    "launch-2048x2732.png": (2048, 2732),
}
for name, size in outputs.items():
    launch(size).save(ASSETS / name, "PNG", optimize=True)

# Android compõe a splash nativa com o ícone maskable e a cor do manifest.
icon = launch((1024, 1024)).resize((512, 512), Image.Resampling.LANCZOS)
icon.save(ROOT / "imagens" / "icons" / "maskable-512-v1.0.1.png", "PNG", optimize=True)
icon.resize((192, 192), Image.Resampling.LANCZOS).save(ROOT / "imagens" / "icons" / "maskable-192-v1.0.1.png", "PNG", optimize=True)
