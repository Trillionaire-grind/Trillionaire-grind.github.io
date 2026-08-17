#!/usr/bin/env python3
"""Generate flBookPages.js from the fat loss PDF (text + extracted images)."""
from __future__ import annotations

import json
import re
from pathlib import Path

from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "assets/how-to-lose-fat-fast.pdf"
OUT_JS = ROOT / "assets/flBookPages.js"
IMG_DIR = ROOT / "assets/book"

HEADER_RE = re.compile(r"^HOW TO LOSE FAT AS FAST AS POSSIBLE\s*$", re.I)
CHAPTER_RE = re.compile(r"^CHAPTER\s+(\d+)\s*$", re.I)


def clean_pdf_text(raw: str) -> str:
    lines = []
    for line in (raw or "").splitlines():
        s = line.strip()
        if not s:
            lines.append("")
            continue
        if HEADER_RE.match(s):
            continue
        if re.fullmatch(r"\d{1,2}", s):
            continue
        lines.append(s)

    text = "\n".join(lines)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    # Align book copy to 90-day program
    text = text.replace("THE 60 DAY PROGRAM", "THE 90 DAY PROGRAM")
    text = text.replace("Lose 10 pounds in 60 days", "Lose 10 pounds in 90 days")
    text = text.replace("Your 60 days and your", "Your 90 days and your")
    text = text.replace("Follow this program for 60 days", "Follow this program for 90 days")
    text = text.replace("your 60 days and your", "your 90 days and your")
    text = text.replace("for all 60 days", "for all 90 days")
    text = text.replace("for 60 days and I guarantee", "for 90 days and I guarantee")
    text = text.replace("For your first 60 days", "For your first 90 days")
    text = text.replace("Follow this program for 60 days. If you don't", "Follow this program for 90 days. If you don't")
    text = text.replace("for all 60 days:", "for all 90 days:")
    text = text.replace("Day 1, Day 30, and Day 60", "Day 1, Day 30, and Day 90")
    text = text.replace("between Day 1 and Day 60", "between Day 1 and Day 90")
    text = text.replace("within 14 days of your Day 60", "within 14 days of your Day 90")
    text = text.replace("over 60 days", "over 90 days")
    text = text.replace("three sessions a week, logged (gym program from Chapter 5 or the\nbodyweight version). At least 22 total sessions across the 60 days.",
                        "three sessions a week, logged (gym program from Chapter 5 or the\nbodyweight version). At least 33 total sessions across the 90 days.")
    text = text.replace("At least 22 total sessions across the 60 days", "At least 33 total sessions across the 90 days")
    text = text.replace("1,800 photos of their food over 60 days", "2,700 photos of their food over 90 days")
    text = text.replace("Lift three days,\nstay under your calorie number. A person who does those three things for 60 days",
                        "Lift three days,\nstay under your calorie number. A person who does those three things for 90 days")
    text = text.replace("for 60 days does not", "for 90 days does not")
    text = re.sub(r"\b60\s+days\b", "90 days", text, flags=re.I)
    text = re.sub(r"\b60\s+day\b", "90 day", text, flags=re.I)
    return text


def chapter_title(text: str) -> str:
    m = re.search(r"Chapter\s+(\d+):\s*([^\n]+)", text, re.I)
    if m:
        return f"Chapter {m.group(1)}: {m.group(2).strip()}"
    if text.startswith("READ THIS FIRST"):
        return "Read This First"
    if text.startswith("PRINTABLE WORKOUT LOG"):
        return "Printable Workout Log"
    if "Before we start" in text[:40]:
        return "Before We Start"
    if "THE 90 DAY PROGRAM" in text or "Track your calories" in text[:80]:
        return "How to Lose Fat as Fast as Possible"
    return "How to Lose Fat as Fast as Possible"


def split_page_6(text: str, image: str) -> list[dict]:
    marker = "This photo exists now."
    if marker in text:
        before, after = text.split(marker, 1)
        pages = []
        if before.strip():
            pages.append({"pageType": "text", "text": before.strip(), "title": chapter_title(before)})
        rest = after.strip().split("\n", 1)[0] if after else "For 24 years, none did."
        if rest and not rest.startswith("For"):
            rest = "For 24 years, none did."
        pages.append(
            {
                "pageType": "image",
                "imageUrl": image,
                "text": f"{marker} {rest}",
                "title": "Chapter 1",
            }
        )
        return pages
    return [{"pageType": "text", "text": text, "title": chapter_title(text)}]


def split_page_7(text: str, images: list[str]) -> list[dict]:
    pages: list[dict] = []
    lines = text.split("\n")
    caption1 = "Same week. In clothes you can't tell anything. That's the skinny fat trap, and it cuts both ways."
    rest_start = "Why I'm Telling You This"
    body = text
    if caption1 in body:
        _, rest = body.split(caption1, 1)
        if images:
            pages.append({"pageType": "image", "imageUrl": images[0], "text": caption1, "title": "Chapter 1"})
            if len(images) > 1:
                pages.append(
                    {
                        "pageType": "image",
                        "imageUrl": images[1],
                        "text": "Shirtless — the result of tracking.",
                        "title": "Chapter 1",
                    }
                )
        rest = rest.strip()
        if rest.startswith(rest_start):
            pages.append({"pageType": "text", "text": rest, "title": "Chapter 1"})
        elif rest:
            pages.append({"pageType": "text", "text": rest, "title": "Chapter 1"})
        return pages
    return [{"pageType": "text", "text": text, "title": chapter_title(text)}]


def split_page_8(text: str, image: str) -> list[dict]:
    marker = "These pants fit a much bigger man once."
    if marker in text:
        _, rest = text.split(marker, 1)
        pages = [
            {"pageType": "image", "imageUrl": image, "text": marker, "title": "Chapter 1"},
        ]
        rest = rest.strip()
        if rest:
            pages.append({"pageType": "text", "text": rest, "title": chapter_title(rest)})
        return pages
    return [{"pageType": "text", "text": text, "title": chapter_title(text)}]


def build_pages() -> list[dict]:
    reader = PdfReader(str(PDF))
    image_map: dict[int, list[str]] = {}
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    for pi, page in enumerate(reader.pages):
        pnum = pi + 1
        for ii, img in enumerate(page.images):
            ext = "jpg" if img.name.lower().endswith((".jpg", ".jpeg")) else "png"
            fname = f"page-{pnum}-{ii + 1}.{ext}"
            path = IMG_DIR / fname
            path.write_bytes(img.data)
            image_map.setdefault(pnum, []).append(f"assets/book/{fname}")

    pages: list[dict] = []

    for pi, page in enumerate(reader.pages):
        pnum = pi + 1
        text = clean_pdf_text(page.extract_text() or "")
        images = image_map.get(pnum, [])

        if pnum == 1 and images:
            pages.append(
                {
                    "pageType": "image",
                    "imageUrl": images[0],
                    "text": text,
                    "title": "How to Lose Fat as Fast as Possible",
                }
            )
            continue

        if pnum == 6 and images:
            pages.extend(split_page_6(text, images[0]))
            continue

        if pnum == 7 and images:
            pages.extend(split_page_7(text, images))
            continue

        if pnum == 8 and images:
            pages.extend(split_page_8(text, images[0]))
            continue

        if not text:
            continue

        pages.append(
            {
                "pageType": "text",
                "text": text,
                "title": chapter_title(text),
            }
        )

    for i, page in enumerate(pages, start=1):
        page["id"] = f"page{i}"
    return pages


def main() -> None:
    pages = build_pages()
    payload = json.dumps(pages, ensure_ascii=False, indent=2)
    OUT_JS.write_text(
        "/** Auto-generated from how-to-lose-fat-fast.pdf — run scripts/buildBookPages.py to rebuild */\n"
        f"export const FL_BOOK_PAGES = {payload};\n\n"
        f"export const FL_BOOK_PAGE_COUNT = {len(pages)};\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(pages)} pages to {OUT_JS}")


if __name__ == "__main__":
    main()
