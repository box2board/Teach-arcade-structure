"""Build state price/wage models from BEA SARPP CSV and BLS state XLSX.
Usage: python scripts/build-career-quest-locations.py SARPP.csv state.xlsx [--check]
"""
import csv,json,hashlib,sys
from pathlib import Path
import openpyxl
root=Path(__file__).resolve().parents[1]; prices=Path(sys.argv[1]); wages=Path(sys.argv[2])
fields={'1':'all','2':'goods','3':'rent','4':'utilities','5':'services'}
states={};national={}
for r in csv.DictReader(prices.open(encoding='utf-8-sig')):
    if r['LineCode'] not in fields:continue
    code=r['GeoFIPS'].strip(' "')[:2]
    if code=='00':national[fields[r['LineCode']]]=float(r['2024']);continue
    if not code.isdigit() or int(code)>56:continue
    st=states.setdefault(code,{'name':r['GeoName'],'indices':{},'wages':{}})
    st['indices'][fields[r['LineCode']]]=float(r['2024'])
careers=json.loads((root/'public/career-arcade/career-quest/data/careers.json').read_text())
codes={c['evidence']['blsRecord']['socCode'] for c in careers}
it=iter(openpyxl.load_workbook(wages,read_only=True,data_only=True).active.values);headers=next(it)
for values in it:
    r=dict(zip(headers,values)); st=states.get(str(r['AREA']).zfill(2))
    if st is None or r['OCC_CODE'] not in codes:continue
    st['abbreviation']=r['PRIM_STATE']
    a,h=r['A_PCT25'],r['H_PCT25']
    if isinstance(a,(int,float)): st['wages'][r['OCC_CODE']]=a
    elif isinstance(h,(int,float)): st['wages'][r['OCC_CODE']]=[round(h*2080),'hourly']
assert len(states)==51 and all(len(s['indices'])==5 and s['abbreviation'] for s in states.values())
out={'priceYear':2024,'wageYear':2025,'priceSourceUrl':'https://apps.bea.gov/regional/zip/SARPP.zip','priceInfoUrl':'https://www.bea.gov/data/prices-inflation/regional-price-parities-state-and-metro-area','priceSha256':hashlib.sha256(prices.read_bytes()).hexdigest(),'wageSourceUrl':'https://www.bls.gov/oes/special-requests/oesm25st.zip','wageSha256':hashlib.sha256(wages.read_bytes()).hexdigest(),'nationalIndices':national,'states':states}
p=root/'public/career-arcade/career-quest/data/locations.json';serialized=json.dumps(out,separators=(',',':'))+'\n'
if '--check' in sys.argv:assert json.loads(p.read_text())==out
else:p.write_text(serialized)
print('Verified',len(states),'states/DC;',sum(len(s['wages']) for s in states.values()),'state occupation wage records')
