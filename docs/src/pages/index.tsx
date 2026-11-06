import Link from '@docusaurus/Link';
import Translate, {translate} from '@docusaurus/Translate';
import useBaseUrl from '@docusaurus/useBaseUrl';
import CodeBlock from '@theme/CodeBlock';
import Layout from '@theme/Layout';
import type {ReactNode} from 'react';
import styles from './index.module.css';

/**
 * Every string here goes through `<Translate>`, so English lives in
 * `i18n/en/code.json` rather than in a second copy of this file. `write-translations`
 * adds new ids; the message values are filled in by hand.
 */
const FEATURES = [
  {
    key: 'state',
    title: (
      <Translate id="home.feature.state.title">字段就是状态</Translate>
    ),
    body: (
      <Translate id="home.feature.state.body">
        没有 useState，也没有 setter 函数。改状态就是 this.count += 1。
      </Translate>
    ),
  },
  {
    key: 'callbacks',
    title: (
      <Translate id="home.feature.callbacks.title">方法就是回调</Translate>
    ),
    body: (
      <Translate id="home.feature.callbacks.body">
        this.save 直接当 onClick。实例方法已经绑好，引用永远稳定。
      </Translate>
    ),
  },
  {
    key: 'islands',
    title: (
      <Translate id="home.feature.islands.title">重渲染只在岛里</Translate>
    ),
    body: (
      <Translate id="home.feature.islands.body">
        @OopReactRender() 方法只订阅自己读到的字段，兄弟节点一动不动。
      </Translate>
    ),
  },
  {
    key: 'boundaries',
    title: (
      <Translate id="home.feature.boundaries.title">一个岛一个边界</Translate>
    ),
    body: (
      <Translate id="home.feature.boundaries.body">
        某个渲染方法抛错，只有它变成 fallback，其余部分照常工作。
      </Translate>
    ),
  },
  {
    key: 'structure',
    title: (
      <Translate id="home.feature.structure.title">逻辑不搬家</Translate>
    ),
    body: (
      <Translate id="home.feature.structure.body">
        对象之间相互持有、直接调用方法，不需要状态提升和回调下传。
      </Translate>
    ),
  },
  {
    key: 'replaceable',
    title: (
      <Translate id="home.feature.replaceable.title">默认实现可替换</Translate>
    ),
    body: (
      <Translate id="home.feature.replaceable.body">
        订阅、可观察化、fallback、错误上报都是配置项，换掉不留后门。
      </Translate>
    ),
  },
];

const SAMPLE = `class Counter {
  count = 0;

  constructor() {
    OopReactObservable(this);
  }

  increment(): void {
    this.count += 1;
  }

  @OopReactRender()
  view() {
    return <button onClick={this.increment}>{this.count}</button>;
  }
}

const counter = new Counter();

export function CounterView() {
  return counter.view();
}`;

export default function Home(): ReactNode {
  const demoHref = useBaseUrl('/demo/');

  return (
    <Layout
      title="oop-react"
      description={translate({
        id: 'home.description',
        message: '状态和行为留在一个普通类里，对象之间相互持有，React 只在最外层出现一次。',
      })}
    >
      <header className={styles.hero}>
        <h1 className={styles.title}>oop-react</h1>
        <p className={styles.tagline}>
          <Translate id="home.tagline">
            状态和行为留在一个普通类里，只有被 @OopReactRender() 注解的方法参与重渲染。
            对象之间相互持有、直接调用，React 只在最外层出现一次。
          </Translate>
        </p>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to="/getting-started">
            <Translate id="home.cta.start">快速开始</Translate>
          </Link>
          {/* A plain anchor: the demo is a separate Vite build served from a
              sibling directory, not a route this site's router owns. */}
          <a className="button button--secondary button--lg" href={demoHref}>
            <Translate id="home.cta.demo">在线演示</Translate>
          </a>
        </div>
        <div className={styles.code}>
          <CodeBlock language="tsx" title="counter.tsx">
            {SAMPLE}
          </CodeBlock>
        </div>
      </header>

      <main className={styles.section}>
        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <div className={styles.card} key={feature.key}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
