import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, history, useLocation } from 'umi';
import { ROUTES, type MineSection } from '@/constants/routes';
import { postService, type PostFeedSort } from '@/services/posts/postService';
import { followService } from '@/services/posts/followService';
import type { Post } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { PostCreateModal } from '@/components/forum/PostCreateModal';
import {
  Button,
  Card,
  Tag,
  Typography,
  List,
  Avatar,
  Space,
  Divider,
  Pagination,
  Select,
  Empty,
  Alert,
} from 'antd';
import { formatViDate, formatViews, roleColor, roleLabel } from '@/utils/format';
import {
  PlusOutlined,
  HomeOutlined,
  QuestionCircleOutlined,
  TagsOutlined,
  ReadOutlined,
  TeamOutlined,
  FireOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  StarOutlined,
  BellOutlined,
  LoginOutlined,
} from '@ant-design/icons';
import styles from './index.less';

const { Title, Paragraph, Text } = Typography;

type PageTab = 'home' | 'mine';

const SORT_TABS: { key: PostFeedSort; label: string }[] = [
  { key: 'newest', label: 'Mới nhất' },
  { key: 'active', label: 'Hoạt động' },
  { key: 'bounty', label: 'Có thưởng' },
  { key: 'unanswered', label: 'Chưa trả lời' },
];

const SORT_LABELS: Record<PostFeedSort, string> = {
  newest: 'mới nhất',
  active: 'hoạt động gần đây',
  bounty: 'có thưởng',
  unanswered: 'chưa có trả lời',
};

const MINE_SECTIONS: { key: MineSection; label: string; icon: ReactNode }[] = [
  { key: 'authored', label: 'Câu hỏi của tôi', icon: <QuestionCircleOutlined /> },
  { key: 'followed', label: 'Đang theo dõi', icon: <BellOutlined /> },
];

const TOP_CONTRIBUTORS = [
  { name: 'PGS. Lê Thu Hà', role: 'LECTURER' as const, points: 2840 },
  { name: 'Nguyễn Minh An', role: 'STUDENT' as const, points: 1520 },
  { name: 'Trần Hoàng Nam', role: 'STUDENT' as const, points: 1388 },
  { name: 'Hoàng Thị Mai', role: 'STUDENT' as const, points: 1204 },
];

function parsePageTab(search: string): PageTab {
  const tab = new URLSearchParams(search).get('tab');
  if (tab === 'mine' || tab === 'questions') return 'mine';
  return 'home';
}

function parseMineSection(search: string): MineSection {
  const s = new URLSearchParams(search).get('section');
  return s === 'followed' ? 'followed' : 'authored';
}

function parseSort(search: string): PostFeedSort {
  const s = new URLSearchParams(search).get('sort');
  if (s === 'active' || s === 'bounty' || s === 'unanswered' || s === 'newest') return s;
  return 'newest';
}

function buildHomeUrl(opts: { sort?: PostFeedSort; q?: string; tag?: string; page?: number }) {
  const params = new URLSearchParams();
  params.set('tab', 'home');
  if (opts.sort && opts.sort !== 'newest') params.set('sort', opts.sort);
  if (opts.q) params.set('q', opts.q);
  if (opts.tag) params.set('tag', opts.tag);
  if (opts.page && opts.page > 1) params.set('page', String(opts.page));
  return `${ROUTES.home}?${params.toString()}#feed`;
}

function buildMineUrl(opts: { section?: MineSection; page?: number }) {
  const params = new URLSearchParams();
  params.set('tab', 'mine');
  params.set('section', opts.section ?? 'authored');
  if (opts.page && opts.page > 1) params.set('page', String(opts.page));
  return `${ROUTES.home}?${params.toString()}#mine`;
}

export default function HomePage() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const activeTab = parsePageTab(location.search);
  const mineSection = parseMineSection(location.search);
  const sort = parseSort(location.search);
  const search = new URLSearchParams(location.search).get('q') ?? '';
  const tagFromUrl = new URLSearchParams(location.search).get('tag') ?? undefined;
  const pageFromUrl = Number(new URLSearchParams(location.search).get('page') ?? '1');

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Math.max(1, pageFromUrl || 1));
  const [tagFilter, setTagFilter] = useState<string | undefined>(tagFromUrl);
  const [modalOpen, setModalOpen] = useState(false);
  const [feedTick, setFeedTick] = useState(0);

  const tagsWithCount = useMemo(() => postService.getTagsWithCount(), [feedTick, posts]);

  const goHome = useCallback(
    (extra?: { sort?: PostFeedSort; tag?: string | null; page?: number }) => {
      history.push(
        buildHomeUrl({
          sort: extra?.sort ?? sort,
          q: search || undefined,
          tag: extra?.tag === null ? undefined : (extra?.tag ?? tagFilter),
          page: extra?.page ?? 1,
        }),
      );
    },
    [search, sort, tagFilter],
  );

  const goMine = useCallback((section: MineSection = mineSection, p = 1) => {
    history.push(buildMineUrl({ section, page: p }));
  }, [mineSection]);

  const setSort = useCallback(
    (next: PostFeedSort) => {
      history.push(buildHomeUrl({ sort: next, q: search || undefined, tag: tagFilter, page: 1 }));
      setPage(1);
    },
    [search, tagFilter],
  );

  const loadFeed = useCallback(() => {
    if (activeTab === 'home') {
      const res = postService.list({ page, pageSize: 8, search, tag: tagFilter, sort });
      setPosts(res.items);
      setTotal(res.total);
      return;
    }
    if (!user) {
      setPosts([]);
      setTotal(0);
      return;
    }
    const res =
      mineSection === 'authored'
        ? postService.listByAuthor(user.id, { page, pageSize: 8 })
        : postService.listFollowed(user.id, { page, pageSize: 8 });
    setPosts(res.items);
    setTotal(res.total);
  }, [activeTab, page, search, tagFilter, sort, user, mineSection]);

  useEffect(() => {
    setTagFilter(tagFromUrl);
    setPage(Math.max(1, pageFromUrl || 1));
  }, [tagFromUrl, pageFromUrl]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed, feedTick]);

  useEffect(() => {
    const hash = location.hash;
    if (hash === '#feed' || hash === '#mine') {
      document.getElementById(hash.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [activeTab, location.hash, location.search]);

  const openAsk = () => {
    if (!isAuthenticated) {
      history.push(ROUTES.login);
      return;
    }
    setModalOpen(true);
  };

  const applyTagFilter = (name: string | undefined) => {
    setTagFilter(name);
    setPage(1);
    goHome({ tag: name ?? null, page: 1 });
  };

  const renderQuestionRow = (item: Post, opts?: { showModeration?: boolean }) => (
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
          {opts?.showModeration && item.moderationStatus !== 'published' && (
            <Tag
              color={
                item.moderationStatus === 'pending' ? 'orange' : 'red'
              }
              className={styles.moderationTag}
            >
              {item.moderationStatus === 'pending' ? 'Chờ duyệt' : 'Đã ẩn'}
            </Tag>
          )}
          {(item.bounty ?? 0) > 0 && (
            <Tag icon={<TrophyOutlined />} color="gold" className={styles.bountyTag}>
              +{item.bounty} điểm thưởng
            </Tag>
          )}
          <Paragraph className={styles.qExcerpt} ellipsis={{ rows: 2 }}>
            {item.excerpt}
          </Paragraph>
          <div className={styles.qTags}>
            {item.tags.map((t, i) => {
              const toneClass =
                i % 3 === 0 ? styles.qTagTone0 : i % 3 === 1 ? styles.qTagTone1 : styles.qTagTone2;
              return (
                <Tag
                  key={t}
                  className={`${styles.qTag} ${toneClass} ${activeTab === 'home' ? styles.qTagClickable : ''}`}
                  onClick={activeTab === 'home' ? () => applyTagFilter(t) : undefined}
                >
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
  );

  const renderPublicFeed = () => (
    <main className={styles.mainCol} id="feed">
      <div className={styles.mainHead}>
        <div>
          <Title level={3} className={styles.pageTitle}>
            Bảng tin
          </Title>
          <Text type="secondary" className={styles.qCount}>
            {total.toLocaleString('vi-VN')} câu hỏi · {SORT_LABELS[sort]}
            {search ? ` · tìm: "${search}"` : ''}
            {tagFilter ? ` · thẻ: ${tagFilter}` : ''}
          </Text>
        </div>
        <Button type="primary" size="large" icon={<PlusOutlined />} className={styles.askBtn} onClick={openAsk}>
          Đặt câu hỏi
        </Button>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.tabs}>
          {SORT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tab} ${sort === t.key ? styles.tabActive : ''}`}
              onClick={() => setSort(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Select
          allowClear
          placeholder="Lọc theo thẻ"
          style={{ minWidth: 160 }}
          value={tagFilter}
          onChange={(v) => applyTagFilter(v)}
          options={tagsWithCount.map((t) => ({
            label: `${t.name} (${t.count})`,
            value: t.name,
          }))}
        />
      </div>

      {posts.length === 0 ? (
        <Empty
          className={styles.emptyFeed}
          description={
            sort === 'bounty'
              ? 'Chưa có câu hỏi nào đang gắn thưởng'
              : sort === 'unanswered'
                ? 'Không có câu hỏi chưa trả lời phù hợp bộ lọc'
                : 'Không tìm thấy câu hỏi phù hợp'
          }
        >
          <Button type="primary" onClick={() => applyTagFilter(undefined)}>
            Xóa bộ lọc
          </Button>
        </Empty>
      ) : (
        <>
          <List className={styles.qList} dataSource={posts} split={false} renderItem={(item) => renderQuestionRow(item)} />
          <Pagination
            style={{ padding: '16px 18px', justifyContent: 'center' }}
            current={page}
            pageSize={8}
            total={total}
            onChange={(p) => {
              setPage(p);
              history.push(buildHomeUrl({ sort, q: search || undefined, tag: tagFilter, page: p }));
            }}
            showSizeChanger={false}
          />
        </>
      )}
    </main>
  );

  const renderMineFeed = () => {
    if (!isAuthenticated) {
      return (
        <main className={styles.mainCol} id="mine">
          <div className={styles.mainHead}>
            <Title level={3} className={styles.pageTitle}>
              Câu hỏi của tôi
            </Title>
          </div>
          <Empty className={styles.emptyFeed} description="Đăng nhập để xem câu hỏi bạn đăng và đang theo dõi">
            <Button type="primary" icon={<LoginOutlined />} onClick={() => history.push(ROUTES.login)}>
              Đăng nhập
            </Button>
          </Empty>
        </main>
      );
    }

    const followedCount = followService.countFollowed(user.id);

    return (
      <main className={styles.mainCol} id="mine">
        <div className={styles.mainHead}>
          <div>
            <Title level={3} className={styles.pageTitle}>
              Câu hỏi của tôi
            </Title>
            <Text type="secondary" className={styles.qCount}>
              Quản lý bài bạn đăng và câu hỏi đang theo dõi
            </Text>
          </div>
          <Button type="primary" size="large" icon={<PlusOutlined />} className={styles.askBtn} onClick={openAsk}>
            Đặt câu hỏi mới
          </Button>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.tabs}>
            {MINE_SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`${styles.tab} ${mineSection === s.key ? styles.tabActive : ''}`}
                onClick={() => {
                  setPage(1);
                  goMine(s.key, 1);
                }}
              >
                {s.icon} {s.label}
                {s.key === 'followed' && followedCount > 0 ? (
                  <span className={styles.tabBadge}>{followedCount}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {mineSection === 'followed' && (
          <Alert
            type="info"
            showIcon
            className={styles.mineHint}
            message="Mẹo"
            description='Vào chi tiết câu hỏi bất kỳ và bấm "Theo dõi" để nhận cập nhật tại đây.'
          />
        )}

        {posts.length === 0 ? (
          <Empty
            className={styles.emptyFeed}
            description={
              mineSection === 'authored'
                ? 'Bạn chưa đăng câu hỏi nào'
                : 'Bạn chưa theo dõi câu hỏi nào'
            }
          >
            {mineSection === 'authored' ? (
              <Button type="primary" icon={<PlusOutlined />} onClick={openAsk}>
                Đặt câu hỏi đầu tiên
              </Button>
            ) : (
              <Button type="primary" onClick={() => goHome()}>
                Khám phá bảng tin
              </Button>
            )}
          </Empty>
        ) : (
          <>
            <List
              className={styles.qList}
              dataSource={posts}
              split={false}
              renderItem={(item) => renderQuestionRow(item, { showModeration: mineSection === 'authored' })}
            />
            <Pagination
              style={{ padding: '16px 18px', justifyContent: 'center' }}
              current={page}
              pageSize={8}
              total={total}
              onChange={(p) => {
                setPage(p);
                goMine(mineSection, p);
              }}
              showSizeChanger={false}
            />
          </>
        )}
      </main>
    );
  };

  return (
    <div className={styles.page}>
      <div className={styles.mobileNav}>
        <button
          type="button"
          className={`${styles.mobileNavLink} ${activeTab === 'home' ? styles.mobileNavLinkActive : ''}`}
          onClick={() => goHome()}
        >
          Trang chủ
        </button>
        <button
          type="button"
          className={`${styles.mobileNavLink} ${activeTab === 'mine' ? styles.mobileNavLinkActive : ''}`}
          onClick={() => goMine('authored')}
        >
          Câu hỏi của tôi
        </button>
      </div>

      <div className={styles.soShell}>
        <aside className={styles.leftNav} aria-label="Điều hướng trang">
          <nav className={styles.navBlock}>
            <Text className={styles.navSection}>Công khai</Text>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'home' ? styles.navItemActive : ''}`}
              onClick={() => goHome()}
            >
              <HomeOutlined /> Trang chủ
            </button>
            <button type="button" className={styles.navItem} onClick={() => goHome()}>
              <TagsOutlined /> Thẻ
            </button>
            <Text className={styles.navSection}>Cá nhân</Text>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'mine' ? styles.navItemActive : ''}`}
              onClick={() => goMine('authored')}
            >
              <StarOutlined /> Câu hỏi của tôi
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === 'mine' && mineSection === 'followed' ? styles.navItemActive : ''}`}
              onClick={() => goMine('followed')}
            >
              <BellOutlined /> Đang theo dõi
            </button>
            <span className={`${styles.navItem} ${styles.navItemDisabled}`} title="Sắp có">
              <ReadOutlined /> Bài viết
            </span>
            <span className={`${styles.navItem} ${styles.navItemDisabled}`} title="Sắp có">
              <TeamOutlined /> Thành viên
            </span>
          </nav>
        </aside>

        {activeTab === 'home' ? renderPublicFeed() : renderMineFeed()}

        <aside className={styles.rightRail} aria-label="Thông tin thêm">
          <Space direction="vertical" size="middle" className={styles.railStack}>
            {activeTab === 'home' && (
              <Card className={styles.railCard} bordered={false} title="Lọc theo thẻ">
                <div className={styles.tagCloud}>
                  {tagsWithCount.map(({ name, count }) => (
                    <button
                      type="button"
                      key={name}
                      className={`${styles.tagPill} ${tagFilter === name ? styles.tagPillActive : ''}`}
                      onClick={() => applyTagFilter(tagFilter === name ? undefined : name)}
                    >
                      <span>{name}</span>
                      <small>{count}</small>
                    </button>
                  ))}
                </div>
              </Card>
            )}

            {activeTab === 'mine' && isAuthenticated && user && (
              <Card className={styles.railCard} bordered={false} title="Tóm tắt">
                <div className={styles.mineSummary}>
                  <button type="button" className={styles.mineSummaryRow} onClick={() => goMine('authored')}>
                    <QuestionCircleOutlined />
                    <span>Câu hỏi đã đăng</span>
                    <strong>{postService.listByAuthor(user.id, { page: 1, pageSize: 1 }).total}</strong>
                  </button>
                  <button type="button" className={styles.mineSummaryRow} onClick={() => goMine('followed')}>
                    <BellOutlined />
                    <span>Đang theo dõi</span>
                    <strong>{followService.countFollowed(user.id)}</strong>
                  </button>
                </div>
              </Card>
            )}

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
                  Gợi ý
                </span>
              }
            >
              <Paragraph type="secondary" className={styles.railHint}>
                {activeTab === 'home'
                  ? 'Lướt bảng tin để khám phá. Theo dõi câu hỏi hay để xem lại trong tab Câu hỏi của tôi.'
                  : 'Bài đăng của bạn có thể ở trạng thái chờ duyệt nếu chứa từ khóa nhạy cảm.'}
              </Paragraph>
              <Button type="primary" block className={styles.joinBtn} onClick={() => (activeTab === 'home' ? goMine('authored') : goHome())}>
                {activeTab === 'home' ? 'Xem câu hỏi của tôi' : 'Về bảng tin'}
              </Button>
            </Card>
          </Space>
        </aside>
      </div>

      <PostCreateModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={(id) => {
          setFeedTick((t) => t + 1);
          goMine('authored');
          history.push(ROUTES.questionDetail(id));
        }}
      />
    </div>
  );
}
