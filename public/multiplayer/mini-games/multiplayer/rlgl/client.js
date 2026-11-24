import {mountSession} from './session-view.js';
import {template} from './template.js';
export function mount({container,initial,now}){
  const host=container.ownerDocument.createElement('div');
  const root=host.attachShadow({mode:'open'});
  const css=container.ownerDocument.createElement('link');
  css.rel='stylesheet';css.href=new URL('./style.css',import.meta.url).href;
  root.innerHTML=template;root.prepend(css);container.append(host);
  let session;
  try {session=mountSession(root,{initial,now});}
  catch(error){host.remove();throw error;}
  return {...session,destroy(){session.destroy();host.remove();}};
}
