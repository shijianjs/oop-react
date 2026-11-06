import {Component, createElement, type ErrorInfo, type ReactNode} from 'react';
import {getOopReactConfig} from '../config/config';

export interface OopReactErrorBoundaryProps {
  /** Reported to `config.onError` and passed to the fallback, for diagnosis. */
  name?: string;
  children?: ReactNode;
}

interface OopReactErrorBoundaryState {
  failure: {error: unknown} | null;
}

/**
 * One boundary per render method, so a broken island renders a fallback in its
 * own place and leaves every sibling — including the rest of the same component
 * — intact.
 *
 * The boundary is a class because React has no hook equivalent; it holds no
 * application state, only "did this subtree throw".
 */
export class OopReactErrorBoundary extends Component<
  OopReactErrorBoundaryProps,
  OopReactErrorBoundaryState
> {
  override state: OopReactErrorBoundaryState = {failure: null};

  static getDerivedStateFromError(error: unknown): OopReactErrorBoundaryState {
    return {failure: {error}};
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    // React already logs the component stack; the reporter exists so an
    // application can send it somewhere durable instead.
    void info;
    getOopReactConfig().onError(error, this.props.name);
  }

  #reset = (): void => {
    this.setState({failure: null});
  };

  override render(): ReactNode {
    const {failure} = this.state;
    if (failure !== null) {
      const {fallback: Fallback} = getOopReactConfig();
      return createElement(Fallback, {
        error: failure.error,
        name: this.props.name,
        reset: this.#reset,
      });
    }
    return this.props.children;
  }
}
