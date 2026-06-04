import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link, history, useLocation } from "umi";
import { ROUTES, type MineSection } from "@/constants/routes";
import {
  postService,
  type PostFeedSort,
  type ForumStats,
} from "@/services/posts/postService";
import { followService } from "@/services/posts/followService";
import type { Post, PostDifficulty } from "@/types";
import { useAuth } from "@/contexts/AuthContext";
import { PostCreateModal } from "@/components/forum/PostCreateModal";
import { TagExplorerPanel } from "@/components/forum/TagExplorerPanel";
import { LeaderboardPanel } from "@/components/forum/LeaderboardPanel";
import { RewardsShopModal } from "@/components/forum/RewardsShopModal";
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
  Empty,
  Alert,
  Statistic,
  Rate,
} from "antd";
import {
  formatViDate,
  formatViews,
  roleColor,
  roleLabel,
  difficultyLabel,
  difficultyColor,
} from "@/utils/format";
import {
  PlusOutlined,
  QuestionCircleOutlined,
  TagsOutlined,
  TeamOutlined,
  FireOutlined,
  EyeOutlined,
  ClockCircleOutlined,
  TrophyOutlined,
  BellOutlined,
  LoginOutlined,
  MessageOutlined,
  GiftOutlined,
  EditOutlined,
} from "@ant-design/icons";
import styles from "./index.less";

const { Title, Paragraph, Text } = Typography;

type PageTab = "home" | "mine" | "tags" | "leaderboard";

const SORT_TABS: { key: PostFeedSort; label: string }[] = [
  { key: "newest", label: "Mới nhất" },
  { key: "active", label: "Hoạt động" },
  { key: "rating", label: "Đánh giá cao" },
  { key: "bounty", label: "Có thưởng" },
  { key: "unanswered", label: "Chưa trả lời" },
];

const SORT_LABELS: Record<PostFeedSort, string> = {
  newest: "mới nhất",
  active: "hoạt động gần đây",
  rating: "đánh giá cao",
  bounty: "có thưởng",
  unanswered: "chưa có trả lời",
};

const MINE_SECTIONS: { key: MineSection; label: string; icon: ReactNode }[] = [
  {
    key: "authored",
    label: "Câu hỏi của tôi",
    icon: <QuestionCircleOutlined />,
  },
  { key: "followed", label: "Đang theo dõi", icon: <BellOutlined /> },
];

function parsePageTab(search: string): PageTab {
  const tab = new URLSearchParams(search).get("tab");
  if (tab === "mine" || tab === "questions") return "mine";
  if (tab === "tags") return "tags";
  if (tab === "leaderboard") return "leaderboard";
  return "home";
}

function parseMineSection(search: string): MineSection {
  const s = new URLSearchParams(search).get("section");
  return s === "followed" ? "followed" : "authored";
}

function parseSort(search: string): PostFeedSort {
  const s = new URLSearchParams(search).get("sort");
  if (
    s === "active" ||
    s === "bounty" ||
    s === "unanswered" ||
    s === "rating" ||
    s === "newest"
  )
    return s;
  return "newest";
}

function parseDifficulty(search: string): PostDifficulty | undefined {
  const d = new URLSearchParams(search).get("difficulty");
  if (d === "easy" || d === "medium" || d === "hard") return d;
  return undefined;
}

function buildHomeUrl(opts: {
  sort?: PostFeedSort;
  q?: string;
  tag?: string | null;
  difficulty?: PostDifficulty | null;
  page?: number;
}) {
  const params = new URLSearchParams();
  params.set("tab", "home");
  if (opts.sort && opts.sort !== "newest") params.set("sort", opts.sort);
  if (opts.q) params.set("q", opts.q);
  if (opts.tag) params.set("tag", opts.tag);
  if (opts.difficulty) params.set("difficulty", opts.difficulty);
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  return `${ROUTES.home}?${params.toString()}#feed`;
}

function buildMineUrl(opts: { section?: MineSection; page?: number }) {
  const params = new URLSearchParams();
  params.set("tab", "mine");
  params.set("section", opts.section ?? "authored");
  if (opts.page && opts.page > 1) params.set("page", String(opts.page));
  return `${ROUTES.home}?${params.toString()}#mine`;
}

export default function HomePage() {
  const location = useLocation();
  const { user, isAuthenticated } = useAuth();
  const activeTab = parsePageTab(location.search);
  const mineSection = parseMineSection(location.search);
  const sort = parseSort(location.search);
  const search = new URLSearchParams(location.search).get("q") ?? "";
  const tagFromUrl =
    new URLSearchParams(location.search).get("tag") ?? undefined;
  const difficultyFromUrl = parseDifficulty(location.search);
  const pageFromUrl = Number(
    new URLSearchParams(location.search).get("page") ?? "1",
  );

  const [posts, setPosts] = useState<Post[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(Math.max(1, pageFromUrl || 1));
  const [tagFilter, setTagFilter] = useState<string | undefined>(tagFromUrl);
  const [difficultyFilter, setDifficultyFilter] = useState<
    PostDifficulty | undefined
  >(difficultyFromUrl);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [rewardsOpen, setRewardsOpen] = useState(false);
  const [feedTick, setFeedTick] = useState(0);
  const [loading, setLoading] = useState(false);
  const [tagsWithCount, setTagsWithCount] = useState<
    { name: string; count: number }[]
  >([]);
  const [authoredTotal, setAuthoredTotal] = useState(0);
  const [followedCount, setFollowedCount] = useState(0);
  const [forumStats, setForumStats] = useState<ForumStats | null>(null);

  const goHome = useCallback(
    (extra?: {
      sort?: PostFeedSort;
      tag?: string | null;
      difficulty?: PostDifficulty | null;
      page?: number;
    }) => {
      history.push(
        buildHomeUrl({
          sort: extra?.sort ?? sort,
          q: search || undefined,
          tag: extra?.tag === null ? undefined : (extra?.tag ?? tagFilter),
          difficulty:
            extra?.difficulty === null
              ? undefined
              : (extra?.difficulty ?? difficultyFilter),
          page: extra?.page ?? 1,
        }),
      );
    },
    [search, sort, tagFilter, difficultyFilter],
  );

  const goMine = useCallback(
    (section: MineSection = mineSection, p = 1) => {
      history.push(buildMineUrl({ section, page: p }));
    },
    [mineSection],
  );

  const setSort = useCallback(
    (next: PostFeedSort) => {
      history.push(
        buildHomeUrl({
          sort: next,
          q: search || undefined,
          tag: tagFilter,
          difficulty: difficultyFilter,
          page: 1,
        }),
      );
      setPage(1);
    },
    [search, tagFilter, difficultyFilter],
  );

  const loadFeed = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === "home") {
        const res = await postService.list({
          page,
          pageSize: 8,
          search,
          tag: tagFilter,
          difficulty: difficultyFilter,
          sort,
        });
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
        mineSection === "authored"
          ? await postService.listByAuthor(user.id, { page, pageSize: 8 })
          : await postService.listFollowed(user.id, { page, pageSize: 8 });
      setPosts(res.items);
      setTotal(res.total);
    } finally {
      setLoading(false);
    }
  }, [
    activeTab,
    page,
    search,
    tagFilter,
    difficultyFilter,
    sort,
    user,
    mineSection,
  ]);

  useEffect(() => {
    postService
      .getTagsWithCount()
      .then(setTagsWithCount)
      .catch(() => setTagsWithCount([]));
    postService
      .getForumStats()
      .then(setForumStats)
      .catch(() => setForumStats(null));
  }, [feedTick]);

  useEffect(() => {
    if (user) {
      postService
        .listByAuthor(user.id, { page: 1, pageSize: 1 })
        .then((r) => setAuthoredTotal(r.total));
      followService.countFollowed(user.id).then(setFollowedCount);
    } else {
      setAuthoredTotal(0);
      setFollowedCount(0);
    }
  }, [user, feedTick]);

  useEffect(() => {
    setTagFilter(tagFromUrl);
    setDifficultyFilter(difficultyFromUrl);
    setPage(Math.max(1, pageFromUrl || 1));
  }, [tagFromUrl, difficultyFromUrl, pageFromUrl]);

  useEffect(() => {
    loadFeed();
  }, [loadFeed, feedTick]);

  useEffect(() => {
    const hash = location.hash;
    if (hash === "#feed" || hash === "#mine") {
      document
        .getElementById(hash.slice(1))
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [activeTab, location.hash, location.search]);

  const scrollToSection = (id: string) => {
    if (id === "tag-cloud") {
      history.push(`${ROUTES.home}?tab=tags`);
    } else if (id === "contributors") {
      history.push(`${ROUTES.home}?tab=leaderboard`);
    } else {
      goHome();
      setTimeout(
        () =>
          document
            .getElementById(id)
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        100,
      );
    }
  };

  const openAsk = () => {
    if (!isAuthenticated) {
      history.push(ROUTES.login);
      return;
    }
    setEditingPost(null);
    setModalOpen(true);
  };

  const openEdit = (post: Post) => {
    setEditingPost(post);
    setModalOpen(true);
  };

  const applyFilters = (tag?: string, difficulty?: PostDifficulty) => {
    setTagFilter(tag);
    setDifficultyFilter(difficulty);
    setPage(1);
    goHome({ tag: tag ?? null, difficulty: difficulty ?? null, page: 1 });
  };

  const renderQuestionRow = (
    item: Post,
    opts?: { showModeration?: boolean },
  ) => (
    <List.Item className={styles.qRow} key={item.id}>
      <article className={styles.qGrid}>
        <div className={styles.qVotes}>
          <span className={styles.qNum}>{item.voteScore}</span>
          <span className={styles.qLbl}>phiếu</span>
        </div>
        <div
          className={
            item.answerCount > 0
              ? `${styles.qAns} ${styles.qAnsHas}`
              : styles.qAns
          }
        >
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
          {opts?.showModeration && item.moderationStatus !== "published" && (
            <Tag
              color={item.moderationStatus === "pending" ? "orange" : "red"}
              className={styles.moderationTag}
            >
              {item.moderationStatus === "pending" ? "Chờ duyệt" : "Đã ẩn"}
            </Tag>
          )}
          {item.difficulty && (
            <Tag color={difficultyColor(item.difficulty)}>
              {difficultyLabel(item.difficulty)}
            </Tag>
          )}
          {(item.bounty ?? 0) > 0 && (
            <Tag
              icon={<TrophyOutlined />}
              color="gold"
              className={styles.bountyTag}
            >
              +{item.bounty} điểm thưởng
            </Tag>
          )}
          {(item.ratingCount ?? 0) > 0 && (
            <span className={styles.qRating}>
              <Rate
                disabled
                allowHalf
                value={item.avgRating ?? 0}
                style={{ fontSize: 12 }}
              />
              <Text type="secondary" style={{ fontSize: 11, marginLeft: 4 }}>
                ({item.ratingCount})
              </Text>
            </span>
          )}
          <Paragraph className={styles.qExcerpt} ellipsis={{ rows: 2 }}>
            {item.excerpt}
          </Paragraph>
          <div className={styles.qTags}>
            {item.tags.map((t, i) => {
              const toneClass =
                i % 3 === 0
                  ? styles.qTagTone0
                  : i % 3 === 1
                    ? styles.qTagTone1
                    : styles.qTagTone2;
              return (
                <Tag
                  key={t}
                  className={`${styles.qTag} ${toneClass} ${activeTab === "home" ? styles.qTagClickable : ""}`}
                  onClick={
                    activeTab === "home"
                      ? () => applyFilters(t, difficultyFilter)
                      : undefined
                  }
                >
                  {t}
                </Tag>
              );
            })}
          </div>
        </div>
        <div className={styles.qUser}>
          <Link to={ROUTES.publicProfile(item.authorUsername)}>
            <Avatar size="small" className={styles.qAvatar}>
              {item.authorName.charAt(0)}
            </Avatar>
          </Link>
          <div className={styles.qUserMeta}>
            <Link
              to={ROUTES.publicProfile(item.authorUsername)}
              className={styles.qAuthor}
            >
              {item.authorName}
            </Link>
            <Tag
              bordered={false}
              color={roleColor(item.authorRole)}
              className={styles.qRole}
            >
              {roleLabel(item.authorRole)}
            </Tag>
            <div className={styles.qWhen}>
              <ClockCircleOutlined aria-hidden /> {formatViDate(item.createdAt)}
            </div>
            {item.isAuthor && (
              <Button
                type="link"
                size="small"
                icon={<EditOutlined />}
                className={styles.editBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  openEdit(item);
                }}
              >
                Sửa
              </Button>
            )}
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
            {total.toLocaleString("vi-VN")} câu hỏi · {SORT_LABELS[sort]}
            {search ? ` · tìm: "${search}"` : ""}
            {tagFilter ? ` · thẻ: ${tagFilter}` : ""}
            {difficultyFilter ? ` · ${difficultyLabel(difficultyFilter)}` : ""}
          </Text>
        </div>
        <Button
          type="primary"
          size="large"
          icon={<PlusOutlined />}
          className={styles.askBtn}
          onClick={openAsk}
        >
          Đặt câu hỏi
        </Button>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.tabs}>
          {SORT_TABS.map((t) => (
            <button
              key={t.key}
              type="button"
              className={`${styles.tab} ${sort === t.key ? styles.tabActive : ""}`}
              onClick={() => setSort(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {posts.length === 0 ? (
        <Empty
          className={styles.emptyFeed}
          description={
            sort === "bounty"
              ? "Chưa có câu hỏi nào đang gắn thưởng"
              : sort === "unanswered"
                ? "Không có câu hỏi chưa trả lời phù hợp bộ lọc"
                : "Không tìm thấy câu hỏi phù hợp"
          }
        >
          <Button
            type="primary"
            onClick={() => applyFilters(undefined, undefined)}
          >
            Xóa bộ lọc
          </Button>
        </Empty>
      ) : (
        <>
          <List
            className={styles.qList}
            dataSource={posts}
            split={false}
            loading={loading}
            renderItem={(item) => renderQuestionRow(item)}
          />
          <Pagination
            style={{ padding: "16px 18px", justifyContent: "center" }}
            current={page}
            pageSize={8}
            total={total}
            onChange={(p) => {
              setPage(p);
              history.push(
                buildHomeUrl({
                  sort,
                  q: search || undefined,
                  tag: tagFilter,
                  difficulty: difficultyFilter,
                  page: p,
                }),
              );
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
          <Empty
            className={styles.emptyFeed}
            description="Đăng nhập để xem câu hỏi bạn đăng và đang theo dõi"
          >
            <Button
              type="primary"
              icon={<LoginOutlined />}
              onClick={() => history.push(ROUTES.login)}
            >
              Đăng nhập
            </Button>
          </Empty>
        </main>
      );
    }

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
          <Button
            type="primary"
            size="large"
            icon={<PlusOutlined />}
            className={styles.askBtn}
            onClick={openAsk}
          >
            Đặt câu hỏi mới
          </Button>
        </div>

        <div className={styles.filterRow}>
          <div className={styles.tabs}>
            {MINE_SECTIONS.map((s) => (
              <button
                key={s.key}
                type="button"
                className={`${styles.tab} ${mineSection === s.key ? styles.tabActive : ""}`}
                onClick={() => {
                  setPage(1);
                  goMine(s.key, 1);
                }}
              >
                {s.icon} {s.label}
                {s.key === "followed" && followedCount > 0 ? (
                  <span className={styles.tabBadge}>{followedCount}</span>
                ) : null}
              </button>
            ))}
          </div>
        </div>

        {mineSection === "followed" && (
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
              mineSection === "authored"
                ? "Bạn chưa đăng câu hỏi nào"
                : "Bạn chưa theo dõi câu hỏi nào"
            }
          >
            {mineSection === "authored" ? (
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
              loading={loading}
              renderItem={(item) =>
                renderQuestionRow(item, {
                  showModeration: mineSection === "authored",
                })
              }
            />
            <Pagination
              style={{ padding: "16px 18px", justifyContent: "center" }}
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

  const renderLeaderboardView = () => (
    <main className={styles.mainCol} id="leaderboard">
      <div className={styles.mainHead}>
        <div>
          <Title level={3} className={styles.pageTitle}>
            Bảng xếp hạng
          </Title>
          <Text type="secondary" className={styles.qCount}>
            Những thành viên tích cực nhất hệ thống
          </Text>
        </div>
      </div>
      <div style={{ padding: "24px" }}>
        <LeaderboardPanel tags={tagsWithCount} />
      </div>
    </main>
  );

  const renderTagsView = () => (
    <main className={styles.mainCol} id="tags">
      <div className={styles.mainHead}>
        <div>
          <Title level={3} className={styles.pageTitle}>
            Thẻ phổ biến
          </Title>
          <Text type="secondary" className={styles.qCount}>
            Tìm kiếm câu hỏi theo chủ đề và độ khó
          </Text>
        </div>
      </div>
      <div style={{ padding: "24px" }}>
        <TagExplorerPanel
          tags={tagsWithCount}
          selectedTag={tagFilter}
          selectedDifficulty={difficultyFilter}
          onApply={applyFilters}
        />
      </div>
    </main>
  );

  const renderContent = () => {
    switch (activeTab) {
      case "mine":
        return renderMineFeed();
      case "tags":
        return renderTagsView();
      case "leaderboard":
        return renderLeaderboardView();
      case "home":
      default:
        return renderPublicFeed();
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.mobileNav}>
        <button
          type="button"
          className={`${styles.mobileNavLink} ${activeTab === "home" ? styles.mobileNavLinkActive : ""}`}
          onClick={() => goHome()}
        >
          Bảng tin
        </button>
        <button
          type="button"
          className={`${styles.mobileNavLink} ${activeTab === "mine" ? styles.mobileNavLinkActive : ""}`}
          onClick={() => goMine("authored")}
        >
          Của tôi
        </button>
      </div>

      <div className={styles.soShell}>
        <aside className={styles.leftNav} aria-label="Điều hướng bổ sung">
          <nav className={styles.navBlock}>
            <Text className={styles.navSection}>Khám phá thêm</Text>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "home" ? styles.navItemActive : ""}`}
              onClick={() => goHome()}
            >
              <FireOutlined /> Bảng tin
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "mine" && mineSection === "followed" ? styles.navItemActive : ""}`}
              onClick={() => goMine("followed")}
            >
              <BellOutlined /> Đang theo dõi
              {followedCount > 0 ? (
                <span className={styles.tabBadge}>{followedCount}</span>
              ) : null}
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "tags" ? styles.navItemActive : ""}`}
              onClick={() => scrollToSection("tag-cloud")}
            >
              <TagsOutlined /> Thẻ phổ biến
            </button>
            <button
              type="button"
              className={`${styles.navItem} ${activeTab === "leaderboard" ? styles.navItemActive : ""}`}
              onClick={() => scrollToSection("contributors")}
            >
              <TeamOutlined /> Bảng xếp hạng
            </button>
          </nav>
        </aside>

        {renderContent()}

        <aside className={styles.rightRail} aria-label="Thông tin thêm">
          <Space
            direction="vertical"
            size="middle"
            className={styles.railStack}
          >
            {activeTab === "home" && forumStats && (
              <Card
                className={styles.railCard}
                bordered={false}
                title="Thống kê diễn đàn"
              >
                <div className={styles.forumStats}>
                  <Statistic
                    title="Câu hỏi"
                    value={forumStats.questionCount}
                    prefix={<QuestionCircleOutlined />}
                  />
                  <Statistic
                    title="Trả lời"
                    value={forumStats.answerCount}
                    prefix={<MessageOutlined />}
                  />
                  <Statistic
                    title="Thẻ"
                    value={forumStats.tagCount}
                    prefix={<TagsOutlined />}
                  />
                </div>
              </Card>
            )}

            {isAuthenticated && user && (
              <Card className={styles.railCard} bordered={false}>
                <Space direction="vertical" style={{ width: "100%" }}>
                  <Text>
                    <TrophyOutlined
                      style={{ color: "#f59e0b", marginRight: 6 }}
                    />
                    Điểm thưởng:{" "}
                    <strong>
                      {(user.reward_points ?? user.rewardPoints ?? 0).toLocaleString("vi-VN")}
                    </strong>
                  </Text>
                  <Button
                    icon={<GiftOutlined />}
                    block
                    onClick={() => setRewardsOpen(true)}
                  >
                    Đổi quà & voucher
                  </Button>
                </Space>
              </Card>
            )}



            <Card
              className={styles.railCard}
              bordered={false}
              title={
                <span>
                  <FireOutlined style={{ color: "#f59e0b", marginRight: 8 }} />
                  Gợi ý
                </span>
              }
            >
              <Paragraph type="secondary" className={styles.railHint}>
                {activeTab === "home"
                  ? "Chọn thẻ và độ khó ở panel bên phải, đánh giá sao bài hữu ích, trả lời câu có thưởng để tích điểm."
                  : "Bài đăng của bạn có thể ở trạng thái chờ duyệt nếu chứa từ khóa nhạy cảm."}
              </Paragraph>
              <Button
                type="primary"
                block
                className={styles.joinBtn}
                onClick={() =>
                  activeTab === "home" ? setSort("bounty") : goHome()
                }
              >
                {activeTab === "home" ? "Xem câu hỏi có thưởng" : "Về bảng tin"}
              </Button>
            </Card>
          </Space>
        </aside>
      </div>

      <PostCreateModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingPost(null);
        }}
        onCreated={(id) => {
          setFeedTick((t) => t + 1);
          goMine("authored");
          history.push(ROUTES.questionDetail(id));
        }}
        editPost={editingPost}
      />
      <RewardsShopModal
        open={rewardsOpen}
        onClose={() => setRewardsOpen(false)}
      />
    </div>
  );
}
