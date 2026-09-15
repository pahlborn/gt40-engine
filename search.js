/**
 * Unified Search — one file, all pages, same results.
 *
 * Requires in the HTML:
 *   #searchInput, #searchNav, #searchCount, #subResults
 *   #guide-glossary  (glossary overlay with .glossary-entry elements)
 *   .container or #mainContent as the search root
 *
 * Each page must call:  initUnifiedSearch();
 */

(function () {
    'use strict';

    /* ---- state ---- */
    var searchMarks = [];
    var searchIdx = -1;
    var searchTimeout = null;
    var subPageCache = null;
    var subPageLoading = false;

    /* ---- helpers ---- */
    function escHtml(s) {
        return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    function getSearchRoot() {
        return document.getElementById('mainContent') || document.querySelector('.container') || document.body;
    }

    /* ---- highlight on current page ---- */
    function clearHighlights() {
        document.querySelectorAll('mark.search-hl').forEach(function (m) {
            var p = m.parentNode;
            p.replaceChild(document.createTextNode(m.textContent), m);
            p.normalize();
        });
        searchMarks = [];
        searchIdx = -1;
    }

    function jumpToMark(idx) {
        if (!searchMarks.length) return;
        searchIdx = ((idx % searchMarks.length) + searchMarks.length) % searchMarks.length;
        searchMarks.forEach(function (m) { m.style.background = '#fefcbf'; });
        var cur = searchMarks[searchIdx];
        cur.style.background = '#f6ad55';

        /* expand collapsed parents */
        var phaseBody = cur.closest('.phase-body');
        if (phaseBody && phaseBody.classList.contains('collapsed')) {
            phaseBody.classList.remove('collapsed');
            var toggle = document.getElementById('toggle_' + phaseBody.id);
            if (toggle) toggle.classList.remove('collapsed');
        }
        var guide = cur.closest('.step-guide');
        if (guide && guide.style.display === 'none') guide.style.display = 'block';

        var headerH = 0;
        var header = document.querySelector('.header');
        if (header) headerH = header.offsetHeight;
        window.scrollTo({ top: cur.getBoundingClientRect().top + window.scrollY - headerH - 20, behavior: 'smooth' });
        var countEl = document.getElementById('searchCount');
        if (countEl) countEl.textContent = (searchIdx + 1) + ' / ' + searchMarks.length;
    }

    /* ---- glossary results ---- */
    function getGlossaryResultsHtml(q) {
        var qLower = q.toLowerCase();
        if (q.length < 2) return '';
        var entries = document.querySelectorAll('#guide-glossary .glossary-entry');
        var glossaryHits = [];
        entries.forEach(function (entry) {
            var searchData = (entry.getAttribute('data-search') || '').toLowerCase();
            var termEl = entry.querySelector('.glossary-term');
            var term = termEl ? termEl.textContent : '';
            if (searchData.indexOf(qLower) >= 0 || term.toLowerCase().indexOf(qLower) >= 0) {
                var fields = entry.querySelectorAll('.glossary-field');
                var related = entry.querySelector('.glossary-related');
                var fieldTexts = [];
                fields.forEach(function (f) { fieldTexts.push(f.textContent.trim()); });
                if (related) fieldTexts.push(related.textContent.trim());
                glossaryHits.push({ term: term, fields: fieldTexts });
            }
        });
        if (glossaryHits.length === 0) return '';
        var html = '<div class="sub-header" style="color:#ed8936;border-bottom:2px solid #ed8936;padding-bottom:4px;margin-bottom:4px;">'
            + '\uD83D\uDCD6 Glossar (' + glossaryHits.length + ' Treffer)</div>';
        glossaryHits.slice(0, 3).forEach(function (h) {
            html += '<div class="sub-hit" style="cursor:pointer;padding:8px 10px;border-left:3px solid #ed8936;margin-bottom:6px;background:rgba(237,137,54,0.06);" '
                + 'onclick="if(typeof showGuide===\'function\')showGuide(\'guide-glossary\');var si=document.getElementById(\'glossarySearch\');if(si){si.value=\'' + escHtml(h.term.split(' ')[0]) + '\';if(typeof filterGlossary===\'function\')filterGlossary();}">'
                + '<span style="font-weight:700;color:#ed8936;font-size:0.85rem;">' + escHtml(h.term) + '</span>';
            h.fields.forEach(function (f) {
                html += '<div style="font-size:0.75rem;color:#718096;margin-top:2px;line-height:1.35;">' + escHtml(f) + '</div>';
            });
            html += '</div>';
        });
        if (glossaryHits.length > 3) {
            html += '<div class="sub-hit" style="cursor:pointer;font-style:italic;color:#ed8936;" '
                + 'onclick="if(typeof showGuide===\'function\')showGuide(\'guide-glossary\');var si=document.getElementById(\'glossarySearch\');if(si){si.value=\'' + escHtml(q) + '\';if(typeof filterGlossary===\'function\')filterGlossary();}">'
                + '... und ' + (glossaryHits.length - 3) + ' weitere &rarr; im Glossar</div>';
        }
        html += '<div style="border-top:1px solid #e2e8f0;margin:6px 0;"></div>';
        return html;
    }

    /* ---- cross-page results ---- */
    function loadSubPages() {
        if (subPageCache || subPageLoading) return;
        subPageLoading = true;
        var thisPage = location.pathname.split('/').pop() || 'index.html';
        var allPages = [
            { url: 'index.html', title: 'Overview' },
            { url: 'specs.html', title: 'Specifications' },
            { url: 'build-log.html', title: 'Build Log' },
            { url: 'docs/M-6009-302.html', title: 'M-6009-302 Short Block' },
            { url: 'docs/M-6010-BOSS302.html', title: 'M-6010-BOSS302 Block' },
            { url: 'docs/dellorto-drla-tuning.html', title: 'Dellorto DRLA Tuning' },
            { url: 'docs/msd-advance-tuning.html', title: 'MSD Advance Tuning' },
            { url: 'docs/un1-13.html', title: 'UN1-13 Gearbox' },
            { url: 'docs/troubleshooting.html', title: 'Troubleshooting' }
        ];
        /* skip the page we are on */
        var pages = allPages.filter(function (p) { return p.url !== thisPage; });
        subPageCache = [];
        var loaded = 0;
        pages.forEach(function (page) {
            fetch(page.url).then(function (r) { return r.ok ? r.text() : ''; }).then(function (html) {
                if (!html) return;
                var parser = new DOMParser();
                var doc = parser.parseFromString(html, 'text/html');
                doc.querySelectorAll('script, style').forEach(function (el) { el.remove(); });
                var allText = (doc.body.textContent || '');
                var rawLines = allText.split(/\n/);
                var lines = [];
                rawLines.forEach(function (line, idx) {
                    var trimmed = line.trim();
                    if (trimmed.length > 3) lines.push({ text: trimmed, lineNum: idx });
                });
                subPageCache.push({ url: page.url, title: page.title, lines: lines });
            }).catch(function () { }).finally(function () {
                loaded++;
                if (loaded === pages.length) subPageLoading = false;
            });
        });
    }

    function getSubPageResultsHtml(q) {
        if (!subPageCache || q.length < 2) return '';
        var qLower = q.toLowerCase();
        var hits = [];
        subPageCache.forEach(function (page) {
            page.lines.forEach(function (line) {
                var idx = line.text.toLowerCase().indexOf(qLower);
                if (idx >= 0) {
                    var start = Math.max(0, idx - 30);
                    var end = Math.min(line.text.length, idx + q.length + 50);
                    var before = (start > 0 ? '...' : '') + escHtml(line.text.substring(start, idx));
                    var match = escHtml(line.text.substring(idx, idx + q.length));
                    var after = escHtml(line.text.substring(idx + q.length, end)) + (end < line.text.length ? '...' : '');
                    hits.push({ page: page, context: before + '<mark>' + match + '</mark>' + after });
                }
            });
        });
        /* deduplicate */
        var seen = {};
        var unique = [];
        hits.forEach(function (h) {
            var key = h.page.url + ':' + h.context.substring(0, 60);
            if (!seen[key]) { seen[key] = true; unique.push(h); }
        });
        if (unique.length === 0) return '';
        /* group by page */
        var grouped = {};
        unique.forEach(function (h) {
            if (!grouped[h.page.url]) grouped[h.page.url] = { page: h.page, hits: [] };
            grouped[h.page.url].hits.push(h);
        });
        var html = '';
        Object.keys(grouped).forEach(function (url) {
            var g = grouped[url];
            var count = g.hits.length;
            html += '<div class="sub-header">' + escHtml(g.page.title) + ' (' + count + ' Treffer)</div>';
            g.hits.slice(0, 5).forEach(function (h) {
                html += '<a class="sub-hit" href="' + g.page.url + '">'
                    + '<span class="sub-context">' + h.context + '</span></a>';
            });
            if (count > 5) {
                html += '<a class="sub-hit" href="' + g.page.url + '" style="font-style:italic;color:#2b6cb0;">'
                    + '... und ' + (count - 5) + ' weitere Treffer &rarr;</a>';
            }
        });
        return html;
    }

    /* ---- main search ---- */
    function _doSearch() {
        var input = document.getElementById('searchInput');
        var q = input ? input.value.trim() : '';
        clearHighlights();
        var navEl = document.getElementById('searchNav');
        var subEl = document.getElementById('subResults');

        if (q.length < 2) {
            if (navEl) navEl.style.display = 'none';
            if (subEl) { subEl.innerHTML = ''; subEl.style.display = 'none'; }
            return;
        }

        /* 1. Highlight matches on this page */
        var root = getSearchRoot();
        var walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, null);
        var matches = [];
        var qLower = q.toLowerCase();
        while (walker.nextNode()) {
            var node = walker.currentNode;
            var tag = node.parentElement ? node.parentElement.tagName : '';
            if (tag === 'SCRIPT' || tag === 'STYLE') continue;
            var idx = node.textContent.toLowerCase().indexOf(qLower);
            if (idx >= 0) matches.push({ node: node, idx: idx, len: q.length });
        }
        for (var i = matches.length - 1; i >= 0; i--) {
            var m = matches[i];
            try {
                var range = document.createRange();
                range.setStart(m.node, m.idx);
                range.setEnd(m.node, m.idx + m.len);
                var mark = document.createElement('mark');
                mark.className = 'search-hl';
                range.surroundContents(mark);
            } catch (e) { /* skip broken ranges */ }
        }
        searchMarks = Array.from(root.querySelectorAll('mark.search-hl'));
        if (navEl) {
            navEl.style.display = searchMarks.length ? 'flex' : 'none';
        }
        var countEl = document.getElementById('searchCount');
        if (countEl) countEl.textContent = searchMarks.length ? searchMarks.length + ' Treffer' : 'keine';
        if (searchMarks.length) { searchIdx = 0; jumpToMark(0); }

        /* 2. Dropdown: glossary + cross-page results */
        var glossaryHtml = getGlossaryResultsHtml(q);
        var subPageHtml = getSubPageResultsHtml(q);
        var combinedHtml = glossaryHtml + subPageHtml;
        if (subEl) {
            if (combinedHtml) {
                subEl.innerHTML = combinedHtml;
                subEl.style.display = 'block';
            } else {
                subEl.innerHTML = '';
                subEl.style.display = 'none';
            }
        }
    }

    /* ---- public API (attached to window) ---- */
    window.doSearch = function () {
        if (searchTimeout) clearTimeout(searchTimeout);
        searchTimeout = setTimeout(_doSearch, 200);
    };

    window.searchJump = function (dir) {
        if (searchMarks.length) jumpToMark(searchIdx + dir);
    };

    window.clearSearch = function () {
        var input = document.getElementById('searchInput');
        if (input) input.value = '';
        clearHighlights();
        var navEl = document.getElementById('searchNav');
        if (navEl) navEl.style.display = 'none';
        var subEl = document.getElementById('subResults');
        if (subEl) { subEl.innerHTML = ''; subEl.style.display = 'none'; }
    };

    window.searchKeyHandler = function (e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (e.shiftKey) window.searchJump(-1);
            else window.searchJump(1);
        } else if (e.key === 'Escape') {
            window.clearSearch();
        }
    };

    window.initUnifiedSearch = function () {
        loadSubPages();
        /* Ctrl+F override */
        document.addEventListener('keydown', function (e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
                e.preventDefault();
                var input = document.getElementById('searchInput');
                if (input) input.focus();
            }
        });
        /* close dropdown on outside click */
        document.addEventListener('click', function (e) {
            var subEl = document.getElementById('subResults');
            var searchBar = document.querySelector('.search-bar');
            if (subEl && subEl.style.display !== 'none' && searchBar && !searchBar.contains(e.target)) {
                subEl.style.display = 'none';
            }
        });
    };
})();
