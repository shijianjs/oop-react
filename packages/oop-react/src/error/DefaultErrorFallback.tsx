import type {CSSProperties} from 'react';
import type {OopReactFallbackProps} from '../config/OopReactFallbackProps';

const box: CSSProperties = {
  border: '1px solid currentColor',
  borderRadius: 6,
  color: 'inherit',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  padding: '8px 12px',
};

const message: CSSProperties = {
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
  margin: 0,
  opacity: 0.75,
  overflowWrap: 'anywhere',
};

const retry: CSSProperties = {
  alignSelf: 'flex-start',
};

/**
 * The fallback a failing render method lands on when the consumer has not
 * configured its own with `OopReactConfigure({fallback})`.
 *
 * It is intentionally plain — a `<div>` with inline styles and no design-system
 * dependency — because the library must not drag a component kit into an
 * application that never asked for one.
 */
export function DefaultErrorFallback({error, name, reset}: OopReactFallbackProps) {
  return (
    <div style={box} role="alert" data-oop-react-fallback="">
      <strong>{name ? `Render failed: ${name}` : 'Render failed'}</strong>
      <p style={message}>{describe(error)}</p>
      <button type="button" onClick={reset} style={retry}>
        Retry
      </button>
    </div>
  );
}

function describe(error: unknown): string {
  if (error instanceof Error) {
    return `${error.name}: ${error.message}`;
  }
  return String(error);
}
