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

## 注意

- After the `await`, `this.data` is always the current value — no stale closure; a `#token` field covers cancellation/races.
- Keeping render methods synchronous is a hard rule: React may re-run them any number of times.

## 演示

Orders (`#/orders`): `flow` submit with `saving`
