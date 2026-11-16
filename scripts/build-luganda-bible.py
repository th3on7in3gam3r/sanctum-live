#!/usr/bin/env python3
"""
Build the site's bundled Luganda Bible (Biblica® Bayibuli Entukuvu / Open Luganda
Contemporary Bible, CC BY-SA 4.0) from USX into one JSON file per book, in the same
chapter shape the Free Use Bible API returns, so the reader treats it like any other.

Source: https://github.com/gracious-tech/fetch_collection  bibles/lug_bib/usx
        (Digital Bible Library f276be3571f516cb, Biblica, Inc.)

Usage:  python3 scripts/build-luganda-bible.py <usx-dir> site/data/bible/lcb
The text is copied unmodified (only markup is converted).
"""
import json
import os
import re
import sys
import xml.etree.ElementTree as ET

CANON = (
    "GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR NEH EST JOB PSA PRO ECC SNG "
    "ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT "
    "ROM 1CO 2CO GAL EPH PHP COL 1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV"
).split()

HEADINGS = {"s", "s1", "s2", "s3", "s4", "sp", "qa"}
SUBTITLE = {"d"}
SKIP_PARA = {"h", "toc1", "toc2", "toc3", "mt", "mt1", "mt2", "mt3", "mte", "cl", "ms", "ms1",
             "ms2", "mr", "r", "sr", "rem", "ide", "restore", "iex"}
POETRY = re.compile(r"^(q\d?|qr|qc|qm\d?|li\d?|pi\d?|pm|pmo|m|mi|nb)$")
PUNCT_START = re.compile(r"^([.,;:!?’”»)\]]+)")


def clean(s):
    return re.sub(r"\s+", " ", s or "")


def note_text(note):
    parts = []
    for el in note.iter():
        if el is note:
            continue
        if el.get("style") in ("fr", "xo"):
            continue
        if el.text:
            parts.append(el.text)
    return clean(" ".join(parts)).strip()


class Book:
    def __init__(self):
        self.name = ""
        self.chapters = {}  # number -> {"content": [], "footnotes": []}
        self.ch = None
        self.verse = None
        self.next_note = 1

    # --- helpers -------------------------------------------------------
    def chapter(self):
        return self.chapters[self.ch]

    def add_text(self, text, wj=False):
        if self.verse is None or self.ch is None:
            return
        text = clean(text)
        if not text:
            return
        content = self.verse["content"]
        last = content[-1] if content else None
        if wj:
            if isinstance(last, dict) and last.get("wordsOfJesus"):
                last["text"] += text
            else:
                content.append({"text": text, "wordsOfJesus": True})
            return
        # Punctuation right after Jesus' words stays attached to them (no stray space).
        if isinstance(last, dict) and last.get("wordsOfJesus"):
            m = PUNCT_START.match(text)
            if m:
                last["text"] += m.group(1)
                text = text[len(m.group(1)):]
                if not text.strip():
                    return
        if isinstance(last, str):
            content[-1] = last + text
        else:
            content.append(text)

    def line_break(self):
        if self.verse is None:
            return
        content = self.verse["content"]
        if content and not (isinstance(content[-1], dict) and content[-1].get("lineBreak")):
            content.append({"lineBreak": True})

    # --- walking -------------------------------------------------------
    def walk(self, el, wj=False):
        tag, style = el.tag, el.get("style", "")
        if tag == "book":
            return
        if tag == "chapter":
            if el.get("sid"):
                self.ch = int(el.get("number"))
                self.chapters[self.ch] = {"content": [], "footnotes": []}
                self.verse = None
            return
        if tag == "verse":
            if el.get("sid"):
                num = int(re.match(r"\d+", el.get("number")).group(0))
                self.verse = {"type": "verse", "number": num, "content": []}
                self.chapter()["content"].append(self.verse)
            elif el.get("eid"):
                self.verse = None
            return
        if tag == "note":
            if style == "f" and self.verse is not None:
                nid = self.next_note
                self.next_note += 1
                self.verse["content"].append({"noteId": nid})
                self.chapter()["footnotes"].append(
                    {"noteId": nid, "text": note_text(el), "caller": None, "verse": self.verse["number"]}
                )
            return  # cross references and note bodies are not reading text
        if tag == "para":
            if style == "h":
                self.name = clean("".join(el.itertext())).strip()
                return
            if style in SKIP_PARA or self.ch is None and style not in ("p",):
                return
            if style in HEADINGS:
                text = clean("".join(t for t in el.itertext())).strip()
                if text:
                    self.chapter()["content"].append({"type": "heading", "content": [text]})
                return
            if style in SUBTITLE:
                saved, self.verse = self.verse, None
                sub = {"type": "hebrew_subtitle", "content": []}
                parts = []
                for t in el.itertext():
                    parts.append(t)
                text = clean("".join(parts)).strip()
                if text:
                    sub["content"].append(text)
                    self.chapter()["content"].append(sub)
                self.verse = saved
                return
            if style == "b":
                return
            # A new paragraph or poetry line inside a running verse.
            if self.verse is not None and self.verse["content"]:
                if POETRY.match(style):
                    self.line_break()
                else:
                    self.add_text(" ")
        if tag == "table":
            pass
        is_wj = wj or (tag == "char" and style == "wj")
        if el.text:
            self.add_text(el.text, is_wj)
        for child in el:
            self.walk(child, is_wj)
            if child.tail:
                self.add_text(child.tail, wj)

    def finish(self):
        out = []
        verses = 0
        for n in sorted(self.chapters):
            ch = self.chapters[n]
            for item in ch["content"]:
                if item.get("type") != "verse":
                    continue
                verses += 1
                c = item["content"]
                while c and isinstance(c[-1], dict) and c[-1].get("lineBreak"):
                    c.pop()
                cleaned = []
                for part in c:
                    if isinstance(part, str):
                        part = part.strip()
                        if part:
                            cleaned.append(part)
                    elif "text" in part:
                        part["text"] = part["text"].strip()
                        if part["text"]:
                            cleaned.append(part)
                    else:
                        cleaned.append(part)
                item["content"] = cleaned
            out.append({"number": n, "content": ch["content"], "footnotes": ch["footnotes"]})
        return out, verses


def main(src, dest):
    os.makedirs(dest, exist_ok=True)
    index, total = [], 0
    for order, code in enumerate(CANON, start=1):
        path = os.path.join(src, f"{code.lower()}.usx")
        root = ET.parse(path).getroot()
        book = Book()
        for child in root:
            book.walk(child)
            if child.tail:
                book.add_text(child.tail)
        chapters, verses = book.finish()
        total += verses
        index.append({"id": code, "name": book.name, "order": order, "numberOfChapters": len(chapters)})
        with open(os.path.join(dest, f"{code}.json"), "w", encoding="utf-8") as f:
            json.dump({"id": code, "name": book.name, "chapters": chapters}, f, ensure_ascii=False, separators=(",", ":"))
    with open(os.path.join(dest, "books.json"), "w", encoding="utf-8") as f:
        json.dump(index, f, ensure_ascii=False, indent=1)
    print(f"{len(index)} books, {total} verses")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
