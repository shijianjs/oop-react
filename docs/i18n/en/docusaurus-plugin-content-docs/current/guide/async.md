---
id: async
title: Async and loading state
slug: /guide/async
---

"A button spinning, data not back yet, a request timing out" — in an object graph these are objects too: one loading
state per button, one resource per piece of data. The library only brings the mechanism (`OopReactLoading` /
`OopReactResource`); **which toast to show, what the progress bar looks like and how the button greys out are
decisions of the object that holds it**.

## One loading state per button

```tsx title="SaveButton.tsx"
class SaveButton {
  readonly loading = new OopReactLoading();

  async click(): Promise<void> {
    const result = await this.loading.run(() => api.save(this.order), {timeoutMs: 5000});
    if (!result.ok) this.page.feedback.error(result.timedOut ? 'Timed out' : String(result.error));
  }

  @OopReactRender()
  view() {
    return (
      <Button loading={this.loading.loading} onClick={() => void this.click()}>
        Save
      </Button>
    );
  }
}
```

- `loading` is its only public state and the button's `loading` prop takes it directly — the spinner and the
  "not clickable" part belong to the component library, no overlay to draw;
- each button has its own instance, so clicking one does not touch another: no provider, no lifting state up;
- calls are counted internally, so if two things overlap on the same button, the one that finishes first does not
  clear `loading`.

## Failure and timeout

`run` does not throw; the result goes into the return value:

```ts
const result = await this.loading.run(() => api.save(), {timeoutMs: 5000});

if (result.ok) {
  this.page.feedback.success('Saved');
} else if (result.timedOut) {
  this.page.feedback.error('Timed out');
} else {
  this.page.feedback.error(String(result.error));
}
```

- the caller writes one `try` less and cannot forget the reset — `run` guarantees it;
- `timeoutMs` only makes `run` return early; **the task keeps running**. To really cancel, pass an `AbortSignal`
  into `fetch`;
- whether a timeout counts as a failure and whether to retry are the caller's calls, not the library's.

## One resource per piece of data

Spinning is only the middle part; what you actually want is the data:

```tsx title="OrdersPage.tsx"
class OrdersPage {
  readonly orders = new OopReactResource<Order[]>();

  async open(): Promise<void> {
    await this.orders.load(() => api.orders());
  }

  @OopReactRender()
  view() {
    if (this.orders.loading.loading && this.orders.data === null) return <Spin />;

    return (
      <Space direction="vertical" size="small">
        {this.orders.error ? <Alert type="error" message={String(this.orders.error)} /> : null}
        <Table dataSource={this.orders.data ?? []} />
      </Space>
    );
  }
}
```

`data` / `error` / `loading` are exactly the three screens: nothing yet, stale data plus an error, fresh data.
A failure keeps the previous `data` (the screen does not go blank); `invalidate()` is what empties it.

**No caching, no deduping, no stale-while-revalidate**: that layer comes with a framework behind it (invalidation
timing, retries, cancelling in flight). To fetch again, call `load` again with the same fetcher.

## Where a callback only leaves room for one node

A dialog's `children`, a drawer body, a table's `render`, the return value of a render prop — each of them can hand
back exactly one node, while the data arrives asynchronously. So the same block gets retyped everywhere:

```tsx
if (error && data === null) return <Alert type="error" title={String(error)} />;
if (data === null) return <Skeleton active />;
return <Table dataSource={data} />;
```

Collapse the three into one helper and each site becomes a single call:

```tsx
{asyncView(this.rows, {
  skeleton: <Skeleton active />,
  ready: this.table(),
  failed: (error) => <Alert type="error" title={String(error)} />,
})}
```

`asyncView` is a plain function in the demo (`demo/src/app/AsyncView.tsx`). The point is that it is **not a
component**: called inside a render method, the `data` / `error` reads belong to *that island*, so nothing needs an
extra observer — and it fits anywhere that leaves room for one node. A failure with stale data does not blank the
screen either: the data stays and the error shows above it as a banner (clearing is `invalidate()`'s job).

React 19 has an official answer here: `use(promise)` with `<Suspense fallback>`, one tag controlling "what to show
while there is no data". The difference is that it falls back per **boundary** (the nearest Suspense), so two async
sections mean two boundaries and failures still need an ErrorBoundary — and the promise has to stay the same across
renders. Here `data` / `error` are fields on an object: reading them tells you which of the three to draw, with no
suspending and no Suspense ancestor.

## Why the global progress bar is not in the library

An NProgress-style bar is UI plus global policy: who closes it, whether it counts, whether it turns red on failure.
In the demo it is one `Progress` object on `App`, about thirty lines. Built into the library it would have to decide
your styles, position and conflict policy — the thing this library keeps refusing to do.

## Tidying up: cleanup

Everything an object accumulates — `reaction`s, timers, DOM listeners, third-party instances — goes into one
`OopReactCleanup`:

```ts
class Poller {
  readonly cleanup = new OopReactCleanup();

  start(): void {
    const timer = setInterval(() => void this.refresh(), 5000);
    this.cleanup.add(() => clearInterval(timer));
  }

  dispose(): void {
    this.cleanup.dispose();
  }
}
```

One disposer throwing does not stop the others; adding after `dispose()` runs immediately — a missing cleanup is
harder to find than a late one.

## The demo

On the demo's "Loading" page (`demo/src/pages/loading/`) the four buttons are four objects, each with its own
`OopReactLoading`: one toast for failures, a timeout on the slow one, a global bar on top, and a card below whose
button belongs to another object.
