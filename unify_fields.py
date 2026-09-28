#!/usr/bin/env python3
"""Unify data-field names: build-log.html measurement fields → specs.html canonical names.
Only renames fields that have direct equivalents. Build-log-only fields (checkboxes, notes) keep their names.
"""
import re

# Mapping: old build-log name → canonical specs name
FIELD_MAP = {
    # Main Bearing Clearance
    'p1_main_brg_1': 'main_1',
    'p1_main_brg_2': 'main_2',
    'p1_main_brg_3': 'main_3',
    'p1_main_brg_4': 'main_4',
    'p1_main_brg_5': 'main_5',
    # Crankshaft End Play
    'p1_crank_endplay': 'crank_endplay',
    # Camshaft End Play
    'p2_endplay_val': 'cam_endplay',
    # Rod Bearing Clearance
    'p1_rod_brg_1': 'rod_1',
    'p1_rod_brg_2': 'rod_2',
    'p1_rod_brg_3': 'rod_3',
    'p1_rod_brg_4': 'rod_4',
    'p1_rod_brg_5': 'rod_5',
    'p1_rod_brg_6': 'rod_6',
    'p1_rod_brg_7': 'rod_7',
    'p1_rod_brg_8': 'rod_8',
    # Ring End Gap - Top Ring
    'p1_ring_top_1': 'topring_1',
    'p1_ring_top_2': 'topring_2',
    'p1_ring_top_3': 'topring_3',
    'p1_ring_top_4': 'topring_4',
    'p1_ring_top_5': 'topring_5',
    'p1_ring_top_6': 'topring_6',
    'p1_ring_top_7': 'topring_7',
    'p1_ring_top_8': 'topring_8',
    # Ring End Gap - Second Ring
    'p1_ring_2nd_1': 'secring_1',
    'p1_ring_2nd_2': 'secring_2',
    'p1_ring_2nd_3': 'secring_3',
    'p1_ring_2nd_4': 'secring_4',
    'p1_ring_2nd_5': 'secring_5',
    'p1_ring_2nd_6': 'secring_6',
    'p1_ring_2nd_7': 'secring_7',
    'p1_ring_2nd_8': 'secring_8',
    # Pushrod lengths
    'p2_pr_intake': 'pushrod_intake',
    'p2_pr_exhaust': 'pushrod_exhaust',
    # Pickup-to-Pan
    'p2_pickup_clr': 'pickup_to_pan',
    # Timing
    'p4_initial_timing': 'initial_timing',
    'p4_total_timing': 'total_timing',
    # Advance Springs & Bushing
    'p4_advance_springs': 'advance_springs',
    'p4_advance_bushing': 'advance_bushing',
}

def unify_fields(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    count = 0
    for old, new in FIELD_MAP.items():
        # Replace data-field="old" with data-field="new"
        pattern = f'data-field="{old}"'
        replacement = f'data-field="{new}"'
        occurrences = content.count(pattern)
        if occurrences > 0:
            content = content.replace(pattern, replacement)
            count += occurrences
            print(f'  {old} -> {new} ({occurrences}x)')
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)
    
    return count

if __name__ == '__main__':
    print('=== Renaming build-log.html fields ===')
    n = unify_fields('build-log.html')
    print(f'\nTotal: {n} field references renamed')
    
    # Also check phase files
    for phase in ['build-log-phase1.html', 'build-log-phase2.html', 'build-log-phase3.html', 'build-log-phase4.html']:
        try:
            print(f'\n=== {phase} ===')
            n2 = unify_fields(phase)
            print(f'Total: {n2} renamed')
        except FileNotFoundError:
            print(f'  (not found, skipping)')
