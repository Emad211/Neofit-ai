#!/usr/bin/env python3
"""Portable Stage-1 runner for the locked IFKB image acquisition plan."""
from __future__ import annotations

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from ifkb.images.build_full_image_acquisition_plan import main

if __name__ == "__main__":
    raise SystemExit(main())
