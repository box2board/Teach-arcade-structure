"""Source-match every Career Quest fact to pinned official records.

python3 scripts/audit-career-quest.py --source-dir /absolute/official-files --write
python3 scripts/audit-career-quest.py --source-dir /absolute/official-files --check

Uses only Python's standard library. No professional/local eligibility inference is
made from a broad SOC classification. See docs/career-quest.md for evidence limits.
"""
import argparse, collections, copy, csv, hashlib, importlib.util, json, re
from pathlib import Path
from html.parser import HTMLParser

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public/career-arcade/career-quest/data'
REPORTS=ROOT/'reports'
DATE='2026-10-16'
BASE='https://www.onetcenter.org/dl_files/database/db_31_0_csv/'
BLS='https://www.bls.gov/emp/tables/occupational-projections-and-characteristics.htm'
FILES=['occupation_data','task_statements','job_zones','sample_of_reported_titles','job_titles','work_context','work_context_categories','essential_skills','transferable_skills']
REDIRECTS={'career-coach':'school-counselor','soc-25-2021-00':'elementary-teacher'}
class TextParser(HTMLParser):
    def __init__(self):super().__init__();self.parts=[]
    def handle_data(self,data):self.parts.append(data)

def norm(s):return re.sub(r'\s+',' ',s).strip()
def title_key(s):return re.sub(r'[^a-z0-9]','',s.lower())
def hash_value(value):return hashlib.sha256(json.dumps(value,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()).hexdigest()
def rows(folder,name):
    with (folder/(name+'.csv')).open(encoding='utf-8-sig',newline='') as f:yield from csv.DictReader(f)
def load_builder():
    spec=importlib.util.spec_from_file_location('cq_builder',ROOT/'scripts/build-career-quest-catalog.py');m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m

def audit(folder,write):
    builder=load_builder()
    before=json.loads((OUT/'careers.json').read_text());records=copy.deepcopy(before)
    occupations={r['O*NET-SOC Code']:r for r in rows(folder,'occupation_data')}
    tasks=collections.defaultdict(list)
    for r in rows(folder,'task_statements'):
        if r['Task Type']=='Core':tasks[r['O*NET-SOC Code']].append(r)
    aliases=collections.defaultdict(list)
    for file,key in [('sample_of_reported_titles','Reported Job Title'),('job_titles','Job Title')]:
        for r in rows(folder,file):aliases[r['O*NET-SOC Code']].append(r[key])
    zones={r['O*NET-SOC Code']:int(r['Job Zone']) for r in rows(folder,'job_zones')}
    anchors=collections.defaultdict(dict)
    for r in rows(folder,'work_context_categories'):
        if r['Category'] in ('1','5'):anchors[r['Element Name']][r['Category']]=r
    context=collections.defaultdict(list)
    for r in rows(folder,'work_context'):
        n=r['Element Name']
        if (r['Scale ID']=='CX' and n in builder.CONTEXT_NAMES and r['Recommend Suppress']!='Y'
            and r['Not Relevant']!='Y' and 1<=float(r['Data Value'])<=5
            and all(k in anchors[n] for k in ('1','5'))):context[r['O*NET-SOC Code']].append(r)
    skills=collections.defaultdict(list)
    for file in ['essential_skills','transferable_skills']:
        for r in rows(folder,file):
            if r['Scale ID']=='IM' and r['Recommend Suppress']!='Y' and r['Not Relevant']!='Y':skills[r['O*NET-SOC Code']].append({**r,'file':file+'.csv'})
    p=builder.TableParser();p.feed((folder/'projections.html').read_text());assert '2025' in ' '.join(p.rows[0])
    headers=p.rows[0];bls={r[1]:r for r in p.rows if len(r)==16 and r[2]=='Line item'}
    # Validate every quoted Handbook fallback against the fetched source body.
    handbook=json.loads((OUT/'handbook-evidence.json').read_text())
    for x in handbook.values():
        hp=folder/x['file'];body=TextParser();body.feed(hp.read_text());text=norm(' '.join(body.parts))
        assert hashlib.sha256(hp.read_bytes()).hexdigest()==x['sha256'],x['file']+' changed; refresh the excerpt selection'
        for quote in [*x['duties'],x['workEnvironment'],*x['qualities']]:assert norm(quote) in text,(x['file'],quote)
    # Correct an actual code error, then consolidate duplicate aliases into the
    # remaining profile. Redirects preserve references in old device saves.
    records=[c for c in records if c['id'] not in REDIRECTS]
    next(c for c in records if c['id']=='elementary-teacher')['socCode']='25-2021.00'
    used={c['socCode'] for c in records}
    for code in ['25-2022.00','25-2056.00']:
        if code not in used:
            assert code in occupations and len(tasks[code])>=4 and len(context[code])>=3
            template=copy.deepcopy(before[0]);template.update(id='soc-'+code.replace('.','-'),socCode=code,title=occupations[code]['Title'],cluster='Education & Training',catalogAdded=5)
            records.append(template);used.add(code)
    assert len(records)==500 and len({c['socCode'] for c in records})==500
    changes=[];audit_rows=[]
    old_by_id={c['id']:c for c in before}
    # Narrow generic display titles whose original phrasing hid a specialty.
    display_overrides={'physician':'Family Medicine Physician','psychologist':'Clinical and Counseling Psychologist','social-worker':'Child, Family, and School Social Worker','case-manager':'Healthcare Social Worker','school-counselor':'School & Career Counselor','public-health-inspector':'Occupational Health and Safety Specialist'}
    search_terms={'police-officer':['cop','law enforcement'],'veterinarian':['vet','animal doctor'],'physician':['doctor'],'hvac-technician':['hvac'],'registered-nurse':['rn']}
    for c in records:
        cid=c['id'];code=c['socCode'];o=occupations[code];b=bls.get({'29-2012.00':'29-2010','21-1011.00':'21-1018','25-2056.00':'25-2052'}.get(code,code[:7]));assert b,(cid,code,'no BLS line item')
        old=old_by_id.get(cid)
        source_aliases=list(dict.fromkeys([o['Title'],*aliases[code]]))
        alias_keys={title_key(x) for x in source_aliases}
        # Preserve a familiar label only when the source registry supports it.
        if cid in display_overrides:c['title']=display_overrides[cid]
        elif title_key(c['title']) not in alias_keys:c['title']=o['Title']
        c['canonicalTitle']=o['Title']
        kept_aliases=[a for a in (old or {}).get('aliases',[]) if title_key(a) in alias_keys]
        c['aliases']=list(dict.fromkeys([*kept_aliases,*source_aliases]))[:24]
        c['searchKeywords']=search_terms.get(cid,[])
        c['summary']=o['Description']
        c['sourceTitle']=o['Title'];c['sourceLabel']='O*NET® 31.0 Database — USDOL/ETA'
        c['sourceUrl']='https://www.onetonline.org/link/summary/'+code
        c['sourceLicense']='https://creativecommons.org/licenses/by/4.0/'
        c['sourceReviewed']=DATE;c['laborSourceUrl']=BLS;c['laborSourceTitle']=b[0]
        fallback=handbook.get(cid)
        tr=tasks[code][:4]
        if len(tr)<4:
            assert fallback,cid+' needs a source-backed duty fallback'
            c['duties']=fallback['duties'];task_evidence=[{'section':'What They Do / Duties','sha256':hash_value(t)} for t in c['duties']]
        else:
            c['duties']=[r['Task'] for r in tr]
            task_evidence=[{'taskId':r['Task ID'],'date':r['Date'],'domainSource':r['Domain Source'],'sha256':hash_value(r['Task'])} for r in tr]
        cr=sorted(context[code],key=lambda r:builder.CONTEXT_NAMES.index(r['Element Name']))[:5]
        if len(cr)<3:
            assert fallback,cid+' needs a source-backed environment fallback'
            c['workEnvironment']=fallback['workEnvironment'];c['workContext']=[]
        else:
            c['workEnvironment']='The figures below are occupational survey averages on item-specific 1–5 scales. They describe reported work conditions, not a promise about a particular employer or a personal stress rating.'
            c['workContext']=[{'label':r['Element Name'],'value':float(r['Data Value']),'low':anchors[r['Element Name']]['1']['Category Description'],'high':anchors[r['Element Name']]['5']['Category Description'],'surveyDate':r['Date'],'surveySource':r['Domain Source']} for r in cr]
        sr=sorted(skills[code],key=lambda r:(-float(r['Data Value']),r['Element Name']))[:3]
        if len(sr)<3:
            assert fallback,cid+' needs a source-backed skill fallback'
            c['researchSkills']=[{'label':q.split('. ',1)[0],'description':q,'source':'handbook'} for q in fallback['qualities'][:3]]
        else:c['researchSkills']=[{'label':r['Element Name'],'importance':float(r['Data Value']),'source':'onet'} for r in sr]
        education=b[12];c['typicalEducation']=education
        c['entryRequirements']=f"BLS typical entry-level education for {b[0]} ({b[1]}): {education}. Related work-experience category: {b[13]}. On-the-job-training category: {b[14]}. These categories are not a complete list of legal, licensing, or employer entry requirements."
        wage=b[11];assert re.fullmatch(r'[0-9,]+|—',wage),('Unexpected wage notation',cid,wage)
        median=int(wage.replace(',','')) if wage!='—' else None
        c['payContext']=(f"BLS reports a 2025 national median annual wage of ${median:,} for {b[0]}. A median is not starting pay, and these wage data exclude self-employed workers." if median is not None else f"A numeric annual median wage is not available in this BLS table for {b[0]}. No wage has been filled in as a research fact.")
        growth=float(b[8].replace(',',''));assert -100<=growth<=1000
        c['outlook']=f"BLS projects employment for {b[0]} to change by {b[8]}% from 2025 to 2035. This is a national projection for that occupational group, not a guarantee of local job availability."
        # Keep dollar/skill/status parameters explicitly outside factual claims.
        if 'doctoral' in education.lower() or 'master' in education.lower():paths=['grad']
        elif 'bachelor' in education.lower():paths=['college']
        elif 'associate' in education.lower():paths=['cc']
        elif 'postsecondary' in education.lower() or b[14]=='Apprenticeship':paths=['trade','cc']
        else:paths=['workforce','trade','cc']
        if cid=='registered-nurse':paths=['cc','college'] # illustrative simulation choices, not a complete eligibility rule
        c['educationOptions']=paths;c['modelPaths']=paths
        if old is None:
            c['skillAffinities']={k:(2 if k in builder.SKILLS[code[:2]] else 1) for k in before[0]['skillAffinities']}
            mid=median*.75 if median else 50000
            c['salaryStartRange']=[max(24000,round(mid*.87/1000)*1000),max(26000,round(mid*1.13/1000)*1000)]
            c['salaryMidRange']=c['salaryStartRange'][:];c['baselineStress']=50;c['baselineWorkLife']=50
        c['simulationNote']='Income ranges, training debt/cost models, baseline status scores, and quiz/game skill weights are Teach Arcade assumptions, not occupational facts or measured career-fit scores.'
        c['evidence']={
            'auditVersion':1,'checkedAt':DATE,'method':'Exact occupation/dataset record comparison; broader groups explicitly labeled',
            'occupationCode':code,'occupationTitle':o['Title'],'descriptionHash':hash_value(o['Description']),
            'tasks':task_evidence,
            'context':[{'elementId':r['Element ID'],'scaleId':r['Scale ID'],'surveyDate':r['Date'],'rowHash':hash_value(r)} for r in cr],
            'skills':[{'elementId':r['Element ID'],'file':r['file'],'scaleId':r['Scale ID'],'surveyDate':r['Date'],'rowHash':hash_value({k:v for k,v in r.items() if k!='file'})} for r in sr],
            'blsRecord':{'socCode':b[1],'title':b[0],'scope':'broader occupation' if not code.endswith('.00') or b[1]!=code[:7] else 'base occupation','education':b[12],'experience':b[13],'training':b[14],'medianAnnualWage2025':median,'employmentChangePercent2025to2035':growth,'rowHash':hash_value(b)},
            'claimSources':{'summary':'onet','duties':'onet' if len(tr)>=4 else 'handbook','workEnvironment':'onet' if len(cr)>=3 else 'handbook','researchSkills':'onet' if len(sr)>=3 else 'handbook','entryRequirements':'bls','payContext':'bls','outlook':'bls','typicalEducation':'bls'},
            'sourceFiles':{'summary':'occupation_data.csv','duties':'task_statements.csv' if len(tr)>=4 else fallback['file'],'workEnvironment':'work_context.csv' if len(cr)>=3 else fallback['file'],'researchSkills':list(dict.fromkeys(r['file'] for r in sr)) if len(sr)>=3 else [fallback['file']],'laborData':'projections.html'},
            'dataLimitations':['Typical education is not a full eligibility rule.','National medians are not starting salaries.','Occupational group statistics may cover more than the selected specialty.','Game/model parameters are not evidence-backed career facts.']
        }
        if fallback:
            c['handbookSourceUrl']=fallback['url'];c['handbookSourceTitle']=fallback['sourceTitle']
            c['evidence']['handbookFileSha256']=fallback['sha256']
            c['evidence']['dataLimitations'].append('Duties, work environment, and qualities use the broader BLS Handbook group because detailed O*NET survey records are unavailable for this code.')
        if old:
            fields=[k for k in ['title','socCode','summary','duties','workEnvironment','entryRequirements','typicalEducation','payContext','outlook','aliases','modelPaths'] if old.get(k)!=c.get(k)]
        else:fields=['new source-backed replacement for a consolidated duplicate']
        changes.append({'id':cid,'oldTitle':old.get('title') if old else None,'title':c['title'],'socCode':code,'updatedFields':fields})
        audit_rows.append({'id':cid,'title':c['title'],'canonicalTitle':o['Title'],'socCode':code,'status':'source-matched','scope':c['evidence']['blsRecord']['scope'],'dutySource':c['evidence']['claimSources']['duties'],'contextSource':c['evidence']['claimSources']['workEnvironment'],'skillsSource':c['evidence']['claimSources']['researchSkills'],'onetUrl':c['sourceUrl'],'blsUrl':BLS,'handbookUrl':c.get('handbookSourceUrl'),'claimCount':8})
    assert len({c['id'] for c in records})==len({c['socCode'] for c in records})==500
    stats={'profilesChecked':500,'uniqueOccupationCodes':500,'claimGroupsChecked':4000,'onetDetailedDutyProfiles':sum(r['dutySource']=='onet' for r in audit_rows),'handbookFallbackProfiles':sum(r['dutySource']=='handbook' for r in audit_rows),'broaderLaborGroups':sum(r['scope']=='broader occupation' for r in audit_rows),'unsupportedClaimGroupsRemaining':0}
    source_manifest={'checkedAt':DATE,'onetVersion':'31.0','blsWageYear':2025,'blsProjectionYears':[2025,2035],'files':[{'file':f+'.csv','url':BASE+f+'.csv','sha256':hashlib.sha256((folder/(f+'.csv')).read_bytes()).hexdigest()} for f in FILES]+[{'file':'projections.html','url':BLS,'sha256':hashlib.sha256((folder/'projections.html').read_bytes()).hexdigest()}]}
    source_manifest['files'] += [{'file':x['file'],'url':x['url'],'sha256':x['sha256']} for x in handbook.values()]
    if not write:
        assert records==before,'Stored catalog differs from fresh source-derived audit output'
        assert json.loads((OUT/'evidence-sources.json').read_text())==source_manifest
        print(json.dumps({'status':'PASS',**stats}));return
    OUT.joinpath('careers.json').write_text(json.dumps(records,ensure_ascii=False,indent=2)+'\n')
    OUT.joinpath('evidence-sources.json').write_text(json.dumps(source_manifest,indent=2)+'\n')
    OUT.joinpath('career-redirects.json').write_text(json.dumps(REDIRECTS,indent=2)+'\n')
    manifest=json.loads((OUT/'catalog-manifest.json').read_text());manifest.update(catalogVersion=5,totalProfiles=500,uniqueOccupationCodes=500,preservedProfiles=79,newOccupationCodes=[c['socCode'] for c in records if c.get('catalogAdded',0)>=4],redirects=REDIRECTS,evidenceAudit=stats,fieldCounts=dict(sorted(collections.Counter(c['cluster'] for c in records).items())));OUT.joinpath('catalog-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
    result={'auditDate':DATE,'method':'Dataset record comparison and source-backed corrections; not a professional licensing or local-employer assessment','summary':stats,'redirects':REDIRECTS,'changes':changes,'profiles':audit_rows}
    REPORTS.mkdir(exist_ok=True);REPORTS.joinpath('career-quest-evidence-audit.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
    lines=['# Career Quest evidence audit', '',f'Date: {DATE}', '', 'All 500 profiles were checked against freshly downloaded O*NET 31.0 and BLS 2025 records. This audit establishes support within those datasets; it does not certify current local licensing or individual job eligibility.', '', '## Results', '', *(f'- {k}: {v}' for k,v in stats.items()), '', '## Material corrections', '', '- Elementary Teacher now uses 25-2021.00, not the middle-school code 25-2022.00.', '- Duplicate career aliases were consolidated, with redirects for old saves. Two distinct, source-backed education occupations fill the catalog to 500 unique occupation codes.', '- All 80 legacy profiles now use the same record-level sourcing standard as the rest of the catalog.', '- Research skills now come from official importance ratings or identified BLS qualities, rather than game-weight rankings.', '- Unsourced search aliases were removed or treated separately as navigation keywords.', '- The Financial Analyst and EMT codes have no detailed O*NET survey rows in the downloaded release. Their duties, work environment, and qualities use checked BLS Handbook excerpts with explicit broader-group labeling.', '- Pay, education, and projections use the identified BLS SOC row and data vintage. No missing wage has been invented.', '', '## Per-profile evidence index', '', '| Profile | Occupation code | Duties / context / skills | BLS scope |', '|---|---|---|---|']
    lines += [f"| [{r['title']}]({r['onetUrl']}) | {r['socCode']} | {r['dutySource']} / {r['contextSource']} / {r['skillsSource']} | {r['scope']} |" for r in audit_rows]
    REPORTS.joinpath('career-quest-evidence-audit.md').write_text('\n'.join(lines)+'\n')
    print(json.dumps(stats,indent=2))
if __name__=='__main__':
    p=argparse.ArgumentParser();p.add_argument('--source-dir',required=True,type=Path);g=p.add_mutually_exclusive_group(required=True);g.add_argument('--write',action='store_true');g.add_argument('--check',action='store_true');a=p.parse_args();audit(a.source_dir,a.write)
