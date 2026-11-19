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
  function csv(solutions, exact) {
    const rows=[['i','x',...(exact?['exact']:[]),...solutions.flatMap(s=>[s.method,...(exact?[s.method+'_abs_error']:[])])]];
    solutions[0].points.forEach((p,i)=>rows.push([i,p.x,...(exact?[exact(p.x)]:[]),...solutions.flatMap(s=>[s.points[i].y,...(exact?[Math.abs(exact(p.x)-s.points[i].y)]:[])])]));
    return '\uFEFF'+rows.map(r=>r.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(';')).join('\r\n');
  }
  function lotka({n=1200,T=30,prey=10,predator=5,alpha=1,beta=.1,gamma=1.5,delta=.075}={}) {
    if(!Number.isInteger(n)||n<1||n>10000||![T,prey,predator,alpha,beta,gamma,delta].every(v=>Number.isFinite(v)&&v>0)) throw new Error('Некоректні параметри системи.');
    const h=T/n, f=([u,v])=>[alpha*u-beta*u*v,delta*u*v-gamma*v], add=(a,b,c)=>a.map((v,i)=>v+c*b[i]);
    const invariant=([u,v])=>delta*u-gamma*Math.log(u)+beta*v-alpha*Math.log(v);
    let y=[prey,predator]; const initial=invariant(y),points=[{t:0,x:y[0],y:y[1]}]; let drift=0;
    for(let i=0;i<n;i++) {
      const k1=f(y),k2=f(add(y,k1,h/2)),k3=f(add(y,k2,h/2)),k4=f(add(y,k3,h));
      y=y.map((v,j)=>v+h*(k1[j]+2*k2[j]+2*k3[j]+k4[j])/6);
      if(!y.every(v=>Number.isFinite(v)&&v>0)) throw new Error('Втрачено додатність популяцій. Зменште крок.');
      drift=Math.max(drift,Math.abs(invariant(y)-initial)); points.push({t:(i+1)*h,x:y[0],y:y[1]});
    }
    return {points,drift,relativeDrift:drift/Math.max(1,Math.abs(initial)),initialInvariant:initial,h,n};
  }
  const api={CauchySolver,errors,csv,lotka}; if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Solver=api;
})(globalThis);
