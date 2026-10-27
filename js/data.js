(function (root) {
  'use strict';
  const DATASETS = {
    5: [[1,1.5],[2,0.8],[3,0.5],[4,0.4],[5,0.3]],
    10: [[1,10],[2,5.1],[3,3.2],[4,2.5],[5,2.1],[6,1.8],[7,1.6],[8,1.5]],
    20: [[0,0],[0.3,0.3],[0.6,0.56],[0.9,0.78],[1.2,0.93],[1.5,1],[1.8,0.97],[2.1,0.86],[2.4,0.68],[2.7,0.43],[3,0.14],[3.3,-0.16],[3.6,-0.44],[3.9,-0.69],[4.2,-0.87],[4.5,-0.98],[4.8,-1],[5.1,-0.92],[5.4,-0.77],[5.7,-0.55]]
  };
  function validatePoints(points) {
    if (!Array.isArray(points) || points.length < 2 || points.length > 20)
      throw new Error('Потрібно від 2 до 20 точок.');
    if (points.some(p => !Array.isArray(p) || p.length !== 2 || !p.every(Number.isFinite)))
      throw new Error('Кожна точка повинна містити два скінченні числа.');
    const sorted = points.map(p => p.slice()).sort((a,b) => a[0]-b[0]);
    for (let i=1;i<sorted.length;i++)
      if (sorted[i][0] === sorted[i-1][0]) throw new Error('Значення x мають бути різними.');
    const span = sorted.at(-1)[0]-sorted[0][0];
    if (!Number.isFinite(span) || span <= 1e-12*Math.max(1,...sorted.map(p=>Math.abs(p[0]))))
      throw new Error('Діапазон x надто малий або надто великий для стійкого обчислення.');
    return sorted;
  }
  function parsePoints(text) {
    const s=text.trim();
    let points;
    if (s.includes('(')) {
      const pattern=/\(\s*([^,()]+)\s*,\s*([^,()]+)\s*\)/g;
      const matches=[...s.matchAll(pattern)];
      if (!matches.length || s.replace(pattern,'').replace(/[\s,;]/g,''))
        throw new Error('Формат: (1, 1.5), (2, 0.8); десятковий роздільник — крапка.');
      points=matches.map(m=>[Number(m[1]),Number(m[2])]);
    } else {
      points=s.split(/[\n;]+/).filter(s=>s.trim()).map(line=>line.trim().split(/[\s,]+/).map(Number));
    }
    return validatePoints(points);
  }
  Object.values(DATASETS).forEach(p=>{p.forEach(Object.freeze);Object.freeze(p);});
  Object.freeze(DATASETS);
  const api={DATASETS,validatePoints,parsePoints};
  if(typeof module!=='undefined') module.exports=api;
  else Object.assign(root.Lab=root.Lab||{},api);
})(typeof globalThis!=='undefined'?globalThis:this);
