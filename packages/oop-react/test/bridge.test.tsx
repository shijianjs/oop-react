import {act, render} from '@testing-library/react';
import {useState} from 'react';
import {describe, expect, it} from 'vitest';
import {OopReactBridge} from '../src/index';

// A stand-in for Form.useForm() / App.useApp(): a hook whose value the object
// has to end up holding.
let bumpOutside: () => void = () => {};

function useTicket(): number {
  const [ticket, setTicket] = useState(0);
  bumpOutside = () => setTicket((value) => value + 1);
  return ticket;
}

describe('OopReactBridge', () => {
  it('hands the value over after mount and again when it changes', () => {
    const seen: number[] = [];
    const released: number[] = [];

    function Host() {
      const ticket = useTicket();
      return (
        <OopReactBridge
          value={ticket}
          assign={(value) => seen.push(value)}
          release={() => released.push(1)}
        />
      );
    }

    render(<Host />);
    expect(seen).toEqual([0]);

    act(() => bumpOutside());
    expect(seen).toEqual([0, 1]);
    // Re-assigning a new value releases the previous one first.
    expect(released).toEqual([1]);
  });

  it('releases on unmount', () => {
    let released = 0;

    function Host() {
      return <OopReactBridge value="form" assign={() => {}} release={() => (released += 1)} />;
    }

    const {unmount} = render(<Host />);
    expect(released).toBe(0);

    unmount();
    expect(released).toBe(1);
  });
});
