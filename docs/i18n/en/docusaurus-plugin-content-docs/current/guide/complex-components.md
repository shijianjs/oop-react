---
id: complex-components
title: Complex components and hooks
slug: /guide/complex-components
---

Component libraries pull you back to React's boundaries: providers, context, hooks that own a component instance.
This page is that boundary checklist; the reference implementation is the demo's "Orders" page
(`demo/src/pages/orders/`).

## The short version

| What you need | Where it goes | How |
| --- | --- | --- |
| a provider (`ConfigProvider`, antd `App`, theme) | some island's JSX | any object's render method can wrap a subtree — not just the app root |
| a side effect (`reaction` / `autorun`) | the object | create it in the constructor, expose `dispose()` |
| a context-bound instance (`Form`, `message`, `modal`) | the object | hand it over once with `OopReactBridge`, then call it freely |
| a hook used by one island and by nobody else | that island | call it at the top of the render method |
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

Everything outside the page keeps the global size — the provider only affects that subtree. **The cost**: when the
provider's island re-renders, ordinary React components inside it re-render too; **nested islands do not**, because
islands are memoized (see [render methods](./render-methods.md)) and skip when their props are unchanged. So a
provider can sit as deep as it needs to, best in the smallest island that requires it.

Even the application-level provider needs no dedicated React component: the demo's `App.root()` is a render method —
`ConfigProvider` + `<AntApp>` wrapping `this.view()`, and the entry file only writes
`createRoot(el).render(app.root())`. antd components take the new theme through context, so they follow it whether
the enclosing island re-renders or is skipped by the memo.

## `reaction` belongs to the object

A side effect does not have to live at the application entry. Whoever owns the state can own the effect that follows
it:

```ts
export class Settings {
  theme: 'light' | 'dark' = 'light';
  #dispose: (() => void) | null = null;

  constructor() {
    OopReactObservable(this);
    this.#dispose = reaction(
      () => this.theme,
      (theme) => {
        document.documentElement.dataset.theme = theme;
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

An island *is* a component, so its render method can call hooks. The three rules are React's, only easier to forget:

1. **Call order must be stable.** No hook after `if (...) return …`; a method that throws or returns early — like
   `content()` — should not use hooks at all.
2. **The instance belongs to that island.** Two parent islands calling the same method means two instances; when the
   island unmounts (a route change), the instance is gone.
3. **Do not store a hook result on the object.** Writing state during a render is wrong here too. Use the bridge.

## The bridge: handing instances to objects

`Form` / `message` / `modal` only exist inside a context. When an object method needs one, hand it over once with
`OopReactBridge`:

```tsx
function FeedbackHost({feedback}: {feedback: Feedback}) {
  const {message} = AntApp.useApp();
  return <OopReactBridge value={message} assign={feedback.bind} release={() => feedback.bind(null)} />;
}
```

It renders `null` and does one thing: **after commit** (in a `useEffect`) it assigns the value to the object, again
whenever the value changes, and calls `release` on unmount. From then on
`this.app.feedback.success('Saved')` works from any object method.

:::caution The hand-over has to happen in an effect
Writing to the object during a render is writing state during a render — React will warn about updating another
component mid-render. The bridge keeps it inside `useEffect`, which is the whole reason it exists.
:::

## The form is an object, not a local in a render method

This is the step that is easiest to get wrong: leave the result of `Form.useForm()` inside a render method and the
object can never touch the form — `setFieldsValue`, `validateFields`, `resetFields` are all component-only, and the
form degrades into a fancy set of controlled inputs.

The object has to hold the instance instead:

```tsx
export class OrderEditor {
  open = false;
  saving = false;
  #form: FormInstance<OrderDraft> | null = null;

  bindForm(form: FormInstance<OrderDraft> | null): void {
    this.#form = form;
  }

  /** the object validates, then hands the values to the page */
  *submit(): Generator<Promise<unknown>, void, unknown> {
    const form = this.#form;
    if (form === null) return;

    let values: OrderDraft;
    try {
      values = (yield form.validateFields()) as OrderDraft;
    } catch {
      return; // antd already marked the fields; keep the dialog open
    }

    this.saving = true;
    try {
      yield this.page.save(values);
      form.resetFields();
      this.open = false;
    } finally {
      this.saving = false;
    }
  }

  @OopReactRender()
  dialog() {
    const [form] = Form.useForm<OrderDraft>();   // hook in the island, instance handed to the object
    return (
      <>
        <OopReactBridge value={form} assign={this.bindForm} release={this.releaseForm} />
        <Modal open={this.open} onOk={() => void this.submit()}>
          <Form form={form} initialValues={this.initialValues}>…</Form>
        </Modal>
      </>
    );
  }
}
```

So:

- **submitting is driven by the object**: the OK button calls `editor.submit()`, which validates and then saves;
- **resetting is driven by the object**: `editor.resetFields()`;
- **initial values can come from anywhere**: another island in the toolbar calls
  `this.editor.create({customer: 'Example Ltd'})`, the editor stores it as `preset`, and the form's `initialValues`
  reads it — no props, no context between the two islands.

That is what "a form opened from far away" looks like: the caller knows `editor.create(...)` and nothing about
`Form`.

## Where form state goes

| Approach | State lives in | Good for |
| --- | --- | --- |
| fully controlled fields on the object | the object | other objects need the values; you write the validation |
| `Form` owns the values, the object owns the records | the component | you only want antd's validation engine |
| **the instance is handed to the object** (recommended) | the object holds the component instance | object methods must call `validateFields` / `setFieldsValue` / `resetFields` |

The demo uses the third. The second remains valid: not every form needs to be model-driven.

## Controlled table state

Paging, sorting, selection and filtering can all be object fields (`page` / `pageSize` / `sortField` / `selected`),
with `dataSource` derived as a computed. The upside is that other objects can read and change them; the cost is that
you write that logic, where antd's internal state would have handled it — but then it is not in the object graph and
nothing else can touch it.

## Splitting a big page

The orders page is three files:

| File | Responsibility |
| --- | --- |
| `pages/orders/model.ts` | types and seed data, no React |
| `pages/orders/OrdersPage.tsx` | table state, columns, the toolbar and table islands, `save()` |
| `pages/orders/OrderEditor.tsx` | the form object: open state, initial values, validation, submit, reset |

The page's `view()` only composes: `{this.toolbar()}{this.table()}{this.editor.dialog()}`. Toolbar and table are
separate islands, so touching one never re-runs the other; the dialog is a third island that only re-renders on the
editor's own state.

## Known limits

- **The bridge must sit under the provider that actually supplies the context**, otherwise it receives the default.
- **Hook state dies with the island.** Navigate away and back, and the `Form` instance is new; put the state on an
  object if it must survive.
- **No writing state in a render method**, including "store the hook's result on a field" — use the bridge.
- **`Form.List` and `Table` virtual scrolling** have not been tried specifically; by the rules above they are
  ordinary controlled components, but they are not in the demo.
- **SSR and concurrent rendering are untested.**
