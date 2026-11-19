/* [AI] Canvas-графік з повторним обчисленням меж на кожному кадрі. */
class Chart{
 constructor(canvas){this.canvas=canvas;}
 draw(series,{log=false,xLabel='i',yLabel='xᵢ'}={}){
  const c=this.canvas,w=Math.max(280,c.clientWidth||600),h=270,dpr=globalThis.devicePixelRatio||1;c.width=w*dpr;c.height=h*dpr;
  const ctx=c.getContext('2d');ctx.scale(dpr,dpr);ctx.clearRect(0,0,w,h);
  const clean=series.map(s=>({...s,points:s.points.filter(p=>p.every(Number.isFinite)).map(([x,y])=>[x,log?Math.log10(Math.max(y,1e-16)):y])}));
  const pts=clean.flatMap(s=>s.points);if(!pts.length)return;
  let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;
  for(const [x,y]of pts){xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);}
  if(xmax===xmin)xmax=xmin+1;if(ymax===ymin){ymin-=1;ymax+=1;}
  const pad=(ymax-ymin)*.08;ymin-=pad;ymax+=pad;
  const left=70,right=w-18,top=18,bottom=h-42,X=x=>left+(x-xmin)/(xmax-xmin)*(right-left),Y=y=>bottom-(y-ymin)/(ymax-ymin)*(bottom-top);
  ctx.font='12px Segoe UI';ctx.lineWidth=1;
  for(let i=0;i<=4;i++){const y=ymin+(ymax-ymin)*i/4,x=xmin+(xmax-xmin)*i/4;ctx.strokeStyle='#e3eaf2';ctx.beginPath();ctx.moveTo(left,Y(y));ctx.lineTo(right,Y(y));ctx.stroke();ctx.fillStyle='#60758a';ctx.textAlign='right';ctx.fillText(log?`10^${y.toFixed(1)}`:y.toPrecision(3),left-8,Y(y)+4);ctx.textAlign='center';ctx.fillText(x.toFixed(xmax<10?1:0),X(x),bottom+19);}
  ctx.fillStyle='#334b64';ctx.textAlign='left';ctx.fillText(yLabel,6,12);ctx.textAlign='right';ctx.fillText(xLabel,right,h-3);
  for(const s of clean){ctx.strokeStyle=s.color;ctx.lineWidth=2;ctx.setLineDash(s.dash?[5,4]:[]);ctx.beginPath();s.points.forEach(([x,y],i)=>i?ctx.lineTo(X(x),Y(y)):ctx.moveTo(X(x),Y(y)));ctx.stroke();ctx.setLineDash([]);}
 }
}
globalThis.Chart=Chart;
