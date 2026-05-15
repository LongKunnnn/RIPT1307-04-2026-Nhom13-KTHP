import { useCallback, useEffect, useState } from 'react';
import { Link, history, useLocation } from 'umi';
import { ROUTES } from '@/constants/routes';
import { postService } from '@/services/posts/postService';
import type { Post } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { PostCreateModal } from '@/components/forum/PostCreateModal';
import { Button, Card, Tag, Typography, List, Avatar, Space, Divider, Pagination, Select } from 'antd';
import { formatViDate, formatViews, roleColor, roleLabel } from '@/utils/format';
import {
  PlusOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  TagsOutlined,
  ReadOutlined,
  TeamOutlined,
  BankOutlined,
  FireOutlined,
  FilterOutlined,
  EyeOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

const TOP_CONTRIBUTORS = [
  { name: 'PGS. Lê Thu Hà', role: 'LECTURER' as const, points: 2840 },
  { name: 'Nguyễn Minh An', role: 'STUDENT' as const, points: 1520 },
  { name: 'Trần Hoàng Nam', role: 'STUDENT' as const, points: 1388 },
  { name: 'Hoàng Thị Mai', role: 'STUDENT' as const, points: 1204 },
];

export default function HomePage() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [tagFilter, setTagFilter] = useState<string | undefined>();
  const [modalOpen, setModalOpen] = useState(false);
  const search = new URLSearchParams(location.search).get('q') ?? '';
  const allTags = postService.getAllTags();

  const loadFeed = useCallback(() => {
    const res = postService.list({ page, pageSize: 8, search, tag: tagFilter });
    setPosts(res.items);
    setTotal(res.total);
  }, [page, search, tagFilter]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed]);

  return (
    <div className={styles.page}>
      <div className={styles.mobileNav}>
        <Link to="/" className={styles.mobileNavLink}>
          Trang chủ
        </Link>
        <a href="#feed" className={styles.mobileNavLink}>
          Câu hỏi
        </a>
        <a href="#" className={styles.mobileNavLink} onClick={(e) => e.preventDefault()}>
          Thẻ
        </a>
        <a href="#" className={styles.mobileNavLink} onClick={(e) => e.preventDefault()}>
          Thành viên
        </a>
      </div>

      <div className={styles.soShell}>
        <aside className={styles.leftNav} aria-label="Điều hướng trang">
          <nav className={styles.navBlock}>
            <Text className={styles.navSection}>Công khai</Text>
            <Link to="/" className={`${styles.navItem} ${styles.navItemActive}`}>
              <HomeOutlined /> Trang chủ
            </Link>
            <a href="#feed" className={styles.navItem}>
              <QuestionCircleOutlined /> Câu hỏi
            </a>
            <a href="#" className={styles.navItem} onClick={(e) => e.preventDefault()}>
              <TagsOutlined /> Thẻ
            </a>
            <a href="#" className={styles.navItem} onClick={(e) => e.preventDefault()}>
              <ReadOutlined /> Bài viết
            </a>
            <a href="#" className={styles.navItem} onClick={(e) => e.preventDefault()}>
              <TeamOutlined /> Thành viên
            </a>
            <a href="#" className={styles.navItem} onClick={(e) => e.preventDefault()}>
              <BankOutlined /> Đơn vị
            </a>
          </nav>
        </aside>

        <main className={styles.mainCol} id="feed">
          <div className={styles.mainHead}>
            <div>
              <Title level={3} className={styles.pageTitle}>
                Câu hỏi mới nhất
              </Title>
              <Text type="secondary" className={styles.qCount}>
                {total.toLocaleString('vi-VN')} bài trên diễn đàn
                {search ? ` · tìm: "${search}"` : ''}
                {tagFilter ? ` · thẻ: ${tagFilter}` : ''}
              </Text>
            </div>
            <Button
              type="primary"
              size="large"
              icon={<PlusOutlined />}
              className={styles.askBtn}
              onClick={() => {
                if (!isAuthenticated) {
                  history.push(ROUTES.login);
                  return;
                }
                setModalOpen(true);
              }}
            >
              Đặt câu hỏi
            </Button>
          </div>

          <div className={styles.filterRow}>
            <div className={styles.tabs}>
              <Link to="/" className={`${styles.tab} ${styles.tabActive}`}>
                Mới nhất
              </Link>
              <a href="#" className={styles.tab} onClick={(e) => e.preventDefault()}>
                Hoạt động
              </a>
              <a href="#" className={styles.tab} onClick={(e) => e.preventDefault()}>
                Có thưởng
              </a>
              <a href="#" className={styles.tab} onClick={(e) => e.preventDefault()}>
                Chưa trả lời
              </a>
            </div>
            <Select
              allowClear
              placeholder="Lọc theo thẻ"
              style={{ minWidth: 160 }}
              value={tagFilter}
              onChange={(v) => {
                setTagFilter(v);
                setPage(1);
              }}
              options={allTags.map((t) => ({ label: t, value: t }))}
            />
          </div>

          <List
            className={styles.qList}
            dataSource={posts}
            split={false}
            renderItem={(item) => (
              <List.Item className={styles.qRow} key={item.id}>
                <article className={styles.qGrid}>
                  <div className={styles.qVotes}>
                    <span className={styles.qNum}>{item.voteScore}</span>
                    <span className={styles.qLbl}>phiếu</span>
                  </div>
                  <div className={item.answerCount > 0 ? `${styles.qAns} ${styles.qAnsHas}` : styles.qAns}>
                    <span className={styles.qNum}>{item.answerCount}</span>
                    <span className={styles.qLbl}>trả lời</span>
                  </div>
                  <div className={styles.qViews}>
                    <EyeOutlined className={styles.qViewsIcon} aria-hidden />
                    <span>{formatViews(item.viewCount)}</span>
                    <span className={styles.qLbl}>lượt xem</span>
                  </div>
                  <div className={styles.qBody}>
                    <Link to={ROUTES.questionDetail(item.id)} className={styles.qTitle}>
                      {item.title}
                    </Link>
                    <Paragraph className={styles.qExcerpt} ellipsis={{ rows: 2 }}>
                      {item.excerpt}
                    </Paragraph>
                    <div className={styles.qTags}>
                      {item.tags.map((t, i) => {
                        const toneClass =
                          i % 3 === 0 ? styles.qTagTone0 : i % 3 === 1 ? styles.qTagTone1 : styles.qTagTone2;
                        return (
                          <Tag key={t} className={`${styles.qTag} ${toneClass}`}>
                            {t}
                          </Tag>
                        );
                      })}
                    </div>
                  </div>
                  <div className={styles.qUser}>
                    <Avatar size="small" className={styles.qAvatar}>
                      {item.authorName.charAt(0)}
                    </Avatar>
                    <div className={styles.qUserMeta}>
                      <span className={styles.qAuthor}>{item.authorName}</span>
                      <Tag bordered={false} color={roleColor(item.authorRole)} className={styles.qRole}>
                        {roleLabel(item.authorRole)}
                      </Tag>
                      <div className={styles.qWhen}>
                        <ClockCircleOutlined aria-hidden /> {formatViDate(item.createdAt)}
                      </div>
                    </div>
                  </div>
                </article>
              </List.Item>
            )}
          />
          <Pagination
            style={{ padding: '16px 18px', justifyContent: 'center' }}
            current={page}
            pageSize={8}
            total={total}
            onChange={(p) => setPage(p)}
            showSizeChanger={false}
          />
        </main>

        <aside className={styles.rightRail} aria-label="Thông tin thêm">
          <Space direction="vertical" size="middle" className={styles.railStack}>
            <div className={styles.noticeYellow}>
              <strong className={styles.noticeTitle}>Tin &amp; cập nhật</strong>
              <ul className={styles.noticeList}>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Hướng dẫn đặt câu hỏi hay trên SV Forum
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Quy tắc trích dẫn và gắn thẻ theo học phần RIPT
                  </a>
                </li>
              </ul>
            </div>

            <div className={styles.noticeRed}>
              <strong className={styles.noticeTitle}>Trên meta</strong>
              <ul className={styles.noticeList}>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Chính sách nội dung và báo cáo vi phạm
                  </a>
                </li>
                <li>
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Góp ý tính năng cho nhóm dự án
                  </a>
                </li>
              </ul>
            </div>

            <Card title="Lọc theo thẻ" className={styles.railCard} bordered={false}>
              <div className={styles.tagCloud}>
                {allTags.map((name) => (
                  <button
                    type="button"
                    key={name}
                    className={`${styles.tagPill} ${tagFilter === name ? styles.tagPillActive : ''}`}
                    onClick={() => {
                      setTagFilter(tagFilter === name ? undefined : name);
                      setPage(1);
                    }}
                  >
                    <span>{name}</span>
                  </button>
                ))}
              </div>
            </Card>

            <Card title="Đóng góp nổi bật" className={styles.railCard} bordered={false}>
              <List
                size="small"
                dataSource={TOP_CONTRIBUTORS}
                renderItem={(u, i) => (
                  <List.Item className={styles.leaderRow} key={u.name}>
                    <Space align="start" size={10}>
                      <Avatar
                        size={36}
                        style={{
                          backgroundColor: i < 2 ? '#2563eb' : '#94a3b8',
                          color: '#fff',
                        }}
                      >
                        {u.name.charAt(0)}
                      </Avatar>
                      <div>
                        <Text strong>{u.name}</Text>{' '}
                        <Tag color={roleColor(u.role)} style={{ fontSize: 11 }}>
                          {roleLabel(u.role)}
                        </Tag>
                        <div className={styles.leaderPts}>{u.points.toLocaleString('vi-VN')} điểm</div>
                      </div>
                    </Space>
                  </List.Item>
                )}
              />
            </Card>

            <Card
              className={styles.railCard}
              bordered={false}
              title={
                <span>
                  <FireOutlined style={{ color: '#f59e0b', marginRight: 8 }} />
                  Nhóm học tập
                </span>
              }
            >
              <Paragraph type="secondary" className={styles.railHint}>
                Tham gia nhóm theo khoa hoặc học phần để nhận câu hỏi liên quan (demo giao diện).
              </Paragraph>
              <Divider style={{ margin: '12px 0' }} />
              <Button type="primary" block className={styles.joinBtn}>
                Khám phá nhóm
              </Button>
            </Card>
          </Space>
        </aside>
      </div>

      <PostCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => {
          loadFeed();
          history.push(ROUTES.questionDetail(id));
        }}
      />
    </div>
  );
}
