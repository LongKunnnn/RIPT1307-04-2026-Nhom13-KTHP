import { useEffect, useState } from 'react';
import { Avatar, Card, List, Select, Space, Tabs, Tag, Typography } from 'antd';
import { TrophyOutlined } from '@ant-design/icons';
import type { LeaderboardEntry } from '@/types';
import type { TagWithCount } from '@/services/posts/postService';
import { leaderboardService, type LeaderboardScope } from '@/services/leaderboard/leaderboardService';
import { roleColor, roleLabel } from '@/utils/format';
import styles from './LeaderboardPanel.less';

const { Text } = Typography;

interface Props {
  tags: TagWithCount[];
}

export function LeaderboardPanel({ tags }: Props) {
  const [scope, setScope] = useState<LeaderboardScope>('global');
  const [tag, setTag] = useState<string | undefined>();
  const [rows, setRows] = useState<any[]>([]); // Để any[] để nó hứng mọi loại field từ BE
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    leaderboardService
      .list(scope, scope === 'tag' ? tag : undefined, 8)
      .then(setRows)
      .catch(() => setRows([]))
      .finally(() => setLoading(false));
  }, [scope, tag]);

  return (
    <Card
      className={styles.card}
      bordered={false}
      id="contributors"
      title={
        <span>
          <TrophyOutlined style={{ marginRight: 8, color: '#f59e0b' }} />
          Bảng xếp hạng
        </span>
      }
    >
      <Tabs
        size="small"
        activeKey={scope}
        onChange={(k) => {
          setScope(k as LeaderboardScope);
          if (k === 'global') setTag(undefined);
        }}
        items={[
          { key: 'global', label: 'Toàn web' },
          { key: 'tag', label: 'Theo thẻ' },
        ]}
      />
      {scope === 'tag' && (
        <Select
          showSearch
          allowClear
          placeholder="Chọn thẻ để xếp hạng"
          value={tag}
          options={tags.map((t) => ({ value: t.name, label: t.name }))}
          onChange={setTag}
          style={{ width: '100%', marginBottom: 12 }}
          optionFilterProp="label"
        />
      )}
      <Text type="secondary" className={styles.hint}>
        {scope === 'global'
          ? 'Điểm = điểm thưởng tích lũy + uy tín (đánh giá sao × độ khó) + câu trả lời được chấp nhận.'
          : 'Xếp hạng theo uy tín nội dung trong thẻ (đánh giá sao của cộng đồng).'}
      </Text>
      <List
        size="small"
        loading={loading}
        dataSource={rows}
        locale={{
          emptyText: scope === 'tag' && !tag ? 'Chọn một thẻ để xem bảng xếp hạng' : 'Chưa có dữ liệu',
        }}
        renderItem={(u, i) => {
          
          // Quét tìm tên, không có thì cho làm Ẩn danh
          const displayName = u.name || u.full_name || u.username || 'Ẩn danh';
          
   
          const displayPoints = u.points ?? u.reward_points ?? 0;
          
          const userRole = u.role || 'student'; 
          
          const avatarChar = String(displayName).charAt(0).toUpperCase();
          
          // 5. Nếu có avatar_url thật từ BE thì ưu tiên hiện luôn
          const avatarUrl = u.avatar_url || u.avatarUrl;

          return (
            <List.Item className={styles.row}>
              <Space align="start" size={10}>
                <span className={styles.rank}>{i + 1}</span>
                <Avatar 
                  src={avatarUrl} 
                  size={36} 
                  style={{ backgroundColor: i < 3 ? '#2563eb' : '#94a3b8' }}
                >
                  {/* Nếu không có src (ảnh), nó sẽ tự fallback về chữ cái này */}
                  {avatarChar}
                </Avatar>
                <div>
                  <Text strong>{displayName}</Text>{' '}
                  <Tag color={roleColor(userRole)} style={{ fontSize: 11 }}>
                    {roleLabel(userRole)}
                  </Tag>
                  <div className={styles.points}>{Number(displayPoints).toLocaleString('vi-VN')} điểm</div>
                </div>
              </Space>
            </List.Item>
          );
        }}
      />
    </Card>
  );
}