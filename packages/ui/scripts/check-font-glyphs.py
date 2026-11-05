from pathlib import Path

from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[3]
FONT_DIR = ROOT / "apps" / "storefront" / "public" / "fonts"
SPECIMEN = "LOPA TRYBE · Modern nativewear · ₦150,000 · Size 36 · Lagos delivery · Ẹ̀wù ọ̀ṣọ́ ṣẹ́ẹ̀ ń"
# Naira sign, Yoruba letters with dot below, acute/grave vowels, ń, and the combining marks.
YORUBA = "ẹọṣẸỌṢáàéèíìóòúùńÁÀÉÈÍÌÓÒÚÙṆ́̀́₦"


def inspect(path: Path) -> tuple[set[str], set[int]]:
    font = TTFont(path)
    axes = {axis.axisTag for axis in font["fvar"].axes} if "fvar" in font else set()
    cmap = set().union(*(set(table.cmap.keys()) for table in font["cmap"].tables))
    return axes, cmap


def describe(codepoints: set[int]) -> str:
    return ", ".join(f"U+{codepoint:04X}" for codepoint in sorted(codepoints))


archivo_axes, archivo_cmap = inspect(FONT_DIR / "archivo.woff2")
voice_axes, voice_cmap = inspect(FONT_DIR / "instrument-serif-italic.woff2")
_, editorial_cmap = inspect(FONT_DIR / "instrument-serif-regular.woff2")
noto_axes, noto_cmap = inspect(FONT_DIR / "noto-serif.woff2")
required = {ord(character) for character in SPECIMEN} | {ord(character) for character in YORUBA}

if not {"wght", "wdth"}.issubset(archivo_axes):
    raise SystemExit(f"Archivo is missing the expected weight/width axes: {archivo_axes}")
if not {"wght", "wdth"}.issubset(noto_axes):
    raise SystemExit(f"Noto Serif is missing the expected weight/width axes: {noto_axes}")

missing = {
    "Archivo": required - archivo_cmap,
    "Instrument Serif italic": required - voice_cmap,
    "Instrument Serif regular": required - editorial_cmap,
}
uncovered = set().union(*missing.values()) - noto_cmap
if uncovered:
    raise SystemExit(f"Noto Serif does not cover glyphs missing from the primary fonts: {describe(uncovered)}")

for name, codepoints in missing.items():
    print(f"{name}: {'covers every required glyph' if not codepoints else 'falls back to Noto Serif for ' + describe(codepoints)}")
print(f"Font check passed: axes verified; Noto Serif covers all {len(set().union(*missing.values()))} glyphs missing from a primary face.")
