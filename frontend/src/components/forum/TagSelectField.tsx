import { Select, Typography } from 'antd';
import { TAG_CATEGORIES, ALL_TAG_SUGGESTIONS } from '@/constants/tagCategories';

const { Text } = Typography;

interface Props {
  value?: string[];
  onChange?: (v: string[]) => void;
}

/** Chọn thẻ theo nhóm: môn, lớp, khoa, lĩnh vực. */
export function TagSelectField({ value, onChange }: Props) {
  return (
    <div>
      <Select
        mode="tags"
        style={{ width: '100%' }}
        placeholder="Chọn hoặc gõ thẻ (Enter để thêm)"
        tokenSeparators={[',']}
        value={value}
        onChange={onChange}
        options={ALL_TAG_SUGGESTIONS.map((t) => ({ label: t, value: t }))}
      />
      <Text type="secondary" style={{ display: 'block', marginTop: 8, fontSize: 12 }}>
        Môn: {TAG_CATEGORIES.subject.join(', ')} · Lớp: {TAG_CATEGORIES.class.join(', ')} · Khoa:{' '}
        {TAG_CATEGORIES.faculty.join(', ')} · Lĩnh vực: {TAG_CATEGORIES.field.join(', ')}
      </Text>
    </div>
  );
}
