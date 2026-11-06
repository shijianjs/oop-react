---
id: errors
title: 错误处理
slug: /guide/errors
---

每个渲染方法外面都套了一个 React 错误边界。一个方法抛错，只有它那个岛变成 fallback，兄弟岛和父岛照常渲染。

```tsx
class Report {
  broken = true;

  @OopReactRender()
  view() {
    return (
      <section>
        {this.header()}
        {this.body()}   {/* 抛错时只有这里被替换 */}
      </section>
    );
  }

  @OopReactRender()
  header() {
    return <h2>周报</h2>;
  }

  @OopReactRender()
  body() {
    if (this.broken) throw new Error('数据格式不对');
    return <Chart />;
  }
}
```

为什么不用一个包裹整个应用的边界：那会让一次渲染错误吃掉整页，而这里每个岛都是可以独立失败、独立恢复的单位。

## 默认 fallback

不配置时是一个普通的 `<div>`：一行标题、错误信息、一个「Retry」按钮。它刻意不用任何设计系统 —— 库本身不
应该把 antd / MUI 拖进不需要它们的应用。

## 换成自己的

`OopReactConfigure({fallback})` 全局替换，fallback 收到三个字段：

```tsx
import {Alert, Button} from 'antd';
import {OopReactConfigure} from 'oop-react';

OopReactConfigure({
  fallback: ({error, name, reset}) => (
    <Alert
      type="error"
      showIcon
      message={`渲染失败：${name ?? '未知方法'}`}
      description={error instanceof Error ? error.message : String(error)}
      action={
        <Button size="small" onClick={reset}>
          重试
        </Button>
      }
    />
  ),
});
```

- `error`：方法抛出的那个值；
- `name`：`ClassName.method`（或 `OopReactComponent` 的 `name` 选项），用来定位是哪个岛；
- `reset`：清掉错误状态并重新渲染该方法。

**重试的语义要说清楚**：`reset` 只是清除「这个岛失败了」这个状态，然后重新执行渲染方法。如果导致失败的
状态还在，它就会再抛一次、再显示 fallback。所以真正的恢复通常要先把状态修好（比如另一个岛上的「恢复」按钮
调了 `this.recover()`），再点重试 —— 演示站点里的「故障隔离」卡片就是这个流程。

## 上报

```tsx
OopReactConfigure({
  onError: (error, name) => {
    reportToSentry(error, {extra: {island: name}});
  },
});
```

每个渲染方法每次抛错调用一次（React 自己的 `componentDidCatch` 时机）。默认实现是 `console.error`。

## 单独包一层

需要只保护某一段 JSX（而不是整个渲染方法）时，直接用导出的边界组件：

```tsx
import {OopReactErrorBoundary} from 'oop-react';

function Legacy() {
  return (
    <OopReactErrorBoundary name="LegacyChart">
      <ThirdPartyChart />
    </OopReactErrorBoundary>
  );
}
```

它用的是同一套 `fallback` / `onError` 配置。
