from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[3]
SPECIMEN = "LOPA TRYBE · Modern nativewear · ₦150,000 · Size 36 · Lagos delivery · Ẹ̀wù ọ̀ṣọ́ ṣẹ́ẹ̀ ń"
FONT_DIR = ROOT / "apps" / "storefront" / "public" / "fonts"


def inspect(path: Path) -> tuple[set[str], set[int]]:
    font = TTFont(path)
    axes = {axis.axisTag for axis in font["fvar"].axes}
    cmap = set().union(*(set(table.cmap.keys()) for table in font["cmap"].tables))
    return axes, cmap


bodoni_axes, bodoni_cmap = inspect(FONT_DIR / "bodoni-moda.woff2")
dm_axes, dm_cmap = inspect(FONT_DIR / "dm-sans.woff2")
noto_axes, noto_cmap = inspect(FONT_DIR / "noto-serif.woff2")
required = {ord(character) for character in SPECIMEN}

if not {"opsz", "wght"}.issubset(bodoni_axes):
    raise SystemExit(f"Bodoni Moda is missing the expected optical-size/weight axes: {bodoni_axes}")
if not {"opsz", "wght"}.issubset(dm_axes):
    raise SystemExit(f"DM Sans is missing the expected optical-size/weight axes: {dm_axes}")
if not {"wght", "wdth"}.issubset(noto_axes):
    raise SystemExit(f"Noto Serif is missing the expected weight/width axes: {noto_axes}")

missing_from_primary = (required - bodoni_cmap) | (required - dm_cmap)
if missing_from_primary - noto_cmap:
    glyphs = ", ".join(f"U+{codepoint:04X}" for codepoint in sorted(missing_from_primary - noto_cmap))
    raise SystemExit(f"Noto Serif does not cover the primary fonts' missing specimen glyphs: {glyphs}")

print(f"Font check passed: axes verified and Noto Serif covers {len(missing_from_primary)} missing specimen glyphs.")
