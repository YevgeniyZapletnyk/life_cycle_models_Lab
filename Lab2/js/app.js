/* [AI] Контролер локального застосунку. */
(()=>{'use strict';const $=id=>document.getElementById(id),M=SLAR,methods=['gauss','jacobi','seidel'],names={gauss:'Гаусс',jacobi:'Якобі',seidel:'Зейдель'},colors={gauss:'#2563eb',jacobi:'#d47716',seidel:'#13856c'};let datasets=[],playing=false,last=0;
 const fmt=v=>v===null?'не застос.':Number.isFinite(v)?(Math.abs(v)<.001&&v!==0?v.toExponential(3):v.toPrecision(6)):'переповнення';
 const visible=m=>document.querySelector(`[data-method="${m}"]`).checked;
 function options(){const eps=Number($('eps').value),maxIter=Number($('limit').value);if(!Number.isFinite(eps)||eps<=0||!Number.isInteger(maxIter)||maxIter<20000||maxIter>100000)throw Error('ε > 0; ліміт - ціле число від 20000 до 100000');return {eps,maxIter};}
 function compute(data){const system=new M.LinearSystem(data.A,data.b,data.exact);const results={};for(const m of methods){try{results[m]=system.solve(m,options());}catch(e){results[m]={status:e.message,x:[],error:null,residual:NaN,ms:0,iterations:null,history:[],steps:[]};}}return {...data,n:data.A.length,results};}
 function run(custom){try{options();datasets=(custom?[custom]:[5,10,20].map(n=>M.generate(n,Number($('d').value)))).map(compute);$('message').textContent=datasets.map(s=>{const dom=M.dominance(s.A);return `n=${s.n}: q=${fmt(dom.q)}; ${dom.strict?'строга діагональна перевага':'немає строгої переваги; збіжність не гарантована'}`;}).join(' · ');render();reset();}catch(e){$('message').textContent=e.message;}}
 function render(){
  $('charts').replaceChildren();
  for(const data of datasets){for(const type of ['convergence','solution']){const card=document.createElement('section');card.className='chart-card';const h=document.createElement('h2');h.textContent=`n = ${data.n} · ${type==='convergence'?'Збіжність ітерацій':'Компоненти розв’язку'}`;card.append(h);const canvas=document.createElement('canvas');card.append(canvas);$('charts').append(card);const series=[];
   if(type==='solution'&&data.exact)series.push({color:'#172335',dash:true,points:data.exact.map((v,i)=>[i+1,v])});
   for(const m of methods.filter(visible)){const r=data.results[m];if(type==='convergence'&&m!=='gauss')series.push({color:colors[m],points:r.history.map(t=>[t.k,t.residual])});if(type==='solution')series.push({color:colors[m],points:r.x.map((v,i)=>[i+1,v])});}
   new Chart(canvas).draw(series,type==='convergence'?{log:true,xLabel:'Ітерація k',yLabel:'‖Ax − b‖₂'}:{});
  }}
  const table=$('results');table.innerHTML='<tr><th>n</th><th>Метод</th><th>Ітерації</th><th>‖Ax − b‖₂</th><th>‖x − x*‖∞</th><th>Час, мс</th><th>Стан</th></tr>';
  for(const s of datasets)for(const m of methods.filter(visible)){const r=s.results[m],row=table.insertRow();[s.n,names[m],r.iterations??'прямий',fmt(r.residual),s.exact?fmt(r.error):'x* невідомий',fmt(r.ms),({converged:'розв’язано',limit:'ліміт ітерацій',diverged:'розбіжність'})[r.status]||r.status].forEach(v=>row.insertCell().textContent=v);}
 }
 function selected(){return datasets.find(s=>s.n===Number($('n').value))||datasets[0];}
 function reset(){playing=false;$('play').textContent='Відтворити';$('frame').value=0;frame();}
 function frame(){const data=selected();if(!data)return;const mode=$('animation').value,r=data.results[mode],frames=mode==='gauss'?r.steps:r.history;const end=Math.max(0,frames.length-1);$('frame').max=end;const index=Math.min(Number($('frame').value),end),f=frames[index];$('matrix').hidden=mode!=='gauss';$('iteration').hidden=mode==='gauss';$('frame-label').textContent=f?`${index} / ${end} · ${f.label||`k=${f.k}, нев’язка ${fmt(f.residual)}`}`:r.status;
  if(!f){$('matrix').replaceChildren();return;}
  if(mode==='gauss'){const table=document.createElement('table');f.M.forEach((row,i)=>{const tr=table.insertRow();if(i===f.p)tr.className='active';row.forEach((v,j)=>{const td=tr.insertCell();td.textContent=fmt(v);if(i===f.p&&j===f.k)td.className='pivot';});});$('matrix').replaceChildren(table);}
  else{const series=[{color:colors[mode],points:f.x.map((v,i)=>[i+1,v])}];if(data.exact)series.unshift({color:'#172335',dash:true,points:data.exact.map((v,i)=>[i+1,v])});new Chart($('iteration')).draw(series);}
 }
 $('run').onclick=()=>run();$('d').onchange=()=>run();$('n').onchange=reset;$('animation').onchange=reset;$('frame').oninput=()=>{playing=false;$('play').textContent='Відтворити';frame();};$('reset').onclick=reset;
 $('step').onclick=()=>{playing=false;$('play').textContent='Відтворити';$('frame').value=Math.min(Number($('frame').value)+1,Number($('frame').max));frame();};
 $('play').onclick=()=>{if(Number($('frame').value)>=Number($('frame').max))$('frame').value=0;playing=!playing;$('play').textContent=playing?'Пауза':'Відтворити';};
 function tick(t){if(playing&&t-last>140){last=t;$('frame').value=Number($('frame').value)+1;frame();if(Number($('frame').value)>=Number($('frame').max)){playing=false;$('play').textContent='Відтворити';}}requestAnimationFrame(tick);}requestAnimationFrame(tick);
 document.querySelectorAll('[data-method]').forEach(e=>e.onchange=render);window.addEventListener('resize',()=>{render();frame();});
 $('solve-custom').onclick=()=>{try{run(M.parse($('custom').value));}catch(e){$('message').textContent=e.message;}};$('variant').onclick=()=>run();
 $('file').onchange=async()=>{try{const file=$('file').files[0];if(!file)return;if(file.size>1e6)throw Error('Файл завеликий: максимум 1 МБ');$('custom').value=await file.text();run(M.parse($('custom').value));}catch(e){$('message').textContent=e.message;}};
 $('experiment').onclick=()=>{const A=[[0,2],[1,3]],b=[4,7];let failure;try{M.gauss(A,b,{pivot:false});}catch(e){failure=e.message;}$('experiment-result').textContent=`A = [[0, 2], [1, 3]], b = [4, 7], x* = [1, 2]\nБез вибору: ${failure}\nЗ вибором: x = [${M.gauss(A,b).x}], нев’язка = 0`;};
 $('export').onclick=()=>{const blob=new Blob([JSON.stringify(datasets,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='slar-results.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};run();
})();
