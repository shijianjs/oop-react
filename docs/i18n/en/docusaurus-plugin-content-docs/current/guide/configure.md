---
id: configure
title: Replacing the defaults
slug: /guide/configure
---

The core is a thin layer, and four things in it are replaceable:

```ts
OopReactConfigure({
  observe,     // how to subscribe
  observable,  // how to make an instance observable
  fallback,    // what a throwing render method shows
  onError,     // where errors are reported
});
```

It returns a function that undoes the change, which is what tests use most:

```ts
const restore = OopReactConfigure({fallback: MyFallback});
// ……
restore();
```

## Where the defaults end

| Capability | Default | Notes |
| --- | --- | --- |
| `observe` | MobX `Reaction` | runs the render method once during render, subscribing to what it reads |
| `observable` | `makeAutoObservable` | fields become observable, methods become actions and are bound |
| `fallback` | a plain built-in div | no design-system dependency |
| `onError` | `console.error` | |

## Replacing the subscription

`observe` receives a function that returns JSX and returns the rendered result. It is called inside a component,
so hooks are available:

```tsx
import {useSyncExternalStore} from 'react';

OopReactConfigure({
  observe: (render) => {
    // your own subscription: it only has to re-render when the data changes
    return <MyObserved render={render} />;
  },
});
```

`observable` receives the instance and returns an instance (it may mutate in place or return a wrapper, but
whatever it returns is what later method calls operate on):

```tsx
OopReactConfigure({
  observable: (instance) => {
    // e.g. your own reactive implementation, or a no-op — in which case render
    // methods only run when a parent re-renders them
    return instance;
  },
});
```

:::caution Not "swap the library and it works"
`observe` and `observable` are enough to replace MobX, but the replacement has to guarantee two things itself:
reads inside `observe` are tracked, and writes after `observable` invalidate. The library does not adapt that for
you — it only fixes the shape of those two functions.
:::

## Replacing one island

`fallback` and `onError` are global. To change one place, wrap it in `<OopReactErrorBoundary>` manually; to change
subscription behaviour for one component, write it with `OopReactObserver`.

## Not a runtime switch

`OopReactConfigure` is module-level configuration. Changing it affects instances created afterwards and renders
that happen afterwards; it does **not** re-subscribe islands that are already mounted. Configure once at startup,
and use the returned function to undo it in tests.
