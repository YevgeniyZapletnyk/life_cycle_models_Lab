/* Чисельні стратегії. k — нахили, а не прирости h*k. */
(function (root) {
  'use strict';
  class OdeMethod {
    constructor(id, name, order, color) { Object.assign(this, {id, name, order, color}); }
    step() { throw new Error('Стратегія має реалізувати step().'); }
  }
  class RK4Method extends OdeMethod {
    constructor() { super('rk4', 'Рунге–Кутта 4', 4, '#2563eb'); }
    step(f,x,y,h) {
      const k1=f(x,y), y2=y+h*k1/2, k2=f(x+h/2,y2);
      const y3=y+h*k2/2, k3=f(x+h/2,y3), y4=y+h*k3, k4=f(x+h,y4);
      return {y:y+h*(k1+2*k2+2*k3+k4)/6,
        stages:[{x,y,k:k1},{x:x+h/2,y:y2,k:k2},{x:x+h/2,y:y3,k:k3},{x:x+h,y:y4,k:k4}]};
    }
  }
  const api={OdeMethod,RK4Method};
  if(typeof module!=='undefined' && module.exports) module.exports=api; else root.Methods=api;
})(globalThis);
