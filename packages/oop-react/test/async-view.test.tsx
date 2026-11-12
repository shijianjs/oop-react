import {render, screen} from '@testing-library/react';
import {describe, expect, it} from 'vitest';
import {OopReactAsyncView, type OopReactAsyncState} from '../src/index';

function state<T>(data: T | null, error: unknown = null): OopReactAsyncState<T> {
  return {data, error};
}

describe('OopReactAsyncView', () => {
  it('shows the skeleton while there is no data', () => {
    render(
      <>
        {OopReactAsyncView(state<number[]>(null), {
          skeleton: <i>skeleton</i>,
          ready: <i>ready</i>,
        })}
      </>,
    );

    expect(screen.getByText('skeleton')).toBeTruthy();
    expect(screen.queryByText('ready')).toBe(null);
  });

  it('shows the content once there is data', () => {
    render(
      <>
        {OopReactAsyncView(state([1, 2]), {
          skeleton: <i>skeleton</i>,
          ready: <i>ready</i>,
        })}
      </>,
    );

    expect(screen.getByText('ready')).toBeTruthy();
    expect(screen.queryByText('skeleton')).toBe(null);
  });

  it('shows the failure as the whole content when there is no data', () => {
    const error = new Error('boom');

    render(
      <>
        {OopReactAsyncView(state<number[]>(null, error), {
          skeleton: <i>skeleton</i>,
          ready: <i>ready</i>,
          failed: (reason) => <b>{String(reason)}</b>,
        })}
      </>,
    );

    expect(screen.getByText('Error: boom')).toBeTruthy();
    expect(screen.queryByText('skeleton')).toBe(null);
  });

  it('keeps stale data and shows the failure above it', () => {
    render(
      <>
        {OopReactAsyncView(state([1], new Error('boom')), {
          skeleton: <i>skeleton</i>,
          ready: <i>ready</i>,
          failed: (reason) => <b>{String(reason)}</b>,
        })}
      </>,
    );

    expect(screen.getByText('ready')).toBeTruthy();
    expect(screen.getByText('Error: boom')).toBeTruthy();
  });

  it('shows nothing extra for a failure when no renderer is given', () => {
    render(
      <>
        {OopReactAsyncView(state<number[]>(null, new Error('boom')), {
          skeleton: <i>skeleton</i>,
          ready: <i>ready</i>,
        })}
      </>,
    );

    expect(screen.queryByText('skeleton')).toBe(null);
    expect(screen.queryByText('ready')).toBe(null);
  });
});
