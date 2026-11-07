import {
  Button,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Switch,
  type FormInstance,
} from 'antd';
import dayjs, {type Dayjs} from 'dayjs';
import {OopReactBridge, OopReactIgnore, OopReactRender, OopReactState} from 'oop-react';
import type {Order, OrderDraft} from './model';
import type {OrdersPage} from './OrdersPage';

/**
 * The form as an object — the case that decides whether this design is usable.
 *
 * The `FormInstance` is created by `Form.useForm()` inside `dialog()`, because
 * only a component can call a hook, and handed to this object by
 * `OopReactBridge`. From then on the object drives the form:
 *
 * - `submit()` validates through `form.validateFields()` and only then saves;
 * - `resetFields()` resets through the instance;
 * - `create(preset)` lets *any other object* decide the initial values, without
 *   touching the form at all.
 *
 * So the form is not "inside a render method" — the render method only mounts
 * it. That is the difference from putting `useForm()` in a method and calling it
 * a day.
 */
@OopReactState
export class OrderEditor {
  @OopReactIgnore readonly page: OrdersPage;
  open = false;
  saving = false;
  editing: Order | null = null;
  /** Initial values for the next `create()`, set by whoever opens it. */
  preset: Partial<OrderDraft> = {};
  /** Remount counter: the `Form` re-applies `initialValues` when this changes. */
  version = 0;
  #form: FormInstance<OrderDraft> | null = null;

  constructor(page: OrdersPage) {
    this.page = page;
  }

  bindForm(form: FormInstance<OrderDraft> | null): void {
    this.#form = form;
  }

  releaseForm(): void {
    this.#form = null;
  }

  create(preset: Partial<OrderDraft> = {}): void {
    this.editing = null;
    this.preset = preset;
    this.version += 1;
    this.open = true;
  }

  edit(order: Order): void {
    this.editing = order;
    this.preset = {};
    this.version += 1;
    this.open = true;
  }

  close(): void {
    this.open = false;
  }

  resetFields(): void {
    this.#form?.resetFields();
  }

  /** Ordinary async/await. The action that starts this method ends at the first
   * `await`; the consecutive writes afterwards are grouped in `finish()` so they
   * still arrive as one notification. */
  async submit(): Promise<void> {
    const form = this.#form;
    if (form === null) return;

    this.saving = true;
    try {
      let values: OrderDraft;
      try {
        values = await form.validateFields();
      } catch {
        // antd already marked the offending fields; leave the dialog open.
        this.saving = false;
        return;
      }

      await this.page.save(this.editing, values);
      this.finish(form);
    } catch {
      // save failed: leave the dialog open with the values intact
      this.saving = false;
    }
  }

  private finish(form: FormInstance<OrderDraft>): void {
    form.resetFields();
    this.open = false;
    this.saving = false;
  }

  get initialValues(): Partial<OrderDraft> {
    const editing = this.editing;
    if (editing !== null) {
      return {...editing, due: dayjs(editing.due)};
    }
    return {status: 'draft', urgent: false, amount: 1000, due: dayjs().add(7, 'day'), ...this.preset};
  }

  @OopReactRender()
  dialog() {
    const {t} = this.page.app.settings;
    // The hook lives here because this method is a component; the instance is
    // handed to the object immediately, so the object can drive it.
    const [form] = Form.useForm<OrderDraft>();

    return (
      <>
        <OopReactBridge value={form} assign={this.bindForm} release={this.releaseForm} />

        <Modal
          open={this.open}
          title={this.editing === null ? t('orders.form.create') : t('orders.form.edit')}
          onCancel={() => this.close()}
          footer={[
            <Button key="reset" onClick={() => this.resetFields()}>
              {t('orders.resetForm')}
            </Button>,
            <Button key="cancel" onClick={() => this.close()}>
              {t('orders.cancel')}
            </Button>,
            <Button key="ok" type="primary" loading={this.saving} onClick={() => void this.submit()}>
              {t('orders.submit')}
            </Button>,
          ]}
        >
          <Form<OrderDraft>
            form={form}
            key={this.version}
            layout="vertical"
            initialValues={this.initialValues}
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
      </>
    );
  }
}
