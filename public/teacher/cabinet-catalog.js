import {GAMES} from '../review-lab/catalog.js';
import {ARCADE_GAMES} from './arcade-catalog.js';
// Both the browser and API use this same allowlist and stable bookmark IDs.
export const CABINET_GAMES=Object.freeze([...ARCADE_GAMES,...GAMES.map(game=>Object.freeze({...game,collection:'Review Lab',chooseTopic:true}))]);
// Cabinet bookmarks point at public resources; they never copy tool/student data.
export const TOOLS=Object.freeze([
 {id:'group-maker',title:'Group Maker',url:'/tools/group-maker.html',symbol:'◉',description:'Build classroom groups quickly.'},
 {id:'name-picker',title:'Random Name Picker',url:'/tools/name-picker.html',symbol:'✦',description:'Pick a name for your next classroom turn.'},
 {id:'wheel',title:'Spin the Wheel',url:'/tools/wheel.html',symbol:'◎',description:'Spin a customizable classroom wheel.'},
 {id:'timer',title:'Timer & Stopwatch',url:'/tools/timer.html',symbol:'◷',description:'Keep activities and transitions on time.'},
 {id:'buzzer',title:'Quiz Buzzer',url:'/tools/buzzer.html',symbol:'●',description:'Run a classroom quiz with team buzzers.'},
 {id:'graphic-organizers',title:'Graphic Organizers',url:'/tools/graphic-organizers/',symbol:'▦',description:'Use and customize organizers for thinking and writing.'},
 {id:'flashcards',title:'Flashcard Studio',url:'/tools/flashcards.html',symbol:'▣',description:'Build and review classroom flashcards.'},
 {id:'timeline-creator',title:'Timeline Creator',url:'/tools/timeline-creator/',symbol:'↔',description:'Arrange events into a visual timeline.'},
 {id:'graphing-calculator',title:'Graphing Calculator',url:'/tools/graphing-calculator/',symbol:'∿',description:'Explore functions and graphs.'},
 {id:'pdf-workspace',title:'PDF Workspace',url:'/tools/pdf-workspace/',symbol:'▤',description:'Work with classroom PDFs.'},
 {id:'citycanvas',title:'City Canvas',url:'/brain-arcade/citycanvas/',symbol:'▥',description:'Explore city building and planning.'},
 {id:'block-builder',title:'Block Builder',url:'/brain-arcade/block-builder/',symbol:'◇',description:'Create with virtual building blocks.'}
].map(item=>Object.freeze(item)));
