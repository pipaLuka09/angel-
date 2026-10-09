const {chromium}=require('playwright');const path=require('path'),fs=require('fs');
(async()=>{const b=await chromium.launch();
for(const k of process.argv.slice(2)){
 const out=path.resolve(__dirname,'../sales/fr',k);fs.rmSync(out,{recursive:true,force:true});fs.mkdirSync(out,{recursive:true});
 let n=0;
 // 1) the 3D tap clip, as rendered for the reels
 for(let i=1;i<=78;i++){n++;fs.copyFileSync(path.join(__dirname,'frames',k,`f${String(i).padStart(4,'0')}.jpg`),path.join(out,`f${String(n).padStart(4,'0')}.jpg`));}
 // 2) the two phone screens, labels hidden
 const p=await b.newPage({viewport:{width:1080,height:1920}});
 await p.goto('file://'+path.join(__dirname,'composer.html')+'?k='+k);await p.evaluate(()=>window.__ready);
 await p.addStyleTag({content:'.lbl{visibility:hidden!important}'});
 for(let i=0;i<168;i++){await p.evaluate(t=>renderAt(t),7.0+i/24);n++;await p.screenshot({path:path.join(out,`f${String(n).padStart(4,'0')}.jpg`),type:'jpeg',quality:90});}
 await p.close();console.log(k,n);}
await b.close();})();
