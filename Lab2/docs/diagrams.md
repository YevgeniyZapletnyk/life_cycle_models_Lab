# Схеми лабораторної № 2

Схеми відповідають чисельному ядру `js/math.js` та компонентам інтерфейсу.

## Гаусс

```mermaid
flowchart TD
 A[Перевірити A, b; скопіювати розширену матрицю] --> B[k = 0]
 B --> C{k < n?}
 C -->|Так| D[Обрати p з найбільшим модулем елемента стовпця k]
 D --> E{Головний елемент перевищує поріг?}
 E -->|Ні| F[Повідомити про чисельну виродженість]
 E -->|Так| G[Переставити рядки p та k разом із b]
 G --> H[Обнулити елементи нижче діагоналі; зберегти кадри]
 H --> I[k = k + 1]
 I --> C
 C -->|Ні| J[Зворотний хід]
 J --> K[Повернути x та нев'язку]
```

## Якобі

```mermaid
flowchart TD
 A[Перевірити дані та ненульову діагональ; x = 0] --> B[Скопіювати x в old]
 B --> C[Обчислити всі компоненти x лише через old]
 C --> D{Скінченні значення?}
 D -->|Ні| E[Статус diverged]
 D -->|Так| F[Обчислити delta, нев'язку; зберегти кадр]
 F --> G{delta < eps?}
 G -->|Так| H[Статус converged]
 G -->|Ні| I{Досягнуто maxIter?}
 I -->|Так| J[Статус limit]
 I -->|Ні| B
```

## Зейдель

```mermaid
flowchart TD
 A[Перевірити дані та ненульову діагональ; x = 0] --> B[Скопіювати x в old]
 B --> C[Для j менше i взяти нові x; для j більше i взяти old]
 C --> D{Скінченні значення?}
 D -->|Ні| E[Статус diverged]
 D -->|Так| F[Обчислити delta, нев'язку; зберегти кадр]
 F --> G{delta < eps?}
 G -->|Так| H[Статус converged]
 G -->|Ні| I{Досягнуто maxIter?}
 I -->|Так| J[Статус limit]
 I -->|Ні| B
```

## Діагональна перевага

```mermaid
flowchart TD
 A[Для кожного рядка обчислити суму модулів позадіагональних елементів] --> B[Обчислити ratios: сума / модуль діагоналі]
 B --> C[Обчислити q: максимум ratios]
 C --> D{Усі ratios менші за 1?}
 D -->|Так| E[strict = true; достатня умова збіжності]
 D -->|Ні| F[strict = false; показати попередження]
 E --> G[Повернути strict, q, ratios]
 F --> G
```

## UML класів

```mermaid
classDiagram
 class LinearSystem {
  A
  b
  exact
  solve(method, options)
 }
 class Chart {
  canvas
  draw(series, options)
 }
 class Result {
  x
  status
  iterations
  residual
  error
  ms
  history
  steps
 }
 class App {
  <<component>>
  run()
  render()
  frame()
  reset()
 }
 App ..> LinearSystem : викликає
 App ..> Chart : відображає
 LinearSystem ..> Result : повертає
```

App позначає функціональний компонент `app.js`, а не JavaScript-клас.

## UML послідовності

```mermaid
sequenceDiagram
 actor User as Користувач
 participant App as app.js
 participant System as LinearSystem
 participant Graph as Chart
 User->>App: Обчислити
 App->>App: generate або parse
 loop Гаусс, Якобі, Зейдель
  App->>System: solve(method, options)
  System-->>App: Result
 end
 App->>Graph: draw(series, options)
 User->>App: Відтворити / крок
 App->>Graph: draw(поточний кадр)
 Graph->>Graph: перерахувати межі X та Y
```
