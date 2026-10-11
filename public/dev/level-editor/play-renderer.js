/* Editor-only drawing for engine objects absent from the Pyramid renderer. */
(()=>{const TA=window.TASideScroller,base=TA.render;TA.render=e=>{base(e);const c=e.ctx,x=n=>n-e.camera.x;c.save();
 for(const s of e.slopes){c.fillStyle='#987147';c.beginPath();c.moveTo(x(s.x1),s.y1);c.lineTo(x(s.x2),s.y2);c.lineTo(x(s.x2),480);c.lineTo(x(s.x1),480);c.closePath();c.fill();c.strokeStyle='#e0b878';c.lineWidth=3;c.beginPath();c.moveTo(x(s.x1),s.y1);c.lineTo(x(s.x2),s.y2);c.stroke();}
 for(const m of e.movingPlatforms){c.fillStyle='#a89269';c.fillRect(x(m.x),m.y,m.w,m.h);c.fillStyle='#e6d39d';c.fillRect(x(m.x),m.y,m.w,4);}
 for(const m of e.movers){if(!m.active)continue;c.fillStyle='#596c58';c.beginPath();c.ellipse(x(m.x)+m.w/2,m.y+m.h/2,m.w/2,m.h/2,0,0,Math.PI*2);c.fill();c.fillStyle='#f0d078';c.fillRect(x(m.x)+m.w*.65,m.y+4,4,4);}
 for(const h of e.hazards){if(!h.active)continue;c.fillStyle='#ce895b';c.beginPath();c.moveTo(x(h.x),h.y+h.h);c.lineTo(x(h.x)+h.w/2,h.y);c.lineTo(x(h.x)+h.w,h.y+h.h);c.fill();}
 c.restore();};})();
