import { Link } from 'umi';
import {
  Button,
  Card,
  Col,
  Row,
  Tag,
  Typography,
  List,
  Avatar,
  Space,
  Divider,
  Statistic,
} from 'antd';
import {
  PlusOutlined,
  RiseOutlined,
  FireOutlined,
  UserOutlined,
  LikeOutlined,
  MessageOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

type Role = 'Sinh viên' | 'Giảng viên';

interface QuestionItem {
  id: string;
  title: string;
  excerpt: string;
  tags: string[];
  author: string;
  role: Role;
  date: string;
  votes: number;
  answers: number;
}

const MOCK_QUESTIONS: QuestionItem[] = [
  {
    id: '1',
    title: 'Giải thích Big-O notation với ví dụ từ thuật toán sắp xếp',
    excerpt:
      'Mình đang học Cấu trúc dữ liệu và thấy khó phân biệt O(n log n) với O(n²). Có ai có ví dụ trực quan không ạ?',
    tags: ['Cấu trúc dữ liệu', 'Khoa CNTT', 'Học phần RIPT'],
    author: 'Nguyễn Minh An',
    role: 'Sinh viên',
    date: '12/05/2026',
    votes: 24,
    answers: 5,
  },
  {
    id: '2',
    title: 'REST vs GraphQL: khi nào nên chọn cho đồ án tốt nghiệp?',
    excerpt:
      'Nhóm em làm API cho hệ thống đặt phòng. Backend NestJS, mobile Flutter. Mong thầy cô góp ý hướng tiếp cận.',
    tags: ['Phát triển Web', 'Đồ án', 'Backend'],
    author: 'Trần Hoàng Nam',
    role: 'Sinh viên',
    date: '11/05/2026',
    votes: 18,
    answers: 7,
  },
  {
    id: '3',
    title: 'Tài liệu tham khảo chuẩn hóa ERD cho hệ thống đa tenant',
    excerpt:
      'Mình cần mô hình tenant_id trên mọi bảng nghiệp vụ. Có pattern hoặc paper nào đáng đọc không?',
    tags: ['Cơ sở dữ liệu', 'Thiết kế hệ thống'],
    author: 'PGS. Lê Thu Hà',
    role: 'Giảng viên',
    date: '10/05/2026',
    votes: 42,
    answers: 12,
  },
  {
    id: '4',
    title: 'Lỗi CORS khi deploy frontend Netlify gọi API Nest local',
    excerpt:
      'Đã thêm origin vào enableCors nhưng vẫn bị chặn preflight. Checklist cần xem những gì?',
    tags: ['Triển khai', 'Netlify', 'NestJS'],
    author: 'Phạm Gia Bảo',
    role: 'Sinh viên',
    date: '09/05/2026',
    votes: 9,
    answers: 4,
  },
  {
    id: '5',
    title: 'Cách viết test E2E cho form đăng ký có OTP email (Playwright)',
    excerpt:
      'Team dùng mailhog trong CI. Muốn hỏi flow chờ email và assert mã OTP.',
    tags: ['Kiểm thử', 'Playwright', 'CI/CD'],
    author: 'Hoàng Thị Mai',
    role: 'Sinh viên',
    date: '08/05/2026',
    votes: 15,
    answers: 3,
  },
];

const POPULAR_TAGS = [
  { name: 'React', count: 128 },
  { name: 'TypeScript', count: 96 },
  { name: 'UmiJS', count: 54 },
  { name: 'Ant Design', count: 71 },
  { name: 'NestJS', count: 48 },
  { name: 'Prisma', count: 33 },
  { name: 'RIPT', count: 89 },
];

const TOP_CONTRIBUTORS = [
  { name: 'PGS. Lê Thu Hà', role: 'Giảng viên' as Role, points: 2840 },
  { name: 'Nguyễn Minh An', role: 'Sinh viên' as Role, points: 1520 },
  { name: 'Trần Hoàng Nam', role: 'Sinh viên' as Role, points: 1388 },
  { name: 'Hoàng Thị Mai', role: 'Sinh viên' as Role, points: 1204 },
];

function roleColor(role: Role) {
  return role === 'Giảng viên' ? 'blue' : 'default';
}

export default function HomePage() {
  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroCopy}>
            <Title level={1} className={styles.heroTitle}>
              Hỏi — đáp — chia sẻ kiến thức học thuật
            </Title>
            <Paragraph className={styles.heroLead}>
              Nền tảng Q&amp;A theo phong cách Stack Overflow: đăng câu hỏi có tiêu đề, nội dung và thẻ; bình chọn
              và thảo luận có kiểm soát vai trò sinh viên / giảng viên.
            </Paragraph>
            <Space wrap size="middle">
              <Button type="primary" size="large" icon={<PlusOutlined />} className={styles.ctaPrimary}>
                Đặt câu hỏi
              </Button>
              <Button size="large" icon={<FireOutlined />}>
                Xem câu hỏi nổi bật
              </Button>
            </Space>
          </div>
          <Card className={styles.heroCard} bordered={false}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Hoạt động gần đây (mẫu)</Text>
                <Row gutter={16} style={{ marginTop: 12 }}>
                  <Col span={8}>
                    <Statistic title="Câu hỏi" value={1284} prefix={<MessageOutlined />} valueStyle={{ fontSize: 20 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Trả lời" value={5021} prefix={<RiseOutlined />} valueStyle={{ fontSize: 20 }} />
                  </Col>
                  <Col span={8}>
                    <Statistic title="Thành viên" value={356} prefix={<UserOutlined />} valueStyle={{ fontSize: 20 }} />
                  </Col>
                </Row>
              </div>
              <Divider style={{ margin: 0 }} />
              <div>
                <Text strong>Tính năng chính</Text>
                <ul className={styles.featureList}>
                  <li>Tìm kiếm theo từ khóa, lọc theo thẻ</li>
                  <li>Bình chọn câu hỏi &amp; bình luận, trả lời lồng nhau</li>
                  <li>Quản trị: duyệt bài, quản lý người dùng, thông báo email</li>
                </ul>
              </div>
            </Space>
          </Card>
        </div>
      </section>

      <div className={styles.shell}>
        <Row gutter={[24, 24]}>
          <Col xs={24} lg={16}>
            <Card
              id="feed"
              className={styles.feedCard}
              title={
                <Space>
                  <span className={styles.feedTitle}>Câu hỏi gần đây</span>
                  <Tag color="processing">Demo dữ liệu</Tag>
                </Space>
              }
              extra={
                <Space split={<Divider type="vertical" />}>
                  <Link to="/" className={styles.feedExtra}>
                    Mới nhất
                  </Link>
                  <a href="#" className={styles.feedExtra} onClick={(e) => e.preventDefault()}>
                    Nổi bật
                  </a>
                  <a href="#" className={styles.feedExtra} onClick={(e) => e.preventDefault()}>
                    Chưa trả lời
                  </a>
                </Space>
              }
            >
              <List
                itemLayout="vertical"
                dataSource={MOCK_QUESTIONS}
                split={false}
                renderItem={(item) => (
                  <List.Item className={styles.qRow} key={item.id}>
                    <Row gutter={16} wrap={false}>
                      <Col className={styles.qStats}>
                        <div className={styles.statBox}>
                          <LikeOutlined className={styles.statIcon} />
                          <span className={styles.statNum}>{item.votes}</span>
                          <span className={styles.statLabel}>phiếu</span>
                        </div>
                        <div className={`${styles.statBox} ${styles.statAnswers}`}>
                          <MessageOutlined className={styles.statIcon} />
                          <span className={styles.statNum}>{item.answers}</span>
                          <span className={styles.statLabel}>trả lời</span>
                        </div>
                      </Col>
                      <Col flex="auto" className={styles.qBody}>
                        <a href="#" className={styles.qTitle} onClick={(e) => e.preventDefault()}>
                          {item.title}
                        </a>
                        <Paragraph className={styles.qExcerpt} ellipsis={{ rows: 2 }}>
                          {item.excerpt}
                        </Paragraph>
                        <div className={styles.qMeta}>
                          <Space wrap size={[6, 6]}>
                            {item.tags.map((t) => (
                              <Tag key={t} className={styles.tag}>
                                {t}
                              </Tag>
                            ))}
                          </Space>
                          <div className={styles.qAuthor}>
                            <Avatar size="small" style={{ backgroundColor: '#e0e7ff', color: '#3730a3' }}>
                              {item.author.charAt(0)}
                            </Avatar>
                            <Text>
                              <Text strong>{item.author}</Text>
                              <Tag bordered={false} color={roleColor(item.role)} style={{ marginLeft: 6 }}>
                                {item.role}
                              </Tag>
                            </Text>
                            <Text type="secondary" className={styles.qDate}>
                              <ClockCircleOutlined /> {item.date}
                            </Text>
                          </div>
                        </div>
                      </Col>
                    </Row>
                  </List.Item>
                )}
              />
            </Card>
          </Col>

          <Col xs={24} lg={8}>
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Card title="Thẻ phổ biến" className={styles.sideCard} bordered={false}>
                <div className={styles.tagCloud}>
                  {POPULAR_TAGS.map((t) => (
                    <button type="button" key={t.name} className={styles.tagPill}>
                      <span>{t.name}</span>
                      <small>{t.count}</small>
                    </button>
                  ))}
                </div>
              </Card>

              <Card title="Đóng góp nổi bật" className={styles.sideCard} bordered={false}>
                <List
                  size="small"
                  dataSource={TOP_CONTRIBUTORS}
                  renderItem={(u, i) => (
                    <List.Item className={styles.leaderRow}>
                      <Space>
                        <span className={styles.rank}>{i + 1}</span>
                        <Avatar style={{ backgroundColor: i < 3 ? '#2563eb' : '#94a3b8' }}>{u.name.charAt(0)}</Avatar>
                        <div>
                          <div>
                            <Text strong>{u.name}</Text>{' '}
                            <Tag color={roleColor(u.role)} style={{ marginLeft: 4, fontSize: 11 }}>
                              {u.role}
                            </Tag>
                          </div>
                          <Text type="secondary" className={styles.points}>
                            {u.points.toLocaleString('vi-VN')} điểm uy tín
                          </Text>
                        </div>
                      </Space>
                    </List.Item>
                  )}
                />
              </Card>

              <Card className={styles.sideCard} bordered={false} title="Hoạt động">
                <Paragraph type="secondary" style={{ marginBottom: 0, fontSize: 13 }}>
                  Khi có bài mới hoặc ai đó trả lời bình luận của bạn, hệ thống sẽ gửi email thông báo (theo yêu cầu dự
                  án).
                </Paragraph>
              </Card>
            </Space>
          </Col>
        </Row>
      </div>
    </div>
  );
}
