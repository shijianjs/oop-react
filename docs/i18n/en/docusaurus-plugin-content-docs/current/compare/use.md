---
id: use
title: use（读 Promise）
slug: /compare/use
---

**React 19**: read a promise during render, together with `Suspense`.
**Here**: never `await` in a render method — finish the async work in a `flow` and write a field; render methods stay synchronous.

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

## Why a generator instead of `async`

`*load()` is a generator, but callers get a plain promise: `@OopReactState` (and `OopReactObservable`) marks
generator methods as MobX `flow`. It is not a stylistic choice — **MobX's action boundary ends at an `await`**:

- an `async` method is one action as a whole, but the code after `await` is no longer inside it. MobX enforces
  actions by default, so writing an observed field there throws
  `Since strict-mode is enabled, changing (observed) observable values without using an action is not allowed`;
- `flow` re-enters an action after every `yield`, so "set loading → request → write the result → clean up" is legal
  at every step, and half-finished state is never exposed to observers.

`async/await` is perfectly fine in two cases:

1. nothing observed is written after the `await` (you only compute and return);
2. the writes after the `await` are wrapped in `runInAction(() => { … })`.

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
