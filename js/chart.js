(function(root){
  'use strict';
  function computeBounds(series,{zero=false}={}){
    const points=series.flat().filter(p=>p.every(Number.isFinite));
    if(!points.length)return {xmin:-1,xmax:1,ymin:-1,ymax:1};
    let xmin=Infinity,xmax=-Infinity,ymin=zero?0:Infinity,ymax=zero?0:-Infinity;
    for(const [x,y] of points){xmin=Math.min(xmin,x);xmax=Math.max(xmax,x);ymin=Math.min(ymin,y);ymax=Math.max(ymax,y);}
    const dx=xmax-xmin||1,dy=ymax-ymin;
    const padY=dy<1e-12*Math.max(1,Math.abs(ymin),Math.abs(ymax))?Math.max(0.1,Math.abs(ymax)*0.05):dy*0.09;
    return {xmin:xmin-dx*0.05,xmax:xmax+dx*0.05,ymin:ymin-padY,ymax:ymax+padY};
  }
  const fmt=x=>Math.abs(x)<1e-11?'0':(Math.abs(x)>=1e4||Math.abs(x)<0.001?x.toExponential(2):Number(x.toPrecision(5)).toString());
  class Chart{
    constructor(canvas){
      this.canvas=canvas;this.ctx=canvas.getContext('2d');this.state=null;
      this.tooltip=document.createElement('div');this.tooltip.className='tooltip';document.body.append(this.tooltip);
      canvas.addEventListener('pointermove',e=>this.hover(e));
      canvas.addEventListener('pointerleave',()=>this.tooltip.style.display='none');
      new ResizeObserver(()=>{if(this.state)this.draw(this.state);}).observe(canvas);
    }
    draw(state){
      this.state=state;
      const {points=[],lines=[],residuals=[],active=-1,zero=false,title=''}=state;
      const rect=this.canvas.getBoundingClientRect(),w=rect.width,h=rect.height,dpr=window.devicePixelRatio||1;
      this.canvas.width=Math.round(w*dpr);this.canvas.height=Math.round(h*dpr);
      const ctx=this.ctx;ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
      ctx.fillStyle='#fff';ctx.fillRect(0,0,w,h);
      const series=[points,...lines.map(l=>l.points),...residuals.map(r=>[[r.x,r.from],[r.x,r.to]])];
      const b=computeBounds(series,{zero});this.bounds=b;
      const left=65,right=w-22,top=30,bottom=h-40;
      const X=x=>left+(x-b.xmin)/(b.xmax-b.xmin)*(right-left);
      const Y=y=>bottom-(y-b.ymin)/(b.ymax-b.ymin)*(bottom-top);
      this.X=X;this.Y=Y;this.area={left,right,top,bottom};
      ctx.font='11px Segoe UI';ctx.lineWidth=1;
      for(let i=0;i<=5;i++){
        const x=b.xmin+(b.xmax-b.xmin)*i/5,y=b.ymin+(b.ymax-b.ymin)*i/5;
        ctx.strokeStyle='#e4eaf1';ctx.beginPath();ctx.moveTo(X(x),top);ctx.lineTo(X(x),bottom);ctx.moveTo(left,Y(y));ctx.lineTo(right,Y(y));ctx.stroke();
        ctx.fillStyle='#536176';ctx.textAlign='center';ctx.fillText(fmt(x),X(x),bottom+18);
        ctx.textAlign='right';ctx.fillText(fmt(y),left-8,Y(y)+4);
      }
      ctx.strokeStyle='#8493a6';ctx.strokeRect(left,top,right-left,bottom-top);
      if(b.ymin<=0&&b.ymax>=0){ctx.strokeStyle='#7c8999';ctx.beginPath();ctx.moveTo(left,Y(0));ctx.lineTo(right,Y(0));ctx.stroke();}
      ctx.textAlign='left';ctx.fillStyle='#26334b';ctx.fillText(title,left,17);ctx.fillText(zero?'r':'y',14,18);ctx.fillText('x',right+5,bottom+18);
      for(const r of residuals){ctx.strokeStyle='#df5369';ctx.lineWidth=1.4;ctx.beginPath();ctx.moveTo(X(r.x),Y(r.from));ctx.lineTo(X(r.x),Y(r.to));ctx.stroke();}
      for(const line of lines){
        ctx.strokeStyle=line.color;ctx.lineWidth=2.2;ctx.beginPath();let first=true;
        for(const [x,y] of line.points){if(!Number.isFinite(y)){first=true;continue;}if(first){ctx.moveTo(X(x),Y(y));first=false;}else ctx.lineTo(X(x),Y(y));}ctx.stroke();
      }
      points.forEach(([x,y],i)=>{ctx.beginPath();ctx.arc(X(x),Y(y),i===active?6:3.7,0,Math.PI*2);ctx.fillStyle=i===active?'#16a085':(state.futureFrom!==undefined&&i>=state.futureFrom?'#b7c2cf':'#202b40');ctx.fill();});
    }
    hover(event){
      if(!this.state)return;
      const box=this.canvas.getBoundingClientRect(),px=event.clientX-box.left,py=event.clientY-box.top;
      const {left,right,top,bottom}=this.area;
      if(px<left||px>right||py<top||py>bottom){this.tooltip.style.display='none';return;}
      const x=this.bounds.xmin+(px-left)/(right-left)*(this.bounds.xmax-this.bounds.xmin);
      let message=`x = ${fmt(x)}`;
      const nearest=(this.state.points||[]).find(p=>Math.hypot(this.X(p[0])-px,this.Y(p[1])-py)<12);
      if(nearest){message=`Вузол (${fmt(nearest[0])}; ${fmt(nearest[1])})`;if(this.state.fit)message+=` · ŷ = ${fmt(this.state.fit.evaluate(nearest[0]))} · r = ${fmt(nearest[1]-this.state.fit.evaluate(nearest[0]))}`;}
      else for(const line of this.state.lines||[]){const p=line.points.reduce((a,b)=>Math.abs(a[0]-x)<Math.abs(b[0]-x)?a:b);message+=` · ${line.name}: ${fmt(p[1])}`;}
      this.tooltip.textContent=message;this.tooltip.style.display='block';
      this.tooltip.style.left=Math.min(event.clientX+12,window.innerWidth-this.tooltip.offsetWidth-12)+'px';this.tooltip.style.top=(event.clientY+16)+'px';
    }
  }
  const api={computeBounds,fmt,Chart};
  if(typeof module!=='undefined')module.exports=api;else Object.assign(root.Lab,api);
})(globalThis);
