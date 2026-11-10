// Prepares a client-supplied picture for a slot: neutralises the off-white backdrop to pure white (objects),
// resizes, and writes <proto>/shared/images/<key>.webp.   Usage: node prepimg.js <src> <key> <object|scene>
const fs=require('fs'),path=require('path');const {chromium}=require('playwright');
(async()=>{
  const [src,key,kind]=process.argv.slice(2);
  const b64=fs.readFileSync(src).toString('base64');const mime=/\.png$/i.test(src)?'image/png':/\.webp$/i.test(src)?'image/webp':'image/jpeg';
  const br=await chromium.launch();const pg=await br.newPage();
  const res=await pg.evaluate(async({b64,mime,kind})=>{
    const img=new Image();img.src='data:'+mime+';base64,'+b64;await img.decode();
    const maxW=kind==='scene'?1600:1000;const s=Math.min(1,maxW/img.width);const W=Math.round(img.width*s),H=Math.round(img.height*s);
    const c=document.createElement('canvas');c.width=W;c.height=H;const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(img,0,0,W,H);
    let corner=null;
    if(kind==='object'){
      const d=x.getImageData(0,0,W,H);const p=d.data;
      // backdrop colour = median of the four corner patches
      const samp=[];const n=Math.round(W*0.04);
      for(const [ox,oy] of [[0,0],[W-n,0],[0,H-n],[W-n,H-n]])for(let yy=0;yy<n;yy+=2)for(let xx=0;xx<n;xx+=2){const i=((oy+yy)*W+(ox+xx))*4;samp.push([p[i],p[i+1],p[i+2]]);}
      const med=ch=>samp.map(v=>v[ch]).sort((a,b)=>a-b)[samp.length>>1];corner=[med(0),med(1),med(2)];
      // white point a little below the backdrop so faint gradients clip to pure white; then feather the outer 5% to white
      const k=corner.map(v=>255/Math.max(200,v-9));
      const f=Math.round(W*0.05);
      for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){const i=(yy*W+xx)*4;
        let r=Math.min(255,p[i]*k[0]),g=Math.min(255,p[i+1]*k[1]),b=Math.min(255,p[i+2]*k[2]);
        const e=Math.min(xx,yy,W-1-xx,H-1-yy);if(e<f){const t=e/f;r=255-(255-r)*t;g=255-(255-g)*t;b=255-(255-b)*t;}
        p[i]=r;p[i+1]=g;p[i+2]=b;}
      x.putImageData(d,0,0);
    }
    return {data:c.toDataURL('image/webp',kind==='scene'?0.82:0.86).split(',')[1],W,H,corner};
  },{b64,mime,kind});
  const out=path.join(__dirname,'images',key+'.webp');fs.writeFileSync(out,Buffer.from(res.data,'base64'));
  console.log(key,res.W+'x'+res.H,'backdrop',JSON.stringify(res.corner),Math.round(fs.statSync(out).size/1024)+'KB');await br.close();
})().catch(e=>{console.error(e);process.exit(1)});
