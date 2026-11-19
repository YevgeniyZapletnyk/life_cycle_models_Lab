# Архітектура

`math.js` експортує функції та клас LinearSystem у SLAR або module.exports.
LinearSystem зберігає копії A,b,exact та викликає gauss або iterative через solve().
`Chart` з chart.js малює серії на Canvas, масштабує осі та обробляє log10(max(r,1e-16)).
`app.js` - функціональний контролер у замиканні, не окремий JavaScript-клас.
В UML він показаний як компонент, а дані результату - як об'єкт даних.
`cli.js` використовує те саме ядро без DOM. `metrics.js` вимірює час без трасування.

Послідовність: користувач -> app.run -> generate/parse -> LinearSystem.solve ->
gauss/iterative -> результат -> Chart.draw і таблиця -> кадри requestAnimationFrame.
Помилка окремого методу не приховує результатів інших методів.

Ідентифікатори: A (number[][]), b,x,exact (number[]), n,k,p (number), d,eps,delta,q
(number), maxIter (number), M (розширена матриця), steps/history (масив кадрів),
status ('converged'/'limit'/'diverged'). Схеми та UML включено у звіт.
