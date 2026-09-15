#!/usr/bin/env python
"""Merge all 4 build-log phase pages into a single build-log.html"""
import re

def extract_between(content, start_marker, end_marker):
    """Extract content between two line markers (inclusive of start, exclusive of end)"""
    lines = content.split('\n')
    capturing = False
    result = []
    for line in lines:
        if start_marker in line:
            capturing = True
        if capturing:
            if end_marker in line:
                result.append(line)
                break
            result.append(line)
    return '\n'.join(result)

def extract_html_content(filename, phase_id):
    """Extract the phase HTML content (banner + body) from a phase file"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    lines = content.split('\n')
    
    # Find the phase div start and end
    start_idx = None
    end_idx = None
    for i, line in enumerate(lines):
        if f'<div id="{phase_id}">' in line:
            start_idx = i
        if f'</div><!-- /{phase_id} -->' in line:
            end_idx = i
            break
    
    if start_idx is None or end_idx is None:
        print(f"WARNING: Could not find {phase_id} in {filename}")
        return ""
    
    return '\n'.join(lines[start_idx:end_idx+1])

def extract_css(filename):
    """Extract CSS from a phase file (between <style> and </style>)"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'<style>(.*?)</style>', content, re.DOTALL)
    if match:
        return match.group(1)
    return ""

def extract_js_functions(filename):
    """Extract the <script> block from a phase file"""
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    match = re.search(r'<script>(.*?)</script>', content, re.DOTALL)
    if match:
        return match.group(1)
    return ""

# Read all phase files
phase_files = {
    'phase1': 'build-log-phase1.html',
    'phase2': 'build-log-phase2.html', 
    'phase3': 'build-log-phase3.html',
    'phase4': 'build-log-phase4.html',
}

# Extract HTML content from each phase
phase_html = {}
for pid, fname in phase_files.items():
    phase_html[pid] = extract_html_content(fname, pid)
    print(f"{fname}: extracted {len(phase_html[pid].split(chr(10)))} lines of HTML")

# Get CSS from P1 (representative - all phases have same CSS)
css_p1 = extract_css('build-log-phase1.html')

# Get JS from P1 (we'll adapt it for all phases)
js_p1 = extract_js_functions('build-log-phase1.html')

# Read the current build-log.html hub to get its header/nav structure
with open('build-log.html', 'r', encoding='utf-8') as f:
    hub_content = f.read()

# Extract header HTML from hub
hub_lines = hub_content.split('\n')
header_end = None
for i, line in enumerate(hub_lines):
    if '</header>' in line or '<!-- end header -->' in line:
        header_end = i
        break
    if 'class="container"' in line and i > 100:
        header_end = i - 1
        break

# Build the new combined page
# We use the CSS from P1 as the base (it has all step-card, guide, photo styles)
# and add phase-card specific styles

print(f"\nBuilding combined build-log.html...")

# Read P1 to get the full header structure (it has the nav we want)
with open('build-log-phase1.html', 'r', encoding='utf-8') as f:
    p1_full = f.read()
p1_lines = p1_full.split('\n')

# Find where the header ends in P1 (before <div class="container">)
p1_container_start = None
for i, line in enumerate(p1_lines):
    if '<div class="container">' in line:
        p1_container_start = i
        break

# Get everything from P1 up to and including the header
p1_header_html = '\n'.join(p1_lines[:p1_container_start])

# Modify the header: change title, fix nav active state
p1_header_html = p1_header_html.replace(
    '<title>Phase 1 &ndash; Incoming Inspection &ndash; 302ci BOSS Build</title>',
    '<title>Build Log &ndash; 302ci BOSS Build</title>'
)
# Fix nav: Build Log should be active
p1_header_html = p1_header_html.replace(
    '<a class="nav-item active" href="build-log.html">Build Log</a>',
    '<a class="nav-item active" href="build-log.html">Build Log</a>'
)

# Remove overflow:hidden from phase-body CSS
p1_header_html = p1_header_html.replace(
    '.phase-body { display: block; }',
    '.phase-body { display: block; }'
)

# Add overall progress section style
extra_css = """
        /* Overall progress */
        .overall-progress {
            background: var(--card-bg); border: 1px solid var(--border); border-radius: 10px;
            padding: 0.75rem 1rem; margin-bottom: 1rem;
        }
        .overall-progress h3 { font-size: 0.9rem; color: var(--primary); margin-bottom: 0.4rem; }
        .overall-bar { height: 8px; background: #e2e8f0; border-radius: 4px; overflow: hidden; }
        .overall-fill { height: 100%; background: var(--success); border-radius: 4px; transition: width 0.3s; }
        
        /* Phase colors */
        .phase-banner.p1 { background: linear-gradient(135deg, #2c5282, #2b6cb0); }
        .phase-banner.p2 { background: linear-gradient(135deg, #975a16, #d69e2e); }
        .phase-banner.p3 { background: linear-gradient(135deg, #276749, #38a169); }
        .phase-banner.p4 { background: linear-gradient(135deg, #9b2c2c, #e53e3e); }
"""

# Insert extra CSS before </style>
p1_header_html = p1_header_html.replace('    </style>', extra_css + '    </style>')

# Also need the phase-banner p2/p3/p4 colors if not already present
# Check if p2 has different banner colors
with open('build-log-phase2.html', 'r', encoding='utf-8') as f:
    p2_css = extract_css('build-log-phase2.html')

# Build the combined HTML
combined = p1_header_html + '\n'
combined += '<div class="container">\n\n'

# Overall progress
combined += '''<!-- Overall Progress -->
<div class="overall-progress">
    <h3>Gesamtfortschritt (Overall Progress)</h3>
    <div style="display:flex;align-items:center;gap:0.5rem;">
        <div class="overall-bar" style="flex:1;"><div class="overall-fill" id="overallFill" style="width:0%"></div></div>
        <span id="overallText" style="font-size:0.78rem;font-weight:600;color:var(--text-light);">0 / 0</span>
    </div>
</div>

'''

# Add all 4 phases with their HTML content
# Each phase starts collapsed
for pid in ['phase1', 'phase2', 'phase3', 'phase4']:
    html = phase_html[pid]
    # Make phase body start collapsed
    html = html.replace(
        f'<div class="phase-body" id="{pid}body">',
        f'<div class="phase-body collapsed" id="{pid}body">'
    )
    # Add phase color class to banner if not present
    pnum = pid.replace('phase', '')
    if f'class="phase-banner"' in html and f'p{pnum}' not in html.split('\n')[1]:
        html = html.replace('class="phase-banner"', f'class="phase-banner p{pnum}"')
    combined += html + '\n\n'

combined += '</div><!-- /container -->\n\n'

# Toast
combined += '<div class="toast" id="toast"></div>\n\n'

# Now build the JavaScript
# We take the JS from P1 and generalize it for all 4 phases

# Read JS from all 4 phases to get any unique functions
js_blocks = {}
for pid, fname in phase_files.items():
    js_blocks[pid] = extract_js_functions(fname)

# Use P1's JS as base but modify updateProgress to handle all phases
combined += '<script>\n'

# Config
combined += '''    // ==== CONFIG ====
    const GIST_FILENAME = 'engine-build-log-data.json';
    const FIXED_GIST_ID = 'e2c838fe26e4af9517cae13b492dc43e';
    let isLoading = false;
    let autoSaveTimer = null;

    function getGistConfig() { return { token: localStorage.getItem('gh_token') || '' }; }
    function isGistConfigured() { return getGistConfig().token.length > 0; }

    // ==== COLLAPSE STATE ====
    var _collapseKey = 'engineBuild_collapse_buildlog';
    function saveBuildCollapseState() {
        var state = {};
        document.querySelectorAll('.phase-body').forEach(function(b) {
            if (b.classList.contains('collapsed')) state['pb_' + b.id] = 1;
        });
        document.querySelectorAll('.step-guide').forEach(function(g, i) {
            if (g.classList.contains('open')) state['sg_' + i] = 1;
        });
        localStorage.setItem(_collapseKey, JSON.stringify(state));
    }
    function restoreBuildCollapseState() {
        var raw = localStorage.getItem(_collapseKey);
        if (!raw) return;
        try {
            var state = JSON.parse(raw);
            document.querySelectorAll('.phase-body').forEach(function(b) {
                if (state['pb_' + b.id]) {
                    b.classList.add('collapsed');
                    var toggle = document.getElementById('toggle_' + b.id);
                    if (toggle) toggle.classList.add('collapsed');
                } else {
                    b.classList.remove('collapsed');
                    var toggle = document.getElementById('toggle_' + b.id);
                    if (toggle) toggle.classList.remove('collapsed');
                }
            });
            document.querySelectorAll('.step-guide').forEach(function(g, i) {
                if (state['sg_' + i]) {
                    g.classList.add('open');
                    var btn = g.closest('.step-card').querySelector('.guide-toggle');
                    if (btn) btn.classList.add('open');
                }
            });
        } catch(e) {}
    }

    function togglePhase(bodyId) {
        var body = document.getElementById(bodyId);
        var toggle = document.getElementById('toggle_' + bodyId);
        if (body.classList.contains('collapsed')) {
            body.classList.remove('collapsed');
            if (toggle) toggle.classList.remove('collapsed');
        } else {
            body.classList.add('collapsed');
            if (toggle) toggle.classList.add('collapsed');
        }
        saveBuildCollapseState();
    }
    function toggleGuide(btn) {
        var guide = btn.closest('.step-card').querySelector('.step-guide');
        if (guide) {
            var open = guide.classList.toggle('open');
            btn.classList.toggle('open', open);
        }
        saveBuildCollapseState();
    }

    // ==== PROGRESS ====
    function updateProgress() {
        var totalAll = 0, doneAll = 0;
        ['phase1','phase2','phase3','phase4'].forEach(function(pid) {
            var phase = document.getElementById(pid);
            if (!phase) return;
            var checks = phase.querySelectorAll('input[type="checkbox"][data-field]');
            var done = Array.from(checks).filter(function(c) { return c.checked; }).length;
            var total = checks.length;
            totalAll += total; doneAll += done;
            var num = pid.replace('phase','');
            var bar = document.getElementById('prog' + num);
            var txt = document.getElementById('progText' + num);
            if (bar) bar.style.width = (total > 0 ? (done/total*100) : 0) + '%';
            if (txt) txt.textContent = done + ' / ' + total + ' completed';
        });
        var overallFill = document.getElementById('overallFill');
        var overallText = document.getElementById('overallText');
        if (overallFill) overallFill.style.width = (totalAll > 0 ? (doneAll/totalAll*100) : 0) + '%';
        if (overallText) overallText.textContent = doneAll + ' / ' + totalAll + ' completed';
    }

'''

# Extract migrateData from P1 (field name migrations)
migrate_match = re.search(r'(function migrateData\(data\)\s*\{.*?\n    \})', js_blocks['phase1'], re.DOTALL)
if migrate_match:
    combined += '    ' + migrate_match.group(1) + '\n\n'

# Data functions
combined += '''    function collectData() {
        var data = {};
        document.querySelectorAll('[data-field]').forEach(function(el) {
            data[el.dataset.field] = el.type === 'checkbox' ? el.checked : el.value;
        });
        data._savedAt = new Date().toISOString();
        return data;
    }
    function applyData(data) {
        document.querySelectorAll('[data-field]').forEach(function(el) {
            var v = data[el.dataset.field];
            if (v !== undefined) { if (el.type === 'checkbox') el.checked = v; else el.value = v; }
        });
        updateProgress();
    }

    async function saveData() {
        var existing = JSON.parse(localStorage.getItem('engineBuildLog') || '{}');
        var myData = collectData();
        var merged = Object.assign({}, existing, myData);
        merged._savedAt = new Date().toISOString();
        localStorage.setItem('engineBuildLog', JSON.stringify(merged));
        updateSaveStatus();
        if (isGistConfigured()) {
            try {
                var t = getGistConfig().token;
                var getRes = await fetch('https://api.github.com/gists/' + FIXED_GIST_ID, {
                    headers: { 'Authorization': 'Bearer ' + t }
                });
                if (getRes.ok) {
                    var gist = await getRes.json();
                    var file = gist.files && gist.files[GIST_FILENAME];
                    if (file) {
                        var remote = JSON.parse(file.content);
                        merged = Object.assign({}, remote, myData);
                        merged._savedAt = new Date().toISOString();
                    }
                }
                var res = await fetch('https://api.github.com/gists/' + FIXED_GIST_ID, {
                    method: 'PATCH',
                    headers: { 'Authorization': 'Bearer ' + t, 'Content-Type': 'application/json' },
                    body: JSON.stringify({ files: { [GIST_FILENAME]: { content: JSON.stringify(merged, null, 2) } } })
                });
                if (res.ok) {
                    localStorage.setItem('engineBuildLog', JSON.stringify(merged));
                    showToast('Gespeichert (lokal + Cloud)');
                } else { showToast('Lokal gespeichert (Cloud-Fehler)'); }
            } catch (e) { showToast('Lokal gespeichert (Cloud-Fehler)'); }
        } else { showToast('Lokal gespeichert'); }
    }

    function loadData() {
        isLoading = true;
        var raw = localStorage.getItem('engineBuildLog');
        if (raw) { try { var data = JSON.parse(raw); applyData(data); } catch(e) {} }
        if (isGistConfigured()) {
            fetch('https://api.github.com/gists/' + FIXED_GIST_ID, {
                headers: { 'Authorization': 'Bearer ' + getGistConfig().token }
            }).then(function(r) { return r.json(); }).then(function(gist) {
                var file = gist.files && gist.files[GIST_FILENAME];
                if (file) {
                    var cloudData = JSON.parse(file.content);
                    var localData = JSON.parse(localStorage.getItem('engineBuildLog') || '{}');
                    var cloudTime = new Date(cloudData._savedAt || 0).getTime();
                    var localTime = new Date(localData._savedAt || 0).getTime();
                    var merged = {}, allKeys = Object.keys(localData).concat(Object.keys(cloudData)), seen = {};
                    var winner = cloudTime > localTime ? cloudData : localData;
                    var loser = cloudTime > localTime ? localData : cloudData;
                    for (var ki = 0; ki < allKeys.length; ki++) {
                        var k = allKeys[ki]; if (seen[k]) continue; seen[k] = 1;
                        var wVal = winner[k], lVal = loser[k];
                        if (wVal !== undefined && wVal !== '' && wVal !== null) { merged[k] = wVal; }
                        else if (lVal !== undefined && lVal !== '' && lVal !== null) { merged[k] = lVal; }
                        else { merged[k] = wVal !== undefined ? wVal : lVal; }
                    }
                    applyData(merged);
                    localStorage.setItem('engineBuildLog', JSON.stringify(merged));
                }
                isLoading = false; updateSaveStatus();
            }).catch(function() { isLoading = false; });
        } else { isLoading = false; updateSaveStatus(); }
    }

    function autoSave() {
        if (isLoading) return;
        updateProgress();
        clearTimeout(autoSaveTimer);
        autoSaveTimer = setTimeout(function() { saveData(); }, 500);
    }
    function updateSaveStatus() {
        var raw = localStorage.getItem('engineBuildLog');
        if (raw) {
            try {
                var d = new Date(JSON.parse(raw)._savedAt);
                document.getElementById('saveStatus').textContent =
                    'Saved: ' + d.toLocaleDateString('de-DE') + ' ' + d.toLocaleTimeString('de-DE') +
                    (isGistConfigured() ? ' (Cloud Sync)' : ' (Local)');
            } catch(e) {}
        }
    }
    function showToast(msg) {
        var t = document.getElementById('toast'); t.textContent = msg;
        t.classList.add('show'); setTimeout(function() { t.classList.remove('show'); }, 2500);
    }

    function exportJSON() {
        var data = JSON.parse(localStorage.getItem('engineBuildLog') || '{}');
        var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        var a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'engine-build-log-export.json'; a.click();
    }
    function importJSON(event) {
        var file = event.target.files[0]; if (!file) return;
        var reader = new FileReader();
        reader.onload = function(e) {
            try {
                var imported = JSON.parse(e.target.result);
                var existing = JSON.parse(localStorage.getItem('engineBuildLog') || '{}');
                var merged = Object.assign({}, existing, imported);
                localStorage.setItem('engineBuildLog', JSON.stringify(merged));
                applyData(merged);
                showToast('Import erfolgreich');
            } catch(err) { showToast('Import-Fehler: ' + err.message); }
        };
        reader.readAsText(file);
    }

'''

# Photo gallery functions - extract from P1
photo_match = re.search(r'(// ==== PHOTO.*?)(// ==== BUILD SEARCH|// ==== SEARCH|// ==== i18n)', js_blocks['phase1'], re.DOTALL)
if photo_match:
    combined += '    ' + photo_match.group(1).strip() + '\n\n'

# Build search - extract from P1
search_match = re.search(r'(// ==== BUILD SEARCH.*?)(// ==== SCROLL|function scrollToHash)', js_blocks['phase1'], re.DOTALL)
if not search_match:
    search_match = re.search(r'(// ==== SEARCH.*?)(// ==== SCROLL|function scrollToHash)', js_blocks['phase1'], re.DOTALL)
if search_match:
    combined += '    ' + search_match.group(1).strip() + '\n\n'

# Scroll to hash
scroll_match = re.search(r'(function scrollToHash\(\).*?^\s*\})', js_blocks['phase1'], re.DOTALL | re.MULTILINE)
if scroll_match:
    combined += '    ' + scroll_match.group(1).strip() + '\n\n'

# i18n - extract from P1
i18n_match = re.search(r'(// ==== i18n.*)', js_blocks['phase1'], re.DOTALL)
if i18n_match:
    # Get the i18n block but stop before the scroll/event handlers at the end
    i18n_text = i18n_match.group(1)
    # Find the setLang function and dict
    combined += '    ' + i18n_text.strip() + '\n\n'

# Scroll and page lifecycle - simplified for single page
combined += '''
    // ==== SCROLL & LIFECYCLE ====
    var _scrollKey = 'engineBuild_scroll_buildlog';
    var _scrollTimer = null;
    var _scrollReady = false;
    window.addEventListener('scroll', function() {
        if (!_scrollReady) return;
        clearTimeout(_scrollTimer);
        _scrollTimer = setTimeout(function() {
            localStorage.setItem(_scrollKey, window.scrollY);
        }, 200);
    }, { passive: true });
    function saveFieldsSync() {
        var existing = JSON.parse(localStorage.getItem('engineBuildLog') || '{}');
        var data = Object.assign({}, existing, collectData());
        data._savedAt = new Date().toISOString();
        localStorage.setItem('engineBuildLog', JSON.stringify(data));
    }
    window.addEventListener('beforeunload', function() {
        saveFieldsSync();
        localStorage.setItem(_scrollKey, window.scrollY);
        saveBuildCollapseState();
    });
    window.addEventListener('pagehide', function() {
        saveFieldsSync();
        localStorage.setItem(_scrollKey, window.scrollY);
        saveBuildCollapseState();
    });
    window.addEventListener('load', function() {
        var pos = localStorage.getItem(_scrollKey);
        if (pos) {
            var delay = currentLang === 'en' ? 400 : 200;
            setTimeout(function() { window.scrollTo(0, parseInt(pos)); }, delay);
            setTimeout(function() { window.scrollTo(0, parseInt(pos)); _scrollReady = true; }, delay + 200);
        } else { _scrollReady = true; }
    });
    window.addEventListener('pageshow', function(e) {
        if (e.persisted) { restoreBuildCollapseState(); var pos = localStorage.getItem(_scrollKey); if (pos) window.scrollTo(0, parseInt(pos)); }
    });

    // ==== INIT ====
    document.addEventListener('DOMContentLoaded', function() {
        loadData();
        restoreBuildCollapseState();
        document.querySelectorAll('.photo-gallery[data-photo-group]').forEach(function(g) {
            renderPhotos(g.dataset.photoGroup);
        });
        scrollToHash();
        if (currentLang === 'en') setTimeout(function() { setLang('en'); }, 100);
    });
    window.addEventListener('hashchange', scrollToHash);
'''

combined += '</script>\n\n'

# FAB buttons (converter, etc.) - extract from P1
with open('build-log-phase1.html', 'r', encoding='utf-8') as f:
    p1_full = f.read()
fab_match = re.search(r'(<div style="position:fixed;bottom:16px.*?</div>\s*\n)', p1_full, re.DOTALL)
if fab_match:
    combined += fab_match.group(1)

# Converter/Units panels - extract from P1 if present
for panel_id in ['convPanel', 'unitsPanel']:
    panel_match = re.search(rf'(<!-- .*?{panel_id}.*?-->.*?</div>\s*\n)', p1_full, re.DOTALL)
    # Skip if not found - might not be on P1

combined += '\n</body>\n</html>\n'

# Write the combined file
with open('build-log.html', 'w', encoding='utf-8') as f:
    f.write(combined)

line_count = len(combined.split('\n'))
print(f"\nCombined build-log.html: {line_count} lines")

# Verify div balance
opens = combined.count('<div')
closes = combined.count('</div')
print(f"Div balance: {opens} opens, {closes} closes {'OK' if opens == closes else 'MISMATCH!'}")
