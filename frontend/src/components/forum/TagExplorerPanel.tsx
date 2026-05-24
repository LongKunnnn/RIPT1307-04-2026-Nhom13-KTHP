import { useEffect, useMemo, useState } from 'react';
import { Button, Card, Select, Space, Typography } from 'antd';
import { SearchOutlined, TagsOutlined } from '@ant-design/icons';
import type { TagWithCount } from '@/services/posts/postService';
import type { PostDifficulty } from '@/types';
import { difficultyLabel } from '@/utils/format';
import styles from './TagExplorerPanel.less';

const { Text, Paragraph } = Typography;

interface Props {
  tags: TagWithCount[];
  selectedTag?: string;
  selectedDifficulty?: PostDifficulty;
  onApply: (tag?: string, difficulty?: PostDifficulty) => void;
}

const DIFFICULTY_OPTIONS: { value: PostDifficulty; label: string }[] = [
  { value: 'easy', label: 'Dễ' },
  { value: 'medium', label: 'Trung bình' },
  { value: 'hard', label: 'Khó' },
];

export function TagExplorerPanel({ tags, selectedTag, selectedDifficulty, onApply }: Props) {
  const [draftTag, setDraftTag] = useState<string | undefined>(selectedTag);
  const [draftDifficulty, setDraftDifficulty] = useState<PostDifficulty | undefined>(selectedDifficulty);

  useEffect(() => {
    setDraftTag(selectedTag);
    setDraftDifficulty(selectedDifficulty);
  }, [selectedTag, selectedDifficulty]);

  const tagOptions = useMemo(
    () => tags.map((t) => ({ value: t.name, label: `${t.name} (${t.count})` })),
    [tags],
  );

  const clear = () => {
    setDraftTag(undefined);
    setDraftDifficulty(undefined);
    onApply(undefined, undefined);
  };

  return (
    <Card
      className={styles.card}
      bordered={false}
      id="tag-cloud"
      title={
        <span>
          <TagsOutlined style={{ marginRight: 8, color: '#2563eb' }} />
          Tìm theo thẻ & độ khó
        </span>
      }
    >
      <Paragraph type="secondary" className={styles.hint}>
        Chọn thẻ chủ đề và mức độ khó, sau đó bấm Áp dụng để lọc bài viết trên bảng tin.
      </Paragraph>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div>
          <Text strong className={styles.fieldLabel}>Thẻ</Text>
          <Select
            showSearch
            allowClear
            placeholder="Chọn thẻ (môn, khoa, lĩnh vực...)"
            value={draftTag}
            options={tagOptions}
            onChange={setDraftTag}
            optionFilterProp="label"
            style={{ width: '100%' }}
          />
        </div>
        <div>
          <Text strong className={styles.fieldLabel}>Độ khó</Text>
          <Select
            allowClear
            placeholder="Tất cả mức độ"
            value={draftDifficulty}
            options={DIFFICULTY_OPTIONS}
            onChange={setDraftDifficulty}
            style={{ width: '100%' }}
          />
        </div>
        <Space wrap style={{ width: '100%' }}>
          <Button type="primary" icon={<SearchOutlined />} onClick={() => onApply(draftTag, draftDifficulty)}>
            Áp dụng lọc
          </Button>
          <Button onClick={clear}>Xóa lọc</Button>
        </Space>
        {(selectedTag || selectedDifficulty) && (
          <Text type="secondary" className={styles.active}>
            Đang lọc:
            {selectedTag ? ` thẻ "${selectedTag}"` : ''}
            {selectedDifficulty ? ` · ${difficultyLabel(selectedDifficulty)}` : ''}
          </Text>
        )}
      </Space>
    </Card>
  );
}
