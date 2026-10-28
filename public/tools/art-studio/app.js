import {StudioState,newProject} from './state.js';
import {buildTemplate} from './templates.js';
import {StudioCanvas} from './canvas.js';
import {StudioUI} from './ui.js';
const root=document.getElementById('art-studio');
const initial=newProject();initial.name='A little curiosity';initial.pages=[buildTemplate('Classroom Poster')];
const state=new StudioState(initial);
const canvas=new StudioCanvas(root,state);
const ui=new StudioUI(root,state,canvas);
requestAnimationFrame(()=>canvas.fit());
// Exposed only for local diagnostics; no authentication or server writes.
root.studio={state,canvas,ui};
