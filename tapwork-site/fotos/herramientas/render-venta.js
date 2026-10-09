const {chromium}=require('playwright');const path=require('path'),fs=require('fs'),{execFileSync}=require('child_process');
const FF=path.resolve(__dirname,'../bin/ffmpeg');
(async()=>{const b=await chromium.launch();
for(const k of process.argv.slice(2)){
 const dir=path.join(__dirname,'rf',k);fs.rmSync(dir,{recursive:true,force:true});fs.mkdirSync(dir,{recursive:true});
 const p=await b.newPage({viewport:{width:1080,height:1350}});
 await p.goto('http://localhost:8818/composer.html?k='+k);await p.evaluate(()=>window.__ready);
 const n=Math.round(await p.evaluate(()=>window.__total)*24);
 for(let i=0;i<n;i++){await p.evaluate(t=>renderAt(t),i/24);await p.screenshot({path:path.join(dir,`f${String(i+1).padStart(4,'0')}.jpg`),type:'jpeg',quality:92});}
 await p.close();
 execFileSync(FF,['-y','-loglevel','error','-framerate','24','-i',path.join(dir,'f%04d.jpg'),'-c:v','libx264','-pix_fmt','yuv420p','-crf','19','-preset','slow','-movflags','+faststart',path.join(__dirname,'out',k+'-1080.mp4')]);
 execFileSync(FF,['-y','-loglevel','error','-i',path.join(__dirname,'out',k+'-1080.mp4'),'-vf','scale=720:900','-c:v','libx264','-pix_fmt','yuv420p','-crf','24','-preset','slow','-movflags','+faststart',path.join(__dirname,'out',k+'-web.mp4')]);
 console.log('done',k,n);}
await b.close();})();
