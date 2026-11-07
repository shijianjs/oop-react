import {Alert, Button, Card, Space, Tag, Typography} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

type Player = 'X' | 'O';
type Square = Player | null;

interface Snapshot {
  squares: Square[];
  /** Which square the move was played on: -1 for the initial board. */
  move: number;
}

/** The three-in-a-row test, kept as a pure function: no React, no state. */
function winnerOf(squares: Square[]): {player: Player; line: number[]} | null {
  const lines = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const line of lines) {
    const [a, b, c] = line as [number, number, number];
    const first = squares[a];
    if (first !== null && first !== undefined && first === squares[b] && first === squares[c]) {
      return {player: first, line};
    }
  }

  return null;
}

const column = (index: number) => (index % 3) + 1;
const row = (index: number) => Math.floor(index / 3) + 1;

/**
 * The official tutorial, as an object — plus every piece of homework the page
 * leaves at the end:
 *
 * 1. move coordinates in the history; 2. the current move is highlighted;
 * 3. the board is two loops, not nine hard-coded squares; 4. a toggle for the
 * history direction; 5. the winning line is highlighted; 6. a draw message.
 */
@OopReactState
export class TicTacToePage implements Page {
  readonly path = 'tictactoe';
  readonly titleKey = 'route.tictactoe';
  readonly sourcePath = 'demo/src/pages/tictactoe/TicTacToePage.tsx';
  @OopReactIgnore
  @OopReactIgnore readonly app: App;

  history: Snapshot[] = [{squares: Array<Square>(9).fill(null), move: -1}];
  step = 0;
  ascending = true;

  constructor(app: App) {
    this.app = app;
  }

  get current(): Snapshot {
    return this.history[this.step] ?? this.history[0]!;
  }

  get winner(): {player: Player; line: number[]} | null {
    return winnerOf(this.current.squares);
  }

  get isDraw(): boolean {
    return this.winner === null && this.current.squares.every((square) => square !== null);
  }

  get nextPlayer(): Player {
    return this.step % 2 === 0 ? 'X' : 'O';
  }

  /** The history in display order: the homework wants this reversible. */
  get moves(): {snapshot: Snapshot; step: number}[] {
    const list = this.history.map((snapshot, step) => ({snapshot, step}));
    return this.ascending ? list : [...list].reverse();
  }

  play(index: number): void {
    const {squares} = this.current;
    if (squares[index] !== null || this.winner !== null) return;

    const next = [...squares];
    next[index] = this.nextPlayer;
    this.history = [...this.history.slice(0, this.step + 1), {squares: next, move: index}];
    this.step += 1;
    this.app.log.add(`ticTacToe.play(${column(index)}, ${row(index)})`);
  }

  jumpTo(step: number): void {
    this.step = step;
  }

  toggleOrder(): void {
    this.ascending = !this.ascending;
  }

  reset(): void {
    this.history = [{squares: Array<Square>(9).fill(null), move: -1}];
    this.step = 0;
    this.app.log.add('ticTacToe.reset()');
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('tictactoe.title')}
          description={t('tictactoe.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <div className="tictactoe">
          <Space direction="vertical" size="middle" style={{width: '100%'}}>
            {this.status()}
            {this.board()}
            <Space>
              <Button onClick={this.reset}>{t('tictactoe.reset')}</Button>
              <Button onClick={this.toggleOrder}>
                {this.ascending ? t('tictactoe.order.desc') : t('tictactoe.order.asc')}
              </Button>
            </Space>
          </Space>
          {this.historyList()}
        </div>
      </div>
    );
  }

  @OopReactRender()
  status() {
    const {t} = this.app.settings;
    const winner = this.winner;

    if (winner !== null) {
      return <Alert type="success" showIcon message={t('tictactoe.winner', {player: winner.player})} />;
    }
    if (this.isDraw) {
      return <Alert type="warning" showIcon message={t('tictactoe.draw')} />;
    }
    return <Alert type="info" showIcon message={t('tictactoe.turn', {player: this.nextPlayer})} />;
  }

  /** Homework 3: three rows of three, built from loops instead of nine literals. */
  @OopReactRender()
  board() {
    const winner = this.winner;
    const squares = this.current.squares;

    return (
      <div className="tictactoe-board">
        {[0, 1, 2].map((rowIndex) => (
          <div className="tictactoe-row" key={rowIndex}>
            {[0, 1, 2].map((columnIndex) => {
              const index = rowIndex * 3 + columnIndex;
              const value = squares[index]!;
              const winning = winner?.line.includes(index) ?? false;

              return (
                <button
                  type="button"
                  key={index}
                  className={winning ? 'tictactoe-square tictactoe-square--win' : 'tictactoe-square'}
                  onClick={() => this.play(index)}
                  aria-label={`${column(index)},${row(index)}`}
                >
                  {value}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  @OopReactRender()
  historyList() {
    const {t} = this.app.settings;
    const current = this.step;

    return (
      <Card size="small" title={t('tictactoe.history')} className="tictactoe-history">
        <Space direction="vertical" size={4} style={{width: '100%'}}>
          {this.moves.map(({snapshot, step}) => {
            const label =
              snapshot.move === -1
                ? t('tictactoe.history.start')
                : t('tictactoe.history.move', {
                    move: step,
                    column: column(snapshot.move),
                    row: row(snapshot.move),
                  });

            return step === current ? (
              <Tag color="blue" key={step}>
                {t('tictactoe.history.current', {label})}
              </Tag>
            ) : (
              <Button key={step} type="link" size="small" onClick={() => this.jumpTo(step)}>
                {label}
              </Button>
            );
          })}
          <Typography.Text type="secondary">{t('tictactoe.history.hint')}</Typography.Text>
        </Space>
      </Card>
    );
  }
}
