#!/usr/bin/env python3
from __future__ import annotations

import argparse
import importlib.util
import sys
import time
from pathlib import Path
from urllib.error import HTTPError


def load_discovery_module(script_path: Path):
    spec = importlib.util.spec_from_file_location("ifkb_commons_discovery", script_path)
    if spec is None or spec.loader is None:
        raise RuntimeError(f"Could not load {script_path}")
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--queries", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--base-delay-seconds", type=float, default=2.5)
    parser.add_argument("--max-attempts", type=int, default=6)
    args = parser.parse_args()

    module = load_discovery_module(Path(__file__).with_name("discover_commons_candidates.py"))
    original_api_request = module.api_request

    def resilient_api_request(params):
        for attempt in range(args.max_attempts):
            # A fixed pre-request delay prevents bursts. Backoff below handles 429 responses.
            time.sleep(args.base_delay_seconds)
            try:
                return original_api_request(params)
            except HTTPError as exc:
                if exc.code != 429 or attempt + 1 == args.max_attempts:
                    raise
                delay = min(120.0, 10.0 * (2 ** attempt))
                print(f"HTTP 429; sleeping {delay:.0f}s before retry {attempt + 2}/{args.max_attempts}", flush=True)
                time.sleep(delay)
        raise RuntimeError("unreachable retry state")

    module.api_request = resilient_api_request
    module.MAX_SEARCH_RESULTS = 20
    sys.argv = [
        str(Path(__file__).name),
        "--queries", str(args.queries),
        "--output", str(args.output),
    ]
    return module.main()


if __name__ == "__main__":
    raise SystemExit(main())
