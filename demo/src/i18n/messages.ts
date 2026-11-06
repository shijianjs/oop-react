export type Locale = 'zh' | 'en';

const zh = {
  'app.tagline': '状态在对象里，React 只在最外层',
  'nav.docs': '文档',
  'nav.source': '源码',
  'nav.theme.toDark': '深色',
  'nav.theme.toLight': '浅色',

  'route.overview': '概览',
  'route.counter': '计数器',
  'route.todos': '待办',
  'route.invite': '弹窗表单',
  'route.failure': '故障隔离',

  'overview.title': '一张对象图，五条路由',
  'overview.description':
    '导航、路由、主题、语言和下面每个页面都是对象。React 只负责把根岛挂到 #root 上。',
  'overview.graph':
    'App 持有 settings、router、log 和五个页面；每个页面又持有自己的子对象。左侧菜单就是 router.pages 的投影，点一下就是 router.go(page)。',
  'overview.cross':
    '计数器、待办、邀请都写着同一个共享的 log —— 它是 App 的字段，被深层子对象直接持有，没有回调和 context。',
  'overview.try': '试试：切到「待办」，勾一条，再回来看左侧的日志。',

  'counter.title': '计数器',
  'counter.description': '三个方法直接当 onClick。每次改动都写进共享的 log。',

  'todos.title': '待办',
  'todos.description': 'TodoItem 持有自己的 board 和整个 App，勾选时直接写 App 的日志。',
  'todos.placeholder': '写一条待办，回车提交',
  'todos.add': '添加',
  'todos.remaining': '还剩 {count} 条',
  'todos.empty': '还没有条目。',
  'todos.status.open': '未完成',
  'todos.status.done': '已完成',
  'todos.detail': '选中的待办',
  'todos.detail.empty': '点一条待办的标题，这里显示它 —— 一对一引用，只有这块重渲染。',
  'todos.detail.status': '状态：{status}',
  'todos.detail.toggle': '切换状态',
  'todos.detail.remove': '删除',

  'invite.title': '弹窗表单',
  'invite.description': '弹窗的开合就是对象上的一个布尔字段。',
  'invite.open': '邀请成员',
  'invite.name': '姓名',
  'invite.email': '邮箱',
  'invite.submit': '邀请',
  'invite.cancel': '取消',
  'invite.empty': '还没有邀请任何人。',
  'invite.hint': '表单值同样是字段，没有 useState。',

  'failure.title': '故障隔离',
  'failure.description': '一个渲染方法抛错，只有它变成 fallback，同一张卡片上的其它岛照常工作。',
  'failure.arm': '让内容岛抛错',
  'failure.disarm': '解除故障',
  'failure.ok': '内容岛正常',
  'failure.error': '这个渲染方法故意抛错',
  'failure.hint': '解除故障后再点 fallback 上的「重试」即可恢复。',

  'log.title': '活动日志',
  'log.empty': '还没有操作。',
} as const;

export type MessageKey = keyof typeof zh;

const en: Record<MessageKey, string> = {
  'app.tagline': 'State in objects, React at the edge',
  'nav.docs': 'Docs',
  'nav.source': 'Source',
  'nav.theme.toDark': 'Dark',
  'nav.theme.toLight': 'Light',

  'route.overview': 'Overview',
  'route.counter': 'Counter',
  'route.todos': 'Todos',
  'route.invite': 'Dialog',
  'route.failure': 'Failure',

  'overview.title': 'One object graph, five routes',
  'overview.description':
    'The nav, the router, the theme, the language and every page below are objects. React only mounts the root island into #root.',
  'overview.graph':
    'App holds settings, router, log and five pages; each page holds its own children. The menu on the left is a projection of router.pages — clicking one calls router.go(page).',
  'overview.cross':
    'The counter, the todos and the invite form all write to the same shared log: a field of App, held directly by deep children — no callbacks, no context.',
  'overview.try': 'Try it: open Todos, tick one, then look at the log on the left.',

  'counter.title': 'Counter',
  'counter.description': 'Three methods passed straight to onClick; every change writes to the shared log.',

  'todos.title': 'Todos',
  'todos.description':
    'A TodoItem holds its board and the whole App, so ticking it writes App’s log directly.',
  'todos.placeholder': 'Add a todo, press Enter',
  'todos.add': 'Add',
  'todos.remaining': '{count} left',
  'todos.empty': 'Nothing here yet.',
  'todos.status.open': 'open',
  'todos.status.done': 'done',
  'todos.detail': 'Selected todo',
  'todos.detail.empty': 'Click a todo title and it shows up here — a one-to-one reference, and only this island re-renders.',
  'todos.detail.status': 'Status: {status}',
  'todos.detail.toggle': 'Toggle',
  'todos.detail.remove': 'Delete',

  'invite.title': 'Dialog form',
  'invite.description': 'Whether the dialog is open is a boolean field on the object.',
  'invite.open': 'Invite someone',
  'invite.name': 'Name',
  'invite.email': 'Email',
  'invite.submit': 'Invite',
  'invite.cancel': 'Cancel',
  'invite.empty': 'Nobody invited yet.',
  'invite.hint': 'Form values are fields too — no useState.',

  'failure.title': 'Failure isolation',
  'failure.description':
    'When one render method throws, only that island becomes a fallback; the other islands on the same card keep working.',
  'failure.arm': 'Make the content island throw',
  'failure.disarm': 'Clear the failure',
  'failure.ok': 'This island is fine',
  'failure.error': 'This render method throws on purpose',
  'failure.hint': 'Clear the failure, then press Retry on the fallback to recover.',

  'log.title': 'Activity log',
  'log.empty': 'Nothing yet.',
};

export const MESSAGES: Record<Locale, Record<MessageKey, string>> = {zh, en};
