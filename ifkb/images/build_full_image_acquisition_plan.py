#!/usr/bin/env python3
"""Locked Stage-2 entrypoint for the full IFKB image acquisition plan.

The P0 roster remains the 12 pilot classes plus the 48-class candidate queue.
Stage 2 additionally includes the explicitly re-adjudicated retry manifest in
the row-level asset ledger. Aggregate-only Wave 3 rows remain excluded.
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
)

P0_INPUTS = planner.P0_INPUTS
ROW_LEVEL_ACCEPTED_INPUTS = planner.ROW_LEVEL_ACCEPTED_INPUTS
main = planner.main

if __name__ == "__main__":
    raise SystemExit(main())
