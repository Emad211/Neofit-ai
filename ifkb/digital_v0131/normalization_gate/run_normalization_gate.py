#!/usr/bin/env python3
"""Run the complete fail-closed IFKB DS2 normalization gate."""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[3]
GATE = ROOT / "ifkb/digital_v0131/normalization_gate"


def run_step(label: str, arguments: list[str], report: dict[str, Any]) -> bool:
    process = subprocess.run(
        [sys.executable, *arguments],
        cwd=ROOT,
        text=True,
        capture_output=True,
        check=False,
    )
    entry = {
        "label": label,
        "command": [sys.executable, *arguments],
        "returnCode": process.returncode,
        "stdout": process.stdout,
        "stderr": process.stderr,
    }
    report["steps"].append(entry)
    print(f"\n=== {label} ===")
    if process.stdout:
        print(process.stdout, end="")
    if process.stderr:
        print(process.stderr, file=sys.stderr, end="")
    return process.returncode == 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-dir", type=Path, required=True)
    parser.add_argument("--enforce-release", action="store_true")
    args = parser.parse_args()
    output = args.output_dir.resolve()
    output.mkdir(parents=True, exist_ok=True)
    report: dict[str, Any] = {
        "format": "ifkb-ds2-normalization-gate-run-report",
        "version": "1.2.0",
        "enforceRelease": args.enforce_release,
        "success": False,
        "steps": [],
    }

    tests = [
        "ifkb/digital_v0131/test_normalization_gate.py",
        "ifkb/digital_v0131/test_official_portion_audit.py",
        "ifkb/digital_v0131/test_official_portion_review_queue.py",
        "ifkb/digital_v0131/test_quantity_semantics.py",
        "ifkb/digital_v0131/test_source_normalization_priority.py",
        "ifkb/digital_v0131/test_kb03_ingredient_mapping_audit.py",
    ]
    commands: list[tuple[str, list[str]]] = [
        ("normalization gate tests", ["-m", "unittest", "-v", *tests]),
        ("consensus alignment", [
            str(GATE / "verify_consensus_alignment.py"),
            "--consensus-csv", "ifkb/digital_v0131/ds2_consensus_profiles.csv",
            "--status-json", str(GATE / "current-status.v1.json"),
            "--report", str(output / "consensus-alignment-report.json"),
        ]),
        ("source work queue", [
            str(GATE / "validate_source_work_queue.py"),
            "--queue", str(GATE / "source-record-normalization-work-queue.v1.json"),
            "--gate-status", str(GATE / "current-status.v1.json"),
            "--report", str(output / "source-work-queue-report.json"),
        ]),
        ("quantity semantics", [
            str(GATE / "validate_quantity_semantics.py"),
            "--source-queue", str(GATE / "source-record-normalization-work-queue.v1.json"),
            "--semantics", str(GATE / "source-quantity-semantics.v1.json"),
            "--report", str(output / "source-quantity-semantics-report.json"),
        ]),
        ("official portion audit", [
            str(GATE / "audit_official_portion_candidates.py"),
            "--database", "mobile/assets/ifkb/ifkb-universal-v1.db",
            "--manifest", "mobile/assets/ifkb/ifkb-universal-v1.manifest.json",
            "--queue", str(GATE / "unit-conversion-work-queue.v1.json"),
            "--spec", str(GATE / "official-portion-audit-spec.v1.json"),
            "--report", str(output / "official-portion-candidates.json"),
        ]),
        ("official portion review queue", [
            str(GATE / "build_official_portion_review_queue.py"),
            "--audit-report", str(output / "official-portion-candidates.json"),
            "--unit-queue", str(GATE / "unit-conversion-work-queue.v1.json"),
            "--output", str(output / "official-portion-review-queue.json"),
        ]),
        ("source normalization priority", [
            str(GATE / "build_source_normalization_priority.py"),
            "--source-queue", str(GATE / "source-record-normalization-work-queue.v1.json"),
            "--semantics", str(GATE / "source-quantity-semantics.v1.json"),
            "--review-queue", str(output / "official-portion-review-queue.json"),
            "--output", str(output / "source-normalization-priority.json"),
        ]),
        ("DS2-KB-03 ingredient mapping audit", [
            str(GATE / "audit_kb03_ingredient_mapping.py"),
            "--database", "mobile/assets/ifkb/ifkb-universal-v1.db",
            "--manifest", "mobile/assets/ifkb/ifkb-universal-v1.manifest.json",
            "--source-queue", str(GATE / "source-record-normalization-work-queue.v1.json"),
            "--semantics", str(GATE / "source-quantity-semantics.v1.json"),
            "--spec", str(GATE / "kb03-ingredient-mapping-audit-spec.v1.json"),
            "--report", str(output / "kb03-ingredient-mapping-candidates.json"),
        ]),
        ("draft normalization gate", [
            str(GATE / "validate_normalization_gate.py"),
            "--input", str(GATE / "current-status.v1.json"),
            "--report", str(output / "draft-report.json"),
            "--mode", "draft",
            "--require-v0131-profile-set",
        ]),
    ]
    if args.enforce_release:
        commands.append(("release normalization gate", [
            str(GATE / "validate_normalization_gate.py"),
            "--input", str(GATE / "current-status.v1.json"),
            "--report", str(output / "release-report.json"),
            "--mode", "release",
            "--require-v0131-profile-set",
        ]))

    success = True
    for label, command in commands:
        if not run_step(label, command, report):
            success = False
            break
    report["success"] = success
    (output / "gate-run-report.json").write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return 0 if success else 1


if __name__ == "__main__":
    raise SystemExit(main())
