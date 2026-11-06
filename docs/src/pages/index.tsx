import Link from '@docusaurus/Link';
import useBaseUrl from '@docusaurus/useBaseUrl';
import Layout from '@theme/Layout';
import type {ReactNode} from 'react';
import styles from './index.module.css';

const FEATURES = [
  {
    title: '字段就是状态',
    body: '没有 useState，也没有 setter 函数。改状态就是 this.count += 1。',
  },
  {
    title: '方法就是回调',
    body: 'this.save 直接当 onClick。实例方法已经绑好，引用永远稳定。',
  },
  {
    title: '重渲染只在岛里',
    body: '@OopReactRender() 方法只订阅自己读到的字段，兄弟节点一动不动。',
  },
  {
    title: '一个岛一个边界',
    body: '某个渲染方法抛错，只有它变成 fallback，其余部分照常工作。',
  },
  {
    title: '逻辑不搬家',
    body: '对象之间相互持有、直接调用方法，不需要状态提升和回调下传。',
  },
  {
    title: '默认实现可替换',
    body: '订阅、可观察化、fallback、错误上报都是配置项，换掉不留后门。',
  },
];

const SAMPLE = `class Counter {
  count = 0;

  increment(): void {
    this.count += 1;
  }

  @OopReactRender()
  view() {
    return <button onClick={this.increment}>{this.count}</button>;
  }
}

export const CounterView = OopReactComponent(Counter, 'view');`;

export default function Home(): ReactNode {
  const demoHref = useBaseUrl('/demo/');

  return (
    <Layout
      title="oop-react"
      description="状态和行为留在一个普通类里，只有 @OopReactRender() 方法参与重渲染。"
    >
      <header className={styles.hero}>
        <h1 className={styles.title}>oop-react</h1>
        <p className={styles.tagline}>
          状态和行为留在一个普通类里，只有 <code>@OopReactRender()</code> 方法参与重渲染。
          于是没有 useCallback，没有依赖数组，也没有把状态一层层往上提。
        </p>
        <div className={styles.actions}>
          <Link className="button button--primary button--lg" to="/getting-started">
            快速开始
          </Link>
          {/* A plain anchor: the demo is a separate Vite build served from a
              sibling directory, not a route this site's router owns. */}
          <a className="button button--secondary button--lg" href={demoHref}>
            在线演示
          </a>
        </div>
        <pre className={styles.code}>
          <code>{SAMPLE}</code>
        </pre>
      </header>

      <main className={styles.section}>
        <div className={styles.grid}>
          {FEATURES.map((feature) => (
            <div className={styles.card} key={feature.title}>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </main>
    </Layout>
  );
}
