---
id: use
title: use (reading a Promise)
slug: /compare/use
---

**React 19**: read a promise during render, together with `Suspense`.
**Here**: render methods stay synchronous; async work happens in a plain `async` method that writes a field when done.

## React

```tsx
const data = use(fetchProfile());   // needs a Suspense boundary
```

## Objects

```ts
@OopReactState
class Profile {
  data: Profile | null = null;
  loading = false;

  async load(): Promise<void> {
    this.loading = true;
    try {
      this.data = await this.api.profile();
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

Strict mode is off by default, so writing a field after `await` raises no warning; each write notifies observers once,
which usually does not matter. To batch several consecutive writes, extract them into a method (a method is an action)
or wrap them in `runInAction`.

## When you explicitly want `yield`: `flow`

MobX's `flow` is written as a generator: `yield` acts like `await`, except that **the code after every `yield`
re-enters an action**:

```ts
import {flow} from 'mobx';

readonly load = flow(function* (this: Profile) {
  this.loading = true;
  try {
    this.data = yield this.api.profile();   // this step is inside an action too
  } finally {
    this.loading = false;
  }
});
```

That buys you: every step of a multi-step sequence is a transaction, a `CancellablePromise` that can be cancelled,
and no warning-per-write if a host turns strict mode back on. Use it only when those are needed; ordinary async code
stays with `async/await`. Generator **methods** are marked as flows too, but TypeScript still types them as
`Generator` and every caller needs a cast — the field form is better.

## Notes

- After an `await` / `yield`, `this.data` is always the current value — no stale closure; a `#token` field covers
  cancellation and races.
- Keeping render methods synchronous is a hard rule: React may re-run them any number of times.

## Demo

Orders (`#/orders`): an `async` submit with `saving`
