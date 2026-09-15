#!/usr/bin/env python
"""Add glossary overlay to index.html and build-log.html (copied from specs.html)"""

# Read specs.html to extract glossary components
with open('specs.html', 'r', encoding='utf-8') as f:
    specs = f.read()
specs_lines = specs.split('\n')

# Extract glossary CSS (lines 260-330 approx)
css_start = css_end = None
for i, line in enumerate(specs_lines):
    if '/* ---- Glossary ---- */' in line:
        css_start = i
    if css_start and i > css_start + 5 and (line.strip().startswith('/*') or line.strip().startswith('.') and 'glossary' not in line.lower()):
        css_end = i
        break
if not css_end:
    css_end = css_start + 70  # fallback

glossary_css = '\n'.join(specs_lines[css_start:css_end])
print(f"Glossary CSS: lines {css_start+1}-{css_end+1} ({css_end-css_start} lines)")

# Extract glossary HTML (guide-glossary overlay)
html_start = html_end = None
for i, line in enumerate(specs_lines):
    if 'id="guide-glossary"' in line:
        html_start = i
    if html_start and '</div><!-- /guide-glossary -->' in line:
        html_end = i + 1
        break

glossary_html = '\n'.join(specs_lines[html_start:html_end])
print(f"Glossary HTML: lines {html_start+1}-{html_end} ({html_end-html_start} lines)")

# Extract glossary JS functions
js_funcs = []
for fname in ['showGuide', 'hideGuide', 'openGlossary', 'filterGlossary', 'filterCategory', 'updateGlossaryCount']:
    # Find each function
    for i, line in enumerate(specs_lines):
        if f'function {fname}(' in line:
            # Capture until closing brace at same indent
            start = i
            brace_depth = 0
            end = i
            for j in range(i, min(i+50, len(specs_lines))):
                brace_depth += specs_lines[j].count('{') - specs_lines[j].count('}')
                if brace_depth <= 0:
                    end = j + 1
                    break
            js_funcs.append((fname, '\n'.join(specs_lines[start:end])))
            break

print(f"Glossary JS: {len(js_funcs)} functions extracted")

# Also extract the guide-overlay CSS if not in glossary CSS
guide_css = ""
for i, line in enumerate(specs_lines):
    if '.guide-overlay' in line and 'glossary' not in line:
        # Get all guide-overlay rules
        for j in range(i, min(i+20, len(specs_lines))):
            if specs_lines[j].strip() and not specs_lines[j].strip().startswith('/*'):
                guide_css += specs_lines[j] + '\n'
            if specs_lines[j].strip() == '' or ('.' in specs_lines[j] and 'guide' not in specs_lines[j]):
                break

# Also get FAB button for glossary
fab_html = '    <button class="fab-btn glossary" onclick="showGuide(\'guide-glossary\')" title="Glossar">&#128214;</button>'

# ============================================================
# Add to index.html
# ============================================================
with open('index.html', 'r', encoding='utf-8') as f:
    idx = f.read()

# Check if glossary already exists
if 'id="guide-glossary"' in idx:
    print("index.html: glossary already present, skipping HTML")
else:
    # Insert glossary HTML before </body>
    idx = idx.replace('</body>', glossary_html + '\n</body>')
    print("index.html: glossary HTML inserted")

# Check if glossary CSS exists
if '/* ---- Glossary ---- */' not in idx:
    # Insert before </style>
    idx = idx.replace('    </style>', glossary_css + '\n    </style>')
    print("index.html: glossary CSS inserted")

# Check if guide-overlay CSS exists
if '.guide-overlay' not in idx:
    guide_overlay_css = """
        .guide-overlay { display: none; position: fixed; inset: 0; z-index: 500; background: var(--bg); overflow-y: auto; }
        .guide-overlay.show { display: block; }
        .guide-back { position: sticky; top: 0; z-index: 501; background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; cursor: pointer; font-size: 1.1rem; width: 100%; text-align: left; }
        .guide-back:hover { background: var(--primary-light); }
        .fab-btn { border: none; border-radius: 50%; width: 48px; height: 48px; font-size: 1.3rem; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; }
        .fab-btn.glossary { background: #ed8936; }"""
    idx = idx.replace('    </style>', guide_overlay_css + '\n    </style>')
    print("index.html: guide-overlay CSS inserted")

# Check if glossary JS functions exist
for fname, fcode in js_funcs:
    if f'function {fname}(' not in idx:
        # Insert before </script> (last one)
        last_script_end = idx.rfind('</script>')
        idx = idx[:last_script_end] + '\n    ' + fcode + '\n' + idx[last_script_end:]
        print(f"index.html: {fname}() inserted")

# Check if FAB button exists for glossary
if "showGuide('guide-glossary')" not in idx:
    # Find the FAB area or add before </body>
    if 'position:fixed;bottom' in idx:
        # Add to existing FAB group
        import re
        fab_match = re.search(r'(<div style="position:fixed;bottom[^>]+>)', idx)
        if fab_match:
            idx = idx.replace(fab_match.group(1), fab_match.group(1) + '\n' + fab_html)
            print("index.html: glossary FAB button added to existing group")
    else:
        fab_container = f'\n<div style="position:fixed;bottom:16px;right:16px;z-index:900;display:flex;flex-direction:column;gap:8px;align-items:center;">\n{fab_html}\n</div>\n'
        idx = idx.replace('</body>', fab_container + '</body>')
        print("index.html: glossary FAB container added")

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(idx)

# ============================================================
# Add to build-log.html
# ============================================================
with open('build-log.html', 'r', encoding='utf-8') as f:
    bl = f.read()

if 'id="guide-glossary"' in bl:
    print("build-log.html: glossary already present, skipping HTML")
else:
    bl = bl.replace('</body>', glossary_html + '\n</body>')
    print("build-log.html: glossary HTML inserted")

if '/* ---- Glossary ---- */' not in bl:
    bl = bl.replace('    </style>', glossary_css + '\n    </style>')
    print("build-log.html: glossary CSS inserted")

if '.guide-overlay' not in bl:
    guide_overlay_css = """
        .guide-overlay { display: none; position: fixed; inset: 0; z-index: 500; background: var(--bg); overflow-y: auto; }
        .guide-overlay.show { display: block; }
        .guide-back { position: sticky; top: 0; z-index: 501; background: var(--primary); color: white; border: none; padding: 0.4rem 0.8rem; cursor: pointer; font-size: 1.1rem; width: 100%; text-align: left; }
        .guide-back:hover { background: var(--primary-light); }
        .fab-btn { border: none; border-radius: 50%; width: 48px; height: 48px; font-size: 1.3rem; cursor: pointer; box-shadow: 0 2px 8px rgba(0,0,0,0.25); display: flex; align-items: center; justify-content: center; color: white; }
        .fab-btn.glossary { background: #ed8936; }"""
    bl = bl.replace('    </style>', guide_overlay_css + '\n    </style>')
    print("build-log.html: guide-overlay CSS inserted")

for fname, fcode in js_funcs:
    if f'function {fname}(' not in bl:
        last_script_end = bl.rfind('</script>')
        bl = bl[:last_script_end] + '\n    ' + fcode + '\n' + bl[last_script_end:]
        print(f"build-log.html: {fname}() inserted")

# Replace the existing glossary button (just links to index.html) with proper FAB
if "showGuide('guide-glossary')" not in bl:
    # Remove old button that just links to index.html
    bl = bl.replace(
        '<button onclick="window.location.href=\'index.html\'" style="background:#ed8936;color:#fff;border:none;border-radius:50%;width:44px;height:44px;font-size:1.1rem;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.25);display:flex;align-items:center;justify-content:center;" title="Glossary">&#128214;</button>',
        fab_html
    )
    print("build-log.html: glossary FAB button updated")

with open('build-log.html', 'w', encoding='utf-8') as f:
    f.write(bl)

# Verify
for fname in ['index.html', 'build-log.html', 'specs.html']:
    with open(fname, 'r', encoding='utf-8') as f:
        c = f.read()
    has_html = 'id="guide-glossary"' in c
    has_css = 'glossary-search' in c
    has_js = 'function filterGlossary(' in c
    has_fab = "showGuide('guide-glossary')" in c
    print(f"\n{fname}: HTML={has_html} CSS={has_css} JS={has_js} FAB={has_fab}")
