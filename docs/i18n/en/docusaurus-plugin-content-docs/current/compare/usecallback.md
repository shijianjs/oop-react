---
id: usecallback
title: useCallback
slug: /compare/usecallback
---

**React**: wrap a handler so its identity stays stable across renders (for `memo` children).
**Here**: instance methods are bound once in the constructor, so the reference is stable by construction — no `useCallback`.

## 原生写法

```tsx
const save = useCallback(() => {
  dispatch({type: 'save'});
}, []);
```

## 对象写法

```ts
@OopReactState
class Form {
  save(): void {
    // this is already bound
  }

  @OopReactRender()
  view() {
    return <Button onClick={this.save}>Save</Button>;
  }
}
```

## 注意

- `autoBind` is on by default; turn it off (`OopReactObservable(this, {}, {autoBind: false})`) and you write `() => this.save()`.
- Identity stability is what makes the island memo work: same instance, same method, no re-run.

## 演示

everywhere (`onClick={this.bump}`)
