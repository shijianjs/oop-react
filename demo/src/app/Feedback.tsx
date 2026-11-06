import {App as AntApp} from 'antd';
import type {MessageInstance} from 'antd/es/message/interface';
import {OopReactBridge} from 'oop-react';

/**
 * antd's `message` only exists inside a component: `App.useApp()` reads the
 * context that gives it the current theme and locale. An object method cannot
 * call a hook — so the value is handed over once by `OopReactBridge` and then
 * lives here, where any method can call it.
 *
 * This is the general shape for every context-bound instance an object needs:
 * `Form.useForm`, `Modal.useModal`, `message.useMessage`, … see
 * `pages/orders/OrderEditor.tsx` for the form case.
 */
export class Feedback {
  #message: MessageInstance | null = null;

  // Arrow fields rather than methods: this object is not observable, so nothing
  // binds a plain method, and `assign={feedback.bind}` would lose `this`.
  bind = (message: MessageInstance | null): void => {
    this.#message = message;
  };

  success(text: string): void {
    void this.#message?.success(text);
  }

  error(text: string): void {
    void this.#message?.error(text);
  }
}

export function FeedbackHost({feedback}: {feedback: Feedback}) {
  const {message} = AntApp.useApp();
  return <OopReactBridge value={message} assign={feedback.bind} release={() => feedback.bind(null)} />;
}
