#!/usr/bin/env python3
"""Personal CLI toolbox for managing short notes."""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any


BASE_DIR = Path(__file__).resolve().parent
DATA_FILE = BASE_DIR / "notes.json"


def load_notes() -> list[dict[str, Any]]:
    if not DATA_FILE.exists():
        return []

    try:
        data = json.loads(DATA_FILE.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return []

    if not isinstance(data, list):
        return []
    return [item for item in data if isinstance(item, dict)]


def save_notes(notes: list[dict[str, Any]]) -> None:
    DATA_FILE.write_text(json.dumps(notes, indent=2), encoding="utf-8")


def next_id(notes: list[dict[str, Any]]) -> int:
    return max((int(note["id"]) for note in notes if "id" in note), default=0) + 1


def add_note(notes: list[dict[str, Any]], content: str) -> None:
    note = {"id": next_id(notes), "content": content.strip()}
    notes.append(note)
    save_notes(notes)
    print(f"Added note {note['id']}")


def list_notes(notes: list[dict[str, Any]]) -> None:
    if not notes:
        print("No notes yet.")
        return

    for note in notes:
        print(f"{note['id']}: {note['content']}")


def delete_note(notes: list[dict[str, Any]], note_id: int) -> None:
    remaining = [note for note in notes if int(note.get("id", -1)) != note_id]
    if len(remaining) == len(notes):
        print(f"Note {note_id} not found.")
        return

    save_notes(remaining)
    print(f"Deleted note {note_id}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Personal CLI toolbox for notes")
    subparsers = parser.add_subparsers(dest="command", required=True)

    add_parser = subparsers.add_parser("add", help="Add a new note")
    add_parser.add_argument("content", help="Note content")

    subparsers.add_parser("list", help="List saved notes")

    delete_parser = subparsers.add_parser("delete", help="Delete a note by id")
    delete_parser.add_argument("id", type=int, help="Note id")

    return parser


def main() -> None:
    parser = build_parser()
    args = parser.parse_args()
    notes = load_notes()

    if args.command == "add":
        add_note(notes, args.content)
    elif args.command == "list":
        list_notes(notes)
    elif args.command == "delete":
        delete_note(notes, args.id)


if __name__ == "__main__":
    main()
