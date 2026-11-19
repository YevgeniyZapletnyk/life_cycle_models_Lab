(function(root) {
  'use strict';
  function bounds(series,log=false) {
    const pts=series.flatMap(s=>s.points).filter(p=>Number.isFinite(p.x)&&Number.isFinite(p.y)&&(!log||p.y>0));
    if(!pts.length) return {xmin:0,xmax:1,ymin:log?-16:0,ymax:log?0:1};
    let xmin=Infinity,xmax=-Infinity,ymin=Infinity,ymax=-Infinity;
    for(const p of pts) {xmin=Math.min(xmin,p.x);xmax=Math.max(xmax,p.x);const y=log?Math.log10(p.y):p.y; ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);}
    let dx=xmax-xmin,dy=ymax-ymin;
    if(dx===0) dx=Math.max(1,Math.abs(xmin)*.1);
    if(dy===0) dy=Math.max(log?1:1e-8,Math.abs(ymin)*.1,log?1:.1);
    return {xmin:xmin-dx*.04,xmax:xmax+dx*.04,ymin:ymin-dy*.1,ymax:ymax+dy*.1};
  }
  function draw(canvas,series,{log=false,xLabel='x',yLabel='y',title=''}={}) {
    const rect=canvas.getBoundingClientRect(),width=Math.max(280,rect.width),height=Number(canvas.dataset.height)||300,dpr=window.devicePixelRatio||1;
    canvas.width=Math.round(width*dpr); canvas.height=height*dpr; canvas.style.height=height+'px';
    const ctx=canvas.getContext('2d'); ctx.scale(dpr,dpr); ctx.fillStyle='#fff';ctx.fillRect(0,0,width,height);
    const b=bounds(series,log),left=72,right=22,top=27,bottom=44,w=width-left-right,h=height-top-bottom;
    const px=x=>left+(x-b.xmin)/(b.xmax-b.xmin)*w,py=y=>top+h-((log?Math.log10(y):y)-b.ymin)/(b.ymax-b.ymin)*h;
    ctx.font='11px Segoe UI';ctx.lineWidth=1;
    const fmt=v=>Math.abs(v)>=1e4||(Math.abs(v)>0&&Math.abs(v)<.001)?v.toExponential(1):Number(v.toPrecision(4)).toString();
    for(let i=0;i<=5;i++) {const x=left+w*i/5,y=top+h*i/5;ctx.strokeStyle='#e9edf3';ctx.beginPath();ctx.moveTo(x,top);ctx.lineTo(x,top+h);ctx.moveTo(left,y);ctx.lineTo(left+w,y);ctx.stroke();ctx.fillStyle='#64748b';ctx.textAlign='center';ctx.fillText(fmt(b.xmin+(b.xmax-b.xmin)*i/5),x,top+h+19);ctx.textAlign='right';const yv=b.ymax-(b.ymax-b.ymin)*i/5;ctx.fillText(log?'10^'+yv.toFixed(1):fmt(yv),left-9,y+4);}
    ctx.fillStyle='#334155';ctx.textAlign='left';ctx.fillText(title||yLabel,left,16);ctx.textAlign='right';ctx.fillText(xLabel,width-14,height-7);
    for(const s of series) {ctx.strokeStyle=s.color;ctx.fillStyle=s.color;ctx.lineWidth=s.width||2;ctx.setLineDash(s.dash?[5,4]:[]);ctx.beginPath();let pen=false;
      for(const p of s.points) {if(!Number.isFinite(p.y)||(log&&p.y<=0)) {pen=false;continue;} if(!pen) {ctx.moveTo(px(p.x),py(p.y));pen=true;} else ctx.lineTo(px(p.x),py(p.y));}ctx.stroke();ctx.setLineDash([]);
      if(s.dots) for(const p of s.points) {if(log&&p.y<=0)continue;ctx.beginPath();ctx.arc(px(p.x),py(p.y),s.radius||3,0,2*Math.PI);ctx.fill();}
    }
    canvas._bounds=b;
  }
  const api={bounds,draw}; if(typeof module!=='undefined'&&module.exports) module.exports=api; else root.Charts=api;
})(globalThis);
