import {QUESTION_SETS} from '../../public/review-lab/catalog.js';
import {lobby} from './lobby.js';
import {api as game} from './room.js';

export const originals = QUESTION_SETS.map(({id,title,subject,category,questionCount}) => ({id,title,subject,category,questionCount}));
export const apiPaths = new Set(['/api/multiplayer','/api/mayhem']);
export const json = (data, status=200) => Response.json(data,{status,headers:{'Cache-Control':'private, no-store'}});

export async function serveSession(request, db, {accounts, reviewEnabled=false} = {}) {
  const url = new URL(request.url);
  if (request.method === 'GET' && url.pathname === '/api/multiplayer') {
    if (url.searchParams.get('action') === 'originals') return json(originals);
    if (url.searchParams.get('action') === 'cabinet') return json(await accounts?.list() ?? {signedIn:false,sets:[]});
  }
  if (request.method !== 'POST') return json({error:'Use POST.'},405);
  const origin = request.headers.get('origin');
  if (origin && origin !== url.origin) return json({error:'Invalid request origin.'},403);
  if (url.pathname === '/api/mayhem') return game(request,db);
  return lobby(request, db, accounts, {reviewEnabled});
}
