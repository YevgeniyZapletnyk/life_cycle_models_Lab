(function(root) {
  'use strict';
  class CauchySolver {
    constructor(strategy) {this.setStrategy(strategy);}
    setStrategy(strategy) {if(!strategy || typeof strategy.step!=='function') throw new Error('Потрібна стратегія.'); this.strategy=strategy;}
    solve({f,x0,y0,b,n}) {
      if(typeof f!=='function'||![x0,y0,b].every(Number.isFinite)||b<=x0) throw new Error('Потрібні скінченні початкові дані та b > x₀.');
      if(!Number.isInteger(n)||n<1||n>10000) throw new Error('Кількість кроків n має бути цілою від 1 до 10000.');
      const h=(b-x0)/n;
      if(!Number.isFinite(h)||h<=0||x0+h===x0) throw new Error('Крок неможливо представити з доступною точністю.');
      const points=[{x:x0,y:y0}], steps=[]; let y=y0;
      for(let i=0;i<n;i++) {
        const x=x0+i*h, result=this.strategy.step(f,x,y,h);
        if(!Number.isFinite(result.y)||result.stages.some(s=>![s.x,s.y,s.k].every(Number.isFinite))) throw new Error('Чисельне переповнення на кроці '+(i+1)+'. Зменште інтервал або крок.');
        steps.push({x,y,h,...result}); y=result.y; points.push({x:i===n-1?b:x0+(i+1)*h,y});
      }
      return {method:this.strategy.id,n,h,points,steps};
    }
  }
  function errors(solution,exact) {
    const values=solution.points.map(p=>({x:p.x,y:Math.abs(exact(p.x)-p.y)}));
    if(values.some(p=>!Number.isFinite(p.y))) throw new Error('Неможливо обчислити похибку.');
    return {values,max:Math.max(...values.map(p=>p.y)),end:values.at(-1).y};
  }
  const api={CauchySolver,errors}; if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Solver=api;
})(globalThis);
