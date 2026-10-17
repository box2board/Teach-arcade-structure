"""Import official national OEWS wage rows; run with extracted national XLSX path.
Requires openpyxl. Keeps source hashes and every occupation crosswalk for review.
"""
import sys,json,hashlib
from pathlib import Path
import openpyxl
root=Path(__file__).resolve().parents[1]
source=Path(sys.argv[1]); it=iter(openpyxl.load_workbook(source,read_only=True,data_only=True).active.values)
headers=next(it); rows={r[8]:dict(zip(headers,r)) for r in it}
profiles={}
for c in json.loads((root/'public/career-arcade/career-quest/data/careers.json').read_text()):
    b=c['evidence']['blsRecord']; r=rows.get(b['socCode'],{})
    annual=r.get('A_PCT25'); hourly=r.get('H_PCT25')
    method='annual-25th-percentile'
    if not isinstance(annual,(int,float)):
        if isinstance(hourly,(int,float)): annual=round(hourly*2080);method='hourly-25th-times-2080'
        else: annual=30000;method='illustrative-missing-wage'
    profiles[c['id']]={'socCode':b['socCode'],'title':r.get('OCC_TITLE',b['title']),'scope':b['scope'],'annualPay':annual,'method':method,'publishedAnnual25':r.get('A_PCT25'),'publishedHourly25':hourly,'sourceUrl':'https://www.bls.gov/oes/current/oes'+b['socCode'].replace('-','')+'.htm'}
out={'wageYear':2025,'sourceUrl':'https://www.bls.gov/oes/special-requests/oesm25nat.zip','sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'wageMethodUrl':'https://www.bls.gov/oes/earnings.htm','tuition':{'sourceUrl':'https://nces.ed.gov/ipeds/search/viewtable?tableId=36557','year':'2023–24','twoYearInDistrict':4074,'fourYearInState':9016,'graduateInState':11827,'certificateExample':10868,'note':'Institutional averages, not enrollment weighted; graduate charges exclude professional-practice doctorates. Tuition only, not total attendance costs or debt.'},'profiles':profiles}
target=root/'public/career-arcade/career-quest/data/career-finances.json'
if '--check' in sys.argv:
    assert json.loads(target.read_text())==out, 'Finance data differs from official source import'
else:
    target.write_text(json.dumps(out,indent=2)+'\n')
print('Imported',len(profiles),'career wage models')
