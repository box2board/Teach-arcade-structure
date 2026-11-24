import {qrImage} from './qr.js';
import {studentJoinUrl} from '../../public/multiplayer/lib/join-link.js';
import {json, originals} from './http.js';
import {teacherAccounts} from './teacher-accounts.js';

export function apiHandler(path) {
  return async function handler(req,res) {
    const send = (value,status=200) => res.status(status).json(value);
    res.setHeader('Cache-Control','private, no-store');
    res.setHeader('Vary','Cookie, Origin');
    const service = process.env.MULTIPLAYER_SERVICE_URL;
    const secret = process.env.MULTIPLAYER_SERVICE_SECRET;
    const accessToken = process.env.MULTIPLAYER_SERVICE_ACCESS_TOKEN;
    try {
      const accounts = teacherAccounts(req,res);
      if (path === '/api/multiplayer' && req.method === 'GET') {
        if (req.query?.action === 'originals') return send(originals);
        if (req.query?.action === 'cabinet') return send(await accounts.list());
      }
      if (req.method !== 'POST') return send({error:'Use POST.'},405);
      const origin = new URL('https://'+req.headers.host).origin;
      if (req.headers.origin && req.headers.origin !== origin) return send({error:'Invalid request origin.'},403);
      const input = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!input || typeof input !== 'object' || Array.isArray(input)) return send({error:'Invalid request.'},400);
      if (JSON.stringify(input).length>500000) return send({error:'Request too large.'},413);

      let bank;
      if (path==='/api/multiplayer' && (
        input.action==='cabinet-set' || (input.action==='create' && typeof input.bank==='string' && input.bank.startsWith('teacher:'))
      )) {
        bank = await accounts.bank(input.action==='create' ? input.bank : input.set);
        if (!bank) return send({error:'This question set is unavailable. Open Teacher Cabinet to sign in or choose another set.'},404);
        if (input.action==='cabinet-set') return send({id:bank.id,title:bank.title,questionCount:bank.questionCount});
      }
      if (!service || !secret) return send({error:'Multiplayer hosting is unavailable.'},503);
      const request = {...input};
      delete request.reviewGame;
      const roomStart = performance.now();
      const response = await fetch(new URL(path,service),{
        method:'POST', signal:AbortSignal.timeout(6500),
        headers:{
          'Content-Type':'application/json',
          'X-Midway-Proxy-Key':secret,
          'X-Midway-Origin':origin,
          ...(accessToken?{'OAI-Sites-Authorization':'Bearer '+accessToken}:{})
        },
        body:JSON.stringify({request, bank})
      });
      const data = await response.json();
      res.setHeader('Server-Timing', 'roomRelay;dur='+Math.round(performance.now()-roomStart));
      if (input.action==='catalog' && response.ok) {
        data.teacherSetsConfigured = accounts.configured;
        data.reviewEnabled = false;
      }
      if (path === '/api/multiplayer' && input.action === 'projection' && response.ok && data.qr) {
        data.qr = qrImage(studentJoinUrl(origin, data.code).href);
      }
      return send(data,response.status);
    } catch (error) {
      if (error instanceof SyntaxError) return send({error:'Invalid request.'},400);
      if (error.status===400) return send({error:error.message},400);
      const response = json({error:'Multiplayer could not respond. Try again.'},502);
      return send(await response.json(),response.status);
    }
  };
}
