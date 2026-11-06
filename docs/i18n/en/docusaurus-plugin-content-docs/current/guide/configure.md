---
id: configure
title: Global configuration
slug: /guide/configure
---

There are exactly two things to configure: what a failed island looks like, and where the failure is reported.

```ts
OopReactConfigure({
  fallback,  // what a throwing render method shows
  onError,   // where errors are reported
});
```

It returns a function that undoes the change, which is what tests use:

```ts
const restore = OopReactConfigure({onError: vi.fn()});
// ……
restore();
```

## Why there is no "swap the reactive engine" seam

It was considered and rejected. The value of MobX is not the one `makeAutoObservable` line, it is computed
invalidation, batching, `flow`, `reaction`, `toJS` and the devtools around them. Replacing it costs about as much as
writing one, and an adapter layer in between would only distort both sides.

So:

- a state class declares its own observability in its constructor (`OopReactObservable`); that is MobX's territory;
- the library only does "wrap the render method in the official `observer` from `mobx-react-lite`, so whatever it
  reads becomes a subscription" — subscribing, batching and scheduling are the official implementation's job, not a
  `Reaction` loop of our own;
- for anything else MobX offers, import it from `mobx` — there is no middle layer.

## Configuration is module-level

`OopReactConfigure` affects instances created afterwards and renders that happen afterwards; it does **not**
re-subscribe islands that are already mounted. Configure once at startup, and use the returned function in tests.

For a single place, do not touch the global config:

- a different error card for one island → wrap it in `<OopReactErrorBoundary>` yourself;
- a piece of hand-written JSX that needs subscribing → use `OopReactObserver`.
