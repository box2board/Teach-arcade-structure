"""Reproducible, low-ink Letter packet. Run from repository root with reportlab installed."""
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
for name, file in [("Body","DejaVuSans.ttf"),("BodyBold","DejaVuSans-Bold.ttf"),("BodyItalic","DejaVuSans.ttf"),("Title","DejaVuSerif-Bold.ttf"),("Mono","DejaVuSansMono.ttf")]:
 pdfmetrics.registerFont(TTFont(name,"/usr/share/fonts/truetype/dejavu/"+file))
pdfmetrics.registerFontFamily("Body",normal="Body",bold="BodyBold",italic="BodyItalic",boldItalic="BodyBold")
from reportlab.lib.colors import HexColor, white
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import Paragraph
from pathlib import Path
import json
OUT=Path('public/print-play-games/escape-style/revolutionary-spy-escape'); OUT.mkdir(parents=True,exist_ok=True)
W,H=612,792
NAVY=HexColor('#203548'); RED=HexColor('#8e3735'); GRAY=HexColor('#4c5155'); PALE=HexColor('#f6f2e8')
c=canvas.Canvas(str(OUT/'revolutionary-spy-escape.pdf'),pagesize=(W,H)); c.setTitle('The Revolutionary Spy Escape | Complete Teacher Packet'); c.setAuthor('Teach Arcade')
page=0; y=0
sty=ParagraphStyle('body',fontName='Body',fontSize=10.5,leading=15,textColor=NAVY,spaceAfter=10)
def para(s,x=48,width=516,size=10.5):
 global y
 p=Paragraph(s,ParagraphStyle('p',parent=sty,fontSize=size,leading=size*1.45)); _,h=p.wrap(width,700)
 if y-h<52: raise ValueError(f'Page {page} overflow at {s[:50]}')
 p.drawOn(c,x,y-h);y-=h+10

def begin(label,title,sub=''):
 global page,y
 page+=1;c.setFillColor(white);c.rect(0,0,W,H,fill=1,stroke=0)
 c.setStrokeColor(NAVY);c.setLineWidth(1);c.rect(32,32,548,728)
 c.setFillColor(RED);c.setFont('BodyBold',9);c.drawString(48,735,'TEACH ARCADE  /  PRINT & PLAY');c.drawRightString(564,735,label.upper())
 c.setStrokeColor(RED);c.line(48,722,564,722)
 c.setFillColor(NAVY);c.setFont('Title',24);c.drawString(48,686,title);y=664
 if sub: para(sub,size=10)
 c.setFillColor(GRAY);c.setFont('Body',8);c.drawString(48,44,'THE REVOLUTIONARY SPY ESCAPE  |  v1.0  |  US Letter - print at 100%');c.drawRightString(564,44,str(page))
def end():c.showPage()
def heading(t):
 global y
 y-=5;c.setFillColor(RED);c.setFont('BodyBold',12);c.drawString(48,y,t);y-=20

def box(title,text,h=95):
 global y
 top=y;c.setFillColor(PALE);c.setStrokeColor(NAVY);c.rect(48,top-h,516,h,fill=1,stroke=1);y-=20
 para('<b>'+title+'</b><br/>'+text,x=60,width=492);y=top-h-15

def lines(n=2):
 global y
 c.setStrokeColor(HexColor('#a0a0a0'))
 for i in range(n):y-=24;c.line(48,y,564,y)
 y-=12

def card(x,top,w,h,title,text):
 c.setDash(3,3);c.setStrokeColor(GRAY);c.rect(x,top-h,w,h);c.setDash()
 p=Paragraph('<b>'+title+'</b><br/><br/>'+text,sty);_,ph=p.wrap(w-24,h-20)
 if ph>h-20:raise ValueError('Card overflow '+title)
 p.drawOn(c,x+12,top-12-ph)

begin('Teacher only','Run the mission tomorrow','QUICK START  /  40-50 minutes  /  Grades 5-9  /  Teams of 3-4')
para('A fictional Patriot intelligence mission set in <b>August 1776</b>. Four puzzles lead to a final seven-letter password. Students need only the printed materials and pencils.')
heading('1 / Print and prepare')
para('For each team, print <b>pages 7-16</b>, single-sided. Cut page 11 into five timeline cards and page 13 into six viewpoint cards: <b>11 rectangles per team</b>. Keep each set together. No other cutting is required. Print <b>pages 1-6 and 17-18 once</b> for the teacher.')
heading('2 / Stack four dossiers')
para('Dossier 1: page 9. Dossier 2: pages 10-11. Dossier 3: pages 12-13. Dossier 4: pages 14-15. Use four folded sheets, clips, or optional envelopes per team. Keep all four at your desk. Give each team pages 7-8 first. Hold page 16 until completion.')
heading('3 / Launch and unlock')
para('Read page 7 together. Set a 35-minute mission limit, within a 45-minute lesson. Give Dossier 1 to each team. A team brings page 8 and explains its solution quietly. Check page 5, write the earned fragment in the log, initial it, then release the next dossier. There are <b>four checks and one final check per team</b>.')
heading('4 / Help, finish, reflect')
para('Use page 4 to read hints privately, one level at a time. Never display page 5 or the answer key. Accept the final password only with four initialed entries. Give page 16 for reflection. Stop with five minutes left; walk unfinished teams through the remaining clues.')
box('For 28 students in seven teams','70 student sheets + 8 teacher sheets = <b>78 sheets</b>. Cut 77 rectangles; prepare 28 dossier bundles. Budget roughly 20-30 minutes for first-time assembly. These are planning estimates, not classroom-tested timings.',85)
end()
begin('Teacher only','Teacher field guide','LEARNING, PACING & CLASSROOM MANAGEMENT')
heading('Learning objectives')
para('Students sequence five turning points from 1765-1776, explain taxation and representation, distinguish Patriot, Loyalist and neutral viewpoints using evidence, and locate four Revolutionary-era places using a schematic map. Decoding supports the mission; historical explanations establish understanding.')
heading('A 45-minute lesson')
para('<b>0-5:</b> briefing, roles, demonstrate raising a hand. <b>5-35:</b> puzzle work and verification. <b>35-40:</b> final unlock or guided finish. <b>40-45:</b> debrief. Allow up to 50 minutes for younger readers. Rotate reader, recorder, arranger and evidence-checker after each dossier; combine roles for three students.')
heading('The paper lock protocol')
para('Keep dossiers out of sight and numbered by mission, never by their answers. At each check, require both the code and a short explanation. A right code with weak reasoning earns a follow-up question, not a penalty. Write the fragment and its slot numbers in the matching row on page 8. Initial only after verification. Page 5 is your reusable desk control panel.')
heading('Hints without a bottleneck')
para('Teams raise a hand; visit them or call one team at a time. Read the relevant hint quietly from page 4. Mark 1, 2 or S in the hint column on page 8. Hints do not reduce credit; use them to support learning. With seven teams, expect 35 total checks. Have students explain while you circulate to reduce a queue.')
heading('Access and differentiation')
para('Read instructions aloud; pair strong and emerging readers; allow oral explanations, scribing, extra time and enlarged copies. Color is never needed to solve anything. All historical facts needed for the puzzles are printed. Pre-cut for students with fine-motor needs. For advanced groups, require a cause/effect explanation and evidence for each viewpoint. Do not assess reading speed as historical mastery.')
heading('Shortened version and reset')
para('For 25-30 minutes, provide Hint 2 for each dossier at the start, model the first cipher word, and shorten the reflection. Preserve all four checks. Collect reusable cards and mats; sort cards by dossier. Replace written logs, cipher sheets, routes and reflections. Never physically lock a classroom door; the escape is fictional.')
end()
begin('Teacher only','Printing & assembly','PRINT SINGLE-SIDED  /  US LETTER  /  BLACK-AND-WHITE FRIENDLY')
for title,txt in [
('Keep at the teacher desk','Pages 1-3: quick start, full guide, printing guide. Page 4: hint bank. Page 5: verification and release panel. Page 6: historical notes and sources. Pages 17-18: complete answer key. One copy of each for the class.'),
('Give at the beginning','Page 7: mission briefing. Page 8: team log and final unlock. One of each per team. Do not distribute the full PDF to students: it includes solutions.'),
('Release in order','Dossier 1: page 9 (cipher). Dossier 2: page 10 (timeline mat) and page 11 (five cut cards). Dossier 3: page 12 (sorting mat) and page 13 (six cut cards). Dossier 4: pages 14-15 (map and route dispatch). One of each per team.'),
('Give at the end','Page 16: Mission Complete and historical reflection. One per team; optionally print extra copies for individual assessment.'),
('Supplies and optional materials','Required: ordinary paper, printer, pencils and teacher scissors. Optional: 4 envelopes per team, clips, folders, reusable sleeves. No locks, devices, color printing, glue, exact folding or special tools. Use an ordinary clock or estimate time; students need no timer.'),
('Copy formula','For T teams: 10T + 8 sheets; 11T cut rectangles; 4T dossier bundles. For 24 students in 6 teams: 68 sheets, 66 rectangles, 24 bundles. For 32 students in 8 teams: 88 sheets, 88 rectangles, 32 bundles.'),
('Reusable and consumable','Pages 7, 10-14 can be reused if students keep writing on the log or scrap paper; page 14 route may also be traced with a finger. Pages 8, 9, 15 and 16 are normally consumable. All pages are required in the first complete run; envelopes and extra reflections are optional.')]:
 heading(title);para(txt)
end()
begin('Teacher only','Private hint bank','READ ONE HINT AT A TIME  /  DO NOT HAND OUT THIS MASTER')
for title,h1,h2,sol in [
('1 / Cipher','Use the paired alphabet. Find a coded letter on the bottom row.','V becomes S. Move three letters backward; wrap A to X. Decode each word.','The message is NO TAX WITHOUT A VOICE. The check word is VOICE. Ask why representation matters; release BE into slots 3-4.'),
('2 / Timeline','The archive dates are your evidence. Start before the fighting.','Stamp Act comes first; Boston Massacre comes before Boston Tea Party. Independence comes after the fighting begins.','Order: Stamp Act, Boston Massacre, Tea Party, Lexington and Concord, Declaration. Code 41736. Release LI into slots 1-2.'),
('3 / Viewpoints','A complaint about taxes alone does not always establish a side. Find the stated political choice.','Use all three categories: independence, continued British rule, and neither side. Read the selected column digit for each numbered card.','Cards 1-6: P, L, P, L, N, N. Code 285149. Ask for evidence; release RT into slots 5-6.'),
('4 / Courier map','The dispatch tells you which event identifies each stop. Use the place register.','Begin in Boston. Visit Lexington, then Concord. Finish in the city where Congress adopted the Declaration.','Route Boston, Lexington, Concord, Philadelphia. Digits 6248. Release Y into slot 7. Lines are puzzle links, not actual travel routes.')]:
 heading(title);para('<b>Hint 1:</b> '+h1+'<br/><b>Hint 2:</b> '+h2+'<br/><b>Emergency:</b> '+sol)
end()
begin('Teacher only','The paper lock panel','KEEP THIS PAGE PRIVATE  /  NO STUDENT ACCESS')
para('At each checkpoint, hear the code AND the evidence. Write the exact payload below in the matching log row, then initial it. This serves as the printable lock: your initial authorizes the next dossier. No separate slips need cutting.')
for title,txt in [
('CHECK 1 -> Release Dossier 2','Accept VOICE plus the full decoded message and an explanation of taxation without colonial representation in Parliament. Write <b>BE / slots 3-4</b> in row 1.'),
('CHECK 2 -> Release Dossier 3','Accept <b>41736</b>, the five events in order, and an explanation that disputes preceded armed conflict and independence. Write <b>LI / slots 1-2</b> in row 2.'),
('CHECK 3 -> Release Dossier 4','Accept <b>285149</b> and classifications P, L, P, L, N, N. Ask for one supporting phrase. Write <b>RT / slots 5-6</b> in row 3.'),
('CHECK 4 -> Authorize final unlock','Accept <b>6248</b> with Boston -> Lexington -> Concord -> Philadelphia. Ask what happened in Philadelphia. Write <b>Y / slot 7</b> in row 4.'),
('FINAL CHECK -> Release page 16','Require four initialed rows and <b>LIBERTY</b>, formed by placing each fragment into its numbered slots. Students must also explain why independence did not guarantee liberty for everyone. Accept thoughtful answers; discuss enslaved people and excluded groups.')]:box(title,txt,86)

end()
begin('Teacher only','History behind the fiction','SOURCE NOTES  /  CONTENT VERIFIED OCTOBER 2026')
para('The Patriot Spy Network, dispatches, speakers, seals, codes and courier route are <b>invented teaching devices</b>. They are not primary sources. August 1776 provides a setting after adoption of the Declaration. This mission does not claim that these particular searches, messages or events occurred.')
heading('Accurate framing')
para('Patriots supported independence; Loyalists retained allegiance to Britain. Some people remained neutral or changed positions. The six fictional statements simplify a wider range of lived experiences. Neither wealth nor occupation automatically determined allegiance. Avoid presenting either side as uniformly good or bad.')
para('The map is a modern schematic of selected places, not a historical map, scale map or reconstruction of a real courier journey. Lexington and Concord are separate Massachusetts towns; Boston is east of them. Philadelphia is southwest of Boston. No future battles or post-1776 events appear in the student mission.')
heading('Teacher reference shelf')
para('<b>Library of Congress - American Revolution classroom materials</b><br/>Stamp Act, Boston Massacre, Tea Party and the outbreak of fighting.<br/>https://www.loc.gov/classroom-materials/american-revolution/',size=10)
para('<b>National Park Service - Timeline of the Revolution</b><br/>Chronological cross-check of the events used in the archive.<br/>https://www.nps.gov/subjects/americanrevolution/timeline.htm',size=10)
para('<b>National Archives - Declaration of Independence</b><br/>Adoption on July 4, 1776; adoption and signing are different events.<br/>https://www.archives.gov/milestone-documents/declaration-of-independence',size=10)
para('<b>National Park Service - Loyalists, Moores Creek</b><br/>Loyalists and the conflict over continued allegiance.<br/>https://www.nps.gov/mocr/learn/historyculture/loyalists.htm',size=10)
para('<b>National Park Service - Assembly Room of Independence Hall</b><br/>Philadelphia as the place where the Declaration was adopted.<br/>https://www.nps.gov/inde/learn/historyculture/places-independencehall-assemblyroom.htm',size=10)
para('All student prose and puzzle art are original educational material. The packet contains no reproduced historical quotations. Teachers may print and reuse it for their own classrooms.',size=10)
end()
begin('Student / start here','The Revolutionary Spy Escape','A PRINTABLE CLASSROOM ESCAPE ROOM ADVENTURE')
box('CONFIDENTIAL  /  PATRIOT SPY NETWORK','Fully Printable. Fully Playable. No Technology Required.',62)
c.setStrokeColor(RED);c.setFillColor(white);c.circle(524,602,20,fill=1,stroke=1);c.circle(524,602,16,stroke=1);c.setFillColor(RED);c.setFont('BodyBold',8);c.drawCentredString(524,599,'PSN')
para('<b>August 1776.</b> In this fictional mission, British search parties are looking for secret Patriot communications. Your team has been recruited to recover information intended for General George Washington. Four dossiers conceal the pieces of a final password. The history you investigate is real; this spy network and its messages are invented.')
heading('Your mission')
para('1. Solve all four spy puzzles, in order.<br/>2. Record each code and explain your evidence.<br/>3. Ask the teacher to verify it and release your intelligence fragment.<br/>4. Place the fragments in their numbered slots to discover the password.<br/>5. Finish before the teacher-set time expires.')
heading('Spy network rules')
para('Work only with your team. Do not open a dossier early. Raise your hand for a clue. Rotate jobs so everyone participates. Record codes carefully. Present solutions quietly so other teams can investigate for themselves.')
heading('Fieldcraft')
para('Speak quietly. Protect your clues. Watch for patterns. Check claims against the printed evidence. Think like a spy - and explain like a historian.')
box('TEAM REGISTER','Team name: __________________________________________<br/>Agents: ______________________________________________<br/>Time limit set by teacher: __________ minutes',92)
para('<b>Important:</b> No real doors are locked. Ask for help whenever needed. You do not need a device or outside research.',size=10)
end()
begin('Student / keep throughout','Intelligence log','TEAM: ______________________________________')
para('Write codes before you visit the teacher. The teacher writes the fragment, slot numbers and initial after checking your reasoning. Hints are support, not penalties.')
for i,t in enumerate(['Cipher','Timeline','Viewpoints','Courier map'],1):
 box(f'DOSSIER {i} / {t}','Our code: __________________    Hint used (1 / 2 / S): ______<br/>Teacher fragment: __________    Slots: ______    Initial: ______',72)
heading('Final unlock / seven numbered slots')
para('After all four checks, put each letter into the slot assigned by your teacher. Read slots 1-7 from left to right. A guessed word without four verified entries does not complete the mission.')
c.setFillColor(NAVY)
for i in range(7):
 x=62+i*70;c.rect(x,y-42,50,40);c.setFont('Body',10);c.drawCentredString(x+25,y-57,str(i+1))
y-=72
para('Final teacher initial: ______',size=10)
para('Discuss: Whose liberty remained limited in 1776? Explain at the final check.',size=10)
end()
begin('Student / dossier 1','The intercepted dispatch','OPERATION 1  /  DECODE & EXPLAIN')
para('A fictional courier has left a short message about a dispute that helped lead to the Revolution. Recover the message to earn your first intelligence fragment.')
box('The decoder strip','<font name="Mono">Plain: ABCDEFGHIJKLMNOPQRSTUVWXYZ<br/>Coded: DEFGHIJKLMNOPQRSTUVWXYZABC</font>',76)
para('Find each coded letter on the <b>bottom</b> row; replace it with the letter directly above it. Spaces stay spaces. Example: FDW becomes CAT. This is a shift cipher; it is a classroom model, not evidence of an actual 1776 dispatch.')
heading('Intercepted text')
box('QR WDA ZLWKRXW D YRLFH','Decode the full message below.',65)
lines(2)
heading('The historical intelligence')
para('Parliament imposed taxes on the colonies, including a tax on printed materials in 1765. Colonists had no elected representatives in Parliament. Many protested that Parliament should not tax them without their consent through representatives. Britain defended Parliament\'s authority over the empire.')
para('<b>Discuss:</b> What does a "voice" mean in this message? How could a dispute about a tax become a dispute about who had the right to govern?')
para('<b>Checkpoint:</b> Put the final decoded word into row 1 of your log. Show the teacher the whole message and explain the dispute. Your teacher will release Dossier 2.')
end()
begin('Student / dossier 2','The broken archive','OPERATION 2  /  ARRANGE THE EVIDENCE')
para('Five event cards have been mixed up. Arrange them from earliest to latest on your table. Use the archive below; you do not have to memorize the dates. Read the small seal number on each correctly placed card to create one five-digit code.')
heading('Archive reference / evidence, not card order')
for t,s in [('1775 / Armed conflict','On April 19, fighting at Lexington and Concord began the war.'),('1765 / Tax protest','The Stamp Act taxed printed materials and helped intensify protests over representation.'),('1776 / Independence','Congress adopted the Declaration of Independence on July 4.'),('1770 / Boston confrontation','On March 5, British soldiers fired into a crowd in Boston, killing five colonists.'),('1773 / Harbor protest','On December 16, protesters destroyed tea in Boston Harbor to resist British tea policy.')]:
 heading(t);para(s)
box('Arrange the five cards here or on your table','EARLIEST -> _________________________________ -> LATEST<br/>Write the seal numbers in order: ___  ___  ___  ___  ___',78)
para('<b>Checkpoint:</b> Enter your five-digit code in row 2. Tell the teacher how the sequence shows the conflict developing from political disputes into fighting and independence. Do not confuse adopting the Declaration with every delegate signing it.')
end()
begin('Student / dossier 2 / cut','Archive event cards','TEACHER: CUT ON DASHED RECTANGLES. KEEP ALL FIVE CARDS TOGETHER.')
events=[('BOSTON TEA PARTY','Protesters destroy tea in Boston Harbor.','7'),('DECLARATION OF INDEPENDENCE','Congress adopts a declaration explaining independence.','6'),('STAMP ACT','Parliament taxes printed materials in the colonies.','4'),('LEXINGTON AND CONCORD','British troops and colonial militia fight in Massachusetts.','3'),('BOSTON MASSACRE','A confrontation ends with soldiers killing colonists in Boston.','1')]
for i,(t,s,n) in enumerate(events):card(48,635-i*108,516,96,t,s+'<br/><b>SEAL '+n+'</b>')
end()
begin('Student / dossier 3','Whom can you trust?','OPERATION 3  /  SORT VIEWPOINTS, NOT PEOPLE\'S WORTH')
para('Six fictional statements describe choices people might make during the Revolution. They are <b>not historical quotations</b>. Place each card under a heading on your table. Use the evidence in the statement; do not guess from a speaker\'s occupation or wealth.')
box('P / PATRIOT','Supports independence from Britain.',65)
box('L / LOYALIST','Supports remaining under British rule.',65)
box('N / NEUTRAL','Chooses neither side in the conflict.',65)
heading('Recover the code')
para('Every card has a row labeled P, L and N. After sorting, select only the digit under the category you chose. Read these digits in <b>card number order 1-6</b>, not pile order. That makes a six-digit code. Explain at least one classification with words from the card.')
para('Card 1 ____  Card 2 ____  Card 3 ____<br/>Card 4 ____  Card 5 ____  Card 6 ____')
para('<b>Checkpoint:</b> Record the six-digit code in row 3. Bring your sorted cards and reasoning to the teacher.')
para('<b>Historian\'s caution:</b> Real allegiances could be complicated or change over time. A person could dislike a tax and still oppose independence. Neutrality did not necessarily keep someone safe. These categories help us analyze stated positions; they do not capture every experience.',size=10)
end()
begin('Student / dossier 3 / cut','Voices in the colonies','TEACHER: CUT ON DASHED RECTANGLES. ALL SPEAKERS ARE FICTIONAL.')
voices=[('1','Parliament should not govern us. I support declaring independence and forming our own government.','2 / 7 / 9'),('2','Some taxes trouble me, but breaking from Britain is wrong. I remain loyal to the king.','3 / 8 / 6'),('3','I will send supplies to help the army fighting for independence. The colonies should govern themselves.','5 / 2 / 8'),('4','Rebellion threatens our place in the empire. We should remain under British rule.','6 / 1 / 3'),('5','I will support neither army. I want to keep my family out of this struggle.','8 / 6 / 4'),('6','I have decided not to choose either side. I will not join the Patriots or the Loyalists.','1 / 5 / 9')]
for i,(n,s,d) in enumerate(voices):
 x=48+(i%2)*264;top=635-(i//2)*184
 card(x,top,252,170,'CARD '+n,s+'<br/><br/><b>P / L / N: '+d+'</b>')
end()
begin('Student / dossier 4','The courier\'s map','OPERATION 4  /  FOLLOW THE EVIDENCE')
para('Use the dispatch on page 15 with this map. Only the four required stops count. Trace the route with your finger or pencil. Read each stop\'s station digit in travel order.')
# schematic graph, north at top. Boston east of Lexington/Concord; Philadelphia southwest.
points={'Concord':(145,565,'4'),'Lexington':(330,550,'2'),'Boston':(505,520,'6'),'New York':(320,390,'3'),'Philadelphia':(180,275,'8'),'Newport':(490,390,'9')}
c.setStrokeColor(GRAY);c.setLineWidth(1)
for a,b in [('Boston','Lexington'),('Lexington','Concord'),('Concord','Philadelphia'),('Boston','Newport'),('Newport','New York'),('New York','Philadelphia'),('Lexington','New York')]:
 x1,y1,_=points[a];x2,y2,_=points[b];c.line(x1,y1,x2,y2)
for name,(xx,yy,n) in points.items():
 c.setFillColor(white);c.circle(xx,yy,15,fill=1,stroke=1);c.setFillColor(NAVY);c.setFont('BodyBold',12);c.drawCentredString(xx,yy-4,n)
 c.setFont('BodyBold',10);c.drawCentredString(xx,yy+26,name)
c.setFont('BodyBold',12);c.drawString(52,577,'N');c.line(57,565,57,535);c.line(57,565,52,555);c.line(57,565,62,555)
c.setFont('BodyItalic',10);c.drawString(375,260,'Atlantic Ocean (east)')
y=230
box('Map key','Circle = a place. Digit = its puzzle station number.<br/>Lines = allowed puzzle links, not real roads or actual courier routes.<br/>North is up. Distances and angles are not to scale.',87)
para('This is a modern classroom schematic, not a primary-source map. All locations needed for the route appear in the place register on the next page.',size=10)
end()
begin('Student / dossier 4','A route through the evidence','FICTIONAL COURIER DISPATCH  /  AUGUST 1776')
box('Deliver by this route','Begin at the harbor city where tea was destroyed in protest. Travel next to the town where the first clash on April 19, 1775, took place. Continue to the nearby town where British troops had sought colonial military supplies. Finish in the city where Congress adopted the Declaration of Independence.',133)
heading('Place register / historical evidence')
for t,s in [('Boston, Massachusetts','Site of the December 1773 tea protest in the harbor.'),('Lexington, Massachusetts','British troops and colonial militia first clashed here early on April 19, 1775.'),('Concord, Massachusetts','British troops continued here seeking colonial military supplies; fighting also occurred here on April 19.'),('Philadelphia, Pennsylvania','Congress adopted the Declaration of Independence here on July 4, 1776.'),('New York and Newport','These cities appear as alternate stations. Neither matches a required stop in this dispatch.')]:heading(t);para(s)
para('<b>Our route:</b> ______________ -> ______________<br/>-> ______________ -> ______________')
para('<b>Four station digits:</b> ___  ___  ___  ___<br/>Enter them in row 4. Explain your final destination to the teacher. After verification, return to page 8 for the final unlock.')
end()
begin('Student / after final check','Mission complete','THE PASSWORD HAS BEEN VERIFIED. NOW TEST THE HISTORY.')
para('Your team recovered the dispatch, rebuilt the archive, compared viewpoints and traced a courier route. The teacher has verified all four checkpoints and your final password.')
heading('1 / Cause and effect')
para('Choose two timeline events. Explain how the earlier event contributed to growing conflict. Avoid claiming that one event alone made the Revolution inevitable.')
lines(3)
heading('2 / More than two sides')
para('Why might someone object to a British tax but still reject independence? Use a viewpoint card as evidence.')
lines(3)
heading('3 / Liberty for whom?')
para('Independence did not end slavery or establish equal political rights for everyone. Explain why the final password expresses an ideal rather than a condition shared equally by all people in 1776.')
lines(3)
heading('4 / Fact or fiction?')
para('Name one historical fact from the packet and one invented mission element. Explain how you know the difference.')
lines(2)
end()
begin('Teacher only','Master key / operations 1-2','VERIFY REASONING AS WELL AS THE CODE')
heading('1 / The intercepted dispatch')
para('Read coded letters on the bottom row and plain letters above them. QR = NO; WDA = TAX; ZLWKRXW = WITHOUT; D = A; YRLFH = VOICE. Complete message: <b>NO TAX WITHOUT A VOICE</b>. The log code is <b>VOICE</b>. Release <b>BE in slots 3-4</b>.')
para('Accept an explanation that colonists lacked elected representatives in Parliament and that many viewed taxation without their consent as illegitimate. Britain asserted parliamentary authority. The wording is an invented classroom message, not a quoted historical slogan or archival document.')
heading('2 / The broken archive')
for a,b in [('1. Stamp Act / 1765 / seal 4','Taxation and representation disputes intensified.'),('2. Boston Massacre / March 5, 1770 / seal 1','Five colonists died after soldiers fired into a crowd.'),('3. Boston Tea Party / December 16, 1773 / seal 7','Protesters destroyed tea in Boston Harbor.'),('4. Lexington and Concord / April 19, 1775 / seal 3','Fighting began before the Declaration.'),('5. Declaration adopted / July 4, 1776 / seal 6','Congress stated and explained independence.')]:heading(a);para(b)
para('Code <b>41736</b>. Release <b>LI in slots 1-2</b>. Accept explanations that move from protests and conflict over authority toward armed fighting and the decision for independence. The chronology does not mean every colonist agreed or that independence was inevitable.')
heading('Troubleshooting')
para('<b>Cipher reads nonsense:</b> check row direction; coded V becomes plain S. <b>Timeline code wrong:</b> ask students to pair each card with an archive date, then read seal numbers in chronological order, not the printed page order. <b>Card lost:</b> use the event title, date and seal on this page to create a replacement.')
end()
begin('Teacher only','Master key / operations 3-4','FINAL UNLOCK & DEBRIEF GUIDANCE')
heading('3 / Whom can you trust?')
para('Card 1 <b>P -> 2</b>: independence and self-government.<br/>Card 2 <b>L -> 8</b>: loyal to the king despite tax concerns.<br/>Card 3 <b>P -> 5</b>: supplies for the independence cause.<br/>Card 4 <b>L -> 1</b>: continued British rule.<br/>Card 5 <b>N -> 4</b>: supports neither army.<br/>Card 6 <b>N -> 9</b>: explicitly chooses neither side.')
para('Code <b>285149</b>. Release <b>RT in slots 5-6</b>. If a team reads 4/5/6 piles instead of cards 1-6, redirect it to the numbered-card rule. A complaint about taxes does not make card 2 a Patriot position. These are invented voices, not representative statistics or documented people.')
heading('4 / A route through the evidence')
para('<b>Boston (6) -> Lexington (2) -> Concord (4) -> Philadelphia (8)</b>. The clues identify the tea-protest city, first clash, supply-search destination and Declaration city. Every required link appears on the map. Code <b>6248</b>. Release <b>Y in slot 7</b>.')
para('The route is fictional and schematic. Do not require measured distance, a real road name or a modern state map. If a team selects New York because Washington was there, direct it to the actual dispatch clue: the place where Congress adopted the Declaration.')
heading('Final unlock')
box('BE (3-4) + LI (1-2) + RT (5-6) + Y (7)','Slots 1 2 3 4 5 6 7 -> L I B E R T Y<br/><b>Final password: LIBERTY</b><br/>Require all four initials before accepting. Give page 16.',94)
heading('Suggested debrief evidence')
para('Tax and representation disputes contributed to resistance; armed conflict preceded independence. Card 2 separates disliking taxes from wanting separation. Enslaved people remained enslaved; women and other groups lacked equal political rights. The Declaration\'s ideals did not describe equal lived conditions. A real fact: adoption on July 4, 1776. An invented element: this spy network, dispatch or code.')

end();c.save()
assert page==18
manifest={'title':'The Revolutionary Spy Escape','version':'1.0','pages':18,'teacher_pages':[1,2,3,4,5,6,17,18],'team_pages':list(range(7,17)),'cuts_per_team':11,'dossiers':[[9],[10,11],[12,13],[14,15]],'checkpoints':[{'code':'VOICE','fragment':'BE','slots':[3,4]},{'code':'41736','fragment':'LI','slots':[1,2]},{'code':'285149','fragment':'RT','slots':[5,6]},{'code':'6248','fragment':'Y','slots':[7]}],'password':'LIBERTY'}
Path('scripts/print-play/revolutionary-spy-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Built',page,'pages:',OUT/'revolutionary-spy-escape.pdf')
