(function(root) {
  const problems={variant:{name:'Варіант 3',expression:'y*cos(x)',exactExpression:'2*exp(sin(x))',x0:0,y0:2,b:Math.PI,f:(x,y)=>y*Math.cos(x),exact:x=>2*Math.exp(Math.sin(x))},stability:{name:'Тест стійкості',expression:'-20*y',exactExpression:'exp(-20*x)',x0:0,y0:1,b:1,f:(x,y)=>-20*y,exact:x=>Math.exp(-20*x)}};
  if(typeof module!=='undefined'&&module.exports) module.exports=problems; else root.Problems=problems;
})(globalThis);
