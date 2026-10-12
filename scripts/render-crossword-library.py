#!/usr/bin/env python3
"""Render static cards from the shared manifest; run after building PDFs."""
import html,json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
base=root/'public/print-play-games'
resources=json.loads((base/'crossword-catalog.json').read_text())['resources']
esc=lambda value:html.escape(str(value),quote=True)
categories=list(dict.fromkeys(r['category'] for r in resources))
cards=[]
for r in resources:
    options=[]
    for level,label,detail in [('full','Download All Three','Easy + Medium + Hard · 6 pages'),('easy','Easy Only','10 clues · student copy + answer key'),('medium','Medium Only','15 clues · student copy + answer key'),('hard','Hard Only','20 clues · student copy + answer key')]:
        previews='|'.join(r['previews'].values()) if level=='full' else r['previews'][level]
        options.append(f'<div class="download-option{" primary" if level=="full" else ""}"><a href="{esc(r["pdfs"][level])}" data-preview="{esc(previews)}" aria-label="{esc(r["title"])}: {label}" download><span class="download-title">{label}</span><span class="download-sub">{detail}</span></a></div>')
    search=(r['title']+' '+r['sourceTitle']+' '+r['category']).lower()
    cards.append(f'<article class="crossword-card" id="crossword-{esc(r["id"])}" data-course="{esc(r["category"])}" data-search="{esc(search)}"><h3>{esc(r["title"])} Crossword</h3><p class="meta">Social Studies · {esc(r["category"])} · Grades 7–12<br>Easy · Medium · Hard</p><div class="download-options">'+''.join(options)+'</div></article>')
filters='<button type="button" data-category="" aria-pressed="true">All courses</button>'+''.join(f'<button type="button" data-category="{esc(c)}" aria-pressed="false">{esc(c)}</button>' for c in categories)
markup=f'''<!-- CROSSWORD_LIBRARY_START -->
<section id="social-studies-crosswords" class="crossword-library" aria-labelledby="crossword-title">
<div class="library-heading"><span class="library-icon" aria-hidden="true">{''.join('<i></i>' for _ in range(9))}</span><h2 id="crossword-title" class="section-title">Social Studies Crossword Library</h2></div>
<p class="section-sub">{len(resources)} topics, three cumulative levels each. Every download includes a student worksheet and teacher answer key. Hover or focus a download to preview the worksheet.</p>
<div class="library-toolbar"><label for="crossword-search">Find your topic</label><input id="crossword-search" type="search" placeholder="Search topics or courses" autocomplete="off"><div class="library-filters" role="group" aria-label="Filter crosswords by course">{filters}</div></div>
<p class="library-status" role="status" aria-live="polite">{len(resources)} topics available</p>
<div class="library-grid">{''.join(cards)}</div>
<div class="library-pagination" hidden><button type="button" data-prev>Previous</button><span></span><button type="button" data-next>Next</button></div>
<noscript><p>All downloads are available below. Enable JavaScript to search and filter this library.</p></noscript>
</section>
<!-- CROSSWORD_LIBRARY_END -->'''
p=base/'index.html';s=p.read_text()
if '<!-- CROSSWORD_LIBRARY_START -->' in s:s=re.sub(r'<!-- CROSSWORD_LIBRARY_START -->.*?<!-- CROSSWORD_LIBRARY_END -->',lambda _:markup,s,flags=re.S)
else:
    start=s.index('<div class="card resource-card">');end=s.index('<div class="card"><h3>Build the Library',start);s=s[:start]+s[end:]
    s=s.replace('<section aria-labelledby="featured-title">',markup+'\n<section aria-labelledby="featured-title">')
    # Remove obsolete PDF iframe preview styles; keep shared compact download option styles.
    a=s.index('    .preview-popover{');b=s.index('    .anchor{',a);s=s[:a]+s[b:]
    s=s.replace('.preview-popover{display:none}','')
    s=s.replace('</head>','  <link rel="stylesheet" href="/print-play-games/crossword-library.css">\n  <script src="/print-play-games/crossword-library.js" defer></script>\n</head>')
    s=s.replace('href="/subjects/social-studies/index.html" aria-label="Print and Play for Social Studies"','href="#social-studies-crosswords" aria-label="Print and Play for Social Studies"')
    s=s.replace('<a class="btn" href="#featured-title">Featured Printables</a>','<a class="btn" href="#social-studies-crosswords">Browse Crosswords</a>')
p.write_text(s)
print(f'Rendered {len(resources)} static cards and {len(resources)*4} download choices')
