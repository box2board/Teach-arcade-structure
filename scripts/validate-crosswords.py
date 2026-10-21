#!/usr/bin/env python3
"""Independent PDF glyph, catalog, connectivity, page-order and asset validation."""
import argparse,hashlib,importlib,json,re,sys
from pathlib import Path
import fitz
from PIL import Image
from pypdf import PdfReader
m=importlib.import_module('build-crosswords');root=m.ROOT

def validate_pdf_grid(page,puzzle,key):
    size=min(19,540/puzzle['cols'],288/puzzle['rows']);left=(612-size*puzzle['cols'])/2
    expected={(r,c):ch for r,c,ch in puzzle['cells']};letters={};numbers={}
    for block in page.get_text('rawdict')['blocks']:
        for line in block.get('lines',[]):
            for span in line['spans']:
                for glyph in span['chars']:
                    ch=glyph['c'];x,y=glyph['origin']
                    if not (left-.1<=x<=left+size*puzzle['cols']+.1 and 158<=y<=158+size*puzzle['rows']+.1):continue
                    row=int((y-158)/size);col=int((x-left)/size)
                    assert (row,col) in expected,('Glyph in impossible cell',row,col,ch)
                    if ch.isalpha():
                        assert key,'Student grid contains letters';assert (row,col) not in letters
                        letters[row,col]=ch
                    elif ch.isdigit():numbers.setdefault((row,col),'');numbers[row,col]+=ch
    assert letters==expected if key else not letters
    assert numbers=={(p['row'],p['col']):str(p['number']) for p in puzzle['entries']},'Printed grid numbering mismatch'

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--subject',choices=list(m.SUBJECTS));args=parser.parse_args()
    content=m.read_content();all_catalog=json.loads((m.BASE/'crossword-catalog.json').read_text())['resources']
    subjects=[args.subject] if args.subject else list(m.SUBJECTS)
    inventory_topics=[t for slug in subjects for t in json.loads((root/m.SUBJECTS[slug]['inventory']).read_text())['topics']]
    ids={t['id'] for t in inventory_topics};content={k:v for k,v in content.items() if k in ids}
    catalog=[r for r in all_catalog if r['id'] in ids]
    assert len(catalog)==len(inventory_topics)==len(content)
    assert {r['id'] for r in catalog}==set(content)
    assert len({r['id'] for r in all_catalog})==len(all_catalog)
    assert {r['id'] for r in all_catalog}==set(m.read_content())
    html=(m.BASE/'crosswords'/'index.html').read_text();hub=(m.BASE/'index.html').read_text();assert '<iframe' not in html
    assert not re.search(r'class="crossword-card"',hub)
    assert 'href="/print-play-games/crosswords/"' in hub
    checked=[];totalpages=0;mincell=100;maxthumb=0
    for r in catalog:
        assert hashlib.sha256((root/r['source']).read_bytes()).hexdigest()==r['sourceSha256'],'Source changed'
        assert html.count(f'id="crossword-{r["id"]}"')==1
        puzzles=json.loads(m.path_url(r['puzzles']).read_text());previous=set();full=fitz.open(m.path_url(r['pdfs']['full']));assert len(full)==6
        for idx,(level,count) in enumerate(m.LEVELS.items()):
            p=puzzles[level];answers={e['gridAnswer'] for e in p['entries']}
            assert len(answers)==count and previous<=answers;previous=answers
            m.validate_grid(p,content[r['id']][:count]);mincell=min(mincell,540/p['cols'],288/p['rows'],19)
            pdf=m.path_url(r['pdfs'][level]);doc=fitz.open(pdf);assert len(doc)==2 and len(PdfReader(pdf).pages)==2
            assert r['pdfs'][level] in html and r['previews'][level] in html
            for i,page in enumerate(doc):
                assert page.rect.width==612 and page.rect.height==792
                validate_pdf_grid(page,p,i==1)
                assert page.get_pixmap().samples==full[idx*2+i].get_pixmap().samples,'Combined page order or rendering differs'
                # Every drawn text block stays within the sheet; no clipping.
                for block in page.get_text('dict')['blocks']:
                    if block['type']==0:
                        x0,y0,x1,y1=block['bbox'];assert x0>=30 and y0>=12 and x1<=583 and y1<=780,(r['id'],level,block['bbox'])
            pix=doc[0].get_pixmap(matrix=fitz.Matrix(.85,.85),alpha=False);expected=Image.frombytes('RGB',[pix.width,pix.height],pix.samples)
            import io
            buf=io.BytesIO();expected.save(buf,'WEBP',quality=78,method=6)
            thumb=m.path_url(r['previews'][level]);assert thumb.read_bytes()==buf.getvalue(),'Preview does not match PDF'
            assert thumb.stat().st_size<100_000;maxthumb=max(maxthumb,thumb.stat().st_size)
        assert r['pdfs']['full'] in html;totalpages+=12;checked.append(r['id'])
    # All local hub href/src assets resolve, including generated choices.
    for page in (html,hub):
        for url in re.findall(r'(?:href|src)="([^"]+)"',page):
            if url.startswith('/'):
                path=m.path_url(url.split('?')[0].split('#')[0]);assert path.is_file() or (path/'index.html').is_file(),url
    report={'status':'passed','topics':len(checked),'packages':len(checked),'pdfs':len(checked)*4,'previews':len(checked)*3,'pdfPages':totalpages,'minimumCellPoints':round(mincell,2),'maximumThumbnailBytes':maxthumb,'checks':['cumulative 10/15/20 vocabulary','unique answers and nonblank clues','all entries placed','independent maximal-run comparison','connected crossings','printed glyph and numbering checks','no student answer glyphs','complete key glyphs','Letter page size and text bounds','2/2/2/6 page counts','exact combined rendering/order','exact thumbnail/PDF match','all hub href/src assets resolve','unique resource IDs','source SHA-256 freshness']}
    report['subjects']=[m.SUBJECTS[slug]['subject'] for slug in subjects]
    destination=(root/m.SUBJECTS[args.subject]['inventory']).parent/'validation.json' if args.subject else root/'docs/crosswords/all-subjects-validation.json'
    destination.parent.mkdir(parents=True,exist_ok=True);destination.write_text(json.dumps(report,indent=2)+'\n');print(json.dumps(report,indent=2))
if __name__=='__main__':main()
