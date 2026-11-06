export interface OopReactFallbackProps {
  /** Whatever the render method threw. */
  error: unknown;
  /** `ClassName.methodName`, or the name given to `OopReactComponent`. */
  name?: string;
  /** Clears the error and renders the method again. */
  reset: () => void;
}
