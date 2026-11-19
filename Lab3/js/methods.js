/* Чисельні стратегії. k — нахили, а не прирости h*k. */
(function (root) {
  'use strict';
  class OdeMethod {
    constructor(id, name, order, color) { Object.assign(this, {id, name, order, color}); }
    step() { throw new Error('Стратегія має реалізувати step().'); }
  }
  class EulerMethod extends OdeMethod {
    constructor() { super('euler', 'Ейлер', 1, '#d24747'); }
    step(f, x, y, h) {
      const k1 = f(x, y);
      return {y: y + h*k1, stages: [{x, y, k:k1}]};
    }
  }
  class HeunMethod extends OdeMethod {
    constructor() { super('heun', 'Хойн', 2, '#be7808'); }
    step(f, x, y, h) {
      const k1=f(x,y), predicted=y+h*k1, k2=f(x+h,predicted);
      return {y:y+h*(k1+k2)/2, stages:[{x,y,k:k1},{x:x+h,y:predicted,k:k2}]};
    }
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
  class MethodRegistry {
    constructor() { this.methods=new Map(); }
    register(method) {
      if (!(method instanceof OdeMethod) || !method.id || this.methods.has(method.id)) throw new Error('Некоректна або повторна стратегія.');
      this.methods.set(method.id,method); return this;
    }
    get(id) { const m=this.methods.get(id); if(!m) throw new Error('Невідомий метод: '+id); return m; }
    list() { return [...this.methods.values()]; }
  }
  const registry=new MethodRegistry().register(new EulerMethod()).register(new HeunMethod()).register(new RK4Method());
  const api={OdeMethod,EulerMethod,HeunMethod,RK4Method,MethodRegistry,registry};
  if(typeof module!=='undefined' && module.exports) module.exports=api; else root.Methods=api;
})(globalThis);
