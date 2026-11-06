import {Button, Card, Input, Modal, Space, Tag, Typography} from 'antd';
import {OopReactObservable, OopReactRender} from 'oop-react';
import type {App} from '../../app/App';
import {sourceUrl} from '../../app/links';
import type {Page} from '../Page';
import {PageHeader} from '../PageHeader';

interface Invite {
  name: string;
  email: string;
}

export class InvitePage implements Page {
  readonly path = 'invite';
  readonly titleKey = 'route.invite';
  readonly sourcePath = 'demo/src/pages/invite/InvitePage.tsx';
  readonly app: App;
  open = false;
  name = '';
  email = '';
  invites: Invite[] = [];

  constructor(app: App) {
    this.app = app;
    OopReactObservable(this, {app: false});
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
    this.app.log.add(`invite.submit(${JSON.stringify(invite.name)})`);
  }

  @OopReactRender()
  view() {
    const {t} = this.app.settings;

    return (
      <div>
        <PageHeader
          title={t('invite.title')}
          description={t('invite.description')}
          sourceLabel={t('nav.source')}
          sourceUrl={sourceUrl(this.sourcePath)}
        />
        <Space direction="vertical" size="middle" style={{width: '100%'}}>
          {this.actions()}
          {this.list()}
          {this.dialog()}
        </Space>
      </div>
    );
  }

  @OopReactRender()
  actions() {
    const {t} = this.app.settings;

    return (
      <Space wrap>
        <Button type="primary" onClick={this.openDialog}>
          {t('invite.open')}
        </Button>
        <Typography.Text type="secondary">{t('invite.hint')}</Typography.Text>
      </Space>
    );
  }

  @OopReactRender()
  list() {
    const {t} = this.app.settings;

    if (this.invites.length === 0) {
      return <Typography.Text type="secondary">{t('invite.empty')}</Typography.Text>;
    }

    return (
      <Card size="small">
        <Space wrap>
          {this.invites.map((invite) => (
            <Tag key={invite.email} color="blue">
              {invite.name} · {invite.email}
            </Tag>
          ))}
        </Space>
      </Card>
    );
  }

  @OopReactRender()
  dialog() {
    const {t} = this.app.settings;

    return (
      <Modal
        open={this.open}
        title={t('invite.open')}
        okText={t('invite.submit')}
        cancelText={t('invite.cancel')}
        okButtonProps={{disabled: !this.canSubmit}}
        onOk={() => this.submit()}
        onCancel={() => this.closeDialog()}
      >
        <Space direction="vertical" size="small" style={{width: '100%'}}>
          <Input
            value={this.name}
            placeholder={t('invite.name')}
            onChange={(event) => this.setName(event.target.value)}
          />
          <Input
            value={this.email}
            placeholder={t('invite.email')}
            onChange={(event) => this.setEmail(event.target.value)}
          />
        </Space>
      </Modal>
    );
  }
}
