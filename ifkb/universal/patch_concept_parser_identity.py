#!/usr/bin/env python3
from pathlib import Path

path = Path('ifkb/universal/augment_mobile_catalog_concepts.py')
source = path.read_text(encoding='utf-8')

before_patterns = "VARIANT_SEGMENT_PATTERNS = tuple(pattern for _, pattern in (*COOKING_PATTERNS, *FORM_PATTERNS, *FAT_PATTERNS))"
after_patterns = """VARIANT_FORM_PATTERNS = tuple(
    pattern for name, pattern in FORM_PATTERNS if name not in {'juice', 'concentrate'}
)
VARIANT_SEGMENT_PATTERNS = tuple(
    pattern for _, pattern in (*COOKING_PATTERNS, *FAT_PATTERNS)
) + VARIANT_FORM_PATTERNS"""
if source.count(before_patterns) != 1:
    raise RuntimeError('Expected one VARIANT_SEGMENT_PATTERNS definition')
source = source.replace(before_patterns, after_patterns)

before_loop = """    for index, segment in enumerate(segments[1:], start=1):
        if segment_is_variant(segment):
            split_index = index
            break"""
after_loop = """    for index, segment in enumerate(segments[1:], start=1):
        # In USDA meat descriptions, a leading `fresh` is an identity family
        # marker followed by the actual cut (for example pork backfat). Splitting
        # at that segment would collapse hundreds of distinct cuts into `Pork`.
        if index == 1 and normalized_key(segment) == 'fresh':
            continue
        if segment_is_variant(segment):
            split_index = index
            break"""
if source.count(before_loop) != 1:
    raise RuntimeError('Expected one concept split loop')
source = source.replace(before_loop, after_loop)

path.write_text(source, encoding='utf-8')
print('concept parser identity refinement applied')
