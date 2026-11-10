const fs=require('fs');const {chromium}=require('playwright');
(async()=>{
  const src=fs.readFileSync(process.argv[2]).toString('base64');
  const b=await chromium.launch();const p=await b.newPage();
  const out=await p.evaluate(async (src)=>{
    const img=new Image();img.src='data:image/png;base64,'+src;await img.decode();
    const S=288;const c=document.createElement('canvas');c.width=S;c.height=S;const x=c.getContext('2d');
    x.beginPath();x.arc(S/2,S/2,S/2-1,0,Math.PI*2);x.closePath();x.clip();
    // source: 512x523, circle roughly centred; crop a centred 506 square
    const sw=506, sx=(img.width-sw)/2, sy=(img.height-sw)/2;
    x.imageSmoothingQuality='high';x.drawImage(img,sx,sy,sw,sw,0,0,S,S);
    return c.toDataURL('image/png').split(',')[1];
  },src);
  fs.writeFileSync(process.argv[3],Buffer.from(out,'base64'));await b.close();
})();
