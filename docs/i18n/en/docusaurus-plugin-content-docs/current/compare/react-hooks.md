---
id: react-hooks
title: React → objects
slug: /compare/react-hooks
sidebar_position: 1
---

This page maps the official [Hooks reference](https://react.dev/reference/react/hooks) onto the object graph.
The "demo" column points at a page you can try; ⏳ means the page explains it but the demo has no dedicated screen
yet.

## The table

| React | Here | demo |
| --- | --- | --- |
| [`useState`](./usestate.md) | a field; several states are several fields | Counter, Todos, Orders |
| [`useReducer`](./usereducer.md) | one method (or a few) changing a group of fields; for complex cases, a dedicated state object | Orders (`OrdersPage`) |
| [`useContext`](./usecontext.md) | hold that object (`this.app.settings`) | everywhere: `t()` comes from `App.settings` |
| `useRef` (a value) | a plain field; mark it `@OopReactIgnore` if it must not be observed | Orders (`OrderEditor` holds the form instance) |
| `useRef` (a DOM node) | only inside a thin component that needs the DOM | Chart (`EChart`) |
| `useImperativeHandle` / `forwardRef` | hand the instance to an object (`OopReactBridge`) and call its methods | Orders (`OrderEditor`) |
| [`useEffect`](./useeffect.md) | a `reaction` owned by the object, or work inside a method; teardown is the object's lifetime | Settings (theme → `<html>`) |
| [`useLayoutEffect`](./uselayouteffect.md) | same; synchronous measurement still lives in a thin component | ⏳ |
| [`useInsertionEffect`](./useinsertioneffect.md) | not needed: styles belong to `ConfigProvider` / CSS-in-JS | — |
| [`useDebugValue`](./usedebugvalue.md) | not needed: the object is a plain object in DevTools | — |
| [`useMemo`](./usememo.md) | a `get` accessor (computed) | Orders (`paged`, `columns`), Chart (`option`) |
| [`useCallback`](./usecallback.md) | an instance method, bound once in the constructor | everywhere: `onClick={this.bump}` |
| [`memo`](./memo.md) | islands are memoized by (instance + method + name + args) | every page |
| `useTransition` / `useDeferredValue` | not wrapped; state lives on the object, use the official hook inside an island if needed | ⏳ |
| [`useId`](./useid.md) | not wrapped; labels of form controls come from antd | ⏳ |
| [`useSyncExternalStore`](./usesyncexternalstore.md) | not needed: subscribing is `observer`'s job | — |
| `useOptimistic` / `useActionState` / `useFormStatus` | optimistic updates = change the field first, revert on failure, inside an `async` method | ⏳ |
| `use` (React 19, reading a Promise) | `await` in an object method, then write fields; never `await` in a render method | Orders (`async` method submit) |
| `Suspense` / `lazy` | not wrapped: routes and pages are synchronous objects; `import()` stays at the boundary | ⏳ |
| error boundaries | one per island, plus `OopReactErrorBoundary` | Failure |
| `createPortal` | use it directly in a render method when needed | dialogs (antd `Modal`) |
| HOC | not needed: cross-cutting ability is held by the object | see below |
| render props | not needed: pass the object, or call its method | `OopReactCallback` remains for foreign APIs |

## A few in detail

### Several `useState`s

```tsx
// React
const [draft, setDraft] = useState('');
const [items, setItems] = useState<Item[]>([]);
const [selected, setSelected] = useState<Item | null>(null);
```

```ts
// objects
class Todos {
  draft = '';
  items: Item[] = [];
  selected: Item | null = null;

  constructor() {
    OopReactObservable(this);
  }
}
```

Fields can read each other directly — no effect is needed to keep them in sync — and when `selected` changes, only
the island that reads it re-renders.

### `useRef` for a value that must not trigger a render

```ts
class OrderEditor {
  @OopReactIgnore #form: FormInstance<Draft> | null = null;   // a plain field
}
```

`@OopReactIgnore` means "not subscribed"; unlike `useRef` the field is still readable from any method, and subclasses
inherit the mark.

### The three usual jobs of `useEffect`

| Job | Here |
| --- | --- |
| subscribe to outside state (theme, language, routing) | a `reaction` owned by the object, created in the constructor, released by `dispose()` |
| fetch data | an `async` method on the object |
| touch the DOM or a third-party instance | `useEffect` in a thin component (`EChart`), or hand the instance to an object (`OopReactBridge`) |

### Async: `await` stops being a trap

In React, the value you see after an `await` is the one captured by the closure — every "what is the current value?"
bug starts there. In an object method, `this.x` is always current:

```ts
async submit(): Promise<void> {
  const values = await this.#form!.validateFields();
  await this.page.save(values);       // page.save is a async method
  this.open = false;                  // still the current `this`
  this.page.app.feedback.success('Saved');
}
```

### HOCs

What a HOC provides in React has two more direct replacements here:

- **the object holds the ability**: needs to show a toast → it holds `feedback`; needs the current user → it holds
  `session`;
- **a thin component**: when a React component genuinely has to wrap a third-party one (`EChart`), write an ordinary
  component and pass props.

You only need `OopReactComponent` / `OopReactObserver` when reusing a piece of UI inside somebody else's React code.

## The demo pages

| Page | What it shows |
| --- | --- |
| Counter | fields are state, methods are callbacks |
| Todos | one-to-many, computed, a one-to-one reference |
| Orders | controlled table state, form instance handed to the object, `async` method, validation |
| Tic-tac-toe | the whole official tutorial: snapshot history, computed winner, two-loop board |
| Chart | a thin component around an imperative library (ECharts) |
| Animation | CSS transitions + `react-spring` (hook inside one island) |
| Failure | one error boundary per island |
