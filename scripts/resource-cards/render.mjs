export const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[c]);

const subjectSizes = '(max-width: 600px) calc(100vw - 32px), (max-width: 900px) calc((100vw - 64px) / 2), 350px';
const homeSizes = '(max-width: 480px) calc(100vw - 32px), (max-width: 900px) calc((100vw - 64px) / 2), 350px';
const status = '<strong class="resource-availability">Coming soon</strong>';
const arrow = '<span aria-hidden="true">→</span>';

function image(resource, className, sizes, height = 512, width = 768) {
  if (!resource.image) return '';
  const responsive = resource.imageSrcset
    ? ` srcset="${escapeHTML(resource.imageSrcset)}" sizes="${sizes}"` : '';
  return `<img class="${className}" src="${escapeHTML(resource.image)}"${responsive} width="${width}" height="${height}" alt="" loading="lazy" decoding="async">`;
}

export function renderCard(resource, placement, comingSoon = false) {
  const {view} = placement;
  const title = escapeHTML(resource.title);
  const description = escapeHTML(placement.note ?? resource.description);
  const kicker = escapeHTML(placement.kicker);
  const action = escapeHTML(placement.action);
  function link(content, classes = '', attributes = '') {
    const classAttr = classes ? ` class="${classes}"` : '';
    const target = comingSoon ? 'role="link" aria-disabled="true"' : `href="${escapeHTML(resource.url)}"`;
    return `<a${classAttr} ${target}${attributes}>${content}${comingSoon ? status : ''}</a>`;
  }
  switch (view) {
    case 'cabinet': {
      if (!/^#[a-f0-9]{6}$/i.test(placement.accent)) throw Error('Invalid cabinet accent');
      const art = image(resource, 'home-tile-art', '(max-width: 520px) 246px, 196px', 768);
      return link(`<div class="cabinet-shell"><div class="cabinet-marquee"><h3 class="subject-title">${title}</h3></div><div class="cabinet-screen">${art}</div><div class="cabinet-controls" aria-hidden="true"><span class="cabinet-joystick"></span><span class="cabinet-button"></span><span class="cabinet-button"></span></div></div><div class="home-art-copy"><p class="subject-desc">${description}</p></div>`, 'subject-tile home-art-card featured-cabinet', ` style="--cabinet-accent: ${placement.accent};"`);
    }
    case 'subject':
    case 'feature': {
      const subject = view === 'subject';
      const prefix = subject ? 'subject' : 'home';
      const art = image(subject ? resource : resource.homeArt ?? resource, prefix+'-tile-art', subject ? subjectSizes : '(max-width: 480px) calc(100vw - 32px), 220px');
      return link(`${art}<div class="${prefix}-art-copy"><h3 class="subject-title">${title}</h3><p class="subject-desc">${description}</p></div>`, subject ? 'subject-tile subject-art-card' : 'subject-tile home-art-card home-feature-card');
    }
    case 'subject-guide':
      return `<article class="card"><h3>Original Teach Arcade Resources</h3><p>This subject page now focuses on activities created for Teach Arcade. Visit the subject hub to browse original games, tools, and materials currently available.</p>${link('Browse '+title,'cta')}</article>`;
    case 'more':
      return link(`${image(resource.homeArt ?? resource,'home-tile-art',homeSizes)}<span class="home-art-copy"><strong>${title}</strong><span>${description}</span></span>`, 'more-tile home-art-card');
    case 'brain-feature':
      return link(`${image(resource,'brain-tile-art','(max-width: 480px) calc(100vw - 34px), (max-width: 800px) calc((100vw - 46px) / 2), 254px')}<strong>${title}</strong><span>${description}</span>`, 'featured-card');
    case 'hub':
    case 'course': {
      const prefix = view === 'hub' ? 'hub-tile' : 'ss-card';
      return link(`${image(resource,'subject-tile-art',subjectSizes)}<div class="subject-art-copy"><span class="${prefix}-top"><span class="${prefix}-kicker">${kicker}</span></span><h3>${title}</h3><p>${description}</p><span class="${prefix}-action">${comingSoon ? '' : action+' '+arrow}</span></div>`, 'subject-art-card');
    }
    case 'topic': {
      const heading = placement.heading === 'h3' ? 'h3' : 'h2';
      return link(`${image(resource,'topic-flat-art',subjectSizes)}<div class="topic-art-copy"><${heading}>${title}</${heading}><p>${description}</p></div>`, placement.track ? 'topic-art-link js-tile' : 'topic-art-link', placement.track ? ` data-tile-name="${title}"` : '');
    }
    case 'game': {
      const prefix = placement.theme === 'ss' ? 'ss-game' : 'hub-game';
      return link(`<span class="${prefix}-tag">${kicker}</span><span class="${prefix}-title">${title}</span><span class="${prefix}-action">${comingSoon ? '' : action+' '+arrow}</span>`, prefix+'-card');
    }
    case 'art':
      return link(`${image(resource,'resource-card-banner','(max-width: 600px) calc(100vw - 32px), (max-width: 900px) 50vw, 700px',512,1536)}<h3>${title}</h3><p>${description}</p>${comingSoon ? '' : '<span>'+action+' '+arrow+'</span>'}`, 'card');
    case 'resource':
      return `<article class="topic-resource-card"><span class="resource-type">${kicker}</span><h3>${title}</h3><p>${description}</p>${link(comingSoon ? '' : 'Open '+title,'topic-resource-action')}</article>`;
    case 'related':
      return `<article class="related-topic-card"><h3>${link(title)}</h3><p>${description}</p></article>`;
    case 'link':
      return link(escapeHTML(placement.prefix)+title+escapeHTML(placement.suffix));
    default: throw Error('Unknown resource-card layout: '+view);
  }
}
