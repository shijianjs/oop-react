import {animated, useSpring} from '@react-spring/web';
import {Button, Card, Space, Typography} from 'antd';
import {OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

/**
 * Two ways to animate, both driven by plain fields:
 *
 * - **CSS**: the field decides the class / inline style, the transition does the
 *   motion. Nothing React-specific at all.
 * - **react-spring**: the hook lives inside one island, and the spring follows a
 *   field like any other value.
 */
@OopReactState
export class AnimationPage implements Page {
  readonly path = 'animation';
  readonly titleKey = 'route.animation';
  readonly sourcePath = 'demo/src/pages/animation/AnimationPage.tsx';
  @OopReactIgnore
  @OopReactIgnore readonly app: App;

  /** CSS demo: the box slides and fades with this flag. */
  shifted = false;
  /** react-spring demo: the card pops. */
  popped = false;
  /** A tiny list to show layout animation through a class only. */
  items: {id: number; text: string}[] = [
    {id: 1, text: 'one'},
    {id: 2, text: 'two'},
    {id: 3, text: 'three'},
  ];

  constructor(app: App) {
    this.app = app;
  }

  toggleShifted(): void {
    this.shifted = !this.shifted;
    this.app.log.add(`animation.shifted = ${this.shifted}`);
  }

  togglePopped(): void {
    this.popped = !this.popped;
    this.app.log.add(`animation.popped = ${this.popped}`);
  }

  addItem(): void {
    const id = this.items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    this.items.push({id, text: `item ${id}`});
  }

  removeItem(id: number): void {
    this.items = this.items.filter((item) => item.id !== id);
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('animation.title')}
          description={t('animation.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <div className="animation-grid">
          <Card size="small" title={t('animation.css')}>
            <Space direction="vertical" size="middle" style={{width: '100%'}}>
              <div className="animation-track">
                <div
                  className="animation-box"
                  style={{
                    transform: `translateX(${this.shifted ? 220 : 0}px) rotate(${this.shifted ? 45 : 0}deg)`,
                    background: this.shifted ? '#1677ff' : '#91caff',
                  }}
                />
              </div>
              <Button onClick={this.toggleShifted}>{t('animation.toggle')}</Button>
              <Typography.Text type="secondary">{t('animation.css.hint')}</Typography.Text>
            </Space>
          </Card>

          <Card size="small" title={t('animation.spring')}>
            <Space direction="vertical" size="middle" style={{width: '100%'}}>
              {this.spring()}
              <Button onClick={this.togglePopped}>{t('animation.toggle')}</Button>
              <Typography.Text type="secondary">{t('animation.spring.hint')}</Typography.Text>
            </Space>
          </Card>

          <Card size="small" title={t('animation.list')}>
            <Space direction="vertical" size="small" style={{width: '100%'}}>
              {this.list()}
              <Button size="small" onClick={() => this.addItem()}>
                {t('animation.list.add')}
              </Button>
            </Space>
          </Card>
        </div>
      </div>
    );
  }

  /** The hook belongs to this island; the value it animates is a field. */
  @OopReactRender()
  spring() {
    return <SpringBox popped={this.popped} />;
  }

  @OopReactRender()
  list() {
    return (
      <div>
        {this.items.map((item) => (
          <div key={item.id} className="animation-item" onClick={() => this.removeItem(item.id)}>
            {item.text}
          </div>
        ))}
      </div>
    );
  }
}

/**
 * A component because `useSpring` is a hook — and a good illustration of where a
 * component still earns its keep: it takes one prop and animates it.
 */
function SpringBox({popped}: {popped: boolean}) {
  const style = useSpring({
    scale: popped ? 1.15 : 1,
    opacity: popped ? 1 : 0.55,
    rotate: popped ? 8 : 0,
    config: {tension: 260, friction: 18},
  });

  return (
    <animated.div className="animation-spring" style={style}>
      <span>{popped ? '✷' : '○'}</span>
    </animated.div>
  );
}
