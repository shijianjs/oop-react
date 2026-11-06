import {useEffect, useRef, type ReactNode} from 'react';

export interface OopReactBridgeProps<Value> {
  /** What to hand over — usually the result of a hook called by this component's parent. */
  value: Value;
  /** Receives the value after mount and again whenever it changes. */
  assign: (value: Value) => void;
  /** Runs on unmount and before a new value is assigned, e.g. to drop the reference. */
  release?: () => void;
}

/**
 * Hands a React-context-bound value to an object.
 *
 * It exists because a component library's most useful instances only exist
 * inside a component: `Form.useForm()`, `Modal.useModal()`, `App.useApp()`.
 * An object cannot call a hook, but it can *hold* the result — and then any
 * method can drive the form, show a message, or open a dialog. This component
 * is the only place where the hand-over is allowed to happen: after commit, in
 * an effect, never during a render.
 *
 * ```tsx
 * function EditorHost({editor}: {editor: OrderEditor}) {
 *   const [form] = Form.useForm<Draft>();
 *   return <OopReactBridge value={form} assign={(next) => editor.bindForm(next)} />;
 * }
 * ```
 *
 * Renders nothing. The `assign`/`release` functions may be re-created on every
 * render; only a change of `value` calls them again.
 */
export function OopReactBridge<Value>({value, assign, release}: OopReactBridgeProps<Value>): ReactNode {
  // Kept in a ref so a re-created callback does not re-run the effect, and
  // updated in its own effect (declared first) rather than during render.
  const latest = useRef({assign, release});

  useEffect(() => {
    latest.current = {assign, release};
  });

  useEffect(() => {
    latest.current.assign(value);
    return () => latest.current.release?.();
  }, [value]);

  return null;
}
