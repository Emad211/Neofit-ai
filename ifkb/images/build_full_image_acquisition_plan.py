#!/usr/bin/env python3
"""Locked Stage-1 entrypoint for the full IFKB image acquisition plan.

The P0 roster is exactly the 12 pilot classes plus the 48-class P0 candidate
queue. Later wave, exact-source and field-capture files only describe status;
they cannot add or remove classes from the historical P0 scope.
"""
from __future__ import annotations

from ifkb.images import full_image_acquisition_plan_impl as planner

planner.P0_INPUTS = (
    "ifkb/images/pilot_seed_manifest.csv",
    "ifkb/images/p0_candidate_queries.csv",
)

P0_INPUTS = planner.P0_INPUTS
main = planner.main

if __name__ == "__main__":
    raise SystemExit(main())
