/* Контролер: реєстр визначає список методів, математичне ядро не залежить від DOM. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id), {registry}=Methods, {CauchySolver,errors,csv,lotka}=Solver;
  const methods=registry.list(),fmt=v=>v==null?'—':v===0?'0':Math.abs(v)<.001||Math.abs(v)>1e5?v.toExponential(5):Number(v.toPrecision(7)).toString();
  const state={mode:'variant',problem:null,solutions:[],analysis:[],playing:false,last:0,valid:false};
  for(const m of methods) {const o=document.createElement('option');o.value=m.id;o.textContent=m.name;$('method').append(o);}
  $('legend').innerHTML='<span><i style="background:#18243b"></i>Точний</span>'+methods.map(m=>`<span><i style="background:${m.color}"></i>${m.name}</span>`).join('');
  const table=(el,headers,rows)=>el.innerHTML='<thead><tr>'+headers.map(x=>'<th>'+x+'</th>').join('')+'</tr></thead><tbody>'+rows.map(row=>'<tr>'+row.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody>';
  function stop() {state.playing=false;$('play').textContent='▶ Відтворити';}
  function read() {
    const number=id=>Expr.compile($(id).value,[])();
    const p={f:Expr.compile($('expression').value),x0:number('x0'),y0:number('y0'),b:number('end'),n:Number($('n').value)};
    p.exact=$('exact').value.trim()?Expr.compile($('exact').value,['x']):null;
    if(p.exact&&Math.abs(p.exact(p.x0)-p.y0)>1e-8*Math.max(1,Math.abs(p.y0))) throw new Error('Точний розв’язок не відповідає початковій умові. Виправте його або залиште поле порожнім.');
    return p;
  }
  const solve=(p,n)=>methods.map(m=>new CauchySolver(m).solve({...p,n}));
  function exactPoints(p,end=p.b,start=p.x0) {return p.exact?Array.from({length:401},(_,i)=>{const x=start+(end-start)*i/400;return {x,y:p.exact(x)};}):[];}
  function series(solutions,p,endCount=null) {
    const result=[];
    if(p.exact) {const end=endCount===null?p.b:p.x0+(p.b-p.x0)*endCount/solutions[0].n;result.push({points:exactPoints(p,end),color:'#18243b',width:2,dash:true});}
    solutions.forEach(s=>{const points=endCount===null?s.points:s.points.slice(0,Math.floor(endCount)+1);if(endCount!==null&&endCount%1&&Math.ceil(endCount)<s.points.length) {const a=s.points[Math.floor(endCount)],b=s.points[Math.ceil(endCount)],t=endCount%1;points.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}result.push({points,color:registry.get(s.method).color,dots:s.n<=100});});return result;
  }
  function draw() {
    if(!state.valid||state.mode==='lotka') return;
    const p=state.problem,t=Number($('timeline').value),selected=$('method').value;
    const solutions=state.solutions.filter(s=>selected==='all'||s.method===selected),ss=series(solutions,p,t);
    const rk=solutions.find(s=>s.method==='rk4');$('stage-values').textContent='';
    if(rk&&$('stages').checked&&t<rk.n) {
      const step=rk.steps[Math.floor(t)];
      step.stages.forEach((s,i)=>ss.push({color:['#a78bfa','#8b5cf6','#7c3aed','#5b21b6'][i],dots:true,points:[{x:s.x,y:s.y},{x:s.x+step.h*.18,y:s.y+s.k*step.h*.18}]}));
      $('stage-values').textContent=step.stages.map((s,i)=>`k${i+1} = ${fmt(s.k)}`).join('   ·   ');
    } else if(t===p.n) $('stage-values').textContent='Побудову завершено. Перемістіть повзунок, щоб переглянути стадії РК4.';
    Charts.draw($('solution'),ss);
    const es=p.exact?solutions.map(s=>({points:s.error.values.slice(0,Math.floor(t)+1),color:registry.get(s.method).color,dots:s.n<=100})):[];
    Charts.draw($('error'),es,{log:$('log').checked,yLabel:'|Δy|'});
    $('step-label').textContent=`Крок ${Math.floor(t)} / ${p.n} · h = ${fmt((p.b-p.x0)/p.n)}`;
  }
  function renderGallery() {
    $('gallery').replaceChildren();
    for(const row of state.analysis) for(const isError of [false,true]) {
      const card=document.createElement('div');card.className='panel';const h=document.createElement('h3');h.textContent=`n = ${row.n} · ${isError?'абсолютна похибка':'розв’язки'}`;const c=document.createElement('canvas');c.dataset.height='255';c.id=`gallery-${row.n}-${isError?'error':'solution'}`;card.append(h,c);$('gallery').append(card);
      Charts.draw(c,isError?(state.problem.exact?row.solutions.map(s=>({points:s.error.values,color:registry.get(s.method).color,dots:true})):[]):series(row.solutions,state.problem),{yLabel:isError?'|Δy|':'y'});
    }
  }
  function build() {
    stop();
    try {
      const p=read(),solutions=solve(p,p.n),analysis=[5,10,20].map(n=>({n,solutions:solve(p,n)}));
      // Перевіряємо еталон також між вузлами до оновлення інтерфейсу.
      exactPoints(p);if(p.exact) for(const s of [...solutions,...analysis.flatMap(a=>a.solutions)]) s.error=errors(s,p.exact);
      Object.assign(state,{problem:p,solutions,analysis,valid:true});document.body.classList.remove('invalid');$('message').textContent='';$('export').disabled=false;
      $('timeline').max=p.n;$('timeline').value=p.n;
      $('error-note').textContent=p.exact?'Нульові похибки не відображаються в логарифмічній шкалі. Для власної задачі еталон задає користувач; тотожність ОДУ автоматично не доводиться.':'Точний розв’язок не задано: похибки й порядок не обчислюються.';
      const rows=[];
      for(const m of methods) {let previous=null;for(const a of analysis) {const s=a.solutions.find(s=>s.method===m.id),e=s.error,ratio=previous&&e?.max>0?previous/e.max:null;rows.push([m.name,a.n,fmt(s.h),fmt(e?.max),fmt(e?.end),fmt(ratio),fmt(ratio?Math.log2(ratio):null)]);previous=e?.max;}}
      table($('analysis'),['Метод','n','h','max |Δy|','|Δy(b)|','e(h) / e(h/2)','p'],rows);
      const indices=Array.from({length:Math.min(p.n+1,201)},(_,i)=>p.n<=200?i:Math.round(i*p.n/200));
      table($('nodes'),['i','x','Точний',...methods.map(m=>m.name)],indices.map(i=>[i,fmt(solutions[0].points[i].x),p.exact?fmt(p.exact(solutions[0].points[i].x)):'—',...solutions.map(s=>fmt(s.points[i].y))]));
      $('table-note').textContent=p.n>200?'Показано 201 рівномірно вибраний вузол; CSV містить усі '+(p.n+1)+' вузлів.':'Показано всі '+(p.n+1)+' вузлів. CSV також містить абсолютні похибки.';
      document.querySelectorAll('[data-n]').forEach(b=>b.classList.toggle('selected',Number(b.dataset.n)===p.n));
      if(state.mode==='stability') $('task-note').textContent=`Множник Ейлера R = 1 − 20h = ${fmt(1-20/p.n)}. При n=5: −3 (зростання), n=10: −1 (осциляції), n=20: 0 (занулення після першого кроку).`;
      draw();renderGallery();
    } catch(e) {state.valid=false;document.body.classList.add('invalid');$('message').textContent=e.message+' Попередні результати не відповідають поточному введенню.';$('export').disabled=true;}
  }
  function setMode(mode) {
    stop();state.mode=mode;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('active',b.dataset.mode===mode));
    $('scalar').hidden=mode==='lotka';$('lotka').hidden=mode!=='lotka';
    if(mode==='lotka') {
      const r=lotka();$('formula').innerHTML='Хижак–жертва<small>Дві популяції · система ОДУ</small>';
      Charts.draw($('phase'),[{points:r.points,color:'#2563eb'},{points:[{x:20,y:10}],color:'#d24747',dots:true,radius:5}],{xLabel:'Жертви x',yLabel:'Хижаки y'});
      Charts.draw($('populations'),[{points:r.points.map(p=>({x:p.t,y:p.x})),color:'#2563eb'},{points:r.points.map(p=>({x:p.t,y:p.y})),color:'#be7808'}],{xLabel:'t',yLabel:'Синій — жертви; помаранчевий — хижаки'});
      $('lotka-result').textContent=`Контроль точності: max |V(t) − V(0)| = ${fmt(r.drift)}; нормований дрейф = ${fmt(r.relativeDrift)}. h = ${r.h}.`;return;
    }
    const custom=mode==='custom',p=Problems[mode]||Problems.variant;
    ['expression','x0','y0','end','exact'].forEach(id=>$(id).disabled=!custom);
    $('expression').value=p.expression;$('x0').value=p.x0;$('y0').value=p.y0;$('end').value=p.b===Math.PI?'pi':p.b;$('exact').value=p.exactExpression;
    $('formula').innerHTML=mode==='stability'?'y′ = −20y<small>y(0) = 1 · x ∈ [0; 1]</small>':custom?'Власна задача<small>Введіть рівняння та початкову умову</small>':'y′ = y cos x<small>y(0) = 2 · x ∈ [0; π]</small>';
    $('task-note').textContent='n — кількість кроків; таблиця містить n + 1 вузлів.';$('method').value=mode==='stability'?'euler':'all';build();
  }
  function tick(time) {if(!state.playing)return;const dt=Math.min((time-state.last)/1000,.1);state.last=time;$('timeline').value=Math.min(state.problem.n,Number($('timeline').value)+dt*2*Number($('speed').value));draw();if(Number($('timeline').value)>=state.problem.n)stop();else requestAnimationFrame(tick);}
  $('play').onclick=()=>{if(!state.valid)return;if(state.playing){stop();return;}if(Number($('timeline').value)>=state.problem.n)$('timeline').value=0;state.playing=true;state.last=performance.now();$('play').textContent='Ⅱ Пауза';requestAnimationFrame(tick);};
  $('reset').onclick=()=>{stop();$('timeline').value=0;draw();};$('timeline').oninput=()=>{stop();draw();};
  ['method','log','stages'].forEach(id=>$(id).onchange=draw);
  $('parameters').onsubmit=e=>{e.preventDefault();build();};$('n').onchange=build;
  document.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{$('n').value=b.dataset.n;build();});
  document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
  for(const id of ['expression','x0','y0','end','exact','n']) $(id).addEventListener('input',()=>{stop();state.valid=false;$('export').disabled=true;document.body.classList.add('invalid');$('message').textContent='Параметри змінено. Натисніть «Обчислити розв’язок» для оновлення результатів.';});
  $('export').onclick=()=>{if(!state.valid)return;const blob=new Blob([csv(state.solutions,state.problem.exact)],{type:'text/csv;charset=utf-8;'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`ode-${state.mode}-n${state.problem.n}.csv`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  let resizeTimer;window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(state.mode==='lotka')setMode('lotka');else if(state.valid){draw();renderGallery();}},120);});
  window.LabApp={state,build,setMode};setMode('variant');
})();
