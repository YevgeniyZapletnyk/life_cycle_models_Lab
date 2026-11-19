/* Парсер математичних виразів без eval і Function. */
(function(root) {
  'use strict';
  const funcs={sin:Math.sin,cos:Math.cos,tan:Math.tan,exp:Math.exp,log:Math.log,ln:Math.log,sqrt:Math.sqrt,abs:Math.abs,atan:Math.atan};
  function compile(source, variables=['x','y']) {
    if(typeof source!=='string' || !source.trim() || source.length>500) throw new Error('Вираз має містити від 1 до 500 символів.');
    const tokens=[]; let pos=0;
    while(pos<source.length) {
      const rest=source.slice(pos), m=/^(?:\s+|(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?|[a-zA-Z]+|[+\-*/^()])/.exec(rest);
      if(!m) throw new Error('Недопустимий символ у позиції '+(pos+1)+'.');
      pos+=m[0].length; if(m[0].trim()) tokens.push(m[0]);
    }
    let i=0;
    const take=t=>tokens[i]===t?(i++,true):false;
    function primary() {
      const t=tokens[i++];
      if(t==='(') {const a=add(); if(!take(')')) throw new Error('Очікується закривальна дужка.'); return a;}
      if(t && /^(\d|\.)/.test(t)) {const v=Number(t); if(!Number.isFinite(v)) throw new Error('Число завелике.'); return ()=>v;}
      if(t==='pi') return ()=>Math.PI;
      if(t==='e') return ()=>Math.E;
      if(variables.includes(t)) return scope=>scope[t];
      if(Object.hasOwn(funcs,t)) {if(!take('(')) throw new Error('Після функції потрібні дужки.'); const a=add(); if(!take(')')) throw new Error('Очікується закривальна дужка.'); return scope=>funcs[t](a(scope));}
      throw new Error('Невідомий ідентифікатор або пропущений операнд: '+(t??'кінець виразу'));
    }
    function power() {const a=primary(); if(take('^')) {const b=unary(); return s=>a(s)**b(s);} return a;}
    function unary() {if(take('+')) return unary(); if(take('-')) {const a=unary(); return s=>-a(s);} return power();}
    function mul() {let a=unary(); while(tokens[i]==='*'||tokens[i]==='/') {const op=tokens[i++], left=a,b=unary(); a=op==='*'?s=>left(s)*b(s):s=>left(s)/b(s);} return a;}
    function add() {let a=mul(); while(tokens[i]==='+'||tokens[i]==='-') {const op=tokens[i++],left=a,b=mul(); a=op==='+'?s=>left(s)+b(s):s=>left(s)-b(s);} return a;}
    const evaluate=add(); if(i!==tokens.length) throw new Error('Зайві символи. Множення записуйте через *.');
    return (x=0,y=0)=>{const v=evaluate({x,y}); if(!Number.isFinite(v)) throw new Error('Вираз дав нескінченність або невизначене значення.'); return v;};
  }
  const api={compile}; if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Expr=api;
})(globalThis);
