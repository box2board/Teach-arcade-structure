
/* Edition data for the reusable Panel Quest engine.
   Question tuple: prompt, answers, correctIndex, explanation, clue, sceneCaption, sceneTitle, artCell. */
(() => {
  const rows = [
["Why did King Louis XVI call the Estates-General in 1789?",["France faced a serious financial crisis and needed to address its debts","France had just won a war and needed to divide new territory","The people had voted to replace the monarchy","A new constitution required an election every year"],0,"The monarchy faced mounting debt and a financial crisis. Louis XVI called representatives of the three estates to meet in 1789.","The monarchy’s debt helped trigger the meeting.","A royal summons arrives. The king has called representatives to address France’s financial crisis.","A summons reaches the print shop.",0],
["Which group made up most of France’s population before the Revolution?",["The First Estate","The Second Estate","The Third Estate","The royal family alone"],2,"The Third Estate included most of the population, from peasants and city workers to the middle class.","The Third Estate represented most of the population.","A customer sketches the three estates. French society was divided into legal groups with unequal numbers and privileges.","Three estates, unequal voices",1],
["Why did many members of the Third Estate resent the old system?",["They were barred from living in cities","They carried much of the tax burden while privileged groups had exemptions","They controlled all the land and wanted more taxes","They were required to serve as nobles"],1,"Many in the Third Estate paid taxes and had fewer privileges than the clergy and nobility. Economic hardship made the inequality more painful.","Tax burdens and legal privilege fueled resentment.","The shopkeeper opens a tax ledger. Its entries point to a long-standing grievance.","A ledger of burdens",1],
["At the Estates-General, what did representatives of the Third Estate do in June 1789?",["They pledged to keep meeting until France had a constitution","They declared France an empire","They crowned a new king","They dissolved every local government"],0,"In the Tennis Court Oath, members of the Third Estate and their allies pledged not to separate until France had a constitution.","The Tennis Court Oath demanded a constitution.","Word spreads that representatives have pledged to keep meeting until a constitution is written.","A promise in a crowded hall",0],
["Why did the storming of the Bastille on July 14, 1789, become a powerful symbol?",["It was where the 1791 Constitution was signed","It represented royal authority, and the crowd sought arms and gunpowder","It was the palace where the Estates-General met","It marked Napoleon’s first victory"],1,"The Bastille was a fortress and prison associated with royal authority. The crowd also sought arms and gunpowder. Its fall became a symbol of popular resistance.","The Bastille’s fall became a symbol of resistance.","A messenger brings dramatic news from across Paris: the fortress has fallen.","News from the Bastille",2],
["What did the 1789 Declaration of the Rights of Man and of the Citizen assert?",["That political authority came from the nation and that men had rights","That nobles alone could hold public office","That France should return to feudal obligations","That the king could make laws without limits"],0,"The declaration affirmed liberty, legal equality, and national sovereignty. Those principles did not immediately create equality for everyone in practice.","Revolutionaries declared rights and national sovereignty.","A draft reaches the press. Its language challenges inherited privilege and describes rights in new terms.","Words worth printing",3],
["What kind of government did France establish in its 1791 Constitution?",["A constitutional monarchy","A military dictatorship under Napoleon","A republic with no elected assembly","A return to absolute monarchy"],0,"The Constitution of 1791 limited the king’s power and created a constitutional monarchy, though the arrangement did not last.","The 1791 Constitution limited royal power.","The constitution keeps a king but places limits on royal power and creates a new legislative system.","A new political arrangement",3],
["What effect did Louis XVI’s attempted escape to Varennes in 1791 have?",["It increased trust in the king","It deepened suspicion that the king opposed the Revolution","It ended the war with Austria","It restored feudal dues"],1,"The attempted escape damaged the king’s credibility and increased suspicion that he opposed revolutionary changes.","The attempted escape deepened distrust of the king.","A traveler brings troubling news: the royal family tried to leave Paris.","A rumor at the door",4],
["Why was the Committee of Public Safety created in 1793?",["To defend the Revolution during war and internal revolt","To restore the Estates-General every summer","To give the monarchy control of the press","To oversee France’s overseas colonies"],0,"Created amid war and internal revolt, the Committee of Public Safety took extraordinary measures to defend the Revolution. The period also became associated with mass executions and the Reign of Terror.","War and internal revolt shaped the Reign of Terror.","France faces foreign war and internal revolt. Leaders claim emergency measures are needed, with severe consequences.","A revolution under pressure",2],
["What happened in the coup of 18 Brumaire in 1799?",["Napoleon helped overthrow the Directory, bringing the Revolution’s period to a close","The Bastille was stormed for the first time","Louis XVI called the Estates-General","The 1791 Constitution created a constitutional monarchy"],0,"Napoleon Bonaparte helped overthrow the Directory and establish a new political order, commonly marking the end of the French Revolution.","Napoleon’s 1799 coup ended the Directory.","A coup has overthrown the Directory, and a new leader is rising. The Revolution has entered a new chapter.","The last page of the issue",5]
];
  window.PANEL_QUEST_EDITION = {
    title: "The Paris Print Shop",
    issue: "Issue 01",
    locale: "en",
    questionCount: rows.length,
    choiceAfter: { 1: 3, 2: 6 },
    questions: rows.map(([prompt, answers, correctIndex, explanation, clue, sceneCaption, sceneTitle, artCell]) => ({
      prompt, answers, correctIndex, explanation, clue, sceneCaption, sceneTitle, artCell
    })),
    choices: {
      1: {
        eyebrow: "A choice changes the next scene", title: "Where will you look?",
        description: "The shopkeeper wants to understand why anger is spreading through Paris. Both paths reveal a different perspective.",
        options: [
          { id: "ledger", title: "Inspect the tax ledger", description: "Trace the costs and privileges recorded in the shopkeeper’s accounts." },
          { id: "market", title: "Visit the bread market", description: "Hear how rising prices affect people in the city." }
        ]
      },
      2: {
        eyebrow: "A choice changes the next scene", title: "What should be printed?",
        description: "Ideas are moving quickly through Paris. Choose which document your character helps prepare for the neighborhood.",
        options: [
          { id: "rights", title: "Print a rights pamphlet", description: "Share the new language of liberty, equality, and national sovereignty." },
          { id: "constitution", title: "Post the new constitution", description: "Explain how the 1791 settlement limits the king’s power." }
        ]
      }
    },
    routes: {
      ledger: "You followed the tax ledger and traced how privilege and tax burdens shaped resentment.",
      market: "You visited the bread market and saw how economic hardship affected city residents.",
      rights: "Your character printed a rights pamphlet, sharing revolutionary ideas.",
      constitution: "Your character posted the constitution, explaining limits on royal power."
    },
    ending: {
      storyRecap: "You followed the story from the financial crisis of 1789 to Napoleon’s rise in 1799. Your choices shaped the scenes; the historical evidence shaped your conclusion.",
      scoreLabels: ["A promising first issue", "A growing historian", "A sharp-eyed investigator"],
      summary: "The print-shop story is fictional. The questions cover the financial crisis, the estates, revolutionary demands, constitutional change, the Reign of Terror, and the coup of 18 Brumaire.",
      finalFact: "The Revolution brought constitutional change, political violence, and a new order under Napoleon."
    }
  };
})();


// Adapt the recovered edition into the shared scene graph. All setting-specific
// text, branching, effects, assets and ending conditions belong in this file.
(() => {
 const e=window.PANEL_QUEST_EDITION;
 e.id='paris-print-shop';e.version=2;e.start='q0';e.subtitle='A graphic novel investigation';
 e.description='You are a printer’s apprentice. Follow a decade of upheaval, gather evidence, and decide what your neighborhood will read.';
 e.cover='art/panel-0.webp';e.art=Array.from({length:6},(_,i)=>'art/panel-'+i+'.webp');
 e.clues={};e.scenes={};
 // Keep the original academic material, repairing chronology and distractors.
 [e.questions[6],e.questions[7]]=[e.questions[7],e.questions[6]];
 e.questions[1].answers=['The First Estate','The Second Estate','The Third Estate','The three estates in roughly equal numbers'];
 e.questions[2].answers=['They had the same tax exemptions as nobles but wanted higher wages','They carried much of the tax burden while privileged groups had exemptions','They wanted voting by estate to preserve the privileged orders’ advantage','They opposed attempts to limit royal power with a constitution'];
 e.questions[3].prompt='A June 1789 dispatch describes the Tennis Court Oath. What did the deputies pledge?';
 e.questions[3].answers=['To remain together until France had a constitution','To restore voting by estate and end the National Assembly','To establish a republic immediately and put the king on trial','To postpone reforms until the monarchy had repaid its debts'];
 const dates=['May 1789','May 1789','May 1789','June 1789','July 1789','August 1789','June 1791','September 1791','1793–1794','November 1799'];
 const jobs=['A royal summons needs a headline. Find the reason behind the meeting.','A customer asks whose voices are missing. Check the social order before setting the type.','Before publishing a complaint, identify the grievance supported by the ledger.','A dispatch arrives from Versailles. Make sure your report describes the oath accurately.','A messenger rushes in. Explain why the fortress matters to the crowd.','You are setting a declaration in type. Identify the principle the document asserts.','The street is full of rumors. Explain why the attempted flight matters.','Readers want to know who now holds power. Explain the new settlement.','A decade turns darker. Explain the emergency government without excusing its violence.','You are closing the shop’s chronicle. Identify what changed in November 1799.'];
 e.questions.forEach((q,i)=>{
  const clue='history-'+i;e.clues[clue]={title:q.sceneTitle,text:q.clue,date:dates[i],kind:'Historical context'};
  e.scenes['q'+i]={id:'q'+i,type:'question',title:q.sceneTitle,date:dates[i],caption:q.sceneCaption,art:q.artCell,layout:i%3===0?'splash':i%3===1?'split':'inset',dialogue:jobs[i],question:q,clue,next:i===2?'route-a':i===5?'route-b':i===9?'final':'q'+(i+1)};
 });
 e.clues.ledger={title:'A ledger of unequal burdens',text:'The fictional shop ledger connects tax payments with complaints about privileged exemptions.',date:'May 1789',kind:'Story evidence'};
 e.clues.market={title:'A voice from the bread line',text:'A fictional market witness describes how bread costs strain a household budget. This illustrates economic hardship, not a universal price record.',date:'May 1789',kind:'Story evidence'};
 e.clues.rights={title:'A principle, and its limits',text:'A fictional editorial note asks readers to compare declared legal equality with the exclusions that persisted in practice.',date:'August 1789',kind:'Story evidence'};
 e.clues.constitution={title:'Power needs limits',text:'A fictional planning sheet asks who will make laws and what will limit the king while a constitution is still being debated.',date:'August 1789',kind:'Story evidence'};
 e.clues.source={title:'The witness’s permission',text:'You choose to preserve a market witness’s name privately rather than identify the source in print.',date:'May 1789',kind:'Story decision'};
 e.scenes['route-a']={type:'decision',title:'Whose story will you follow?',date:'May 1789',art:0,caption:'The master printer points toward the ledger, then toward the street. “Find something we can support with evidence.”',dialogue:'Both routes rejoin the chronicle. Your source will change the story you can tell.',options:[
  {id:'ledger',title:'Follow the money',description:'Inspect the shopkeeper’s ledger and trace a complaint about privilege.',next:'ledger',effects:{flags:{routeA:'ledger'},add:{care:1}}},
  {id:'market',title:'Listen in the bread line',description:'Ask a market customer what rising costs mean at home.',next:'market',effects:{flags:{routeA:'market'},add:{voice:1}}}
 ]};
 e.scenes.ledger={type:'investigation',title:'Ink beside the numbers',date:'May 1789',art:0,layout:'inset',caption:'An account book lies beneath a bundle of pamphlets. “A list of payments is a beginning,” says the printer. “Now ask who has privileges.”',dialogue:'Inspect the ledger before you return to the press.',items:[{id:'ledger',title:'Read the ledger margin',text:'A fictional customer’s note links tax payments to resentment of exemptions. It supports your investigation of unequal burdens.',clue:'ledger'}],next:'q3'};
 e.scenes.market={type:'investigation',title:'The price of a loaf',date:'May 1789',art:1,layout:'split',caption:'At the bread stall, a customer counts out coins. “The household still needs to eat,” she tells you. “Write about that.”',dialogue:'Listen to the witness before choosing how to use her account.',items:[{id:'market',title:'Hear the customer’s account',text:'This fictional testimony illustrates how food costs can turn a financial crisis into a daily struggle. One witness cannot represent all of France.',clue:'market'}],next:'source'};
 e.scenes.source={type:'dialogue',title:'A name in print?',date:'May 1789',art:1,caption:'“You can use my account,” the customer says, “but must my name go into the pamphlet?”',dialogue:'Your answer affects the fictional shop’s reputation for care.',options:[
 {id:'protect',title:'Keep her name private',description:'Preserve the account while respecting the witness’s request.',next:'q3',clue:'source',effects:{add:{care:1}}},
 {id:'attribute',title:'Ask to print her name',description:'She agrees, but asks you to use her exact words and explain that this is one account.',next:'q3',effects:{add:{voice:1}}}
 ]};
 e.scenes['route-b']={type:'decision',title:'What belongs on the front page?',date:'August 1789',art:3,caption:'A declaration has arrived, but a constitution is still being debated. There is room for one lead story.',dialogue:'Choose an editorial direction. It will influence your final chronicle.',options:[
 {id:'rights',title:'Lead with rights',description:'Explore liberty, equality and the gap between principles and practice.',next:'rights',effects:{flags:{routeB:'rights'},add:{voice:1}}},
 {id:'constitution',title:'Ask how power will be limited',description:'Prepare questions about the constitutional settlement still to come.',next:'constitution',effects:{flags:{routeB:'constitution'},add:{care:1}}}
 ]};
 e.scenes.rights={type:'investigation',title:'Who is included?',date:'August 1789',art:3,layout:'splash',caption:'“The words matter,” the printer says, “but so does who can actually claim them.” You add a margin note rather than pretend the declaration has already made everyone equal.',dialogue:'Compare the principle with its limits.',items:[{id:'rights',title:'Read the editorial note',text:'The declaration asserts rights and national sovereignty. Women lacked equal political rights, and slavery continued in French colonies in 1789.',clue:'rights'}],next:'q6'};
 e.scenes.constitution={type:'investigation',title:'A constitution still unwritten',date:'August 1789',art:3,layout:'inset',caption:'You leave a blank space on the planning sheet: “Who will make the laws?” The answer will take time, conflict and negotiation.',dialogue:'Study the question you will revisit in 1791.',items:[{id:'constitution',title:'Inspect the planning sheet',text:'The Tennis Court Oath promised a constitution. In August 1789, the constitutional settlement of 1791 is still in the future.',clue:'constitution'}],next:'q6'};
 e.scenes.final={type:'decision',title:'The last sheet',date:'November 1799',art:5,layout:'splash',caption:'Ten years after the royal summons, the apprentice is an experienced printer. The master places one last sheet beside the press. “What will this shop leave behind?”',dialogue:'Choose what to emphasize. Your earlier sources, editorial choices and care with evidence also shape the epilogue.',options:[
 {id:'public',title:'Publish for the neighborhood',description:'Use your gathered sources to explain what changed and whose concerns deserve to be heard.',next:'ending',effects:{flags:{final:'public'}}},
 {id:'archive',title:'Preserve a documented chronicle',description:'Keep the records together so future readers can examine promises, violence and changes in power.',next:'ending',effects:{flags:{final:'archive'},add:{care:1}}}
 ]};
 e.scenes.ending={type:'ending'};
 e.endings=[
 {id:'voices',title:'The neighborhood’s voice',when:{flags:{final:'public',routeA:'market',routeB:'rights'},clues:['market','rights'],min:{voice:2}},art:1,text:'Your final issue begins with everyday hardship and asks who can claim the rights declared in 1789. The market account and your rights editorial give the neighborhood a place in the chronicle. Your pamphlet cannot change the historical outcome, but it can preserve voices that might otherwise be lost.',hint:'A ledger investigation or a different editorial direction opens another version of the shop’s legacy.'},
 {id:'archive',title:'The keeper of the record',when:{min:{care:2},firstTry:5},art:3,text:'The shop becomes a place where claims are checked against documents and testimony. Your attention to sources helps the printer preserve a careful account of constitutional hopes, political violence and Napoleon’s rise. The archive records both revolutionary principles and their limits.',hint:'Try following the market witness and leading with rights to give the chronicle a more public voice.'},
 {id:'press',title:'A press that keeps asking',art:5,text:'The shop survives a decade of upheaval with its questions still open. Your sources show that debts, inequality, rights and struggles over power all belong in the story. Some claims needed correction along the way; the collected record gives you a basis for revising the next edition.',hint:'Earlier source choices, editorial direction and careful first readings can change the shop’s legacy.'}
 ];
 e.sources=[{title:'George Mason University / CHNM: The Flight to Varennes',url:'https://revolution.chnm.org/items/show/537'},{title:'George Mason University / CHNM: Louis Accepts the Constitution',url:'https://revolution.chnm.org/d/535/'},{title:'George Mason University / CHNM: Monarchy Falls',url:'https://revolution.chnm.org/exhibits/show/liberty--equality--fraternity/monarchy-falls'}];
 // Make art dates explicit; no 1789 label over the later chapters.
})();

Object.assign(window.PANEL_QUEST_EDITION, {
 dateRange:'1789–1799',coverTitle:'THE PARIS PRINT SHOP',coverTagline:'One city. A decade of upheaval. What will you put into print?',
 historicalNote:'The apprentice, dialogue and shop records are fictional. Historical events stay fixed; your choices shape the shop’s story. The narrative spans 1789–1799.',
 pageFooter:'History stays fixed. Your story takes shape.',speaker:'At the print shop',endingLabel:'The shop’s legacy · November 1799',
 sourceNote:'The illustrations and dialogue are fictional interpretations. The 1791 chapters place the June flight before the September constitution.',
 artDescriptions:['A young apprentice and master printer examine a sealed letter in a candlelit workshop.','The apprentice listens to customers at a busy Paris bread stall.','A crowd gathers outside the Bastille fortress.','An apprentice operates a wooden printing press beside the master printer.','The apprentice watches a carriage on a lamplit Paris street.','The apprentice and master printer hold a printed sheet above the Paris skyline.']
});
// Plausible alternatives draw on nearby revolutionary developments.
(() => {
 const q=window.PANEL_QUEST_EDITION.questions;
 q[0].answers=['France faced a serious financial crisis and needed to address its debts','France needed an assembly to ratify a completed constitution','The monarchy needed approval to establish a republic','The king wanted deputies to approve Napoleon’s new government'];
 q[4].answers=['It was where deputies first declared themselves the National Assembly','It represented royal authority, and the crowd sought arms and gunpowder','It was the meeting place where deputies took the Tennis Court Oath','It was where the Declaration of Rights was formally adopted'];
 q[5].answers=['That political authority came from the nation and that men had rights','That political authority came only from inherited royal power','That legal rights depended on membership in a privileged estate','That national sovereignty required ending all representative assemblies'];
 q[7].answers=['A constitutional monarchy','An absolute monarchy with the Estates-General as an advisory body','A republic headed by the National Convention','A consulate in which Napoleon held executive power'];
 q[8].answers=['To defend the Revolution during war and internal revolt','To negotiate the constitutional monarchy agreed upon in 1791','To resolve the voting dispute that opened the Estates-General','To draft the Declaration of Rights adopted in August 1789'];
 q[9].answers=['Napoleon helped overthrow the Directory and establish the Consulate','Deputies replaced the absolute monarchy with the 1791 Constitution','The National Convention abolished the monarchy and proclaimed a republic','The fall of Robespierre ended the Jacobin leadership of the Terror'];
})();

// Reusable comic beats and state-aware callbacks. Art is intentionally reused;
// the supporting documents are fictional notes, not primary-source facsimiles.
(() => {
 const e=window.PANEL_QUEST_EDITION;
 const beats=[
  ['THE SUMMONS','A kingdom in debt. A meeting called.',0],
  ['OUTSIDE THE SHOP','Whose voices reach the press?',1],
  ['IN THE MARGIN','Tax burdens. Privileges. A grievance.',0],
  ['DISPATCH FROM VERSAILLES','A promise to keep meeting.',0],
  ['ACROSS PARIS','News travels faster than the ink dries.',2],
  ['ON THE PRESS','Rights declared. Questions remain.',3],
  ['RUMORS IN THE STREET','A royal flight deepens mistrust.',4],
  ['A NEW SETTLEMENT','A crown with constitutional limits.',3],
  ['THE CHRONICLE DARKENS','Record the crisis. Examine the violence.',4],
  ['THE LAST DISPATCH','The Directory falls. The Consulate begins.',5]
 ];
 beats.forEach(([label,text,art],i)=>{
  e.scenes['q'+i].panels=[{kind:'art',label,text,art},{kind:'document',label:'APPRENTICE’S NOTE',afterAnswer:true,beforeText:'Your conclusion belongs here. Check the source before filing it.',text:e.questions[i].clue}];
 });
 for(const id of ['route-a','route-b','final']){
  const s=e.scenes[id];s.panels=s.options.map(o=>({kind:'art',art:id==='route-a'?(o.id==='market'?1:0):id==='route-b'?3:5,label:'A POSSIBLE PATH',text:o.title}));
 }
 for(const id of ['ledger','market','rights','constitution']){
  e.scenes[id].panels=[{kind:'document',label:'FICTIONAL SHOP NOTE',text:e.clues[id].text}];
 }
 e.scenes.source.panels=[{kind:'art',art:1,label:'BEFORE THE INK DRIES',text:'A witness is a person, not just a source.'}];
 e.scenes.q3.callbacks=[
  {when:{flags:{routeA:'ledger'}},text:'You return with a ledger note. Your next report carries the question of unequal burdens.'},
  {when:{flags:{routeA:'market'}},text:'You return with the market account. The household behind the political crisis stays in your story.'}
 ];
 e.scenes.q7.callbacks=[
  {when:{flags:{routeB:'rights'}},text:'Your rights editorial asked who was included. Read this new settlement with that question in mind.'},
  {when:{flags:{routeB:'constitution'}},text:'You left a constitutional question open in 1789. Now the 1791 settlement gives you something to examine.'}
 ];
 e.scenes.final.callbacks=[
  {when:{flags:{routeA:'market',routeB:'rights'}},text:'The bread-line account and your rights editorial are on the desk beside your final sheet.'},
  {when:{flags:{routeA:'ledger'}},text:'The ledger you inspected is still in the file. Decide how its evidence belongs in the final chronicle.'},
  {when:{flags:{routeB:'constitution'}},text:'Your planning sheet now sits beside the record of the 1791 Constitution. Preserve both the hope and what followed.'}
 ];
 e.endings[0].reason='You listened in the bread line, led with rights, and published for the neighborhood. Those choices carried everyday voices into the final issue.';
 e.endings[1].reason='You made at least two choices that favored care with the record and resolved at least five historical questions on the first try.';
 e.endings[2].reason='Your combination of editorial choices and first readings produced an open-ended chronicle. Your corrections and gathered sources remain part of its record.';
})();
