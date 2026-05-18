import { PrismaClient, UserRole, ModerationStatus, TargetType, PostDifficulty } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 200);
}

async function upsertUser(data: {
  email: string;
  username: string;
  full_name: string;
  role: UserRole;
  faculty?: string;
  password_hash: string;
}) {
  return prisma.user.upsert({
    where: { email: data.email },
    update: { full_name: data.full_name, faculty: data.faculty },
    create: data,
  });
}

async function createPostWithTags(
  data: {
    title: string;
    content: string;
    author_id: number;
    view_count: number;
    answer_count: number;
    bounty?: number;
    difficulty?: PostDifficulty;
    moderation_status?: ModerationStatus;
    matched_words?: string[];
  },
  tagNames: string[],
  tagByName: Record<string, { id: number }>,
) {
  const existing = await prisma.post.findFirst({ where: { title: data.title, deleted_at: null } });
  if (existing) {
    return prisma.post.update({
      where: { id: existing.id },
      data: {
        bounty: data.bounty ?? existing.bounty,
        difficulty: data.difficulty ?? existing.difficulty,
        view_count: data.view_count,
        answer_count: data.answer_count,
        moderation_status: data.moderation_status ?? existing.moderation_status,
      },
    });
  }

  const slug = `${slugify(data.title)}-${Date.now()}`;
  return prisma.post.create({
    data: {
      title: data.title,
      slug,
      excerpt: data.content.trim().slice(0, 180),
      content: data.content,
      author_id: data.author_id,
      view_count: data.view_count,
      answer_count: data.answer_count,
      bounty: data.bounty ?? 0,
      difficulty: data.difficulty ?? PostDifficulty.medium,
      moderation_status: data.moderation_status ?? ModerationStatus.published,
      matched_words: data.matched_words?.length ? data.matched_words : undefined,
      post_tags: {
        create: tagNames.map((name) => ({ tag_id: tagByName[name].id })),
      },
    },
  });
}

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);

  const admin = await upsertUser({
    email: 'admin@svforum.vn',
    username: 'admin',
    password_hash: passwordHash,
    full_name: 'Quản trị viên',
    role: UserRole.admin,
  });

  const lecturer = await upsertUser({
    email: 'giangvien@svforum.vn',
    username: 'giangvien',
    password_hash: passwordHash,
    full_name: 'PGS. Lê Thu Hà',
    role: UserRole.teacher,
    faculty: 'Khoa CNTT',
  });

  const student = await upsertUser({
    email: 'sinhvien@svforum.vn',
    username: 'sinhvien',
    password_hash: passwordHash,
    full_name: 'Nguyễn Minh An',
    role: UserRole.student,
    faculty: 'Khoa CNTT',
  });

  const student2 = await upsertUser({
    email: 'nam@svforum.vn',
    username: 'hoangnam',
    password_hash: passwordHash,
    full_name: 'Trần Hoàng Nam',
    role: UserRole.student,
    faculty: 'Khoa CNTT',
  });

  const student3 = await upsertUser({
    email: 'mai@svforum.vn',
    username: 'hoangmai',
    password_hash: passwordHash,
    full_name: 'Hoàng Thị Mai',
    role: UserRole.student,
    faculty: 'Khoa CNTT',
  });

  await prisma.user.updateMany({ data: { reward_points: 500 } });

  const rewardCatalog = [
    { title: 'Voucher Highlands 50k', description: 'Đổi tại quầy sinh viên', cost: 80, stock: 50 },
    { title: 'Voucher Grab 30k', description: 'Mã giảm giá di chuyển', cost: 50, stock: 100 },
    { title: 'Áo SV Forum', description: 'Size M/L, nhận tại văn phòng đoàn', cost: 200, stock: 20 },
    { title: 'Gói in 100 trang', description: 'Thư viện khoa CNTT', cost: 120, stock: 40 },
  ];
  for (const item of rewardCatalog) {
    const existing = await prisma.rewardItem.findFirst({ where: { title: item.title } });
    if (!existing) {
      await prisma.rewardItem.create({ data: item });
    }
  }

  const bannedWords = ['spam', 'lừa đảo', 'hack'];
  for (const word of bannedWords) {
    await prisma.bannedWord.upsert({
      where: { word },
      update: {},
      create: { word, created_by: admin.id },
    });
  }

  const tagNames = [
    'Cấu trúc dữ liệu',
    'Khoa CNTT',
    'RIPT',
    'Phát triển Web',
    'Đồ án',
    'Backend',
    'Cơ sở dữ liệu',
    'Thiết kế hệ thống',
    'Lập trình Python',
    'Machine Learning',
    'DevOps',
  ];

  const tags = await Promise.all(
    tagNames.map((name) =>
      prisma.tag.upsert({
        where: { name },
        update: {},
        create: { name, slug: slugify(name) },
      }),
    ),
  );
  const tagByName = Object.fromEntries(tags.map((t) => [t.name, t]));

  const postsSpec = [
    {
      title: 'Giải thích Big-O notation với ví dụ từ thuật toán sắp xếp',
      content:
        'Mình đang học Cấu trúc dữ liệu và thấy khó phân biệt O(n log n) với O(n²).\n\nVí dụ mình đang so sánh merge sort với bubble sort. Cảm ơn mọi người!',
      author_id: student.id,
      tags: ['Cấu trúc dữ liệu', 'Khoa CNTT', 'RIPT'],
      view_count: 842,
      answer_count: 2,
      bounty: 0,
      difficulty: PostDifficulty.easy,
    },
    {
      title: 'REST vs GraphQL: khi nào nên chọn cho đồ án tốt nghiệp?',
      content:
        'Nhóm em làm API cho hệ thống đặt phòng. Backend NestJS, mobile Flutter.\n\nEm đang phân vân REST vs GraphQL.',
      author_id: student2.id,
      tags: ['Phát triển Web', 'Đồ án', 'Backend'],
      view_count: 1204,
      answer_count: 1,
      bounty: 50,
      difficulty: PostDifficulty.medium,
    },
    {
      title: 'Tài liệu tham khảo chuẩn hóa ERD cho hệ thống đa tenant',
      content: 'Stack: PostgreSQL, ưu tiên row-level tenant. Cảm ơn.',
      author_id: lecturer.id,
      tags: ['Cơ sở dữ liệu', 'Thiết kế hệ thống'],
      view_count: 3102,
      answer_count: 0,
      bounty: 100,
      difficulty: PostDifficulty.hard,
    },
    {
      title: 'Cách triển khai CI/CD cho dự án NestJS + React trên VPS?',
      content:
        'Nhóm em cần pipeline build Docker, chạy test và deploy tự động. Ai có kinh nghiệm với GitHub Actions + Nginx không?',
      author_id: student3.id,
      tags: ['DevOps', 'Backend', 'Đồ án'],
      view_count: 456,
      answer_count: 0,
      bounty: 75,
      difficulty: PostDifficulty.hard,
    },
    {
      title: 'Phân biệt supervised và unsupervised learning — ví dụ thực tế?',
      content:
        'Em đang học môn ML cơ bản. Thầy cô và anh chị có thể cho ví dụ dễ hiểu trong ngành CNTT không ạ?',
      author_id: student.id,
      tags: ['Machine Learning', 'Khoa CNTT'],
      view_count: 678,
      answer_count: 1,
      bounty: 30,
      difficulty: PostDifficulty.medium,
    },
    {
      title: 'Pandas groupby chậm với file CSV 500MB — cách tối ưu?',
      content:
        'Dataset log server ~500MB. Em dùng groupby().agg() bị treo máy. Có nên chuyển sang DuckDB hoặc chunk read không?',
      author_id: student2.id,
      tags: ['Lập trình Python', 'Cơ sở dữ liệu'],
      view_count: 923,
      answer_count: 0,
      bounty: 40,
      difficulty: PostDifficulty.medium,
    },
    {
      title: 'Thiết kế schema Prisma cho forum Q&A có moderation',
      content: 'Nhóm RIPT1307 đang thiết kế DB. Cần góp ý về quan hệ Post-Comment-Vote và soft delete.',
      author_id: student3.id,
      tags: ['Cơ sở dữ liệu', 'Backend', 'RIPT'],
      view_count: 534,
      answer_count: 2,
      bounty: 0,
      difficulty: PostDifficulty.hard,
    },
    {
      title: 'Bài test chứa từ khóa spam cần kiểm duyệt',
      content: 'Đây là bài demo auto-mod với từ spam trong nội dung để admin xử lý.',
      author_id: student.id,
      tags: ['RIPT'],
      view_count: 12,
      answer_count: 0,
      bounty: 0,
      moderation_status: ModerationStatus.pending,
      matched_words: ['spam'],
    },
  ];

  const createdPosts: Record<string, { id: number }> = {};

  for (const spec of postsSpec) {
    const { tags: postTags, ...postData } = spec;
    const post = await createPostWithTags(postData, postTags, tagByName);
    createdPosts[spec.title] = post;
  }

  // Comments & votes for key posts
  const bigOPost = createdPosts['Giải thích Big-O notation với ví dụ từ thuật toán sắp xếp'];
  if (bigOPost) {
    const existingComments = await prisma.comment.count({ where: { post_id: bigOPost.id } });
    if (existingComments === 0) {
      const c1 = await prisma.comment.create({
        data: {
          post_id: bigOPost.id,
          author_id: lecturer.id,
          content: 'Bạn có thể vẽ biểu đồ n vs n log n với cùng trục để so sánh trực quan.',
          moderation_status: ModerationStatus.published,
        },
      });
      await prisma.comment.create({
        data: {
          post_id: bigOPost.id,
          author_id: student.id,
          content: 'Cảm ơn thầy! Em sẽ thử với Python matplotlib.',
          parent_id: c1.id,
          moderation_status: ModerationStatus.published,
        },
      });
    }
    await seedVote(student.id, bigOPost.id, TargetType.post);
    await seedVote(lecturer.id, bigOPost.id, TargetType.post);
    await seedVote(student2.id, bigOPost.id, TargetType.post);
  }

  const restPost = createdPosts['REST vs GraphQL: khi nào nên chọn cho đồ án tốt nghiệp?'];
  if (restPost) {
    const hasComment = await prisma.comment.count({ where: { post_id: restPost.id } });
    if (hasComment === 0) {
      await prisma.comment.create({
        data: {
          post_id: restPost.id,
          author_id: lecturer.id,
          content: 'Với mobile + CRUD đơn giản, REST thường đủ. GraphQL hợp khi client cần query linh hoạt.',
          moderation_status: ModerationStatus.published,
        },
      });
    }
    await seedVote(student.id, restPost.id, TargetType.post);
  }

  const mlPost = createdPosts['Phân biệt supervised và unsupervised learning — ví dụ thực tế?'];
  if (mlPost) {
    const hasComment = await prisma.comment.count({ where: { post_id: mlPost.id } });
    if (hasComment === 0) {
      await prisma.comment.create({
        data: {
          post_id: mlPost.id,
          author_id: lecturer.id,
          content: 'Phân loại email spam vs không spam là supervised. Gom nhóm khách hàng theo hành vi là unsupervised.',
          moderation_status: ModerationStatus.published,
        },
      });
    }
    await seedVote(student3.id, mlPost.id, TargetType.post);
  }

  const prismaPost = createdPosts['Thiết kế schema Prisma cho forum Q&A có moderation'];
  if (prismaPost) {
    const hasComment = await prisma.comment.count({ where: { post_id: prismaPost.id } });
    if (hasComment === 0) {
      const c1 = await prisma.comment.create({
        data: {
          post_id: prismaPost.id,
          author_id: lecturer.id,
          content: 'Nên tách Vote polymorphic bằng target_type + target_id, và dùng deleted_at thay hard delete.',
          moderation_status: ModerationStatus.published,
        },
      });
      await prisma.comment.create({
        data: {
          post_id: prismaPost.id,
          author_id: student2.id,
          content: 'Em đồng ý, soft delete giúp audit trail tốt hơn.',
          parent_id: c1.id,
          moderation_status: ModerationStatus.published,
        },
      });
    }
  }

  // Follows: sinh viên theo dõi vài bài hay
  const followPairs = [
    { userId: student.id, postTitle: 'REST vs GraphQL: khi nào nên chọn cho đồ án tốt nghiệp?' },
    { userId: student.id, postTitle: 'Tài liệu tham khảo chuẩn hóa ERD cho hệ thống đa tenant' },
    { userId: student.id, postTitle: 'Cách triển khai CI/CD cho dự án NestJS + React trên VPS?' },
    { userId: student2.id, postTitle: 'Giải thích Big-O notation với ví dụ từ thuật toán sắp xếp' },
    { userId: student3.id, postTitle: 'Phân biệt supervised và unsupervised learning — ví dụ thực tế?' },
  ];

  for (const { userId, postTitle } of followPairs) {
    const post = createdPosts[postTitle];
    if (!post) continue;
    await prisma.postFollow.upsert({
      where: { user_id_post_id: { user_id: userId, post_id: post.id } },
      update: {},
      create: { user_id: userId, post_id: post.id },
    });
  }

  // Sample star ratings for leaderboard demo
  const ratingSamples = [
    { postTitle: 'Giải thích Big-O notation với ví dụ từ thuật toán sắp xếp', userId: student2.id, stars: 5 },
    { postTitle: 'Giải thích Big-O notation với ví dụ từ thuật toán sắp xếp', userId: student3.id, stars: 4 },
    { postTitle: 'REST vs GraphQL: khi nào nên chọn cho đồ án tốt nghiệp?', userId: student.id, stars: 5 },
    { postTitle: 'Tài liệu tham khảo chuẩn hóa ERD cho hệ thống đa tenant', userId: student.id, stars: 4 },
  ];
  for (const r of ratingSamples) {
    const post = createdPosts[r.postTitle];
    if (!post) continue;
    await prisma.postRating.upsert({
      where: { post_id_user_id: { post_id: post.id, user_id: r.userId } },
      create: { post_id: post.id, user_id: r.userId, stars: r.stars },
      update: { stars: r.stars },
    });
    const agg = await prisma.postRating.aggregate({
      where: { post_id: post.id },
      _avg: { stars: true },
      _count: { stars: true },
    });
    await prisma.post.update({
      where: { id: post.id },
      data: { avg_rating: agg._avg.stars ?? 0, rating_count: agg._count.stars },
    });
  }

  console.log('Seed completed — users, posts, bounty, ratings, rewards, follows updated.');
}

async function seedVote(userId: number, targetId: number, targetType: TargetType) {
  const existing = await prisma.vote.findFirst({
    where: { user_id: userId, target_id: targetId, target_type: targetType },
  });
  if (!existing) {
    await prisma.vote.create({
      data: { user_id: userId, target_id: targetId, target_type: targetType, vote_value: 1 },
    });
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
