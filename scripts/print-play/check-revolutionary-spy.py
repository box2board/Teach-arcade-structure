"""Audit the generated student packet rather than trusting the authored answer key."""
from pathlib import Path
import json,re,itertools
import pdfplumber
root=Path('public/print-play-games/escape-style/revolutionary-spy-escape')
m=json.loads(Path('scripts/print-play/revolutionary-spy-manifest.json').read_text())
with pdfplumber.open(root/'revolutionary-spy-escape.pdf') as pdf:
 assert len(pdf.pages)==18
 texts=[p.extract_text() for p in pdf.pages]
 for i,p in enumerate(pdf.pages,1):
  assert p.width==612 and p.height==792
  for word in p.extract_words():
   assert word['x0']>=31 and word['x1']<=581,(i,word)
   assert word['top']>=31 and word['bottom']<=756,(i,word)
 cipher=re.search(r'QR WDA[^\n]+',texts[8]).group()
 decoded=''.join(chr((ord(c)-65-3)%26+65) if c.isalpha() else c for c in cipher)
 assert decoded=='NO TAX WITHOUT A VOICE',decoded
 assert decoded.split()[-1]==m['checkpoints'][0]['code']
 # Read title/seal pairings directly from the cut-apart student page.
 seals={}
 for title,number in re.findall(r'(BOSTON TEA PARTY|DECLARATION OF INDEPENDENCE|STAMP ACT|LEXINGTON AND CONCORD|BOSTON MASSACRE).*?SEAL (\d)',texts[10],re.S):seals[title]=number
 sequence=['STAMP ACT','BOSTON MASSACRE','BOSTON TEA PARTY','LEXINGTON AND CONCORD','DECLARATION OF INDEPENDENCE']
 assert ''.join(seals[t] for t in sequence)==m['checkpoints'][1]['code']
 # Card columns extracted by their physical rectangles to avoid two-column interleaving.
 digits=[]
 for i in range(6):
  x=48+(i%2)*264;top=635-(i//2)*184
  t=pdf.pages[12].within_bbox((x,792-top,x+252,792-top+170)).extract_text()
  nums=re.search(r'P / L / N: (\d) / (\d) / (\d)',t).groups();digits.append(nums)
 selected=[0,1,0,1,2,2]
 assert ''.join(digits[i][j] for i,j in enumerate(selected))==m['checkpoints'][2]['code']
 assert sum(''.join(digits[i][j] for i,j in enumerate(c))=='285149' for c in itertools.product(range(3),repeat=6))==1
 route=['Boston','Lexington','Concord','Philadelphia'];mapdigits={}
 # Each station number is centered on a drawn node; read nearby text from actual map.
 for name,(x,y) in {'Boston':(505,520),'Lexington':(330,550),'Concord':(145,565),'Philadelphia':(180,275)}.items():
  mapdigits[name]=pdf.pages[13].within_bbox((x-10,792-y-10,x+10,792-y+12)).extract_text().strip()
 assert ''.join(mapdigits[x] for x in route)==m['checkpoints'][3]['code']
 slots={}
 for c in m['checkpoints']:
  for pos,letter in zip(c['slots'],c['fragment']):assert pos not in slots;slots[pos]=letter
 assert ''.join(slots[i] for i in range(1,8))==m['password']
 assert set(m['teacher_pages']).isdisjoint(m['team_pages'])
 assert len(m['teacher_pages'])+len(m['team_pages'])==18
 assert len(m['team_pages'])*7+len(m['teacher_pages'])==78
print('PASS: 18 Letter pages, text bounds, cipher, card seals, unique viewpoint code, map stations, final slots, print counts.')
