const {test}=require('node:test');const assert=require('node:assert/strict');const M=require('../js/math.js');
for(const n of [5,10,20])for(const d of [1,.1]){
 test(`variant n=${n} d=${d}`,()=>{const s=M.generate(n,d);assert.equal(s.A[0][1],Math.cos(3));assert.equal(s.exact[0],-1);assert.equal(s.exact.at(-1),(n%2===0?1:-1)*n);assert.ok(M.dominance(s.A).strict);s.A.forEach((r,i)=>assert.ok(Math.abs(r[i]-r.reduce((sum,v,j)=>sum+(j===i?0:Math.abs(v)),0)-d)<1e-13));});
 for(const method of ['gauss','jacobi','seidel'])test(`${method} n=${n} d=${d}`,()=>{const s=M.generate(n,d),r=new M.LinearSystem(s.A,s.b,s.exact).solve(method);assert.equal(r.status,'converged');assert.ok(r.error<1e-8);assert.ok(r.residual<1e-8);});
}
test('pivot rescues zero diagonal',()=>assert.deepEqual(M.gauss([[0,2],[1,3]],[4,7]).x,[1,2]));
test('no pivot fails zero diagonal',()=>assert.throws(()=>M.gauss([[0,2],[1,3]],[4,7],{pivot:false}),/головний/));
test('singular matrix rejected',()=>assert.throws(()=>M.gauss([[1,2],[2,4]],[3,6]),/вироджена/));
test('uniformly small scale is solvable',()=>{const r=M.gauss([[2e-100,0],[0,3e-100]],[4e-100,9e-100]);assert.ok(M.normInf(r.x.map((v,i)=>v-[2,3][i]))<1e-14);});
test('input not mutated',()=>{const s=M.generate(),copy=JSON.stringify(s);M.gauss(s.A,s.b);M.iterative(s.A,s.b);assert.equal(JSON.stringify(s),copy);});
test('Jacobi uses old values',()=>{const r=M.iterative([[4,1],[2,3]],[6,8],{maxIter:1});assert.deepEqual(r.x,[1.5,8/3]);assert.equal(r.status,'limit');});
test('Seidel uses new values',()=>{const r=M.iterative([[4,1],[2,3]],[6,8],{method:'seidel',maxIter:1});assert.deepEqual(r.x,[1.5,5/3]);});
test('zero diagonal iterative rejected',()=>assert.throws(()=>M.iterative([[0,1],[1,2]],[1,3]),/Нуль/));
test('divergence detected',()=>assert.equal(M.iterative([[1,3],[3,1]],[1,1]).status,'diverged'));
test('non dominant can converge',()=>assert.equal(M.iterative([[1,2],[.1,1]],[3,1.1],{method:'seidel'}).status,'converged'));
test('zero RHS',()=>assert.deepEqual(M.iterative([[2,1],[1,2]],[0,0]).x,[0,0]));
test('parse text',()=>assert.deepEqual(M.parse('0 2 4\n1 3 7'),{A:[[0,2],[1,3]],b:[4,7]}));
test('parse JSON',()=>assert.deepEqual(M.parse('{"A":[[2,0],[0,3]],"b":[4,9]}').b,[4,9]));
test('bad inputs rejected',()=>{for(const s of ['1,2,\n3,4,', '1,,2\n3,,4', '', '1 2\n3 4','1 x 2\n2 3 4','{"A":[[1,2],[3,4]],"b":[1,null]}'])assert.throws(()=>M.parse(s));});
test('bad iteration settings rejected',()=>{for(const eps of [0,-1,Infinity,NaN])assert.throws(()=>M.iterative([[1,0],[0,1]],[1,1],{eps}));});
test('trace final triangular',()=>{const s=M.generate(),r=M.gauss(s.A,s.b),last=r.steps.at(-1).M;for(let i=0;i<5;i++)for(let j=0;j<i;j++)assert.equal(last[i][j],0);});
