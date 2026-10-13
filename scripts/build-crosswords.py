#!/usr/bin/env python3
"""Deterministic, fail-closed crossword/PDF build for the static Print & Play catalog.
Run from repo root: python3 scripts/build-crosswords.py [--only ID] [--attempts N].
Editorial source files contain ordered answer|clue pairs; first 10/15/20 are cumulative.
"""
import argparse, hashlib, io, json, math, random, re, sys, unicodedata
from pathlib import Path
from collections import Counter
import fitz
from PIL import Image
from pypdf import PdfReader, PdfWriter
from reportlab.pdfgen import canvas
from reportlab.lib.utils import simpleSplit
from reportlab.lib.colors import HexColor, Color
ROOT=Path(__file__).resolve().parent.parent
LEVELS={'easy':10,'medium':15,'hard':20}
BASE=ROOT/'public/print-play-games'
SUBJECTS=json.loads((ROOT/'crossword-data/subjects.json').read_text())
def norm(s):
    return re.sub('[^A-Z]','',unicodedata.normalize('NFKD',s).encode('ascii','ignore').decode().upper())
def read_content():
    sets={}
    for p in sorted((ROOT/'crossword-data').rglob('*.txt')):
        key=None
        for line in p.read_text().splitlines():
            if not line.strip() or line.startswith('#'):continue
            if line.startswith('['):
                key=line[1:-1];assert key not in sets,key;sets[key]=[]
            else:
                answer,clue=line.split('|',1)
                sets[key].append({'answer':answer,'gridAnswer':norm(answer),'clue':clue})
    for key,entries in sets.items():
        assert len(entries)==20,(key,len(entries))
        assert len(set(e['gridAnswer'] for e in entries))==20,key
        assert all(e['answer'].strip() and e['clue'].strip() and len(e['gridAnswer'])>=2 for e in entries),key
    return sets

def cells_for(word,r,c,d):
    return [(r+i*(d=='down'),c+i*(d=='across')) for i in range(len(word))]
def candidates(entry,grid,owners,placed):
    word=entry['gridAnswer'];starts={(p['row'],p['col']) for p in placed}
    for (gr,gc),char in list(grid.items()):
        for i,ch in enumerate(word):
            if ch!=char:continue
            for d in ('across','down'):
                r=gr-i*(d=='down');c=gc-i*(d=='across')
                if (r,c) in starts:continue # unique clue numbers, even across/down
                cells=cells_for(word,r,c,d);end=cells[-1]
                before=(r-(d=='down'),c-(d=='across'));after=(end[0]+(d=='down'),end[1]+(d=='across'))
                if before in grid or after in grid:continue
                crossings=0;valid=True
                for pos,ch in zip(cells,word):
                    if pos in grid:
                        if grid[pos]!=ch or d in owners[pos] or len(owners[pos])>=2:valid=False;break
                        crossings+=1
                    else:
                        a,b=pos
                        neighbors=((a-1,b),(a+1,b)) if d=='across' else ((a,b-1),(a,b+1))
                        if any(n in grid for n in neighbors):valid=False;break
                if not valid or not crossings:continue
                rows=[p[0] for p in grid]+[p[0] for p in cells];cols=[p[1] for p in grid]+[p[1] for p in cells]
                h=max(rows)-min(rows)+1;w=max(cols)-min(cols)+1
                if h>24 or w>43:continue # at least 12-point writable cells
                # Prefer crossings, balanced compact bounds, and modest vertical extent.
                score=crossings*100-h*w*.14-h*2-abs(w-h*1.3)
                yield score,r,c,d

def generate(entries,seed,attempts):
    rng=random.Random(seed);best=None
    for trial in range(attempts):
        order=list(range(len(entries)));rng.shuffle(order)
        order.sort(key=lambda i:len(entries[i]['gridAnswer'])+rng.uniform(-7,7),reverse=True)
        first=order.pop(0);word=entries[first]['gridAnswer'];d='across'
        grid={(0,i):ch for i,ch in enumerate(word)};owners={pos:{d} for pos in grid}
        placed=[dict(entries[first],index=first,row=0,col=0,direction=d)]
        remaining=order[:]
        while remaining:
            moved=False
            for idx in remaining[:]:
                opts=list(candidates(entries[idx],grid,owners,placed))
                if not opts:continue
                opts.sort(reverse=True);pick=rng.choice(opts[:min(3,len(opts))]);_,r,c,d=pick
                p=dict(entries[idx],index=idx,row=r,col=c,direction=d);placed.append(p)
                for pos,ch in zip(cells_for(p['gridAnswer'],r,c,d),p['gridAnswer']):grid[pos]=ch;owners.setdefault(pos,set()).add(d)
                remaining.remove(idx);moved=True
            if not moved:break
        if remaining:continue
        top=min(r for r,c in grid);left=min(c for r,c in grid)
        for p in placed:p['row']-=top;p['col']-=left
        grid={(r-top,c-left):ch for (r,c),ch in grid.items()}
        h=max(r for r,c in grid)+1;w=max(c for r,c in grid)+1
        score=h*w+abs(w-h*1.4)*8+h*8
        if best is None or score<best[0]:
            ordered=sorted(placed,key=lambda p:(p['row'],p['col']))
            for number,p in enumerate(ordered,1):p['number']=number
            best=(score,{'rows':h,'cols':w,'entries':ordered,'cells':[[r,c,ch] for (r,c),ch in sorted(grid.items())]})
        if best and trial>=min(30,attempts-1) and best[0]<700:break
    if best is None:raise ValueError('No complete readable connected grid found; edit vocabulary or increase attempts')
    return best[1]

def validate_grid(puzzle,expected):
    entries=puzzle['entries'];grid={(r,c):ch for r,c,ch in puzzle['cells']}
    assert sorted(p['index'] for p in entries)==list(range(len(expected)))
    assert sorted(p['number'] for p in entries)==list(range(1,len(entries)+1))
    starts=sorted(entries,key=lambda p:(p['row'],p['col']))
    assert [p['number'] for p in starts]==list(range(1,len(entries)+1))
    owners={};declared=set()
    for i,p in enumerate(entries):
        assert p['gridAnswer']==expected[p['index']]['gridAnswer']
        assert p['clue']==expected[p['index']]['clue']
        cells=cells_for(p['gridAnswer'],p['row'],p['col'],p['direction'])
        declared.add((p['row'],p['col'],p['direction'],p['gridAnswer']))
        for pos,ch in zip(cells,p['gridAnswer']):
            assert grid.get(pos)==ch,(pos,ch)
            owners.setdefault(pos,[]).append(i)
    assert set(owners)==set(grid)
    graph=[set() for p in entries]
    for ids in owners.values():
        assert len(ids)<=2
        if len(ids)==2:
            a,b=ids;assert entries[a]['direction']!=entries[b]['direction'];graph[a].add(b);graph[b].add(a)
    assert all(graph),'Orphan entry'
    seen={0};todo=[0]
    while todo:
        for n in graph[todo.pop()]-seen:seen.add(n);todo.append(n)
    assert len(seen)==len(entries),'Disconnected puzzle'
    # Independently extract every maximal run: catches adjacency/accidental extra words.
    runs=set()
    for r,c in grid:
        for d,dr,dc in [('across',0,1),('down',1,0)]:
            if (r-dr,c-dc) in grid or (r+dr,c+dc) not in grid:continue
            chars=[];a,b=r,c
            while (a,b) in grid:chars.append(grid[a,b]);a+=dr;b+=dc
            runs.add((r,c,d,''.join(chars)))
    assert runs==declared,('Unexpected or missing runs',runs-declared,declared-runs)
    assert puzzle['rows']<=24 and puzzle['cols']<=43
    return True

def draw_grid(c,puzzle,key,top=634):
    size=min(19,540/puzzle['cols'],288/puzzle['rows'])
    assert size>=12,(puzzle['rows'],puzzle['cols'],size)
    width=size*puzzle['cols'];left=(612-width)/2
    numbers={(p['row'],p['col']):p['number'] for p in puzzle['entries']}
    c.setStrokeColor(HexColor('#263238'));c.setLineWidth(.55)
    for r,col,ch in puzzle['cells']:
        x=left+col*size;y=top-(r+1)*size
        c.setFillColor(Color(1,1,1));c.rect(x,y,size,size,fill=1,stroke=1)
        if (r,col) in numbers:
            c.setFillColor(HexColor('#263238'));c.setFont('Helvetica',max(4.8,size*.27));c.drawString(x+1.2,y+size-max(5.5,size*.32),str(numbers[r,col]))
        if key:
            c.setFont('Helvetica-Bold',min(11,size*.58));c.setFillColor(HexColor('#111827'));c.drawCentredString(x+size/2,y+size*.19,ch)
    return top-size*puzzle['rows']

def draw_page(c,topic,level,puzzle,key):
    c.setFillColor(HexColor('#111827'));c.setFont('Helvetica-Bold',11);c.drawString(36,757,'TEACH ARCADE')
    c.setFont('Helvetica',9);c.drawRightString(576,757,'PRINT & PLAY  /  '+SUBJECTS[topic.get('subjectSlug','social-studies')]['worksheetLabel'])
    c.setStrokeColor(HexColor('#111827'));c.setLineWidth(1);c.line(36,746,576,746)
    title=topic['title']+' Crossword';font=19
    while c.stringWidth(title,'Helvetica-Bold',font)>540 and font>14:font-=.5
    c.setFont('Helvetica-Bold',font);c.drawString(36,717,title)
    c.setFont('Helvetica',10);c.drawString(36,697,f"{level.title()}  |  {len(puzzle['entries'])} clues  |  "+('Teacher Answer Key' if key else 'Student Worksheet'))
    if key:
        c.setFont('Helvetica-Bold',10);c.drawString(36,672,'TEACHER ANSWER KEY')
        c.setFont('Helvetica',9);c.drawString(36,656,'Completed grid and numbered answers. Spaces and punctuation are omitted in the grid.')
    else:
        c.setFont('Helvetica',10);c.drawString(36,672,'Name: __________________________________');c.drawString(358,672,'Date: __________________')
        c.setFont('Helvetica',9);c.drawString(36,656,'Directions: Use the clues to complete the grid. Omit spaces, punctuation, and hyphens.')
    bottom=draw_grid(c,puzzle,key)
    top=min(bottom-17,440)
    ordered=sorted(puzzle['entries'],key=lambda p:(p['direction']!='across',p['number']))
    def height(items):
        last=None;h=0
        for p in items:
            if p['direction']!=last:h+=21;last=p['direction']
            h+=len(simpleSplit(p['answer'] if key else p['clue'],'Helvetica',10,242))*11.5+1.8
        return h
    split=min(range(1,len(ordered)),key=lambda i:max(height(ordered[:i]),height(ordered[i:])))
    for items,x in [(ordered[:split],36),(ordered[split:],315)]:
        y=top;last=None
        for p in items:
            if p['direction']!=last:
                c.setFont('Helvetica-Bold',11);c.setFillColor(HexColor('#111827'))
                label=p['direction'].upper()
                if p is items[0] and ordered[split-1]['direction']==p['direction'] and x==315:label+=' (continued)'
                c.drawString(x,y,label);y-=21;last=p['direction']
            text=p['answer'] if key else p['clue'];lines=simpleSplit(text,'Helvetica',10,242)
            c.setFont('Helvetica-Bold',9);c.drawString(x,y,f"{p['number']}.")
            c.setFont('Helvetica',10)
            for line in lines:c.drawString(x+20,y,line);y-=11.5
            y-=1.8
        if y<47:raise ValueError(f"Clues overflow: {topic['id']} {level} bottom={y}; shorten clues or compact grid")
    c.setStrokeColor(HexColor('#9ca3af'));c.setLineWidth(.5);c.line(36,37,576,37)
    c.setFont('Helvetica',8);c.setFillColor(HexColor('#4b5563'));c.drawString(36,23,'TeachArcade.com  |  Grades 7-12');c.drawRightString(576,23,f"{level.title()}  |  {'Answer Key' if key else 'Student Copy'}")
    c.showPage()

def urls(topic):
    if topic['id']=='us-history--world-war-ii':
        stem='files/Teach_Arcade_WWII_Crossword_'
        pdfs={level:'/print-play-games/'+stem+level.title()+'.pdf' for level in LEVELS}
        pdfs['full']='/print-play-games/'+stem+'Print_and_Play.pdf'
    else:
        stem=f"crosswords/{topic.get('subjectSlug','social-studies')}/{topic['id']}/Teach_Arcade_Crossword_"
        pdfs={level:'/print-play-games/'+stem+level.title()+'.pdf' for level in LEVELS}
        pdfs['full']='/print-play-games/'+stem+'Print_and_Play.pdf'
    previews={level:f"/print-play-games/crosswords/{topic.get('subjectSlug','social-studies')}/{topic['id']}/{level}.webp" for level in LEVELS}
    return pdfs,previews

def path_url(url):return ROOT/'public'/url.lstrip('/')
def build_topic(topic,entries,args):
    pdfs,previews=urls(topic);folder=BASE/'crosswords'/topic.get('subjectSlug','social-studies')/topic['id'];folder.mkdir(parents=True,exist_ok=True)
    puzzles={};full=PdfWriter()
    for level,count in LEVELS.items():
        seed=int.from_bytes(hashlib.sha256((topic['id']+level).encode()).digest()[:8],'big')
        puzzle=generate(entries[:count],seed,args.attempts);validate_grid(puzzle,entries[:count]);puzzles[level]=puzzle
        p=path_url(pdfs[level]);p.parent.mkdir(parents=True,exist_ok=True)
        c=canvas.Canvas(str(p),pagesize=(612,792),pageCompression=1,invariant=1)
        c.setTitle(topic['title']+' Crossword - '+level.title());c.setAuthor('Teach Arcade')
        draw_page(c,topic,level,puzzle,False);draw_page(c,topic,level,puzzle,True);c.save()
        reader=PdfReader(p);assert len(reader.pages)==2
        for page in reader.pages:full.add_page(page)
        doc=fitz.open(p);pix=doc[0].get_pixmap(matrix=fitz.Matrix(.85,.85),alpha=False)
        im=Image.frombytes('RGB',[pix.width,pix.height],pix.samples);im.save(path_url(previews[level]),'WEBP',quality=78,method=6)
    fp=path_url(pdfs['full']);full.add_metadata({'/Title':topic['title']+' Crossword - Complete Set','/Author':'Teach Arcade'})
    with fp.open('wb') as f:full.write(f)
    (folder/'puzzles.json').write_text(json.dumps(puzzles,ensure_ascii=False,separators=(',',':'))+'\n')
    return {k:v for k,v in topic.items() if k not in ('status','outputs')}|{'pdfs':pdfs,'previews':previews,'puzzles':f"/print-play-games/crosswords/{topic.get('subjectSlug','social-studies')}/{topic['id']}/puzzles.json"}

def main():
    parser=argparse.ArgumentParser();parser.add_argument('--only');parser.add_argument('--subject',choices=list(SUBJECTS));parser.add_argument('--attempts',type=int,default=180);args=parser.parse_args()
    inventories={slug:json.loads((ROOT/cfg['inventory']).read_text()) for slug,cfg in SUBJECTS.items()}
    content=read_content();all_ids={t['id'] for inv in inventories.values() for t in inv['topics']}
    assert set(content)==all_ids,'Inventories and editorial sources disagree'
    existing=json.loads((BASE/'crossword-catalog.json').read_text())['resources'] if (BASE/'crossword-catalog.json').exists() else []
    selected=[args.subject] if args.subject else list(SUBJECTS)
    catalog=[r for r in existing if r['subject'] not in {SUBJECTS[s]['subject'] for s in selected}];errors=[];completed=0
    for slug in selected:
        inv=inventories[slug]
        for topic in inv['topics']:
            if args.only and topic['id']!=args.only:continue
            if slug!='social-studies':topic['subjectSlug']=slug
            if topic['id']=='constitution-basics':topic['category']='Government & Civics';topic['gradeBand']='7–12'
            assert topic['subject']==SUBJECTS[slug]['subject']
            topic['sourceSha256']=hashlib.sha256((ROOT/topic['source']).read_bytes()).hexdigest()
            topic['sourceTitle']=topic.get('sourceTitle',topic['title'])
            if topic['id'].startswith('world-history--world-war-'):topic['title']=topic['sourceTitle']+' - Global Perspectives'
            if topic['id']=='us-history--world-war-i':topic['title']='World War I - U.S. Involvement'
            try:
                item=build_topic(topic,content[topic['id']],args);catalog.append(item);completed+=1;topic['status']='completed';topic['outputs']=item['pdfs']|{k+'Preview':v for k,v in item['previews'].items()};print('Completed',topic['id'],flush=True)
            except Exception as e:
                errors.append((topic['id'],str(e)));topic['status']='exception';print('ERROR',topic['id'],str(e),flush=True)
        if not args.only:(ROOT/SUBJECTS[slug]['inventory']).write_text(json.dumps(inv,ensure_ascii=False,indent=2)+'\n')
    if args.only:return bool(errors)
    # Keep previously completed subjects; a failing batch never silently publishes a partial manifest.
    if not errors:
        order={slug:i for i,slug in enumerate(SUBJECTS)}
        catalog.sort(key=lambda r:order[r.get('subjectSlug','social-studies')])
        (BASE/'crossword-catalog.json').write_text(json.dumps({'schemaVersion':1,'resources':catalog},ensure_ascii=False,indent=2)+'\n')
    print('Completed:',completed,'Exceptions:',errors,flush=True)
    return bool(errors)
if __name__=='__main__':sys.exit(main())
