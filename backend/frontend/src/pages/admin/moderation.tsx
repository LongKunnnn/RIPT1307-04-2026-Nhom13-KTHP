import { useMemo, useState } from 'react';
import {
  Badge,
  Button,
  Card,
  Input,
  Modal,
  Popconfirm,
  Radio,
  Select,
  Space,
  Table,
  Tabs,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  CheckOutlined,
  DeleteOutlined,
  WarningOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import type { BannedWord, ModerationQueueItem, ModerationResolveAction } from '@/types';
import { moderationService } from '@/services/moderation/moderationService';
import { bannedWordService } from '@/services/moderation/bannedWordService';
import { formatViDate } from '@/utils/format';
import { useNotify } from '@/contexts/NotificationContext';

const { Text, Paragraph } = Typography;

function statusTag(status: string) {
  if (status === 'pending') return <Tag color="orange">Chờ duyệt</Tag>;
  if (status === 'hidden') return <Tag color="red">Đã ẩn</Tag>;
  return <Tag color="green">Đang hiển thị</Tag>;
}

export default function AdminModerationPage() {
  const notify = useNotify();
  const [tick, setTick] = useState(0);
  const [warnOpen, setWarnOpen] = useState(false);
  const [warnItem, setWarnItem] = useState<ModerationQueueItem | null>(null);
  const [warnText, setWarnText] = useState('');
  const [newWord, setNewWord] = useState('');
  const [newWordAction, setNewWordAction] = useState<BannedWord['action']>('pending');

  const queue = useMemo(() => moderationService.getQueue(), [tick]);
  const bannedWords = useMemo(() => bannedWordService.list(), [tick]);

  const refresh = () => setTick((t) => t + 1);

  const runAction = (item: ModerationQueueItem, action: ModerationResolveAction, warnMsg?: string) => {
    moderationService.resolve(item, action, warnMsg);
    if (action === 'warn') {
      notify.notifyEmail('Nhắc nhở người dùng', `Đã gửi nhắc nhở tới tác giả "${item.authorName}" (giả lập).`);
    }
    if (action === 'delete') {
      notify.success('Đã xóa vĩnh viễn nội dung vi phạm');
    }
    if (action === 'keep') {
      notify.success('Đã giữ lại — nội dung hiển thị công khai');
    }
    refresh();
  };

  const queueColumns = [
    {
      title: 'Nguồn',
      width: 110,
      render: (_: unknown, row: ModerationQueueItem) =>
        row.source === 'report' ? <Tag color="volcano">Báo cáo</Tag> : <Tag color="purple">Auto-mod</Tag>,
    },
    {
      title: 'Loại',
      width: 90,
      dataIndex: 'targetType',
      render: (t: string) => (t === 'post' ? 'Bài viết' : 'Bình luận'),
    },
    { title: 'Tiêu đề / Tóm tắt', dataIndex: 'title', ellipsis: true },
    {
      title: 'Tác giả',
      dataIndex: 'authorName',
      width: 140,
    },
    {
      title: 'Trạng thái',
      width: 120,
      render: (_: unknown, row: ModerationQueueItem) => statusTag(row.moderationStatus),
    },
    {
      title: 'Chi tiết',
      render: (_: unknown, row: ModerationQueueItem) => (
        <div>
          <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
            {row.preview}
          </Paragraph>
          {row.matchedWords?.length ? (
            <Text type="danger" style={{ fontSize: 12 }}>
              Từ khóa: {row.matchedWords.join(', ')}
            </Text>
          ) : null}
          {row.reportReason ? (
            <div>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Báo cáo ({row.reporterName}): {row.reportReason}
              </Text>
            </div>
          ) : null}
        </div>
      ),
    },
    {
      title: 'Thao tác',
      width: 280,
      render: (_: unknown, row: ModerationQueueItem) => (
        <Space wrap>
          <Button
            size="small"
            icon={<CheckOutlined />}
            onClick={() => runAction(row, 'keep')}
          >
            Giữ lại
          </Button>
          <Button
            size="small"
            icon={<WarningOutlined />}
            onClick={() => {
              setWarnItem(row);
              setWarnText('');
              setWarnOpen(true);
            }}
          >
            Nhắc nhở
          </Button>
          <Popconfirm title="Xóa vĩnh viễn?" onConfirm={() => runAction(row, 'delete')}>
            <Button size="small" danger icon={<DeleteOutlined />}>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const wordColumns = [
    { title: 'Từ khóa', dataIndex: 'word' },
    {
      title: 'Hành động auto-mod',
      dataIndex: 'action',
      render: (a: BannedWord['action']) =>
        a === 'hidden' ? <Tag color="red">Ẩn ngay</Tag> : <Tag color="orange">Chờ duyệt</Tag>,
    },
    {
      title: 'Thao tác',
      width: 200,
      render: (_: unknown, row: BannedWord) => (
        <Space>
          <Select
            size="small"
            value={row.action}
            style={{ width: 120 }}
            onChange={(v) => {
              bannedWordService.update(row.id, { action: v });
              refresh();
            }}
            options={[
              { value: 'pending', label: 'Chờ duyệt' },
              { value: 'hidden', label: 'Ẩn ngay' },
            ]}
          />
          <Popconfirm title="Xóa từ này?" onConfirm={() => { bannedWordService.remove(row.id); refresh(); }}>
            <Button size="small" danger>
              Xóa
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <h2 style={{ marginBottom: 8 }}>Kiểm duyệt thông minh</h2>
      <Paragraph type="secondary">
        Hệ thống gom báo cáo từ người dùng và nội dung bị auto-mod (từ khóa cấm) vào một hàng đợi — Admin xử lý tại đây.
      </Paragraph>

      <Tabs
        items={[
          {
            key: 'queue',
            label: (
              <span>
                Hàng đợi <Badge count={queue.length} offset={[8, 0]} />
              </span>
            ),
            children: (
              <Card>
                <Table
                  rowKey="id"
                  dataSource={queue}
                  columns={queueColumns}
                  pagination={{ pageSize: 8 }}
                  locale={{ emptyText: 'Không có mục cần xử lý — tuyệt vời!' }}
                />
              </Card>
            ),
          },
          {
            key: 'words',
            label: 'Từ khóa cấm',
            children: (
              <Card>
                <Space wrap style={{ marginBottom: 16 }}>
                  <Input
                    placeholder="Thêm từ cấm..."
                    value={newWord}
                    onChange={(e) => setNewWord(e.target.value)}
                    style={{ width: 220 }}
                  />
                  <Radio.Group value={newWordAction} onChange={(e) => setNewWordAction(e.target.value)}>
                    <Radio value="pending">Chờ duyệt</Radio>
                    <Radio value="hidden">Ẩn ngay</Radio>
                  </Radio.Group>
                  <Button
                    type="primary"
                    icon={<PlusOutlined />}
                    onClick={() => {
                      try {
                        bannedWordService.add(newWord, newWordAction);
                        setNewWord('');
                        message.success('Đã thêm từ khóa');
                        refresh();
                      } catch (e) {
                        message.error(e instanceof Error ? e.message : 'Lỗi');
                      }
                    }}
                  >
                    Thêm
                  </Button>
                </Space>
                <Table rowKey="id" dataSource={bannedWords} columns={wordColumns} pagination={false} />
              </Card>
            ),
          },
        ]}
      />

      <Modal
        title="Nhắc nhở tác giả"
        open={warnOpen}
        onCancel={() => setWarnOpen(false)}
        onOk={() => {
          if (warnItem) runAction(warnItem, 'warn', warnText);
          setWarnOpen(false);
        }}
        okText="Gửi nhắc nhở"
      >
        <Input.TextArea
          rows={4}
          value={warnText}
          onChange={(e) => setWarnText(e.target.value)}
          placeholder="Nội dung nhắc nhở gửi tới tác giả (hiển thị trên bài/bình luận của họ)"
        />
      </Modal>
    </div>
  );
}
