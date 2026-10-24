/* Narrative edition layer. Characters and shop incidents are fictional;
   historical questions, chronology, and evidence rules remain in the edition. */
(() => {
 const e=window.PANEL_QUEST_EDITION;
 e.characters=[
  {name:'Laurent',role:'Master printer',motive:'Keep the shop open, pay the people who work here, and print claims he can defend.'},
  {name:'Camille',role:'Typesetter',motive:'Get useful words beyond the workshop door before people lose interest or trust.'},
  {name:'Madeleine',role:'Market customer',motive:'Have household hardship heard without losing control of how her account is used.'}
 ];
 e.coverTagline='The paper runs out. The stories do not. What deserves to be printed?';
 e.description='Join a Paris print shop where a careful master, an impatient typesetter, and a market witness disagree about what belongs in print. Build three supported pages and decide what the shop will leave behind.';
 e.scenes.briefing.title='The last clean sheet';
 e.scenes.briefing.caption='Laurent lays an unpaid paper bill beside the press. Camille turns a blank sheet toward you. Outside, a customer waits for words that might explain why life has become so difficult.';
 e.scenes.briefing.lines=[{speaker:'Laurent',text:'Enough paper for a small run. Every careless claim costs us.'},{speaker:'Camille',text:'So does printing nothing. Let the apprentice find our first story.'}];
 e.scenes.briefing.items[0].title='Take the apprentice’s commission';
 e.scenes.briefing.items[0].text='Investigate before setting the type. As the years pass, you will build three pages: causes, promises, and changes in power. Support each claim with a note, then add your own explanation. Your choices shape the fictional shop’s legacy.';
 e.scenes.q0.caption='A royal summons arrives while Laurent is counting the cost of paper. He wants a plain account of why the representatives are meeting. Camille has already cleared a space for the headline.';
 e.scenes.q0.lines=[{speaker:'Laurent',text:'Before you write what people hope for, find out why this meeting was called.'}];
 e.scenes.q1.lines=[{speaker:'Camille',text:'The people outside buy our sheets. Do they have the same voice as the people with titles?'}];
 e.scenes.q2.caption='You find a complaint tucked beside an account entry. The customer’s words are angry; Laurent will not print an accusation until you can explain the grievance behind it.';
 e.scenes.q2.lines=[{speaker:'Laurent',text:'Anger is a beginning. A claim needs a reason our readers can examine.'}];
 e.scenes['route-a'].title='One errand before the press starts';
 e.scenes['route-a'].caption='Camille reaches for the market basket. Laurent opens the ledger. There is time for one investigation before this small run goes to press.';
 e.scenes['route-a'].lines=[{speaker:'Laurent',text:'The accounts can show the grievance.'},{speaker:'Camille',text:'People can show what it costs to live with it.'}];
 e.scenes['route-a'].options[0].description='Stay with Laurent and trace the complaint about exemptions. Your first page will explain unequal burdens.';
 e.scenes['route-a'].options[1].description='Go with Camille to hear one household account. Your first page will connect the crisis to daily hardship.';
 e.scenes.ledger.caption='Laurent turns the account book toward you, but keeps his hand on it. “This is a customer’s complaint,” he says. “Do not turn one margin note into the voice of a whole country.”';
 e.scenes.ledger.lines=[{speaker:'Laurent',text:'Show the grievance. Be honest about how little this one book can prove.'}];
 e.scenes.market.caption='Camille introduces you to Madeleine at the bread stall. She counts the coins again, then looks at your notebook rather than at the bread.';
 e.scenes.market.lines=[{speaker:'Madeleine',text:'People argue about the king. At home, we argue about what is left after bread.'},{speaker:'Camille',text:'Will you let us tell that part?'}];
 e.scenes.source.caption='You have written Madeleine’s words. When you add a space for her name, she stops counting her coins.';
 e.scenes.source.lines=[{speaker:'Madeleine',text:'Use my account. Ask me before you use my name.'}];
 e.scenes.source.options[0].description='Use her account without identifying her. The printed page will credit an unnamed market customer.';
 e.scenes.source.options[1].description='Ask for permission to identify her. She agrees if you preserve her meaning and identify it as one account.';
 e.scenes['publish-causes'].caption='Camille pulls the first proof from the press. Laurent reaches for it before the ink is dry. This page has to earn its paper.';
 e.scenes['publish-causes'].lines=[{speaker:'Camille',text:'Now make the evidence do some work.'},{speaker:'Laurent',text:'Two claims. A reason for each. Then we print.'}];
 e.scenes.q3.callbacks=[
  {when:{flags:{routeA:'ledger'}},text:'Laurent has kept the customer’s margin note with your first proof. He lets you set the next headline yourself.'},
  {when:{flags:{routeA:'market',sourceName:'private'}},text:'Camille delivers the first sheets without Madeleine’s name. The account reaches readers; the promise of anonymity remains yours to keep.'},
  {when:{flags:{routeA:'market',sourceName:'named'}},text:'Madeleine checks the first proof before it leaves the shop. She recognizes her words and agrees to the credit you have printed.'}
 ];
 e.scenes.q3.lines=[{speaker:'Laurent',text:'A promise from Versailles is on this dispatch. Read what was pledged before you set it in type.'}];
 e.scenes.q4.caption='Camille bursts in with news from the Bastille. A customer is already asking for a sheet to carry home. Laurent pulls the door open to hear the messenger directly.';
 e.scenes.q4.lines=[{speaker:'Camille',text:'They will ask what happened. They will also ask why it matters.'}];
 e.scenes.q5.lines=[{speaker:'Camille',text:'These words could belong over our door. Who will be able to claim them?'}];
 e.scenes['route-b'].caption='The declaration lies beside a paid order that would keep the press busy. Camille wants a lead about rights; Laurent wants readers to ask how power will actually be limited. This issue has room for one lead.';
 e.scenes['route-b'].lines=[{speaker:'Camille',text:'A promise is worth printing where people can see it.'},{speaker:'Laurent',text:'Then show what would make the promise hold.'}];
 e.scenes.rights.lines=[{speaker:'Camille',text:'If the words say equality, leave room for the people still shut out.'}];
 e.scenes.constitution.lines=[{speaker:'Laurent',text:'A blank space is more honest than a settlement nobody has finished writing.'}];
 e.scenes['publish-promises'].caption='The second proof rests beside the first. Neither worker asks which page is louder. They ask whether a reader could tell a declared principle from what has already changed.';
 e.scenes['publish-promises'].lines=[{speaker:'Camille',text:'I want readers to see the promise.'},{speaker:'Laurent',text:'And the unfinished work beneath it.'}];
 e.scenes['bridge-1791'].caption='Months of work fill the shelves. Laurent trusts you with the type case now. Camille saves a copy of each issue, even when the next dispatch seems to contradict its hopes.';
 e.scenes['bridge-1791'].lines=[{speaker:'Camille',text:'Keep the earlier pages. We need to remember what people expected.'}];
 e.scenes.q6.lines=[{speaker:'Camille',text:'Yesterday’s confidence is not today’s proof. What does the attempted flight do to trust?'}];
 e.scenes.q7.callbacks=[
  {when:{flags:{routeB:'rights'}},text:'Camille sets your rights page beside the new constitution. The promise of inclusion has become a question to carry forward.'},
  {when:{flags:{routeB:'constitution'}},text:'Laurent finds the blank planning sheet you kept in 1789. You can finally set a dated account beside its unanswered question.'}
 ];
 e.scenes.q7.lines=[{speaker:'Laurent',text:'There is still a king. There are also limits. Name the arrangement carefully.'}];
 e.scenes['bridge-republic'].caption='The shop’s page about a limited king is now an earlier chapter. War and upheaval have ended the monarchy. Camille refuses to throw the old page away.';
 e.scenes['bridge-republic'].lines=[{speaker:'Camille',text:'Keep it. A failed settlement is still part of how we got here.'}];
 e.scenes.q8.caption='Under the republic, the shop records war, revolt, emergency powers and violence. Camille no longer leaves the source notebook on the counter. Laurent notices the empty space.';
 e.scenes.q8.lines=[{speaker:'Laurent',text:'Explain the emergency. Do not let that explanation become an excuse for what was done.'}];
 e.scenes.q8.next='notes-decision';
 e.scenes['notes-decision']={type:'decision',title:'The notebook on the counter',date:'Paris · 1793',art:3,caption:'A visitor has asked who supplied the shop’s accounts. After the door closes, Camille puts the source notebook between you and Laurent. Tonight there is paper and time for one job.',dialogue:'Choose how the fictional shop handles its source material. Both routes retain verified claims and protect unpublished identities; they create different things for the final chronicle.',lines:[{speaker:'Camille',text:'Keep the names safe. But do not let the record disappear with them.'},{speaker:'Laurent',text:'Seal the originals, or prepare anonymous reading copies. Which job do we do tonight?'}],options:[
  {id:'seal',title:'Seal and catalogue the originals',description:'Keep the source trail intact inside the shop. Readers will have to wait for a carefully prepared public account.',next:'sealed-notes',effects:{flags:{notes:'sealed'}},consequence:'The originals go into a labelled packet. You preserve the fuller source trail; no new reading copies leave tonight.'},
  {id:'copies',title:'Prepare anonymous reading copies',description:'Circulate verified claims without unpublished identifying details. The public copies will carry less source context.',next:'reading-copies',effects:{flags:{notes:'copies'}},consequence:'Camille prepares copies with unpublished identifying details removed. Readers get verified claims, with less context than the originals.'}
 ],panels:[{kind:'document',label:'THE ORIGINALS',text:'A fuller source trail, kept inside the shop.'},{kind:'document',label:'THE READING COPIES',text:'Verified claims, with unpublished identifying details removed.'}],variants:[
  {when:{flags:{sourceName:'named'}},lines:[{speaker:'Madeleine',text:'I let you print my name then. Ask me again before using any new notes.'},{speaker:'Laurent',text:'We cannot erase that first page. We can decide what leaves the shop tonight.'}]},
  {when:{flags:{sourceName:'private'}},lines:[{speaker:'Madeleine',text:'You kept my name off the first page. Please keep that promise with these notes.'},{speaker:'Camille',text:'We can protect a person without throwing away what she told us.'}]}
 ]};
 e.clues['sealed-notes']={title:'The sealed source packet',date:'1793',kind:'Story decision',text:'You catalogue and seal the fictional shop’s originals. The fuller source trail stays inside; this preserves context but delays new reading copies.'};
 e.clues['reading-copies']={title:'The anonymous reading copies',date:'1793',kind:'Story decision',text:'You prepare verified claims for readers without unpublished identifying details. The copies spread the account but contain less source context than the originals.'};
 e.scenes['sealed-notes']={type:'investigation',title:'A packet that must survive',date:'1793',art:0,caption:'Laurent ties the packet. You add dates and a list of what is inside. Camille asks for one blank line on the label: “Where the public account will follow.”',dialogue:'Read what your decision preserves and what it postpones.',lines:[{speaker:'Laurent',text:'If anyone reopens this, they must know what each note can prove.'},{speaker:'Camille',text:'And that we meant these words to have readers.'}],items:[{id:'packet',title:'Label the source packet',text:e.clues['sealed-notes'].text,clue:'sealed-notes'}],sourceLabel:'Fictional shop decision',next:'bridge-directory'};
 e.scenes['reading-copies']={type:'investigation',title:'Words beyond the door',date:'1793',art:3,caption:'You and Camille remove unpublished identifying details from the copy. Laurent checks that no sentence claims more than the notes can support. A smaller account leaves the shop.',dialogue:'Read what your decision makes public and what it leaves out.',lines:[{speaker:'Camille',text:'People can read this tonight.'},{speaker:'Laurent',text:'Then tell them what these copies cannot show. The missing context matters too.'}],items:[{id:'copies',title:'Check the reading copy',text:e.clues['reading-copies'].text,clue:'reading-copies'}],sourceLabel:'Fictional shop decision',next:'bridge-directory'};
 e.scenes['bridge-directory'].caption='Years pass. The shop survives by doing ordinary paid work between its reports. A new constitution creates the Directory. You are no longer the apprentice who first opened the summons.';
 e.scenes['bridge-directory'].lines=[{speaker:'Laurent',text:'You kept our earlier pages. Keep the changes between them just as carefully.'}];
 e.scenes['bridge-directory'].callbacks=[{when:{flags:{notes:'sealed'}},text:'The sealed packet has stayed with the shop through another change of government. Its catalogue gives you a way back through the original accounts.'},{when:{flags:{notes:'copies'}},text:'Camille has brought back a worn reading copy. People kept it, though its missing source details still limit what it can show.'}];
 e.scenes.q9.lines=[{speaker:'Camille',text:'Another dispatch. Another promise of order. Give it a date before anyone calls it the end of the story.'}];
 e.scenes.final.caption='November 1799. Laurent gives you the space beside the press where he once put the unpaid bill. The earlier pages are on the desk. This time he waits for your decision.';
 e.scenes.final.lines=[{speaker:'Laurent',text:'The type case is yours now.'},{speaker:'Camille',text:'Then decide where the finished record belongs.'}];
 e.scenes.final.callbacks=[{when:{flags:{notes:'sealed'}},text:'The original packet you sealed is still here. You can preserve the full source trail, or use it to prepare a checked public account.'},{when:{flags:{notes:'copies'}},text:'Your anonymous copies already have readers. You can finish that public account, or bring copies and source notes into one archive.'},...e.scenes.final.callbacks];
 e.scenes['publish-power'].caption='You set the last page yourself. Laurent checks the evidence once more. Camille clears the place where the finished sheets—or the archive packet—will be handed over.';
 e.scenes['publish-power'].lines=[{speaker:'Laurent',text:'Keep the changes in power clear.'},{speaker:'Camille',text:'And leave a record someone can question, not just admire.'}];
 e.epilogueBeats=[
  {speaker:'Laurent',text:'He leaves you the type case and asks you to keep the shop’s standard: no claim without a source.'},
  {when:{flags:{final:'public',notes:'sealed'}},speaker:'Camille',text:'She carries the completed chronicle out to readers. The originals stay behind; the packet has finally helped produce its public account.'},
  {when:{flags:{final:'public',notes:'copies'}},speaker:'Camille',text:'She puts the complete chronicle beside the earlier reading copies, so readers can see the fuller history behind them.'},
  {when:{flags:{final:'archive',notes:'sealed'}},speaker:'Camille',text:'She adds your three pages to the packet and insists on keeping a catalogue for the day someone asks to read it.'},
  {when:{flags:{final:'archive',notes:'copies'}},speaker:'Camille',text:'She brings a worn reading copy back into the archive. The record now includes both what the shop knew and what its readers received.'},
  {when:{flags:{sourceName:'private'}},speaker:'Madeleine',text:'Her first printed account still has no name attached. The finished page keeps the promise you made at the bread stall.'},
  {when:{flags:{sourceName:'named'}},speaker:'Madeleine',text:'Her first account remains credited with her permission. Your later decision has not pretended that the already printed name could be erased.'}
 ];
 e.teacherGuide.debrief.push('What did sealing originals preserve that reading copies could not? What did the copies make possible that a sealed packet could not?');
})();
