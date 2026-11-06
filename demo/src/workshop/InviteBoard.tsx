import {Button, Card, Input, Modal, Space, Tag, Typography} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import {bumpRender} from '../app/renderStats';
import type {Workshop} from './Workshop';

interface Invite {
  name: string;
  email: string;
}

export class InviteBoard {
  open = false;
  name = '';
  email = '';
  invites: Invite[] = [];
  readonly workshop: Workshop;

  constructor(workshop: Workshop) {
    this.workshop = workshop;
    OopReactObservable(this, {workshop: false});
  }

  get canSubmit(): boolean {
    return this.name.trim() !== '' && this.email.includes('@');
  }

  openDialog(): void {
    this.open = true;
  }

  closeDialog(): void {
    this.open = false;
  }

  setName(value: string): void {
    this.name = value;
  }

  setEmail(value: string): void {
    this.email = value;
  }

  submit(): void {
    if (!this.canSubmit) return;
    const invite = {name: this.name.trim(), email: this.email.trim()};
    this.invites.push(invite);
    this.name = '';
    this.email = '';
    this.open = false;
    this.workshop.log.add(`邀请「${invite.name}」`);
  }

  @OopReactRender()
  view() {
    return (
      <Card
        title="弹窗表单"
        extra={<span className="render-count">这个岛渲染 {bumpRender('invite')} 次</span>}
      >
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          {this.actions()}
          {this.list()}
          {this.dialog()}
        </Space>
      </Card>
    );
  }

  @OopReactRender()
  actions() {
    return (
      <Space wrap>
        <Button type="primary" onClick={this.openDialog}>
          邀请成员
        </Button>
        <Typography.Text type="secondary">
          弹窗开合就是 <code>this.open</code>，没有 useState。
        </Typography.Text>
      </Space>
    );
  }

  @OopReactRender()
  list() {
    if (this.invites.length === 0) {
      return <Typography.Text type="secondary">还没有邀请任何人。</Typography.Text>;
    }

    return (
      <Space wrap>
        {this.invites.map((invite) => (
          <Tag key={invite.email} color="blue">
            {invite.name} · {invite.email}
          </Tag>
        ))}
      </Space>
    );
  }

  @OopReactRender()
  dialog() {
    return (
      <Modal
        open={this.open}
        title="邀请成员"
        okText="邀请"
        cancelText="取消"
        okButtonProps={{disabled: !this.canSubmit}}
        onOk={() => this.submit()}
        onCancel={() => this.closeDialog()}
      >
        <Space direction="vertical" size="small" style={{width: '100%'}}>
          <Input
            value={this.name}
            placeholder="姓名"
            onChange={(event) => this.setName(event.target.value)}
          />
          <Input
            value={this.email}
            placeholder="邮箱"
            onChange={(event) => this.setEmail(event.target.value)}
          />
        </Space>
      </Modal>
    );
  }
}
