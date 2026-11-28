import {parse} from 'parse5';
import {escapeHTML} from './render.mjs';

const badge = '<strong class="resource-availability">Coming soon</strong>';
// Keep the original opening tag so an availability change can be reversed without
// losing page-specific attributes, alternate relative URLs, or accessible names.
export function restoreLibraryLinks(html) {
  return html.replace(/<!-- availability-link ([A-Za-z0-9+/=]+) --><a\b[^>]*>([\s\S]*?)<strong class="resource-availability">Coming soon<\/strong><\/a><!-- \/availability-link -->/g,
    (_, saved, body) => Buffer.from(saved,'base64').toString('utf8')+body+'</a>');
}

export function applyLibraryAvailability(source, pageUrl, unavailable) {
  const html = restoreLibraryLinks(source);
  if (!unavailable.size) return html;
  const edits = [];
  function visit(node) {
    if (node.tagName === 'a') {
      const attr = name => node.attrs.find(x=>x.name===name)?.value;
      const href = attr('href');
      if (href && !href.startsWith('#')) {
        const url = new URL(href, 'https://teacharcade.com'+pageUrl);
        const item = url.origin === 'https://teacharcade.com' && unavailable.get(url.pathname.replace(/index\.html$/,'')+url.search+url.hash);
        const location = node.sourceCodeLocation;
        if (item && location?.endTag) {
          const opening = html.slice(location.startOffset,location.startTag.endOffset);
          const attributes = node.attrs.filter(x=>!['href','role','aria-label','aria-disabled','target','tabindex'].includes(x.name));
          const inactive = '<a'+attributes.map(x=>' '+x.name+'="'+escapeHTML(x.value)+'"').join('')+
            ' role="link" aria-disabled="true" aria-label="'+escapeHTML(item.title)+' · Coming soon">';
          const body = html.slice(location.startTag.endOffset,location.endTag.startOffset);
          edits.push([location.startOffset,location.endOffset,'<!-- availability-link '+Buffer.from(opening).toString('base64')+
            ' -->'+inactive+body+badge+'</a><!-- /availability-link -->']);
        }
      }
    }
    for (const child of node.childNodes ?? []) visit(child);
  }
  visit(parse(html,{sourceCodeLocationInfo:true}));
  let result=html;
  for (const [start,end,text] of edits.reverse()) result=result.slice(0,start)+text+result.slice(end);
  return result;
}
