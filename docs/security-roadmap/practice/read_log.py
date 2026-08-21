#!/usr/bin/env python3
"""Read a text log file and summarize SUCCESS vs FAILED lines.

Phase 0 checkpoint: a small Python script that reads a log file.
Phase 2: use the summary to talk about what looks abnormal and what to harden.

Only run this on logs you are allowed to have (this sample, or your own VMs).
"""

from __future__ import annotations

import argparse
import re
from collections import Counter
from pathlib import Path

DEFAULT_LOG = Path(__file__).with_name("sample-auth.txt")
LINE_RE = re.compile(
    r"(?P<result>SUCCESS|FAILED) user=(?P<user>\S+) src=(?P<src>\S+)"
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Summarize SUCCESS/FAILED lines in a text log.")
    parser.add_argument(
        "log_path",
        nargs="?",
        default=str(DEFAULT_LOG),
        help="Path to a log file you are allowed to read",
    )
    return parser.parse_args()


def summarize(path: Path) -> None:
    if not path.is_file():
        raise SystemExit(f"Log file not found: {path}")

    results: Counter[str] = Counter()
    failed_users: Counter[str] = Counter()
    failed_sources: Counter[str] = Counter()
    unparsed = 0

    text = path.read_text(encoding="utf-8", errors="replace")
    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            continue
        match = LINE_RE.search(line)
        if not match:
            unparsed += 1
            continue
        result = match.group("result")
        results[result] += 1
        if result == "FAILED":
            failed_users[match.group("user")] += 1
            failed_sources[match.group("src")] += 1

    print(f"File: {path}")
    print(f"SUCCESS: {results.get('SUCCESS', 0)}")
    print(f"FAILED:  {results.get('FAILED', 0)}")
    if unparsed:
        print(f"Lines not matching the sample format: {unparsed}")
    if failed_users:
        print("Failed attempts by username:")
        for name, count in failed_users.most_common():
            print(f"  {name}: {count}")
    if failed_sources:
        print("Failed attempts by source address:")
        for src, count in failed_sources.most_common():
            print(f"  {src}: {count}")
    print(
        "Defender notes (catalog): many FAILED lines for one account or source "
        "are a reason to review lockout, MFA, and whether that account should exist."
    )


def main() -> None:
    args = parse_args()
    summarize(Path(args.log_path))


if __name__ == "__main__":
    main()
