import dayjs, {type Dayjs} from 'dayjs';

export type OrderStatus = 'draft' | 'paid' | 'shipped';

export interface Order {
  id: number;
  customer: string;
  amount: number;
  status: OrderStatus;
  due: string;
  urgent: boolean;
  note: string;
}

/** What the form produces: the date is a Dayjs while it is being edited. */
export interface OrderDraft {
  customer: string;
  amount: number;
  status: OrderStatus;
  due: Dayjs;
  urgent: boolean;
  note: string;
}

export const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export function seed(): Order[] {
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
