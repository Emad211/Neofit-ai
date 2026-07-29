#!/usr/bin/env python3
"""Locked Stage-1 entrypoint for the full IFKB image acquisition plan.

The historical P0 class roster is defined only by the 12-class pilot manifest
plus the 48-class P0 candidate queue. Later wave, exact-source and field-capture
files describe execution status; they must not add or remove P0 classes.
"""
from __future__ import annotations

from ifkb.images import build_full_image_acquisition_plan as planner

planner.P0_INPUTS = (
    "ifkb/images/pilot_seed_manifest.csv",
    "ifkb/images/p0_candidate_queries.csv",
)

if __name__ == "__main__":
    raise SystemExit(planner.main())
