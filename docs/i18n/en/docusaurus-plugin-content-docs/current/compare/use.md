---
id: use
title: use（读 Promise）
slug: /compare/use
---

**React 19**: read a promise during render, together with `Suspense`.
**Here**: never `await` in a render method — finish async work in a `flow` (or a plain `async` method) and write a field; render methods stay synchronous.

## 原生写法

```tsx
const data = use(fetchProfile());   // needs a Suspense boundary
```

## 对象写法

```ts
@OopReactState
class Profile {
  data: Profile | null = null;
  loading = false;

  *load(): Generator<Promise<unknown>, void, unknown> {
    this.loading = true;
    try {
      this.data = (yield this.api.profile()) as Profile;
    } finally {
      this.loading = false;
    }
  }

  @OopReactRender()
  view() {
    if (this.data === null) return <Skeleton active />;
    return <ProfileCard data={this.data} />;
  }
}
```

## Why this page uses a generator (it is optional)

`*load()` is a generator, but callers get a plain promise: `@OopReactState` (and `OopReactObservable`) marks
generator methods as MobX `flow`, and `yield` behaves exactly like `await`.

**Strict mode is off by default, so `async/await` works fine here**: writing a field after `await` raises no
warning. This page picks `flow` because it is a multi-step sequence — the code after each `yield` runs inside an
action, so `loading → data → clean up` is one notification per step, and the returned `CancellablePromise` can be
cancelled when the page goes away.

With `async` the same method is:

```ts
async load(): Promise<void> {
  this.loading = true;
  try {
    this.data = await this.api.profile();
  } finally {
    this.loading = false;
  }
}
```

It runs just as well; the difference is that those writes notify observers one by one. Wrap the tail in
`runInAction` if they should land together.

If a host application turns strict mode back on (`OopReactConfigure({enforceActions: 'always'})`), every write after
an `await` produces a `console.warn` (MobX 7 warns, it does not throw) — `flow` is unaffected, which makes it the
safer choice there.

If the public signature should not mention `Generator`, write it as a field — its type is the function it becomes at
runtime:

```ts
readonly load = flow(function* (this: Profile) {
  this.loading = true;
  try {
    this.data = yield this.api.profile();
  } finally {
    this.loading = false;
  }
});
```

## 注意

- After the `await`, `this.data` is always the current value — no stale closure; a `#token` field covers cancellation/races.
- Keeping render methods synchronous is a hard rule: React may re-run them any number of times.

## 演示

Orders (`#/orders`): `flow` submit with `saving`
