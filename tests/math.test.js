const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DATASETS,parsePoints,validatePoints}=require('../js/data');
const {interpolation,dividedDifferences,fitPolynomial,sample,leaveOneOut}=require('../js/math');
const {computeBounds}=require('../js/chart');
const near=(a,b,tol=1e-9)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(b)),`${a} ≠ ${b}`);
for(const key of [5,10,20]){
 test(`Лагранж відтворює всі вузли: набір ${key}`,()=>{const p=DATASETS[key],l=interpolation(p);for(const [x,y]of p)near(l.evaluate(x),y);});
 test(`Ньютон і Лагранж збігаються між вузлами: набір ${key}`,()=>{const p=DATASETS[key],l=interpolation(p),n=dividedDifferences(p);for(const [x,y]of sample(l.evaluate,p[0][0],p.at(-1)[0],200))near(n.evaluate(x),y,2e-7);});
 test(`Залишки QR-МНК ортогональні стовпцям A: набір ${key}`,()=>{for(let d=1;d<=4;d++){const p=DATASETS[key],m=fitPolynomial(p,d);for(let j=0;j<=d;j++)near(p.reduce((s,[x],i)=>s+((x-m.center)/m.half)**j*m.residuals[i],0),0,1e-10);}});
}
test('QR точно відновлює відомий кубічний поліном',()=>{const p=Array.from({length:12},(_,i)=>{const x=i/2;return[x,2-3*x+.5*x*x-.2*x*x*x];});const m=fitPolynomial(p,3);for(const [x,y]of p)near(m.evaluate(x),y);near(m.rss,0);});
test('Лінійний МНК збігається з незалежною формулою',()=>{const p=DATASETS[10],n=p.length,sx=p.reduce((s,p)=>s+p[0],0),sy=p.reduce((s,p)=>s+p[1],0),sxy=p.reduce((s,p)=>s+p[0]*p[1],0),sxx=p.reduce((s,p)=>s+p[0]**2,0);const b=(n*sxy-sx*sy)/(n*sxx-sx*sx),a=(sy-b*sx)/n,m=fitPolynomial(p,1);for(const [x]of p)near(m.evaluate(x),a+b*x);});
test('Зсув x на 10^6 не руйнує точну параболу',()=>{const p=Array.from({length:8},(_,i)=>[1e6+i,i*i+2*i+1]);const m=fitPolynomial(p,2);near(m.evaluate(1e6+2.5),12.25);});
test('Збільшення степеня не збільшує RSS',()=>{for(const p of Object.values(DATASETS)){let rss=Infinity;for(let d=1;d<=4;d++){const next=fitPolynomial(p,d).rss;assert.ok(next<=rss+1e-10);rss=next;}}});
test('Константні y мають скінченне R²',()=>{const m=fitPolynomial([[0,3],[1,3],[2,3],[3,3]],2);near(m.r2,1);near(m.rss,0);});
test('МНК n−1 на 5 вузлах збігається з інтерполяцією',()=>{const p=DATASETS[5],m=fitPolynomial(p,4),l=interpolation(p);for(const [x,y]of sample(l.evaluate,1,5,40))near(m.evaluate(x),y);});
test('Розбір двох підтримуваних форматів',()=>{assert.deepEqual(parsePoints('(1, 1.5), (2, 0.8)'),[[1,1.5],[2,.8]]);assert.deepEqual(parsePoints('2 0.8\n1 1.5'),[[1,1.5],[2,.8]]);});
test('Помилкові, зайві й нечислові дані відхиляються',()=>{for(const text of ['','1 2','(1, 2) junk (2, 3)','0 1 2\n1 2','1 NaN\n2 3','1 Infinity\n2 3','(1, ), (2, 3)'])assert.throws(()=>parsePoints(text));});
test('Повторні x і недопустимий степінь відхиляються',()=>{assert.throws(()=>validatePoints([[1,2],[1,3]]));assert.throws(()=>fitPolynomial([[0,1],[1,2]],2));assert.throws(()=>fitPolynomial(DATASETS[5],1.5));});
test('Вхідні масиви не змінюються',()=>{const p=[[2,4],[0,0],[1,1]],copy=JSON.stringify(p);interpolation(p);fitPolynomial(p,2);assert.equal(JSON.stringify(p),copy);});
test('Автомасштаб охоплює всю криву з великими осциляціями',()=>{const p=DATASETS[20],curve=sample(interpolation(p).evaluate,0,5.7,4000),b=computeBounds([p,curve]);for(const [x,y]of curve){assert.ok(x>=b.xmin&&x<=b.xmax&&y>=b.ymin&&y<=b.ymax);}});
test('Майже нульові залишки не розтягуються на все полотно',()=>{const b=computeBounds([[[0,1e-16],[1,-2e-16]]],{zero:true});assert.ok(b.ymax-b.ymin>=.2);});
test('LOO відомої параболи дає нульову похибку',()=>{near(leaveOneOut([[0,0],[1,1],[2,4],[3,9],[4,16]],p=>fitPolynomial(p,2)),0);});
test('Вихідні набори містять рівно 5, 8 і 20 пар',()=>{assert.deepEqual(Object.values(DATASETS).map(p=>p.length),[5,8,20]);});
