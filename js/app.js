(function(){
 'use strict';
 const {DATASETS,parsePoints,interpolation,dividedDifferences,fitPolynomial,sample,Chart,fmt}=Lab;
 const $=id=>document.getElementById(id), blue='#2463d8',orange='#cb741c';
 const chart=new Chart($('mainChart')), residualChart=new Chart($('residualChart'));
 let points,key='5',model,newton,curves,progress=1,playing=false,lastTime=null,custom=false;
 const gallery=[];
 for(const k of [5,10,20])for(const method of ['lagrange','lsq']){
   const article=document.createElement('article');article.innerHTML=`<h3>${k===10?'10 (8)':k} точок · ${method==='lagrange'?'Лагранж':'МНК'}</h3><canvas id="gallery-${k}-${method}"></canvas>`;
   $('gallery').append(article);gallery.push({key:k,method,chart:new Chart(article.querySelector('canvas'))});
 }
 const ease=t=>t*t*(3-2*t);
 function table(headers,rows){return '<table><thead><tr>'+headers.map(h=>`<th>${h}</th>`).join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(v=>`<td>${v}</td>`).join('')+'</tr>').join('')+'</tbody></table>';}
 function stop(){playing=false;$('play').textContent='▶ Відтворити';lastTime=null;}
 function build(nextPoints){
   const degree=Math.min(Number($('degree').value),nextPoints.length-1);
   const nextModel=fitPolynomial(nextPoints,degree),nextNewton=dividedDifferences(nextPoints);
   const min=nextPoints[0][0],max=nextPoints.at(-1)[0],extension=$('extrap').checked?(max-min)*.15:0;
   const nextCurves=[sample(()=>nextPoints[0][1],min-extension,max+extension)];
   for(let k=2;k<=nextPoints.length;k++)nextCurves.push(sample(interpolation(nextPoints.slice(0,k)).evaluate,min-extension,max+extension));
   if(nextCurves.some(c=>c.some(p=>!p.every(Number.isFinite))))throw new Error('Інтерполяція чисельно нестійка для цих даних.');
   points=nextPoints;model=nextModel;newton=nextNewton;curves=nextCurves;
   $('degree').value=String(degree);[...$('degree').options].forEach(o=>o.disabled=Number(o.value)>=points.length);
   stop();progress=1;
   $('chartTitle').textContent=custom?`Власні дані · ${points.length} точок`:`Набір ${key==='10'?'10 (фактично 8)':key} точок`;
   $('formula').textContent=`P${degree}(t) = `+model.coefficients.map((a,j)=>`${j&&a>=0?'+ ':''}${fmt(a)}${j?'·t'+(j>1?'^'+j:''):''}`).join(' ');
   $('normalization').textContent=`t = (x − ${fmt(model.center)}) / ${fmt(model.half)}. Коефіцієнти наведені в нормалізованій змінній t.`;
   $('metrics').innerHTML=[['RSS',model.rss],['RMSE',model.rmse],['R²',model.r2]].map(([k,v])=>`<div><span>${k}</span><strong>${fmt(v)}</strong></div>`).join('');
   $('interpolationInfo').textContent=`${points.length} вузлів · степінь не вище ${points.length-1} · L(xᵢ) = yᵢ`;
   $('newton').textContent='Коефіцієнти Ньютона: '+newton.coefficients.map(fmt).join('; ');
   $('pointsTable').innerHTML=table(['i','xᵢ','yᵢ','L(xᵢ)','ŷᵢ','rᵢ'],points.map((p,i)=>[i,...p.map(fmt),fmt(p[1]),fmt(model.predictions[i]),fmt(model.residuals[i])]));
   $('differenceTable').innerHTML=table(['xᵢ',...points.map((_,i)=>'Δ'+i)],points.map((p,i)=>[fmt(p[0]),...points.map((_,j)=>newton.table[i][j]===undefined?'—':fmt(newton.table[i][j]))]));
   $('extrapNote').hidden=!$('extrap').checked;
   $('error').textContent='';draw();updateGallery();
 }
 function draw(){
   const mode=$('mode').value,showL=mode!=='lsq',showM=mode!=='lagrange';
   const step=progress*(points.length-1),previous=Math.min(Math.floor(step),points.length-1),next=Math.min(previous+1,points.length-1),mix=ease(step-previous);
   const lcurve=curves[previous].map(([x,y],i)=>[x,y+(curves[next][i][1]-y)*mix]);
   const growth=ease(Math.min(1,progress/.72)),reveal=ease(Math.max(0,(progress-.55)/.45));
   const mcurve=curves[0].map(([x])=>[x,model.mean+(model.evaluate(x)-model.mean)*growth]);
   const residuals=showM?points.map(([x,y],i)=>({x,from:y,to:y-model.residuals[i]*reveal})):[];
   const lines=[];if(showL)lines.push({points:lcurve,color:blue,name:'L'});if(showM)lines.push({points:mcurve,color:orange,name:'МНК'});
   chart.draw({points,lines,residuals,active:showL&&progress<1?next:-1,futureFrom:showL&&progress<1?next+1:points.length,fit:showM?model:null,title:$('extrap').checked?'X / Y · інтервал розширено на 15 %':'X / Y · інтервал вихідних даних'});
   $('residualPanel').hidden=!showM;
   if(showM)residualChart.draw({points:points.map((p,i)=>[p[0],model.residuals[i]*reveal]),residuals:points.map((p,i)=>({x:p[0],from:0,to:model.residuals[i]*reveal})),zero:true,title:'Нульова лінія: r = 0'});
   $('progress').value=Math.round(progress*1000);$('progressText').value=Math.round(progress*100)+' %';
   $('frameNote').textContent=progress===1?'Побудову завершено. Межі осей охоплюють усі відображені відліки кривих і точки.':`Кадр ${Math.round(progress*100)} % · ${showL?'вузол '+(next+1)+' із '+points.length+' · ':''}автомасштаб X та Y оновлюється на кожному кадрі.`;
 }
 function updateGallery(){
   const degree=Number($('degree').value),rows=[];
   for(const k of [5,10,20]){
     const p=DATASETS[k],l=interpolation(p),m=fitPolynomial(p,degree),lc=sample(l.evaluate,p[0][0],p.at(-1)[0]);
     rows.push([k===10?'10 (8)':k,p.length,p.length-1,fmt(Math.min(...lc.map(p=>p[1])))+' … '+fmt(Math.max(...lc.map(p=>p[1]))),fmt(m.rss),fmt(m.rmse),fmt(m.r2)]);
     for(const g of gallery.filter(g=>g.key===k)){
       const isL=g.method==='lagrange';g.chart.draw({points:p,lines:[{points:isL?lc:sample(m.evaluate,p[0][0],p.at(-1)[0]),color:isL?blue:orange,name:isL?'L':'МНК'}],fit:isL?null:m,title:isL?`Степінь ≤ ${p.length-1}`:`Степінь m = ${degree}`});
     }
   }
   $('comparison').innerHTML=table(['Набір','n','Степінь L','min … max L','RSS МНК','RMSE МНК','R² МНК'],rows);
 }
 function animate(time){
   if(playing){if(lastTime!==null)progress=Math.min(1,progress+(time-lastTime)*Number($('speed').value)/(points.length*650));lastTime=time;draw();if(progress>=1)stop();}
   requestAnimationFrame(animate);
 }
 function play(){if(playing){stop();return;}if(progress>=1)progress=0;playing=true;lastTime=null;$('play').textContent='⏸ Пауза';draw();}
 function select(){custom=false;key=$('dataset').value;points=DATASETS[key];$('input').value=points.map(p=>p.join(' ')).join('\n');build(points);}
 $('dataset').onchange=select;$('mode').onchange=draw;
 for(const id of ['degree','extrap'])$(id).onchange=()=>{try{build(points);}catch(e){$('error').textContent=e.message;}};
 $('play').onclick=play;$('restart').onclick=()=>{stop();progress=0;play();};$('finish').onclick=()=>{stop();progress=1;draw();};
 $('progress').oninput=()=>{stop();progress=Number($('progress').value)/1000;draw();};
 $('apply').onclick=()=>{try{const p=parsePoints($('input').value);build(p);custom=true;$('chartTitle').textContent=`Власні дані · ${p.length} точок`;}catch(e){$('error').textContent=e.message;}};
 $('reset').onclick=select;
 document.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT','BUTTON','SUMMARY'].includes(e.target.tagName))return;if(e.code==='Space'){e.preventDefault();play();}if(['1','2','3'].includes(e.key)){$('dataset').value=['5','10','20'][Number(e.key)-1];select();}});
 const params=new URLSearchParams(location.search);if(['5','10','20'].includes(params.get('set')))$('dataset').value=params.get('set');
 if(['all','lagrange','lsq'].includes(params.get('mode')))$('mode').value=params.get('mode');
 if(['1','2','3','4'].includes(params.get('m')))$('degree').value=params.get('m');
 $('extrap').checked=params.get('extrap')==='1';select();
 if(params.has('t')){const t=Number(params.get('t'));progress=Number.isFinite(t)?Math.max(0,Math.min(1,t)):1;draw();}
 requestAnimationFrame(animate);
 window.labState=()=>({key,n:points.length,progress,playing,degree:model.degree,rss:model.rss,bounds:chart.bounds});
})();
