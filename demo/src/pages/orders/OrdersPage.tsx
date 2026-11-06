import {
  Button,
  Card,
  ConfigProvider,
  Input,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
  type TableProps,
} from 'antd';
import dayjs from 'dayjs';
import {OopReactObservable, OopReactRender} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';
import {seed, sleep, type Order, type OrderDraft, type OrderStatus} from './model';
import {OrderEditor} from './OrderEditor';

/**
 * The table side of the page: paging, sorting, selection and filtering are
 * fields here, `dataSource` is derived from them, and the dialog is a separate
 * object (`OrderEditor`) that this page merely opens.
 */
export class OrdersPage implements Page {
  readonly path = 'orders';
  readonly titleKey = 'route.orders';
  readonly sourcePath = 'demo/src/pages/orders/OrdersPage.tsx';
  readonly app: App;
  readonly editor: OrderEditor;

  rows: Order[] = seed();
  keyword = '';
  status: OrderStatus | 'all' = 'all';
  page = 1;
  pageSize = 5;
  sortField: 'customer' | 'amount' | null = null;
  sortOrder: 'ascend' | 'descend' | null = null;
  selected: number[] = [];

  constructor(app: App) {
    this.app = app;
    // Children first, then declare our own state.
    this.editor = new OrderEditor(this);
    OopReactObservable(this, {app: false, editor: false});
  }

  get filtered(): Order[] {
    const keyword = this.keyword.trim().toLowerCase();
    return this.rows.filter(
      (row) =>
        (this.status === 'all' || row.status === this.status) &&
        (keyword === '' || row.customer.toLowerCase().includes(keyword)),
    );
  }

  get sorted(): Order[] {
    const {sortField, sortOrder} = this;
    if (sortField === null || sortOrder === null) return this.filtered;

    const factor = sortOrder === 'ascend' ? 1 : -1;
    return [...this.filtered].sort((left, right) =>
      sortField === 'amount'
        ? (left.amount - right.amount) * factor
        : left.customer.localeCompare(right.customer) * factor,
    );
  }

  get paged(): Order[] {
    const start = (this.page - 1) * this.pageSize;
    return this.sorted.slice(start, start + this.pageSize);
  }

  setKeyword(value: string): void {
    this.keyword = value;
    this.page = 1;
  }

  setStatus(value: OrderStatus | 'all'): void {
    this.status = value;
    this.page = 1;
  }

  changeTable(
    page: number,
    pageSize: number,
    sorter: Parameters<NonNullable<TableProps<Order>['onChange']>>[2],
  ): void {
    const single = Array.isArray(sorter) ? sorter[0] : sorter;
    const field = single?.field;
    const order = single?.order ?? null;

    if (field === 'customer' || field === 'amount') {
      this.sortField = order === null ? null : field;
      this.sortOrder = order;
    } else {
      this.sortField = null;
      this.sortOrder = null;
    }

    this.page = page;
    this.pageSize = pageSize;
  }

  /** A MobX `flow`: called by the editor, which awaits this promise. */
  *save(editing: Order | null, values: OrderDraft): Generator<Promise<void>, void, void> {
    yield sleep(300);

    const record = {
      customer: values.customer.trim(),
      amount: values.amount,
      status: values.status,
      due: values.due.format('YYYY-MM-DD'),
      urgent: values.urgent ?? false,
      note: values.note ?? '',
    };

    if (editing === null) {
      const id = this.rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      this.rows.push({id, ...record});
      this.app.log.add(`orders.create(${JSON.stringify(record.customer)})`);
    } else {
      Object.assign(editing, record);
      this.app.log.add(`orders.update(${JSON.stringify(record.customer)})`);
    }

    this.app.feedback.success(this.app.settings.t('orders.saved'));
  }

  remove(id: number): void {
    this.rows = this.rows.filter((row) => row.id !== id);
    this.selected = this.selected.filter((selected) => selected !== id);
    this.app.log.add(`orders.remove(${id})`);
    this.app.feedback.success(this.app.settings.t('orders.deleted', {count: 1}));
  }

  removeSelected(): void {
    const count = this.selected.length;
    this.rows = this.rows.filter((row) => !this.selected.includes(row.id));
    this.selected = [];
    this.app.log.add(`orders.removeAll(${count})`);
    this.app.feedback.success(this.app.settings.t('orders.deleted', {count}));
  }

  reset(): void {
    this.rows = seed();
    this.selected = [];
    this.keyword = '';
    this.status = 'all';
    this.page = 1;
    this.app.log.add('orders.reset()');
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('orders.title')}
          description={t('orders.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          {this.toolbar()}
          {this.table()}
          {this.editor.dialog()}
        </Space>
      </div>
    );
  }

  @OopReactRender()
  toolbar() {
    const {t} = this.app.settings;
    const [modal, holder] = Modal.useModal();

    return (
      <>
        {holder}
        <Space wrap>
          <Input
            allowClear
            value={this.keyword}
            placeholder={t('orders.search')}
            style={{width: 190}}
            onChange={(event) => this.setKeyword(event.target.value)}
          />
          <Select<OrderStatus | 'all'>
            value={this.status}
            style={{width: 130}}
            onChange={(value) => this.setStatus(value)}
            options={[
              {value: 'all', label: t('orders.status.all')},
              {value: 'draft', label: t('orders.status.draft')},
              {value: 'paid', label: t('orders.status.paid')},
              {value: 'shipped', label: t('orders.status.shipped')},
            ]}
          />
          <Button type="primary" onClick={() => this.editor.create()}>
            {t('orders.create')}
          </Button>
          {/* Another island pre-fills the form through the editor object: no form
              instance here, no context, just a method call. */}
          <Button onClick={() => this.editor.create({customer: '示例客户', amount: 5200, note: '来自工具栏'})}>
            {t('orders.createPreset')}
          </Button>
          <Popconfirm
            disabled={this.selected.length === 0}
            title={t('orders.bulkConfirm', {count: this.selected.length})}
            okText={t('orders.delete')}
            cancelText={t('orders.cancel')}
            onConfirm={() => this.removeSelected()}
          >
            <Button danger disabled={this.selected.length === 0}>
              {t('orders.bulkDelete', {count: this.selected.length})}
            </Button>
          </Popconfirm>
          <Button
            onClick={() =>
              void modal.confirm({
                title: t('orders.resetConfirm'),
                okText: t('orders.submit'),
                cancelText: t('orders.cancel'),
                onOk: () => this.reset(),
              })
            }
          >
            {t('orders.reset')}
          </Button>
        </Space>
      </>
    );
  }

  /**
   * The nested provider: everything inside this island renders compact, while
   * the rest of the application keeps the root settings.
   */
  @OopReactRender()
  table() {
    const {t} = this.app.settings;

    return (
      <ConfigProvider componentSize="small">
        <Card size="small">
          <Table<Order>
            rowKey="id"
            columns={this.columns}
            dataSource={this.paged}
            locale={{emptyText: t('orders.empty')}}
            rowSelection={{
              selectedRowKeys: this.selected,
              onChange: (keys) => {
                this.selected = keys.map(Number);
              },
            }}
            pagination={{
              current: this.page,
              pageSize: this.pageSize,
              total: this.filtered.length,
              showSizeChanger: true,
            }}
            onChange={(pagination, _filters, sorter) =>
              this.changeTable(pagination.current ?? 1, pagination.pageSize ?? this.pageSize, sorter)
            }
          />
          <Typography.Text type="secondary">{t('orders.nested')}</Typography.Text>
        </Card>
      </ConfigProvider>
    );
  }

  get columns(): NonNullable<TableProps<Order>['columns']> {
    const {t} = this.app.settings;
    const sortOrder = (field: 'customer' | 'amount') =>
      this.sortField === field ? this.sortOrder : null;

    return [
      {title: '#', dataIndex: 'id', width: 60},
      {
        title: t('orders.col.customer'),
        dataIndex: 'customer',
        sorter: true,
        sortOrder: sortOrder('customer'),
        render: (customer: string, row: Order) =>
          row.urgent ? <Typography.Text strong>{customer}</Typography.Text> : customer,
      },
      {
        title: t('orders.col.amount'),
        dataIndex: 'amount',
        align: 'right',
        sorter: true,
        sortOrder: sortOrder('amount'),
        render: (amount: number) =>
          amount.toLocaleString('zh-CN', {style: 'currency', currency: 'CNY'}),
      },
      {
        title: t('orders.col.status'),
        dataIndex: 'status',
        render: (status: OrderStatus) => (
          <Tag color={status === 'paid' ? 'green' : status === 'shipped' ? 'blue' : 'default'}>
            {t(`orders.status.${status}`)}
          </Tag>
        ),
      },
      {
        title: t('orders.col.due'),
        dataIndex: 'due',
        render: (due: string) =>
          dayjs(due).isBefore(dayjs(), 'day') ? (
            <Typography.Text type="danger">{due}</Typography.Text>
          ) : (
            due
          ),
      },
      {
        title: t('orders.col.actions'),
        key: 'actions',
        width: 120,
        render: (_value: unknown, row: Order) => (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => this.editor.edit(row)}>
              {t('orders.edit')}
            </Button>
            <Popconfirm
              title={t('orders.deleteConfirm')}
              okText={t('orders.delete')}
              cancelText={t('orders.cancel')}
              onConfirm={() => this.remove(row.id)}
            >
              <Button type="link" size="small" danger>
                {t('orders.delete')}
              </Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];
  }
}
