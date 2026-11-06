---
id: complex-components
title: Complex components and hooks
slug: /guide/complex-components
---

Component libraries pull you back to React's boundaries: providers, context, hooks that own a component instance.
This page is that boundary checklist; the reference implementation is the "Orders" page in the demo
(`demo/src/pages/orders/OrdersPage.tsx`).

## The short version

| What you need | Where it goes | How |
| --- | --- | --- |
| a provider (`ConfigProvider`, antd `App`, theme) | some island's JSX | any object's render method can wrap a subtree — not just the app root |
| a side effect (`reaction` / `autorun`) | the object | create it in the constructor, expose `dispose()` |
| a context-bound instance (`message` / `modal` / `notification`) | the object | capture it once with a bridge component, hand it over in `useEffect` |
| a hook used by one island (`Form.useForm`, `Modal.useModal`) | that island | call it at the top of the render method |
| table / form *view* state | object fields | pass it back in as controlled props |

## Providers do not have to be at the root

The orders table wraps itself in a `ConfigProvider` on the page:

```tsx
@OopReactRender()
table() {
  return (
    <ConfigProvider componentSize="small">
      <Table columns={this.columns} dataSource={this.paged} … />
    </ConfigProvider>
  );
}
```

Everything outside the page keeps the global size — the provider only affects that subtree. The cost is direct:
**when the provider's island re-renders, the whole subtree re-renders with it**, so keep it in the smallest island
that needs it rather than dropping it into `view()`.

The same holds for antd's `<App>` (where `App.useApp()` comes from), except it also provides the `message` instances.

## `reaction` belongs to the object

A side effect does not have to live at the application entry. Whoever owns the state can own the effect that follows
it:

```ts
export class Settings {
  theme: 'light' | 'dark' = 'light';
  locale: 'zh' | 'en' = 'zh';
  #dispose: (() => void) | null = null;

  constructor() {
    OopReactObservable(this);
    this.#dispose = reaction(
      () => [this.theme, this.locale] as const,
      ([theme, locale]) => {
        document.documentElement.dataset.theme = theme;
        document.documentElement.lang = locale === 'zh' ? 'zh-Hans' : 'en';
      },
      {fireImmediately: true},
    );
  }

  dispose(): void {
    this.#dispose?.();
    this.#dispose = null;
  }
}
```

:::caution Do not create a reaction in a render method
Render methods run repeatedly; a reaction created there is a leak per render. Effects belong to the object's
lifetime, not to one render.
:::

## Hooks work inside render methods

An island *is* a component, so its render method can call hooks:

```tsx
@OopReactRender()
dialog() {
  const [form] = Form.useForm<OrderDraft>();   // fine
  return <Modal onOk={() => form.submit()}>…</Modal>;
}

@OopReactRender()
toolbar() {
  const [modal, holder] = Modal.useModal();
  return (
    <>
      {holder}
      <Button onClick={() => modal.confirm({title: '…', onOk: () => this.reset()})}>Reset</Button>
    </>
  );
}
```

The three rules are exactly React's, only easier to forget here:

1. **Call order must be stable.** No hook after `if (...) return …`. A method that throws or returns early — like
   `content()` — should not use hooks at all.
2. **The instance belongs to that island.** If two parent islands each call the same render method, that is two
   instances; when the island unmounts (a route change), the instance is gone and the form resets.
3. **Do not store a hook result on the object.** Writing state during a render is wrong here for the same reason it
   is wrong in plain React.

## The bridge: handing context instances to objects

`message` / `modal` / `notification` only exist inside a context. When an object method needs one, capture it once:

```tsx
export class Feedback {
  #message: MessageInstance | null = null;

  bind(message: MessageInstance): void {
    this.#message = message;
  }

  success(text: string): void {
    void this.#message?.success(text);
  }
}

export function FeedbackBridge({feedback}: {feedback: Feedback}) {
  const {message} = AntApp.useApp();

  useEffect(() => {
    feedback.bind(message);
  }, [feedback, message]);

  return null;
}
```

Mounted under the same provider, before `app.view()`:

```tsx
<ConfigProvider …>
  <AntApp>
    <FeedbackBridge feedback={app.feedback} />
    {app.view()}
  </AntApp>
</ConfigProvider>
```

After that, `OrdersPage.save()` can simply call `this.app.feedback.success('Saved')`. Three things to notice:

- the hand-over has to happen in `useEffect` — writing to the object during a render is writing state during a
  render;
- the bridge must sit below the provider that actually supplies the context, otherwise it gets the default value;
- the bridge is eight lines, and the library does not ship one — see "known limits" below.

## Where form state goes

Three options, pick by need:

| Approach | State lives in | Good for |
| --- | --- | --- |
| fully controlled fields on the object | the object | other objects need to read or change the values; you write the validation |
| `Form` owns the values, the object owns the records | the component | you want antd's validation engine (the demo's choice) |
| capture the `Form` instance into the object | the object | object methods must call `form.setFieldsValue()` |

The demo uses the second: opening the modal bumps `formKey` so the `Form` remounts, `initialValues` refills it from
the current record, and `onFinish` hands the values to `this.save()`. No form instance is stored anywhere.

The third option works exactly like `Feedback`, capturing what `Form.useForm()` returns.

## Controlled table state

Paging, sorting, selection and filtering can all be object fields (`page` / `pageSize` / `sortField` / `selected`),
with `dataSource` derived as a computed. The upside is that other objects can read and change them (a "this week
only" button elsewhere is just a method call); the cost is that you write that logic, where antd's internal state
would have handled it — but then it is not in the object graph and nothing else can touch it.

## Splitting a big page

`OrdersPage` is three islands: `toolbar` (search/filter/bulk actions), `table` (the grid plus its nested provider),
and `dialog` (the validated form). The form's hooks do not affect the other two; `columns` is a computed getter, so
a language switch re-renders the table and leaves the page header alone.

## Known limits

Listed honestly, because these are what the current version does *not* do:

- **No automatic injection of context instances.** `App.useApp()` / `message.useMessage()` need a hand-written
  bridge (about eight lines).
- **Hook state dies with the island.** Navigate away and back, and the form and any `Modal.useModal()` instance are
  new; keep that state on an object if it must survive.
- **No writing state in a render method**, including "store the hook's result on a field".
- **SSR and concurrent rendering are untested.** `ObservedRender` runs `reaction.track` during render, which should
  work on the server, but nothing covers it.
- **Heavily stateful components** like `Table` virtual scrolling or `Form.List` have not been tried specifically;
  by the rules above they are ordinary controlled components, but they are not in the demo.
