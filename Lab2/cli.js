const fs=require('node:fs');
const {generate,parse,LinearSystem}=require('./js/math.js');
try{
 const data=process.argv[2]&& !/^\d+$/.test(process.argv[2])?parse(fs.readFileSync(process.argv[2],'utf8')):generate(Number(process.argv[2]||5),Number(process.argv[3]||1));
 const s=new LinearSystem(data.A,data.b,data.exact);
 for(const method of ['gauss','jacobi','seidel']){const r=s.solve(method,{trace:false});console.log(JSON.stringify({method,...r},null,2));}
}catch(e){console.error(e.message);process.exitCode=1;}
