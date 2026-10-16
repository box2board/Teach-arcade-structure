"""Import O*NET 31.0 occupational interest vectors; no inferred replacements."""
import argparse,csv,hashlib,json
from pathlib import Path
p=argparse.ArgumentParser();p.add_argument('--source',type=Path,required=True);a=p.parse_args()
out=Path(__file__).resolve().parents[1]/'public/career-arcade/career-quest/data'
careers=json.loads((out/'careers.json').read_text());by={}
for r in csv.DictReader(a.source.open(encoding='utf-8-sig')):
 if r['Scale ID']=='OI':
  by.setdefault(r['O*NET-SOC Code'],{})[r['Element Name'][0]]=float(r['Data Value'])
profiles={c['socCode']:by[c['socCode']] for c in careers if len(by.get(c['socCode'],{}))==6}
assert all(set(v)==set('RIASEC') and all(1<=x<=7 for x in v.values()) for v in profiles.values())
result={'version':'O*NET 31.0','url':'https://www.onetcenter.org/dl_files/database/db_31_0_csv/career_interest_types.csv','sha256':hashlib.sha256(a.source.read_bytes()).hexdigest(),'scale':'OI, 1–7','checkedAt':'2026-10-16','attribution':'USDOL/ETA, O*NET 31.0 Database, CC BY 4.0; Teach Arcade selected six OI values per occupation. No endorsement.','profiles':profiles,'unavailable':[c['socCode'] for c in careers if c['socCode'] not in profiles]}
(out/'career-interests.json').write_text(json.dumps(result,indent=2)+'\n');print('Exact interest profiles:',len(profiles),'Unavailable:',result['unavailable'])
