import {Alert, Button} from 'antd';
import type {OopReactFallbackProps} from 'oop-react';

/**
 * Replaces the library's plain default fallback with an antd alert.
 *
 * This is the "defaults are replaceable" seam in practice: the library itself
 * has no design-system dependency, the demo does.
 */
export function DemoFallback({error, name, reset}: OopReactFallbackProps) {
  return (
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
  );
}
