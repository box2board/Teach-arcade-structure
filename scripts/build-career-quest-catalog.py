"""Build Career Quest's 500-profile catalog from official, pinned O*NET/BLS files.

python3 scripts/build-career-quest-catalog.py --source-dir /tmp/cq500
See docs/career-quest.md for input downloads and content attribution.
"""
import argparse, collections, csv, hashlib, json, re
from pathlib import Path
from html.parser import HTMLParser

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public/career-arcade/career-quest/data'

class TableParser(HTMLParser):
    def __init__(self): super().__init__(); self.rows=[]; self.row=None; self.cell=None
    def handle_starttag(self,t,a):
        if t=='tr': self.row=[]
        if t in ('td','th') and self.row is not None:self.cell=[]
    def handle_data(self,d):
        if self.cell is not None:self.cell.append(d)
    def handle_endtag(self,t):
        if t in ('td','th') and self.cell is not None:
            self.row.append(re.sub(r'\s+',' ',''.join(self.cell)).strip());self.cell=None
        if t=='tr' and self.row is not None:self.rows.append(self.row);self.row=None

def load(folder,name):
    with (folder/(name+'.csv')).open(encoding='utf-8-sig',newline='') as f:return list(csv.DictReader(f))
def slug(s):return re.sub(r'[^a-z0-9]+','-',s.lower()).strip('-')

# Stable IDs already referenced by saved journeys. Codes prevent re-adding these
# roles under their official plural titles when choosing the additional 420.
LEGACY_CODES = dict(line.split() for line in '''
registered-nurse 29-1141.00
physical-therapist-assistant 31-2021.00
radiologic-technologist 29-2034.00
dental-hygienist 29-1292.00
medical-laboratory-technician 29-2012.00
software-developer 15-1252.00
cybersecurity-analyst 15-1212.00
network-technician 15-1231.00
data-analyst 15-2051.00
ux-designer 15-1255.00
project-coordinator 13-1082.00
operations-manager 11-1021.00
marketing-specialist 13-1161.00
human-resources-assistant 43-4161.00
sales-representative 41-4012.00
accountant 13-2011.00
financial-analyst 13-2051.00
loan-officer 13-2072.00
tax-specialist 13-2081.00
insurance-underwriter 13-2053.00
civil-engineering-technician 17-3022.00
mechanical-designer 17-3013.00
electrical-engineering-technician 17-3023.00
environmental-engineer 17-2081.00
quality-engineer 17-2112.00
elementary-teacher 25-2022.00
school-counselor 21-1012.00
instructional-designer 25-9031.00
special-education-teacher 25-2058.00
career-coach 21-1012.00
graphic-designer 27-1024.00
video-editor 27-4032.00
journalist 27-3023.00
social-media-manager 27-3031.00
animator 27-1014.00
hotel-manager 11-9081.00
event-planner 13-1121.00
chef 35-1011.00
travel-advisor 41-3041.00
restaurant-supervisor 35-1012.00
social-worker 21-1021.00
substance-abuse-counselor 21-1011.00
community-outreach-specialist 21-1093.00
childcare-director 11-9031.00
case-manager 21-1022.00
city-planner 19-3051.00
public-health-inspector 19-5011.00
emergency-dispatcher 43-5031.00
policy-analyst 19-3094.00
parks-program-coordinator 39-9032.00
police-officer 33-3051.00
firefighter 33-2011.00
emt 29-2042.00
paramedic 29-2043.00
electrician 47-2111.00
plumber 47-2152.00
hvac-technician 49-9021.00
welder 51-4121.00
carpenter 47-2031.00
auto-mechanic 49-3023.00
diesel-mechanic 49-3031.00
machinist 51-4041.00
construction-manager 11-9021.00
architect 17-1011.00
physician 29-1215.00
dentist 29-1021.00
pharmacist 29-1051.00
physical-therapist 29-1123.00
veterinarian 29-1131.00
veterinary-technician 29-2056.00
farmer 11-9013.00
pilot 53-2012.00
truck-driver 53-3032.00
cosmetologist 39-5012.00
lawyer 23-1011.00
civil-engineer 17-2051.00
mechanical-engineer 17-2141.00
psychologist 19-3033.00
high-school-teacher 25-2031.00
athletic-trainer 29-9091.00
'''.strip().splitlines())

FIELDS = {
 '11':'Business','13':'Business','15':'Information Technology','17':'Engineering',
 '19':'Science & Research','21':'Human Services','23':'Public Safety & Law',
 '25':'Education & Training','27':'Arts, A/V Technology & Communications',
 '29':'Health Science','31':'Health Science','33':'Public Safety & Law',
 '35':'Food Service','37':'Facilities & Grounds','39':'Personal Care',
 '41':'Sales & Customer Service','43':'Office & Administration',
 '45':'Agriculture & Animals','47':'Skilled Trades & Construction',
 '49':'Transportation & Repair','51':'Manufacturing','53':'Transportation & Repair'}
WEIGHTS=dict(zip(FIELDS,[30,30,27,30,32,18,9,27,30,45,15,20,14,10,20,18,28,12,30,30,35,25]))
SKILLS={
 '11':['leadership','communication','timeManagement'], '13':['financialLiteracy','problemSolving','professionalism'],
 '15':['techLiteracy','problemSolving','adaptability'],'17':['problemSolving','techLiteracy','creativity'],
 '19':['problemSolving','professionalism','techLiteracy'],'21':['communication','teamwork','professionalism'],
 '23':['communication','problemSolving','professionalism'],'25':['communication','leadership','adaptability'],
 '27':['creativity','communication','techLiteracy'],'29':['problemSolving','communication','professionalism'],
 '31':['teamwork','communication','professionalism'],'33':['adaptability','communication','professionalism'],
 '35':['timeManagement','teamwork','creativity'],'37':['professionalism','timeManagement','problemSolving'],
 '39':['communication','creativity','professionalism'],'41':['communication','problemSolving','adaptability'],
 '43':['timeManagement','communication','techLiteracy'],'45':['adaptability','problemSolving','professionalism'],
 '47':['problemSolving','professionalism','techLiteracy'],'49':['problemSolving','techLiteracy','professionalism'],
 '51':['techLiteracy','professionalism','problemSolving'],'53':['timeManagement','professionalism','adaptability']}
CONTEXT_NAMES=['Contact With Others','Time Pressure','Indoors, Environmentally Controlled','Outdoors, Exposed to Weather','Spend Time Standing','Face-to-Face Discussions with Individuals and Within Teams','Work With or Contribute to a Work Group or Team']

def cluster_for(prefix, title):
    lower=title.lower()
    if prefix in ('11','13','15') and any(x in lower for x in ['financial','insurance','credit','tax ','budget','actuar','investment','loan ','claims ']):return 'Finance'
    if prefix=='39' and any(x in lower for x in ['animal','pet ']):return 'Agriculture & Animals'
    if prefix=='11' and any(x in lower for x in ['food service','lodging']):return 'Hospitality & Tourism'
    return FIELDS[prefix]

def build(folder):
    if any(c.get('evidence') for c in json.loads((OUT/'careers.json').read_text())):
        raise ValueError('Catalog is audited. Use scripts/audit-career-quest.py --write to refresh without discarding evidence or corrections.')
    original=[c for c in json.loads((OUT/'careers.json').read_text()) if c.get('catalogAdded',0)<=3]
    assert len(original)==80
    occ={r['O*NET-SOC Code']:r for r in load(folder,'occupation_data')}
    tasks=collections.defaultdict(list)
    for r in load(folder,'task_statements'):
        if r['Task Type']=='Core':tasks[r['O*NET-SOC Code']].append(r['Task'])
    zones={r['O*NET-SOC Code']:int(r['Job Zone']) for r in load(folder,'job_zones')}
    aliases=collections.defaultdict(list)
    for r in load(folder,'sample_of_reported_titles'):aliases[r['O*NET-SOC Code']].append(r['Reported Job Title'])
    anchors=collections.defaultdict(dict)
    for r in load(folder,'work_context_categories'):
        if r['Category'] in ('1','5'):anchors[r['Element Name']][r['Category']]=r['Category Description']
    contexts=collections.defaultdict(list)
    # Stream the 50 MB input; do not retain hundreds of thousands of survey rows.
    with (folder/'work_context.csv').open(encoding='utf-8-sig',newline='') as f:
        for r in csv.DictReader(f):
            if r['Scale ID']=='CX' and r['Element Name'] in CONTEXT_NAMES and r['Recommend Suppress']!='Y':
                name=r['Element Name'];value=float(r['Data Value'])
                if 1<=value<=5 and '1' in anchors[name] and '5' in anchors[name]:
                    contexts[r['O*NET-SOC Code']].append(dict(label=name,value=value,low=anchors[name]['1'],high=anchors[name]['5'],surveyDate=r['Date'],surveySource=r['Domain Source']))
    parser=TableParser();parser.feed((folder/'projections.html').read_text())
    if not parser.rows or '2025' not in ' '.join(parser.rows[0]): raise ValueError('Expected the pinned 2025 BLS table; review the importer before using a new vintage')
    bls={r[1]:r for r in parser.rows if len(r)==16 and r[2]=='Line item'}
    used=set(LEGACY_CODES.values());existing_titles={slug(c['title']) for c in original}
    candidates=collections.defaultdict(list)
    for code,o in occ.items():
        prefix=code[:2];row=bls.get(code[:7])
        if (prefix not in FIELDS or code in used or not row
            or len(tasks[code])<4 or len(contexts[code])<3 or code not in zones
            or 'all other' in o['Title'].lower() or slug(o['Title']) in existing_titles):continue
        candidates[prefix].append(code)
    # Deterministic selection balances major occupational families, rather than
    # filling the catalog with hundreds of alphabetically adjacent job titles.
    priority_titles = {'forensic science technicians','marine engineers and naval architects','zoologists and wildlife biologists','aerospace engineers','chemical engineers','dental assistants','pharmacy technicians','nurse practitioners','flight attendants','air traffic controllers','animal trainers','coaches and scouts','photographers','producers and directors','fashion designers','interior designers','optometrists','biochemists and biophysicists','epidemiologists','video game designers','librarians and media collections specialists','astronomers','personal financial advisors','biologists'}
    def priority(code):
        title=occ[code]['Title'].lower()
        penalty=3*('postsecondary' in title)+2*('first-line' in title)+('machine' in title)
        return (-10 if title in priority_titles else penalty),len(title),title
    for prefix in candidates:candidates[prefix].sort(key=priority)
    selected=[];counts=collections.Counter(c['socCode'][:2] if 'socCode' in c else LEGACY_CODES[c['id']][:2] for c in original)
    while len(selected)<420:
        options=[p for p in FIELDS if candidates[p]]
        if not options:raise ValueError('Not enough complete, distinct occupations')
        prefix=min(options,key=lambda p:counts[p]/WEIGHTS[p]);selected.append(candidates[prefix].pop(0));counts[prefix]+=1
    allskills=list(original[0]['skillAffinities'])
    additions=[]
    for c in original:c['socCode']=LEGACY_CODES[c['id']]
    for code in selected:
        o=occ[code];row=bls[code[:7]];prefix=code[:2];zone=zones[code];education=row[12]
        if 'doctoral' in education.lower() or "master" in education.lower():paths=['grad']
        elif 'bachelor' in education.lower():paths=['college']
        elif 'associate' in education.lower():paths=['cc','college']
        elif 'postsecondary' in education.lower() or row[14]=='Apprenticeship':paths=['trade','cc']
        else:paths=['workforce','trade','cc']
        wage_text=row[11];wage_match=re.search(r'[0-9][0-9,]*(?:\.[0-9]+)?',wage_text)
        median=float(wage_match.group().replace(',','')) if wage_match else None
        # Pay ranges are ONLY game assumptions, kept apart from sourced pay.
        model_mid=median*.75 if median else {2:38000,3:48000,4:62000,5:80000}[zone]
        minimum=max(24000,round(model_mid*.87/1000)*1000);maximum=max(minimum+2000,round(model_mid*1.13/1000)*1000)
        pay=(f"BLS reports a 2025 national median annual wage of ${median:,.0f} for {row[0]}. This includes experienced workers and is not starting pay." if median else f"BLS does not publish a comparable numeric median wage in this table for {row[0]}. Consult local employers and the official profile.")
        if wage_text.endswith('(1)') or '>=' in wage_text:pay=f"BLS reports a wage at or above its publication threshold for {row[0]}; consult the official profile for the published limit and context."
        entry=f"BLS typical entry education: {education}. Related work experience: {row[13]}. Typical on-the-job preparation: {row[14]}. Licensing, certification, and employer requirements may add conditions; check the official profile and your state authority."
        context=sorted(contexts[code],key=lambda r:CONTEXT_NAMES.index(r['label']))[:5]
        additions.append(dict(id='soc-'+code.replace('.','-'),socCode=code,title=o['Title'],cluster=cluster_for(prefix,o['Title']),educationOptions=paths,modelPaths=paths,
            salaryStartRange=[minimum,maximum],salaryMidRange=[minimum,maximum],baselineStress=50,baselineWorkLife=50,
            skillAffinities={k:(2 if k in SKILLS[prefix] else 1) for k in allskills},scenarioTags=['workplace','money','life-balance'],
            aliases=list(dict.fromkeys(aliases[code]))[:12] or [o['Title']],summary=o['Description'],duties=tasks[code][:4],
            workEnvironment='Occupational survey averages below describe how workers reported aspects of this job. Each item has its own scale; the endpoints explain the numbers. These are averages, not a guarantee about every workplace.',workContext=context,
            entryRequirements=entry,typicalEducation=education,
            outlook=f"BLS projects employment in {row[0]} to change by {row[8]}% from 2025 to 2035. Projections describe an occupational group, not a guarantee of a job in a particular location.",
            payContext=pay,sourceLabel='O*NET® 31.0 Database — USDOL/ETA',sourceTitle=o['Title'],sourceUrl='https://www.onetonline.org/link/summary/'+code,
            sourceReviewed='2026-10-16',sourceLicense='https://creativecommons.org/licenses/by/4.0/',
            laborSourceUrl='https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm',laborSourceTitle=row[0],catalogAdded=4))
    result=original+sorted(additions,key=lambda c:c['title'])
    assert len(result)==500 and len({c['id'] for c in result})==500
    assert len({c['socCode'] for c in additions})==420
    (OUT/'careers.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    files=['occupation_data','task_statements','job_zones','sample_of_reported_titles','work_context','work_context_categories']
    manifest=dict(catalogVersion=4,totalProfiles=500,preservedProfiles=80,newOccupationCodes=selected,
        sourceVersion='O*NET 31.0',license='CC BY 4.0',blsVintage='2025 employment and wages; 2025–2035 projections',
        importedAt='2026-10-16',sourceFiles=[dict(name=f+'.csv',url='https://www.onetcenter.org/dl_files/database/db_31_0_csv/'+f+'.csv',sha256=hashlib.sha256((folder/(f+'.csv')).read_bytes()).hexdigest()) for f in files],
        blsSource=dict(url='https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm',sha256=hashlib.sha256((folder/'projections.html').read_bytes()).hexdigest()),
        fieldCounts=dict(sorted(collections.Counter(c['cluster'] for c in result).items())))
    (OUT/'catalog-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    print(json.dumps(dict(profiles=len(result),new=len(additions),distinctCodes=len({c['socCode'] for c in result}),fields=manifest['fieldCounts']),indent=2))

if __name__=='__main__':
    args=argparse.ArgumentParser();args.add_argument('--source-dir',required=True,type=Path);build(args.parse_args().source_dir)
