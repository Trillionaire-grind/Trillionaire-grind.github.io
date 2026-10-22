#!/usr/bin/env python3
"""Generate flBookPages.js: the fat loss book as a cover, chapters, and text pages.

Reads how-to-lose-fat-fast.pdf and produces a Liv Lakay style structure:
  book -> chapters -> pages -> text blocks (plus the few author photos).
"""
from __future__ import annotations

import json
import re
from pathlib import Path

import pymupdf

ROOT = Path(__file__).resolve().parents[1]
PDF = ROOT / "assets/how-to-lose-fat-fast.pdf"
OUT_JS = ROOT / "assets/flBookPages.js"
IMG_DIR = ROOT / "assets/book"

BOOK_TITLE = "How to Lose Fat as Fast as Possible"
BOOK_AUTHOR = "Képler Siguineau"
BOOK_SUBJECT = "90-Day Fat Loss"
BOOK_YEAR = "2026"
COVER_FILE = "assets/book/cover.jpg"

# Font sizes in the source PDF, used to classify each text block.
RUNNING_HEAD_SIZE = 8.0
CHAPTER_KICKER_SIZE = 10.0
LIST_SIZE = 10.0
CAPTION_SIZE = 9.5
BODY_SIZE = 11.0
SUBHEAD_SIZES = {12.5, 15.5, 17.0, 19.0}
CHAPTER_TITLE_SIZE = 25.0

PAGE_CHAR_BUDGET = 900
HEADING_BREAK_AFTER = 480

# Chapter kickers that open a new chapter, in reading order.
KICKERS = {
    "READ THIS FIRST": "Read This First: The Deal",
    "CHAPTER 1": None,
    "CHAPTER 2": None,
    "CHAPTER 3": None,
    "CHAPTER 4": None,
    "CHAPTER 5": None,
    "CHAPTER 6": None,
    "CHAPTER 7": None,
    "PRINTABLE WORKOUT LOG": "Printable Workout Log",
}

DAY_FIXES = [
    ("THE 60 DAY PROGRAM", "THE 90 DAY PROGRAM"),
    ("At least 22 total sessions", "At least 33 total sessions"),
    ("1,800 photos of their food", "2,700 photos of their food"),
    ("Day 1, Day 30, and Day 60", "Day 1, Day 30, and Day 90"),
]


def fix_program_length(text: str) -> str:
    """The funnel sells a 90-day program; the source PDF still says 60 days."""
    for old, new in DAY_FIXES:
        text = text.replace(old, new)
    text = re.sub(
        r"\b60(\s+)(day|Day|DAY)(s|S)?\b",
        lambda m: f"90{m.group(1)}{m.group(2)}{m.group(3) or ''}",
        text,
    )
    text = re.sub(r"\bDay 60\b", "Day 90", text)
    return text


def style_runs(block: dict) -> list[tuple[float, bool, str]]:
    """Split a PDF block into runs of consecutive lines that share a font size.

    Chapter kickers and their titles live in one block at different sizes, so a
    block is not usable as a unit on its own.
    """
    runs: list[tuple[float, bool, list[str]]] = []
    for line in block["lines"]:
        spans = [s for s in line["spans"] if s["text"].strip()]
        if not spans:
            continue
        size = round(spans[0]["size"], 1)
        bold = all("Bold" in s["font"] for s in spans)
        text = "".join(s["text"] for s in line["spans"]).strip()
        if runs and runs[-1][0] == size and runs[-1][1] == bold:
            runs[-1][2].append(text)
        else:
            runs.append((size, bold, [text]))

    out = []
    for size, bold, lines in runs:
        text = re.sub(r"\s+", " ", " ".join(lines)).strip()
        if text:
            out.append((size, bold, fix_program_length(text)))
    return out


def classify(size: float, bold: bool, text: str) -> str:
    if size <= RUNNING_HEAD_SIZE:
        return "skip"
    if size >= CHAPTER_TITLE_SIZE:
        return "chapter-title"
    if size == CHAPTER_KICKER_SIZE and bold and text.upper() in KICKERS:
        return "kicker"
    if size in SUBHEAD_SIZES and bold:
        return "heading"
    if size == CAPTION_SIZE:
        return "caption"
    if size == LIST_SIZE and re.match(r"^(\d+\.|\u2022|\u25cf|-)\s", text):
        return "list"
    return "para"


WORKOUT_DAY_RE = re.compile(r"^(PUSH|PULL|LEGS) DAY((?:\s+Set \d)+)$")


def split_table_headers(stream: list[dict]) -> list[dict]:
    """The printable log flattens a table; give each day a real heading."""
    out: list[dict] = []
    for item in stream:
        match = WORKOUT_DAY_RE.match(item.get("text", "")) if item["kind"] == "para" else None
        if not match:
            out.append(item)
            continue
        out.append({"kind": "heading", "text": f"{match.group(1)} DAY"})
        columns = " · ".join(match.group(2).split())
        out.append({"kind": "caption", "text": columns.replace("Set · ", "Set ")})
    return out


def merge_continuations(stream: list[dict]) -> list[dict]:
    """Rejoin sentences the PDF split across font runs or page breaks.

    A wrapped list item drops from 10pt to 11pt mid-sentence, which would
    otherwise leave orphan fragments like "guarantee start the moment...".
    """
    merged: list[dict] = []
    for item in stream:
        text = item.get("text", "")
        prev = merged[-1] if merged else None
        continues = (
            prev is not None
            and item["kind"] in {"para", "list"}
            and prev["kind"] in {"para", "list"}
            and text[:1].islower()
            and not prev["text"].endswith((".", "!", "?", ":", '"'))
        )
        if continues:
            prev["text"] = f"{prev['text']} {text}"
            continue
        merged.append(item)
    return merged


def patch_cover_text(page: pymupdf.Page) -> None:
    """The source PDF cover still advertises 60 days; the program sells 90.

    Also drops the running head so the render reads as a cover, not page 1.
    """
    rewrites = []
    for block in page.get_text("dict")["blocks"]:
        if block["type"] != 0:
            continue
        for line in block["lines"]:
            for span in line["spans"]:
                text = span["text"]
                if round(span["size"], 1) <= RUNNING_HEAD_SIZE:
                    rewrites.append((span, ""))
                elif "60" in text:
                    rewrites.append((span, fix_program_length(text)))

    for span, _ in rewrites:
        page.add_redact_annot(pymupdf.Rect(span["bbox"]), fill=(1, 1, 1))
    page.apply_redactions()

    for span, text in rewrites:
        if not text:
            continue
        page.insert_text(
            span["origin"],
            text,
            fontname="hebo" if "Bold" in span["font"] else "helv",
            fontsize=span["size"],
            color=(0, 0, 0),
        )


def read_blocks(doc: pymupdf.Document) -> list[dict]:
    """Flatten the PDF into an ordered stream of typed blocks."""
    stream: list[dict] = []
    IMG_DIR.mkdir(parents=True, exist_ok=True)

    for pno, page in enumerate(doc, start=1):
        if pno == 1:
            continue

        photo_index = 0
        for block in page.get_text("dict")["blocks"]:
            if block["type"] == 1:
                photo_index += 1
                name = f"photo-{pno}-{photo_index}.jpg"
                pix = pymupdf.Pixmap(block["image"])
                if pix.alpha:
                    pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                pix.save(IMG_DIR / name, jpg_quality=82)
                stream.append({"kind": "image", "src": f"assets/book/{name}"})
                continue

            if not block.get("lines"):
                continue
            for size, bold, text in style_runs(block):
                kind = classify(size, bold, text)
                if kind == "skip":
                    continue
                stream.append({"kind": kind, "text": text})

    return stream


def render_cover(doc: pymupdf.Document) -> None:
    IMG_DIR.mkdir(parents=True, exist_ok=True)
    page = doc[0]
    patch_cover_text(page)
    clip = pymupdf.Rect(0, 0, page.rect.width, 700)
    pix = page.get_pixmap(matrix=pymupdf.Matrix(2, 2), clip=clip)
    pix.save(IMG_DIR / "cover.jpg", jpg_quality=88)


def chapter_id(title: str, index: int) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", title.lower()).strip("-")
    return f"{index:02d}-{slug}"[:48]


def split_chapters(stream: list[dict]) -> list[dict]:
    chapters: list[dict] = []
    current: dict | None = None

    def start(title: str) -> dict:
        nonlocal current
        current = {"title": title, "blocks": []}
        chapters.append(current)
        return current

    start("Before We Start")

    i = 0
    while i < len(stream):
        item = stream[i]

        if item["kind"] == "kicker":
            kicker = item["text"].upper()
            title = KICKERS.get(kicker)
            if title is None:
                nxt = stream[i + 1] if i + 1 < len(stream) else None
                title = (
                    nxt["text"]
                    if nxt and nxt["kind"] == "chapter-title"
                    else kicker.title()
                )
                if nxt and nxt["kind"] == "chapter-title":
                    i += 1
            start(title)
            i += 1
            continue

        if item["kind"] == "chapter-title":
            start(item["text"])
            i += 1
            continue

        if current is None:
            start(BOOK_TITLE)
        current["blocks"].append(item)
        i += 1

    return [c for c in chapters if c["blocks"]]


def paginate(blocks: list[dict]) -> list[dict]:
    """Pack blocks into reader pages. Photos get their own page with the caption."""
    pages: list[dict] = []
    current: list[dict] = []
    length = 0

    def flush() -> None:
        nonlocal current, length
        if current:
            pages.append({"blocks": current})
            current = []
            length = 0

    i = 0
    while i < len(blocks):
        item = blocks[i]

        if item["kind"] == "image":
            flush()
            images = [item["src"]]
            i += 1
            # Side-by-side photos in the source share one caption.
            while i < len(blocks) and blocks[i]["kind"] == "image":
                images.append(blocks[i]["src"])
                i += 1
            page: dict = {"images": images, "blocks": []}
            if i < len(blocks) and blocks[i]["kind"] == "caption":
                page["blocks"].append({"t": "cap", "x": blocks[i]["text"]})
                i += 1
            pages.append(page)
            continue

        kind = {"heading": "h", "list": "li", "caption": "cap"}.get(item["kind"], "p")
        text = item["text"]

        starts_section = kind == "h" and length > HEADING_BREAK_AFTER
        overflows = length and length + len(text) > PAGE_CHAR_BUDGET
        if starts_section or overflows:
            flush()

        current.append({"t": kind, "x": text})
        length += len(text) + 24
        i += 1

    flush()
    return pages


def build() -> dict:
    doc = pymupdf.open(str(PDF))
    render_cover(doc)
    stream = split_table_headers(merge_continuations(read_blocks(doc)))
    chapters = split_chapters(stream)

    payload_chapters = []
    for index, chapter in enumerate(chapters):
        pages = paginate(chapter["blocks"])
        payload_chapters.append(
            {
                "id": chapter_id(chapter["title"], index),
                "number": index,
                "title": chapter["title"],
                "pages": pages,
            }
        )

    return {
        "title": BOOK_TITLE,
        "author": BOOK_AUTHOR,
        "subject": BOOK_SUBJECT,
        "year": BOOK_YEAR,
        "cover": COVER_FILE,
        "chapters": payload_chapters,
    }


def main() -> None:
    book = build()
    payload = json.dumps(book, ensure_ascii=False, indent=2)
    total_pages = sum(len(c["pages"]) for c in book["chapters"])
    OUT_JS.write_text(
        "/** Auto-generated from how-to-lose-fat-fast.pdf — run scripts/buildBookPages.py to rebuild */\n"
        f"export const FL_BOOK = {payload};\n\n"
        f"export const FL_BOOK_CHAPTER_COUNT = {len(book['chapters'])};\n"
        f"export const FL_BOOK_PAGE_COUNT = {total_pages};\n",
        encoding="utf-8",
    )
    print(f"Wrote {len(book['chapters'])} chapters / {total_pages} pages to {OUT_JS}")
    for chapter in book["chapters"]:
        print(f"  {chapter['number']:>2}. {chapter['title']}  ({len(chapter['pages'])} pages)")


if __name__ == "__main__":
    main()
