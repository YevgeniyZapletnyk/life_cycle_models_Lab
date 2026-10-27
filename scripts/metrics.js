const {DATASETS}=require('../js/data');
const {interpolation,fitPolynomial,sample,leaveOneOut}=require('../js/math');
function benchmark(action,count=200){for(let i=0;i<20;i++)action();const t=performance.now();for(let i=0;i<count;i++)action();return(performance.now()-t)/count;}
function analyze(){
 return Object.entries(DATASETS).map(([key,p])=>{
  const l=interpolation(p),curve=sample(l.evaluate,p[0][0],p.at(-1)[0],10000);
  return {dataset:key,n:p.length,degreeL:p.length-1,minL:Math.min(...curve.map(p=>p[1])),maxL:Math.max(...curve.map(p=>p[1])),looL:leaveOneOut(p,interpolation),timeL:benchmark(()=>{const l=interpolation(p);sample(l.evaluate,p[0][0],p.at(-1)[0],1000);}),models:[1,2,3,4].map(degree=>{const m=fitPolynomial(p,degree);return{degree,coefficients:m.coefficients,center:m.center,half:m.half,rss:m.rss,rmse:m.rmse,r2:m.r2,loo:degree<p.length-1?leaveOneOut(p,q=>fitPolynomial(q,degree)):null,time:benchmark(()=>fitPolynomial(p,degree))};})};
 });
}
if(require.main===module){const rows=analyze();if(process.argv.includes('--json'))console.log(JSON.stringify(rows,null,2));else{console.log('Варіант 3. LOO: тільки внутрішні вузли. min/max: 10001 відлік. Час: середнє 200 повторів.');console.table(rows.map(r=>({набір:r.dataset,n:r.n,'min L':r.minL,'max L':r.maxL,'LOO L':r.looL,'час L, мс':r.timeL})));for(const r of rows){console.log(`Набір ${r.dataset}: ${r.n} точок`);console.table(r.models.map(({coefficients,center,half,...m})=>m));}}}
module.exports={analyze};
