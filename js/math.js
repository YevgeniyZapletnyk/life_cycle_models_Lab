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
  const api={interpolation,dividedDifferences};
  if(typeof module!=='undefined')module.exports=api;
  else Object.assign(root.Lab,api);
})(globalThis);
