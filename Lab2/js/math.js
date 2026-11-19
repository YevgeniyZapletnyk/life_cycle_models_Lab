/* [AI] Чисельне ядро. Працює у браузері та Node.js без залежностей. */
(function(root){
 'use strict';
 const normInf = x => Math.max(0,...x.map(Math.abs));
 const multiply = (A,x) => A.map(row=>row.reduce((s,a,j)=>s+a*x[j],0));
 const residual = (A,b,x) => Math.hypot(...multiply(A,x).map((v,i)=>v-b[i]));
 function validate(A,b){
  if(!Array.isArray(A)||A.length<2||A.length>50||!Array.isArray(b)||b.length!==A.length||A.some(r=>!Array.isArray(r)||r.length!==A.length||r.some(v=>!Number.isFinite(v)))||b.some(v=>!Number.isFinite(v))) throw Error('Потрібна скінченна квадратна матриця 2..50 та вектор b');
 }
 function generate(n=5,d=1){
  if(![5,10,20].includes(n)||!Number.isFinite(d)||d<=0) throw Error('Некоректні n або d');
  const A=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?0:Math.cos(i+j+2)));
  A.forEach((r,i)=>r[i]=r.reduce((s,v)=>s+Math.abs(v),0)+d);
  const exact=Array.from({length:n},(_,i)=>(i%2===0?-1:1)*(i+1));
  return {A,b:multiply(A,exact),exact,n,d};
 }
 function dominance(A){
  const ratios=A.map((r,i)=>r.reduce((s,v,j)=>s+(i===j?0:Math.abs(v)),0)/Math.abs(r[i]));
  return {strict:ratios.every(v=>v<1),q:Math.max(...ratios),ratios};
 }
 function gauss(A,b,{pivot=true,trace=true}={}){
  validate(A,b);
  const n=A.length,M=A.map((r,i)=>[...r,b[i]]),steps=[];
  const scale=Math.max(...A.flat().map(Math.abs));
  const threshold=Number.EPSILON*n*scale;
  function snap(k,p,label){if(trace)steps.push({M:M.map(r=>r.slice()),k,p,label});}
  snap(-1,-1,'Початкова розширена матриця');
  for(let k=0;k<n;k++){
   let p=k;
   if(pivot)for(let i=k+1;i<n;i++)if(Math.abs(M[i][k])>Math.abs(M[p][k]))p=i;
   if(Math.abs(M[p][k])<=threshold)throw Error(pivot?'Вироджена або чисельно вироджена матриця':'Нульовий або надто малий головний елемент без вибору');
   snap(k,p,'Вибір головного елемента');
   if(p!==k){[M[k],M[p]]=[M[p],M[k]];snap(k,k,'Перестановка рядків');}
   for(let i=k+1;i<n;i++){
    const factor=M[i][k]/M[k][k]; M[i][k]=0;
    for(let j=k+1;j<=n;j++)M[i][j]-=factor*M[k][j];
    snap(k,k,`Обнулення рядка ${i+1}`);
   }
  }
  const x=Array(n).fill(0);
  for(let i=n-1;i>=0;i--){let s=M[i][n];for(let j=i+1;j<n;j++)s-=M[i][j]*x[j];x[i]=s/M[i][i];}
  if(x.some(v=>!Number.isFinite(v)))throw Error('Переповнення обчислень');
  return {x,iterations:null,status:'converged',residual:residual(A,b,x),steps};
 }
 function iterative(A,b,{method='jacobi',eps=1e-10,maxIter=20000,trace=true}={}){
  validate(A,b);
  if(!['jacobi','seidel'].includes(method)||!Number.isFinite(eps)||eps<=0||!Number.isInteger(maxIter)||maxIter<1||maxIter>100000)throw Error('Некоректні параметри ітерацій');
  if(A.some((r,i)=>r[i]===0))throw Error('Нуль на діагоналі: ітераційний метод неможливий');
  let x=Array(b.length).fill(0),delta=Infinity,r=residual(A,b,x),status='limit',k=0;
  const history=trace?[{k:0,x:x.slice(),residual:r}]:[];
  for(k=1;k<=maxIter;k++){
   const old=x.slice();
   for(let i=0;i<x.length;i++){
    let sum=b[i];
    for(let j=0;j<x.length;j++)if(i!==j)sum-=A[i][j]*(method==='seidel'&&j<i?x[j]:old[j]);
    x[i]=sum/A[i][i];
   }
   delta=normInf(x.map((v,i)=>v-old[i]));r=residual(A,b,x);
   if(!Number.isFinite(r)||x.some(v=>!Number.isFinite(v))){status='diverged';break;}
   if(trace)history.push({k,x:x.slice(),residual:r});
   if(delta<eps){status='converged';break;}
  }
  return {x,iterations:Math.min(k,maxIter),status,residual:r,delta,history};
 }
 function parse(text){
  const s=text.trim();if(!s)throw Error('Введіть систему');
  let value;
  if(s.startsWith('{'))value=JSON.parse(s);
  else{const rows=s.split(/\r?\n/).filter(r=>r.trim()).map(r=>{
   const line=r.trim();
   if(/^[,;|]|[,;|]$|[,;|]\s*[,;|]/.test(line))throw Error('Порожнє числове поле');
   return line.split(/[\s;,|]+/).map(Number);
  });value={A:rows.map(r=>r.slice(0,-1)),b:rows.map(r=>r.at(-1))};}
  validate(value.A,value.b);
  if(value.exact!==undefined&&(!Array.isArray(value.exact)||value.exact.length!==value.b.length||value.exact.some(v=>!Number.isFinite(v))))throw Error('Некоректний точний розв’язок');
  return value;
 }
 class LinearSystem{
  constructor(A,b,exact=null){validate(A,b);this.A=A.map(r=>r.slice());this.b=b.slice();this.exact=exact;}
  solve(method,options={}){const start=performance.now();const result=method==='gauss'?gauss(this.A,this.b,options):iterative(this.A,this.b,{...options,method});return {...result,ms:performance.now()-start,error:this.exact?normInf(result.x.map((v,i)=>v-this.exact[i])):null};}
 }
 const api={normInf,multiply,residual,validate,generate,dominance,gauss,iterative,parse,LinearSystem};
 if(typeof module!=='undefined')module.exports=api;else root.SLAR=api;
})(globalThis);
