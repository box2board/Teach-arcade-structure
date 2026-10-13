#!/usr/bin/env python3
"""Render grouped static libraries from the shared manifest; run after building PDFs."""
import html,json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent;base=root/'public/print-play-games'
resources=json.loads((base/'crossword-catalog.json').read_text())['resources']
subjects=json.loads((root/'crossword-data/subjects.json').read_text())
esc=lambda value:html.escape(str(value),quote=True)
sections=[]
for slug,config in subjects.items():
    items=[r for r in resources if r['subject']==config['subject']]
    if not items:continue
    categories=list(dict.fromkeys(r['category'] for r in items));cards=[]
    for r in items:
        options=[]
        for level,label,detail in [('full','Download All Three','Easy + Medium + Hard · 6 pages'),('easy','Easy Only','10 clues · student copy + answer key'),('medium','Medium Only','15 clues · student copy + answer key'),('hard','Hard Only','20 clues · student copy + answer key')]:
            previews='|'.join(r['previews'].values()) if level=='full' else r['previews'][level]
            options.append(f'<div class="download-option{" primary" if level=="full" else ""}"><a href="{esc(r["pdfs"][level])}" data-preview="{esc(previews)}" aria-label="{esc(r["title"])}: {label}" download><span class="download-title">{label}</span><span class="download-sub">{detail}</span></a></div>')
        search=(r['title']+' '+r['sourceTitle']+' '+r['category']).lower()
        cards.append(f'<article class="crossword-card" id="crossword-{esc(r["id"])}" data-course="{esc(r["category"])}" data-search="{esc(search)}"><h3>{esc(r["title"])} Crossword</h3><p class="meta">{esc(config["displayName"])} · {esc(r["category"])} · Grades 7–12<br>Easy · Medium · Hard</p><div class="download-options">'+''.join(options)+'</div></article>')
    filters='<button type="button" data-category="" aria-pressed="true">All categories</button>'+''.join(f'<button type="button" data-category="{esc(c)}" aria-pressed="false">{esc(c)}</button>' for c in categories)
    title_id='crossword-title-'+slug;search_id='crossword-search' if slug=='social-studies' else 'crossword-search-'+slug
    sections.append(f'''<section id="{config['anchor']}" class="crossword-library" data-subject="{esc(config['subject'])}" aria-labelledby="{title_id}">
<div class="library-heading"><span class="library-icon" aria-hidden="true">{''.join('<i></i>' for _ in range(9))}</span><h2 id="{title_id}" class="section-title">{esc(config['displayName'])} Crossword Library</h2></div>
<p class="section-sub">{len(items)} topics, three cumulative levels each. Every download includes a student worksheet and teacher answer key. Hover or focus a download to preview the worksheet.</p>
<div class="library-toolbar"><label for="{search_id}">Find your topic</label><input id="{search_id}" type="search" placeholder="Search topics or categories" autocomplete="off"><div class="library-filters" role="group" aria-label="Filter {esc(config['displayName'])} crosswords by category">{filters}</div></div>
<p class="library-status" role="status" aria-live="polite">{len(items)} topics available</p>
<div class="library-grid">{''.join(cards)}</div>
<div class="library-pagination" hidden><button type="button" data-prev>Previous</button><span></span><button type="button" data-next>Next</button></div>
<noscript><p>All downloads remain available. Enable JavaScript to search and filter this library.</p></noscript>
</section>''')
markup='<!-- CROSSWORD_LIBRARY_START -->\n'+'\n'.join(sections)+'\n<!-- CROSSWORD_LIBRARY_END -->'
p=base/'index.html';s=p.read_text();assert '<!-- CROSSWORD_LIBRARY_START -->' in s
s=re.sub(r'<!-- CROSSWORD_LIBRARY_START -->.*?<!-- CROSSWORD_LIBRARY_END -->',lambda _:markup,s,flags=re.S)
links=''.join(f'<a class="btn secondary" href="#{cfg["anchor"]}">{esc(cfg["displayName"])} Crosswords</a>' for cfg in subjects.values())
s=re.sub(r'<!-- CROSSWORD_SUBJECT_LINKS_START -->.*?<!-- CROSSWORD_SUBJECT_LINKS_END -->','',s,flags=re.S)
s=s.replace('<a class="btn" href="#social-studies-crosswords">Browse Crosswords</a>', '<a class="btn" href="#social-studies-crosswords">Browse Crosswords</a><!-- CROSSWORD_SUBJECT_LINKS_START -->'+links+'<!-- CROSSWORD_SUBJECT_LINKS_END -->')
s=s.replace('href="/subjects/ela/index.html" aria-label="Print and Play for ELA"','href="#ela-crosswords" aria-label="Print and Play for ELA"')
p.write_text(s);print(f'Rendered {len(resources)} static cards across {len(sections)} subjects and {len(resources)*4} download choices')
