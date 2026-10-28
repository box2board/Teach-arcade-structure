import {newPage} from './state.js';
import {makeObject,classroomObject} from './objects.js';
export const templateList=[['Classroom Poster','A little encouragement','#e9e2ff'],['Vocabulary Cards','Words worth knowing','#fff0d9'],['Exit Ticket','A small check. A big insight.','#dff5ef'],['Bellringer','Start with a spark','#ffdfdc'],['Award Certificate','Celebrate a bright moment','#fff3c9'],['Classroom Rules','Make room for everyone','#e1ebff'],['Historical Figure Poster','Meet a changemaker','#f2e7db'],['Science Diagram','Observe. Label. Discover.','#e1f5ef'],['Timeline','Put the story in order','#eee5ff'],['Graphic Organizer','Make thinking visible','#e5edff'],['Student Choice Board','Different paths to learning','#ffe7df'],['Game Instructions','Ready, set, learn','#e5e1ff']];
export function buildTemplate(name){const p=newPage();p.name=name;const color=templateList.find(t=>t[0]===name)?.[2]||'#eee5ff';p.background='#fffcf7';
 const add=(type,v)=>{let o=makeObject(type,v);p.objects.push(o);return o;};
 const text=(text,x,y,w,fontSize=30,v={})=>add('text',{name:text.split('\n')[0].slice(0,32),text,x,y,w,h:fontSize*Math.max(2,text.split('\n').length)*1.3,fontSize,fill:'#292447',...v});
 const rect=(x,y,w,h,fill,v={})=>add('shape',{shape:'rounded',name:'Color block',x,y,w,h,fill,radius:20,...v});
 rect(40,40,736,976,color,{name:'Soft page frame',radius:24});rect(64,64,688,928,'#fffcf7',{name:'Paper inset'});
 text('THE CLASSROOM COLLECTION',98,94,610,15,{letterSpacing:2,fill:'#7258ba',bold:true});
 if(name==='Classroom Poster'){
 text('A little curiosity.\nA lot of possibility.',98,174,620,66,{bold:true,lineHeight:1.12});text('Ask questions. Try new things.\nYour next great idea starts here.',100,390,570,25,{lineHeight:1.55,fill:'#646079'});
 rect(98,558,620,285,'#ded4fa',{name:'Purple message card'});add('shape',{shape:'star',x:552,y:590,w:110,h:110,fill:'#f4b850',angle:12,name:'Golden star'});text('What will you\ndiscover today?',132,602,400,44,{bold:true});text('A SPACE TO WONDER. A PLACE TO GROW.',100,908,630,15,{letterSpacing:1.4});
 }else if(name==='Award Certificate'){
 text('CERTIFICATE OF',100,220,616,24,{align:'center',letterSpacing:4});text('Brilliant effort',100,275,616,65,{font:'Georgia',align:'center'});text('Presented to',100,430,616,23,{align:'center'});text('Student name',120,500,576,43,{align:'center',font:'Georgia'});rect(160,570,496,3,'#bba770');text('For showing curiosity, kindness,\nand the courage to keep learning.',120,615,576,24,{align:'center'});text('Teacher signature                   Date',125,850,570,18);add('shape',{shape:'star',x:360,y:720,w:96,h:96,fill:'#e7b347',name:'Achievement star'});
 }else if(name==='Exit Ticket'||name==='Bellringer'){
 text(name==='Exit Ticket'?'Before you go…':'Let’s get thinking.',100,170,610,56,{bold:true});text('Name: __________________   Date: __________',100,285,620,20);
 ['One thing I learned…','A connection I can make…','Something I’m still wondering…'].forEach((t,i)=>{text(t,100,365+i*185,610,25,{bold:true});const o=classroomObject('Lined paper');Object.assign(o,{x:100,y:415+i*185,w:610,h:100,stroke:'#bab3d0'});p.objects.push(o);});
 }else if(name==='Vocabulary Cards'){
 text('Words worth knowing',100,165,610,48,{bold:true});for(let i=0;i<4;i++){const x=100+(i%2)*315,y=290+Math.floor(i/2)*310;rect(x,y,292,285,i%2?'#e3f2ec':'#f7e8d0');text(['Curiosity','Perspective','Evidence','Connection'][i],x+20,y+25,252,28,{bold:true});text('Definition:\n\n\nUse it in a sentence:',x+20,y+90,252,19);}
 }else if(name==='Student Choice Board'){
 text('Choose your adventure',100,165,610,46,{bold:true});text('Pick three. Make something you’re proud of.',100,240,610,20);['Draw it','Explain it','Build it','Compare it','Explore it','Teach it','Connect it','Debate it','Create it'].forEach((t,i)=>{const x=100+(i%3)*210,y=320+Math.floor(i/3)*195;rect(x,y,195,178,i%2?'#ece4ff':'#ffe9dc');text(t,x+14,y+55,168,25,{bold:true,align:'center'});});
 }else if(name==='Classroom Rules'){
 text('Our space.\nOur community.',100,160,610,56,{bold:true});['Be curious. Ask questions.','Be kind. Make room for others.','Be brave. Learn from mistakes.','Be ready. Give your best effort.'].forEach((t,i)=>{rect(100,380+i*125,610,100,i%2?'#eef0fa':'#e0e9ff');text(t,120,407+i*125,570,25,{bold:true});});
 }else if(name==='Timeline'){
 text('Every moment matters',100,170,610,48,{bold:true});text('A timeline of change',100,250,610,24);rect(396,340,6,525,'#b5a2e6');for(let i=0;i<4;i++){add('shape',{shape:'circle',x:384,y:370+i*135,w:30,h:30,fill:'#7957e7'});text('YEAR',i%2?440:110,350+i*135,240,19,{bold:true});text('Describe the moment\nand why it matters.',i%2?440:110,385+i*135,240,21);}
 }else if(name==='Historical Figure Poster'){
 text('Meet a changemaker',100,170,610,48,{bold:true});rect(100,280,610,250,'#e8ddcd',{name:'Portrait placeholder'});text('Add a portrait here',150,375,510,26,{align:'center',fill:'#746556'});text('Name / time period',100,585,610,36,{bold:true});text('Their story\n\nWhat changed because of them?\n\nA question I would ask…',100,680,610,24,{lineHeight:1.4});
 }else if(name==='Science Diagram'){
 text('A closer look',100,170,610,56,{bold:true});text('Label the parts. Explain the connections.',100,260,610,23);add('shape',{shape:'circle',x:240,y:420,w:320,h:260,fill:'#d5eee0',stroke:'#76a992',strokeWidth:4,name:'Main structure'});add('shape',{shape:'circle',x:340,y:480,w:115,h:115,fill:'#baa3e9',name:'Inner structure'});text('Label 1',110,360,210,24);text('Label 2',520,730,210,24);add('shape',{shape:'arrow',x:175,y:420,w:125,h:38,fill:'#7258ba',angle:35});text('What do you notice?',100,845,610,27,{bold:true});
 }else if(name==='Graphic Organizer'){
 text('Connect your thinking',100,170,610,46,{bold:true});rect(235,310,345,145,'#e6ddfa');text('Main idea',255,355,305,32,{bold:true,align:'center'});for(let i=0;i<3;i++){rect(100+i*210,575,195,245,'#e7edff');text('Detail '+(i+1),113+i*210,605,170,23,{bold:true});add('shape',{shape:'line',x:180+i*210,y:485,w:110,h:3,fill:'#9e8bc6',angle:90});}
 }else{
 text('How to play',100,170,610,62,{bold:true});text('Learn together. Play with purpose.',100,265,610,24);['Set up your space','Take turns and think aloud','Celebrate what you learn'].forEach((t,i)=>{add('shape',{shape:'circle',x:100,y:385+i*160,w:62,h:62,fill:'#7957e7'});text(String(i+1),116,389+i*160,32,30,{fill:'#ffffff',bold:true});text(t,190,390+i*160,500,29,{bold:true});text('Add your instructions here.',190,440+i*160,500,21);});
 }
 return p;
}
