const fs=require('node:fs'),path=require('node:path'),M=require('../js/math.js');
const rows=[],systems=[];
for(const n of [5,10,20])for(const d of [1,.1]){
 const data=M.generate(n,d),s=new M.LinearSystem(data.A,data.b,data.exact);systems.push(data);
 for(const method of ['gauss','jacobi','seidel']){
  const r=s.solve(method);for(let i=0;i<20;i++)s.solve(method,{trace:false});
  const start=performance.now();for(let i=0;i<200;i++)s.solve(method,{trace:false});const ms=(performance.now()-start)/200;
  rows.push({n,d,method,q:M.dominance(data.A).q,iterations:r.iterations,residual:r.residual,error:r.error,status:r.status,ms,x:r.x,history:r.history});
 }
}
const experiments=[0,1e-17].map(a=>{const A=[[a,2],[1,3]],exact=[1,2],b=M.multiply(A,exact);let failure;try{M.gauss(A,b,{pivot:false});}catch(e){failure=e.message;}return {A,b,exact,withoutPivot:failure,withPivot:M.gauss(A,b)};});
const out={node:process.version,platform:process.platform,benchmark:'20 warmup, 200 measured repetitions, no trace; mean ms',rows,systems,experiments};
fs.mkdirSync(path.join(__dirname,'../results'),{recursive:true});fs.writeFileSync(path.join(__dirname,'../results/metrics.json'),JSON.stringify(out,null,2));console.table(rows.map(({n,d,method,iterations,residual,error,ms})=>({n,d,method,iterations,residual,error,ms})));
