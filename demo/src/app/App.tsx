import {Button, Space, Typography} from 'antd';
import {CounterCard} from '../counter/CounterCard';
import {FailureCard} from '../failure/FailureCard';
import {InviteCard} from '../invite/InviteCard';
import {TodoCard} from '../todos/TodoCard';

/** On GitHub Pages the demo lives under `<site>/demo/`; locally it lives at `/`. */
const docsHref = import.meta.env.BASE_URL.replace(/demo\/$/, '');

export function App() {
  return (
    <div className="page">
      <header className="page-header">
        <Typography.Title level={1} style={{marginBottom: 8}}>
          oop-react
        </Typography.Title>
        <Typography.Paragraph style={{marginBottom: 16, maxWidth: '62ch'}}>
          状态、行为、回调都待在一个普通类里。只有标了 <code>@OopReactRender()</code>{' '}
          的方法参与重渲染，其余部分是稳定上下文，不随渲染重跑。
        </Typography.Paragraph>
        <Space>
          <Button type="primary" href={docsHref}>
            读文档
          </Button>
          <Button href="https://github.com/shijianjs/oop-react">GitHub</Button>
        </Space>
      </header>

      <main className="page-grid">
        <CounterCard />
        <TodoCard />
        <InviteCard />
        <FailureCard />
      </main>
    </div>
  );
}
