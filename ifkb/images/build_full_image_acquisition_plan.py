#!/usr/bin/env python3
"""Portable entrypoint for the IFKB image plan.

Image QA is maintained separately from nutrition dataset readiness. This wrapper
only configures the historical manifests and delegates to the deterministic
implementation.
"""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ifkb.images import full_image_acquisition_plan_impl as planner

planner.P0_INPUTS = (
    "ifkb/images/pilot_seed_manifest.csv",
    "ifkb/images/p0_candidate_queries.csv",
)
planner.ROW_LEVEL_ACCEPTED_INPUTS = (
    "ifkb/images/pilot_seed_manifest.csv",
    "ifkb/images/p0_wave2_accepted_manifest.csv",
    "ifkb/images/releases/0.12.2/retry-readjudicated-manifest.csv",
    "ifkb/images/releases/0.12.2/wave3-readjudicated-manifest.csv",
)

main = planner.main

if __name__ == "__main__":
    raise SystemExit(main())
