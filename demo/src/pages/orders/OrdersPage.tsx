import {
  Button,
  Card,
  ConfigProvider,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Switch,
  Table,
  Tag,
  Typography,
  type TableProps,
} from 'antd';
import dayjs, {type Dayjs} from 'dayjs';
import {OopReactObservable, OopReactRender} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

type OrderStatus = 'draft' | 'paid' | 'shipped';

interface Order {
  id: number;
  customer: string;
  amount: number;
  status: OrderStatus;
  due: string;
  urgent: boolean;
  note: string;
}

interface OrderDraft {
  customer: string;
  amount: number;
  status: OrderStatus;
  due: Dayjs;
  urgent: boolean;
  note: string;
}

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

function seed(): Order[] {
  const today = dayjs();
  return [
    {id: 1, customer: '杭州云图科技', amount: 12800, status: 'paid', due: today.add(3, 'day').format('YYYY-MM-DD'), urgent: true, note: '首批交付'},
    {id: 2, customer: '上海明川贸易', amount: 4300, status: 'draft', due: today.add(10, 'day').format('YYYY-MM-DD'), urgent: false, note: ''},
    {id: 3, customer: '深圳合众电子', amount: 26700, status: 'shipped', due: today.subtract(1, 'day').format('YYYY-MM-DD'), urgent: false, note: '已发顺丰'},
    {id: 4, customer: '成都天府软件', amount: 990, status: 'paid', due: today.add(1, 'day').format('YYYY-MM-DD'), urgent: true, note: ''},
    {id: 5, customer: '北京同衡建筑', amount: 54200, status: 'draft', due: today.add(21, 'day').format('YYYY-MM-DD'), urgent: false, note: '需开专票'},
    {id: 6, customer: '西安秦风物流', amount: 7600, status: 'paid', due: today.add(6, 'day').format('YYYY-MM-DD'), urgent: false, note: ''},
    {id: 7, customer: '苏州精工制造', amount: 18300, status: 'shipped', due: today.subtract(4, 'day').format('YYYY-MM-DD'), urgent: true, note: '尾款未结'},
  ];
}

/**
 * The deliberately hard page: a table whose paging/sorting/selection/filtering
 * all live on the object, plus a validated form in a modal.
 *
 * Three boundaries get exercised here and are worth reading:
 *   1. a *nested* `ConfigProvider` inside the page — providers do not have to be
 *      at the app root, they only have to wrap the subtree that needs them;
 *   2. `Form.useForm()` called inside a render method — hooks work there because
 *      an island *is* a component, and the instance belongs to that island;
 *   3. async work as a MobX `flow` (a generator method is detected by
 *      `makeAutoObservable`), with `saving` flipping around the yield.
 */
export class OrdersPage implements Page {
  readonly path = 'orders';
  readonly titleKey = 'route.orders';
  readonly sourcePath = 'demo/src/pages/orders/OrdersPage.tsx';
  readonly app: App;

  rows: Order[] = seed();
  keyword = '';
  status: OrderStatus | 'all' = 'all';
  page = 1;
  pageSize = 5;
  sortField: 'customer' | 'amount' | null = null;
  sortOrder: 'ascend' | 'descend' | null = null;
  selected: number[] = [];
  open = false;
  editing: Order | null = null;
  /** Bumped on open so the form remounts and re-applies `initialValues`. */
  formKey = 0;
  saving = false;

  constructor(app: App) {
    this.app = app;
    OopReactObservable(this, {app: false});
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

  get initialValues(): Partial<OrderDraft> {
    const editing = this.editing;
    if (editing === null) {
      return {status: 'draft', urgent: false, amount: 1000, due: dayjs().add(7, 'day')};
    }
    return {...editing, due: dayjs(editing.due)};
  }

  setKeyword(value: string): void {
    this.keyword = value;
    this.page = 1;
  }

  setStatus(value: OrderStatus | 'all'): void {
    this.status = value;
    this.page = 1;
  }

  changeTable(page: number, pageSize: number, sorter: Parameters<NonNullable<TableProps<Order>['onChange']>>[2]): void {
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

  openCreate(): void {
    this.editing = null;
    this.formKey += 1;
    this.open = true;
  }

  openEdit(order: Order): void {
    this.editing = order;
    this.formKey += 1;
    this.open = true;
  }

  closeForm(): void {
    this.open = false;
  }

  /** A MobX `flow`: generator methods are picked up by `makeAutoObservable`. */
  *save(values: OrderDraft): Generator<Promise<void>, void, void> {
    this.saving = true;
    yield sleep(300);

    const record = {
      customer: values.customer.trim(),
      amount: values.amount,
      status: values.status,
      due: values.due.format('YYYY-MM-DD'),
      urgent: values.urgent ?? false,
      note: values.note ?? '',
    };

    const editing = this.editing;
    if (editing === null) {
      const id = this.rows.reduce((max, row) => Math.max(max, row.id), 0) + 1;
      this.rows.push({id, ...record});
      this.app.log.add(`orders.create(${JSON.stringify(record.customer)})`);
    } else {
      Object.assign(editing, record);
      this.app.log.add(`orders.update(${JSON.stringify(record.customer)})`);
    }

    this.saving = false;
    this.open = false;
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
          {this.dialog()}
        </Space>
      </div>
    );
  }

  @OopReactRender()
  toolbar() {
    const {t} = this.app.settings;
    // `Modal.useModal` is another context-bound hook: it returns the api and a
    // holder that has to be rendered. Both stay inside this island.
    const [modal, holder] = Modal.useModal();

    return (
      <>
        {holder}
        <Space wrap>
        <Input
          allowClear
          value={this.keyword}
          placeholder={t('orders.search')}
          style={{width: 200}}
          onChange={(event) => this.setKeyword(event.target.value)}
        />
        <Select<OrderStatus | 'all'>
          value={this.status}
          style={{width: 140}}
          onChange={(value) => this.setStatus(value)}
          options={[
            {value: 'all', label: t('orders.status.all')},
            {value: 'draft', label: t('orders.status.draft')},
            {value: 'paid', label: t('orders.status.paid')},
            {value: 'shipped', label: t('orders.status.shipped')},
          ]}
        />
        <Button type="primary" onClick={() => this.openCreate()}>
          {t('orders.create')}
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
        render: (amount: number) => amount.toLocaleString('zh-CN', {style: 'currency', currency: 'CNY'}),
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
        width: 130,
        render: (_value: unknown, row: Order) => (
          <Space size={0}>
            <Button type="link" size="small" onClick={() => this.openEdit(row)}>
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

  @OopReactRender()
  dialog() {
    const {t} = this.app.settings;
    // Hooks in a render method: this island is a component, so the instance is
    // created once per island and survives the re-renders that state changes cause.
    const [form] = Form.useForm<OrderDraft>();

    return (
      <Modal
        open={this.open}
        title={this.editing === null ? t('orders.form.create') : t('orders.form.edit')}
        okText={t('orders.submit')}
        cancelText={t('orders.cancel')}
        confirmLoading={this.saving}
        onOk={() => form.submit()}
        onCancel={() => this.closeForm()}
      >
        <Form<OrderDraft>
          form={form}
          key={this.formKey}
          layout="vertical"
          initialValues={this.initialValues}
          onFinish={(values) => void this.save(values)}
        >
          <Form.Item
            name="customer"
            label={t('orders.field.customer')}
            rules={[
              {required: true, message: t('orders.required')},
              {max: 20, message: t('orders.customerMax')},
            ]}
          >
            <Input placeholder="杭州云图科技" />
          </Form.Item>

          <Form.Item
            name="amount"
            label={t('orders.field.amount')}
            rules={[
              {required: true, message: t('orders.required')},
              {type: 'number', min: 0.01, message: t('orders.amountPositive')},
            ]}
          >
            <InputNumber style={{width: '100%'}} min={0} step={100} />
          </Form.Item>

          <Form.Item
            name="status"
            label={t('orders.field.status')}
            rules={[{required: true, message: t('orders.required')}]}
          >
            <Select
              options={[
                {value: 'draft', label: t('orders.status.draft')},
                {value: 'paid', label: t('orders.status.paid')},
                {value: 'shipped', label: t('orders.status.shipped')},
              ]}
            />
          </Form.Item>

          <Form.Item
            name="due"
            label={t('orders.field.due')}
            rules={[
              {required: true, message: t('orders.required')},
              {
                validator: (_rule, value: Dayjs | null) =>
                  value === null || value.isBefore(dayjs(), 'day')
                    ? Promise.reject(new Error(t('orders.dueFuture')))
                    : Promise.resolve(),
              },
            ]}
          >
            <DatePicker style={{width: '100%'}} />
          </Form.Item>

          <Form.Item name="urgent" label={t('orders.field.urgent')} valuePropName="checked">
            <Switch />
          </Form.Item>

          <Form.Item name="note" label={t('orders.field.note')}>
            <Input.TextArea rows={2} maxLength={100} showCount />
          </Form.Item>
        </Form>
      </Modal>
    );
  }
}
