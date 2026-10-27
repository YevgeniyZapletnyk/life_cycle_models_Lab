(function(root){
  'use strict';
  const {validatePoints}=typeof module!=='undefined'?require('./data.js'):root.Lab;
  // Барицентрична форма того самого полінома Лагранжа.
  function interpolation(input) {
    const points=validatePoints(input), n=points.length;
    const center=(points[0][0]+points.at(-1)[0])/2;
    const half=(points.at(-1)[0]-points[0][0])/2;
    const t=points.map(p=>(p[0]-center)/half);
    const weights=t.map((v,i)=>1/t.reduce((p,u,j)=>i===j?p:p*(v-u),1));
    const scale=Math.max(...weights.map(Math.abs));
    for(let i=0;i<n;i++) weights[i]/=scale;
    function evaluate(x){
      const z=(x-center)/half;
      let top=0,bottom=0;
      for(let i=0;i<n;i++){
        if(x===points[i][0]) return points[i][1];
        const q=weights[i]/(z-t[i]); top+=q*points[i][1]; bottom+=q;
      }
      return top/bottom;
    }
    return {points,weights,evaluate};
  }
  function dividedDifferences(input){
    const points=validatePoints(input), n=points.length;
    const table=points.map(p=>[p[1]]);
    for(let order=1;order<n;order++) for(let i=0;i<n-order;i++)
      table[i][order]=(table[i+1][order-1]-table[i][order-1])/(points[i+order][0]-points[i][0]);
    const coefficients=table[0].slice();
    function evaluate(x){let v=coefficients.at(-1);for(let i=n-2;i>=0;i--)v=coefficients[i]+(x-points[i][0])*v;return v;}
    return {table,coefficients,evaluate};
  }
  // Відбиття Хаусхолдера застосовуються одночасно до A та y.
  function householderSolve(matrix, values){
    const a=matrix.map(r=>r.slice()), b=values.slice(), n=a.length, p=a[0].length;
    for(let k=0;k<p;k++){
      const norm=Math.hypot(...a.slice(k).map(r=>r[k]));
      if(norm<1e-13)throw new Error('Чисельно вироджена дизайн-матриця.');
      const alpha=a[k][k]>=0?-norm:norm;
      const v=a.slice(k).map(r=>r[k]);v[0]-=alpha;
      const length=Math.hypot(...v);for(let i=0;i<v.length;i++)v[i]/=length;
      for(let j=k;j<p;j++){
        let dot=0;for(let i=k;i<n;i++)dot+=v[i-k]*a[i][j];
        for(let i=k;i<n;i++)a[i][j]-=2*v[i-k]*dot;
      }
      let dot=0;for(let i=k;i<n;i++)dot+=v[i-k]*b[i];
      for(let i=k;i<n;i++)b[i]-=2*v[i-k]*dot;
    }
    const coefficients=Array(p).fill(0);
    for(let i=p-1;i>=0;i--){
      if(Math.abs(a[i][i])<1e-13)throw new Error('Недостатній чисельний ранг матриці.');
      let v=b[i];for(let j=i+1;j<p;j++)v-=a[i][j]*coefficients[j];
      coefficients[i]=v/a[i][i];
    }
    return coefficients;
  }
  function fitPolynomial(input,degree=2){
    const points=validatePoints(input);
    if(!Number.isInteger(degree)||degree<0||degree>=points.length||degree>4)
      throw new Error('Степінь має бути цілим від 0 до min(4, n−1).');
    const center=(points[0][0]+points.at(-1)[0])/2, half=(points.at(-1)[0]-points[0][0])/2;
    const a=points.map(([x])=>Array.from({length:degree+1},(_,j)=>((x-center)/half)**j));
    const coefficients=householderSolve(a,points.map(p=>p[1]));
    const evaluate=x=>{const t=(x-center)/half;let y=0;for(let j=degree;j>=0;j--)y=y*t+coefficients[j];return y;};
    const predictions=points.map(p=>evaluate(p[0]));
    const residuals=points.map((p,i)=>p[1]-predictions[i]);
    const mean=points.reduce((s,p)=>s+p[1],0)/points.length;
    const rss=residuals.reduce((s,e)=>s+e*e,0),tss=points.reduce((s,p)=>s+(p[1]-mean)**2,0);
    if(![rss,...coefficients,...predictions].every(Number.isFinite))throw new Error('Переповнення обчислень: зменште величину даних.');
    const r2=tss<1e-24?(rss<1e-24?1:0):1-rss/tss;
    return {coefficients,center,half,evaluate,predictions,residuals,rss,rmse:Math.sqrt(rss/points.length),r2,mean,degree};
  }
  function sample(evaluate,min,max,count=1000){
    return Array.from({length:count+1},(_,i)=>{const x=min+(max-min)*i/count;return [x,evaluate(x)];});
  }
  // LOO лише внутрішніх вузлів: крайові пропуски перетворюють задачу на екстраполяцію.
  function leaveOneOut(points,builder){
    let sum=0;
    for(let i=1;i<points.length-1;i++){
      const fit=builder(points.filter((_,j)=>j!==i));
      sum+=(points[i][1]-fit.evaluate(points[i][0]))**2;
    }
    return points.length>2?Math.sqrt(sum/(points.length-2)):null;
  }
  const api={interpolation,dividedDifferences,householderSolve,fitPolynomial,sample,leaveOneOut};
  if(typeof module!=='undefined')module.exports=api;
  else Object.assign(root.Lab,api);
})(globalThis);
