import QRCode from './vendor/QRCode/index.js';
import correction from './vendor/QRCode/QRErrorCorrectLevel.js';

export function qrImage(value) {
  const qr = new QRCode(-1, correction.M);
  qr.addData(value);
  qr.make();
  const count = qr.getModuleCount();
  let modules = '';
  for (let row=0; row<count; row++) {
    for (let column=0; column<count; column++) {
      if (qr.isDark(row,column)) modules+='M'+(column+4)+' '+(row+4)+'h1v1h-1z';
    }
  }
  return 'data:image/svg+xml;base64,'+Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 '+(count+8)+' '+(count+8)+
    '" shape-rendering="crispEdges"><rect width="100%" height="100%" fill="#fff"/><path d="'+modules+'"/></svg>'
  ).toString('base64');
}
