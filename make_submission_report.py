from pathlib import Path
import textwrap


OUT = Path(r"C:\Users\ICH\OneDrive\Desktop\insa summer camp\submission_report.pdf")

NAME = "Habtamu Shewamene"
STUDENT_ID = "CTC-1467-26"

sections = [
    (
        "Challenge 1 - Environment Proof",
        [
            "Get-ChildItem -Force -Name",
            "Get-ChildItem -Recurse -Force -Name 'challenges'",
            "Get-Content -Path 'challenges\\challenge-1\\env_proof.py'",
            "python 'challenges\\challenge-1\\env_proof.py'",
            "git init",
            "git status",
            "git add .",
            "git commit -m \"impliment the script that displays my name the date and installed phyton and node versions\"",
            "git branch -M main",
            "git remote add origin https://github.com/HabtamuShewamene/insa-summer-camp.git",
            "git push -u origin main",
        ],
    ),
    (
        "Challenge 2 - Debug Hunt",
        [
            "Get-Content -Path 'challenges\\Challenge2\\docs\\trainee-lab.md'",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' log --graph --oneline --decorate --all",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' branch",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' switch",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' checkout",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' cherry-pick",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' diff",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' restore",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' reset --soft",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' reset --mixed",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' reset --hard",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' revert",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' merge",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' rebase -i",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' reflog",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' bisect",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' stash",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' stash pop",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' blame",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' add",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' commit",
            "npm install",
            "npm start",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp/challenges/Challenge2' -C 'challenges\\Challenge2' restore docs/git-history-plan.md docs/instructor-guide.md docs/trainee-lab.md",
            "git -c safe.directory='C:/Users/ICH/OneDrive/Desktop/insa summer camp' update-index --force-remove --remove -- 'challenges/challlenge-2-debug-hunt/Challenge1'",
            "git commit -m \"chore: remove debug-hunt submodule link\"",
            "git push origin main",
            "git tag",
            "git remote",
            "git fetch",
            "git pull",
            "git push --force-with-lease",
        ],
    ),
    (
        "Challenge 3 - Personal CLI Toolbox",
        [
            "Get-ChildItem -Force -Name",
            "Get-ChildItem -Recurse -Force -Name 'challenges'",
            "Get-Content -Path 'challenges\\challenge-1\\env_proof.py'",
            "Get-Content -Path 'challenges\\challenge3\\README.md'",
            "python 'challenges\\challenge3\\notes.py' list",
            "python 'challenges\\challenge3\\notes.py' add 'Buy milk'",
            "python 'challenges\\challenge3\\notes.py' delete 1",
            "git add 'challenges/challenge3'",
            "git commit --amend --no-edit",
            "git push origin main",
        ],
    ),
]


def esc(text: str) -> str:
    return text.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def build_lines():
    lines = [
        "Challenge Submission Report",
        f"Name: {NAME}",
        f"ID: {STUDENT_ID}",
        "",
        "Commands used by task",
        "",
    ]
    for title, cmds in sections:
        lines.append(title)
        for cmd in cmds:
            wrapped = textwrap.wrap(cmd, width=88) or [""]
            for i, part in enumerate(wrapped):
                prefix = "  - " if i == 0 else "    "
                lines.append(prefix + part)
        lines.append("")
    return lines


def make_pdf(lines):
    width, height = 612, 792
    margin = 54
    font_size = 11
    leading = 14
    y = height - margin
    page_lines = []
    pages = []

    def flush():
        nonlocal page_lines
        pages.append(page_lines)
        page_lines = []

    for line in lines:
        if y < margin + leading:
            flush()
            y = height - margin
        page_lines.append((margin, y, line))
        y -= leading
    flush()

    objects = []
    offsets = []

    def add_obj(body):
        offsets.append(sum(len(o) for o in objects) + len(b"%PDF-1.4\n"))
        objects.append(body)

    add_obj("1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n")
    kids = " ".join(f"{3 + i*2} 0 R" for i in range(len(pages)))
    add_obj(f"2 0 obj << /Type /Pages /Kids [{kids}] /Count {len(pages)} >> endobj\n")

    for i, page in enumerate(pages):
        content_num = 4 + i * 2
        page_num = 3 + i * 2
        add_obj(
            f"{page_num} 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 {width} {height}] "
            f"/Resources << /Font << /F1 999 0 R >> >> /Contents {content_num} 0 R >> endobj\n"
        )
        content = ["BT /F1 11 Tf"]
        for x, yy, text in page:
            content.append(f"1 0 0 1 {x} {yy} Tm ({esc(text)}) Tj")
        content.append("ET")
        stream = "\n".join(content).encode("utf-8")
        add_obj(
            f"{content_num} 0 obj << /Length {len(stream)} >> stream\n"
            + stream.decode("utf-8")
            + "\nendstream endobj\n"
        )

    # fix font object reference in page objects
    pdf = [b"%PDF-1.4\n"]
    xref_positions = [0]
    for idx, obj in enumerate(objects, start=1):
        if "999 0 R" in obj:
            obj = obj.replace("999 0 R", f"{3 + len(pages)*2 + 1} 0 R")
        xref_positions.append(sum(len(chunk) for chunk in pdf))
        pdf.append(obj.encode("utf-8"))

    font_obj_num = 3 + len(pages) * 2 + 1
    xref_positions.append(sum(len(chunk) for chunk in pdf))
    pdf.append(
        f"{font_obj_num} 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\n".encode(
            "utf-8"
        )
    )
    xref_start = sum(len(chunk) for chunk in pdf)
    xref = ["xref", f"0 {font_obj_num + 1}", "0000000000 65535 f "]
    for pos in xref_positions[1:]:
        xref.append(f"{pos:010d} 00000 n ")
    xref.append("trailer << /Size {0} /Root 1 0 R >>".format(font_obj_num + 1))
    xref.append("startxref")
    xref.append(str(xref_start))
    xref.append("%%EOF")
    pdf.append(("\n".join(xref) + "\n").encode("utf-8"))

    OUT.write_bytes(b"".join(pdf))


if __name__ == "__main__":
    make_pdf(build_lines())
    print(OUT)
