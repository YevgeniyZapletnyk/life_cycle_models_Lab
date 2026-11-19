const {registry}=require('../js/methods'),{CauchySolver,errors,lotka,csv}=require('../js/solver'),P=require('../js/problems');
const fs=require('node:fs'),path=require('node:path');
const dir=path.resolve(__dirname,'../results');fs.mkdirSync(dir,{recursive:true});
const results=[];
for(const m of registry.list()) {let previous=null;for(const n of [5,10,20,40,80]) {
  const solver=new CauchySolver(m),p={...P.variant,n},s=solver.solve(p),e=errors(s,P.variant.exact);
  for(let i=0;i<100;i++)solver.solve(p);
  const batches=[];for(let b=0;b<7;b++){const start=performance.now();for(let i=0;i<1000;i++)solver.solve(p);batches.push((performance.now()-start)/1000);}batches.sort((a,b)=>a-b);
  results.push({method:m.id,name:m.name,n,h:s.h,max:e.max,end:e.end,ratio:previous/e.max||null,order:previous?Math.log2(previous/e.max):null,timeMs:batches[3]});previous=e.max;
}}
const stability=[5,10,20].map(n=>{const s=new CauchySolver(registry.get('euler')).solve({...P.stability,n});return {n,h:s.h,factor:1-20*s.h,last:s.points.at(-1).y,points:s.points};});
const buggy={id:'bug',step(f,x,y,h){const k1=f(x,y),k2=f(x+h/2,y+h*k1),k3=f(x+h/2,y+h*k2),k4=f(x+h,y+h*k3);return {y:y+h*(k1+2*k2+2*k3+k4)/6,stages:[]};}};
let prev;const mutation=[5,10,20,40,80].map(n=>{const e=errors(new CauchySolver(buggy).solve({...P.variant,n}),P.variant.exact).max;const r={n,error:e,ratio:prev?prev/e:null};prev=e;return r;});
const bonus=[150,300,600,1200].map(n=>{const r=lotka({n});return {n,h:r.h,drift:r.drift,relativeDrift:r.relativeDrift};});
const out={variant:3,node:process.version,platform:process.platform,timing:'Медіана 7 серій по 1000 запусків після 100 прогрівальних; мс на один solve, без графіків і похибок.',results,stability,mutation,bonus};
fs.writeFileSync(path.join(dir,'metrics.json'),JSON.stringify(out,null,2));
for(const n of [5,10,20])fs.writeFileSync(path.join(dir,`variant3-n${n}.csv`),csv(registry.list().map(m=>new CauchySolver(m).solve({...P.variant,n})),P.variant.exact));
console.table(results);console.log('Збережено Lab3/results/metrics.json і CSV.');
