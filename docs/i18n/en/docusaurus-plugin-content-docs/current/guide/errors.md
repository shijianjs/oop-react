---
id: errors
title: Error handling
slug: /guide/errors
---

Every render method is wrapped in a React error boundary. When one throws, only its island becomes a fallback;
siblings and the parent keep rendering.

```tsx
class Report {
  broken = true;

  constructor() {
    OopReactObservable(this);
  }

  @OopReactRender()
  view() {
    return (
      <section>
        {this.header()}
        {this.body()}   {/* on failure, only this one is replaced */}
      </section>
    );
  }

  @OopReactRender()
  header() {
    return <h2>Weekly report</h2>;
  }

  @OopReactRender()
  body() {
    if (this.broken) throw new Error('Unexpected payload');
    return <Chart />;
  }
}
```

Why not a single boundary around the whole app: that lets one failure eat the page, while here every island is a unit
that can fail and recover on its own.

## The default fallback

Out of the box it is a plain `<div>`: one heading, the error message, a "Retry" button. It deliberately uses no design
system — the library should not drag antd or MUI into an application that never asked for it.

## Replacing it

```tsx
import {Alert, Button} from 'antd';
import {OopReactConfigure} from 'oop-react';

OopReactConfigure({
  fallback: ({error, name, reset}) => (
    <Alert
      type="error"
      showIcon
      message={`Render failed: ${name ?? 'unknown method'}`}
      description={error instanceof Error ? error.message : String(error)}
      action={
        <Button size="small" onClick={reset}>
          Retry
        </Button>
      }
    />
  ),
});
```

- `error`: whatever the method threw;
- `name`: the island's name, `<class name>.<method name>` — a production build minifies class names, so name the
  ones a human reads with `@OopReactRender({name: 'FlakySection'})`;
- `reset`: clears the error and runs the render method again.

**What retry means**: `reset` only clears "this island failed" and re-renders the method. If the state that caused
the failure is still there, it throws again. Real recovery usually means fixing the state first (another island
calling `this.recover()`) and then retrying — the failure card in the demo walks through exactly that.

## Reporting

```tsx
OopReactConfigure({
  onError: (error, name) => {
    reportToSentry(error, {extra: {island: name}});
  },
});
```

Called once per throw of a render method (the same moment as React's `componentDidCatch`). The default is
`console.error`.

## Protecting a smaller piece

```tsx
import {OopReactErrorBoundary} from 'oop-react';

function Legacy() {
  return (
    <OopReactErrorBoundary name="LegacyChart">
      <ThirdPartyChart />
    </OopReactErrorBoundary>
  );
}
```

It uses the same `fallback` / `onError` configuration.
