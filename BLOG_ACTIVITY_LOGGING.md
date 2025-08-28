# 博客创建活动日志记录实现

## 问题背景
当前创建新博客时不会记录日志，需要照样子实现一个创建博客的日志记录点。

## 实现方案

### 1. 分析现有日志记录模式

**现有组件**:
- `lib/activity-logger.ts`: 核心活动日志记录服务
- `lib/utils/activity-logger-helper.ts`: 日志记录辅助函数
- `logBlogActivity()`: 专门用于博客活动的便捷函数

**数据库支持**:
- Prisma schema 中已有 `BLOG_CREATE` 活动类型
- 支持详细的活动状态、资源信息和元数据记录

### 2. 实现博客创建日志记录

**修改文件**: `app/api/blogs/route.ts`

**记录的场景**:

#### a) 权限检查失败
```typescript
await logBlogActivity(
  userId,
  "BLOG_CREATE", 
  "FAILED",
  "",
  "",
  { reason: "权限检查" },
  "权限不足，仅管理员和已验证用户可以创建博客",
);
```

#### b) 数据验证失败
```typescript
await logBlogActivity(
  userId,
  "BLOG_CREATE",
  "FAILED", 
  "",
  body?.title ?? "",
  { 
    reason: "数据验证", 
    validationErrors: result.error.format() 
  },
  `数据验证失败: ${error}`,
);
```

#### c) 重复检查失败
```typescript
await logBlogActivity(
  userId,
  "BLOG_CREATE",
  "FAILED",
  "",
  title,
  { 
    reason: "重复检查",
    duplicateFields: existingBlogs.map(blog => ({
      id: blog.id,
      title: blog.title === title ? "标题重复" : null,
      slug: blog.slug === slug ? "Slug重复" : null,
    }))
  },
  "标题或者slug重复",
);
```

#### d) 创建成功
```typescript
await logBlogActivity(
  userId,
  "BLOG_CREATE",
  "SUCCESS",
  blog.id,
  title,
  {
    slug,
    published,
    author: author ?? "未知",
    hasDescription: !!description,
    hasCover: !!cover,
    tagCount: tags?.length ?? 0,
    bodyLength: content?.length ?? 0,
    creatorIp: clientIp,
    creatorLocation: location ?? "本地环境",
  },
);
```

#### e) 系统异常
```typescript
await logBlogActivity(
  userId,
  "BLOG_CREATE",
  "FAILED",
  blogId ?? "",
  blogTitle ?? "",
  { 
    reason: "系统异常",
    error: errorMessage,
    stack: error instanceof Error ? error.stack : undefined
  },
  `创建博客失败: ${errorMessage}`,
);
```

### 3. 记录的信息

**基础信息**:
- 用户ID (自动获取登录用户)
- 活动类型 (`BLOG_CREATE`)
- 活动状态 (`SUCCESS` / `FAILED`)
- 博客ID (成功时)
- 博客标题

**详细元数据** (成功时):
- Slug
- 发布状态
- 作者信息
- 是否有描述/封面
- 标签数量
- 内容长度
- 创建者IP和位置

**失败原因** (失败时):
- 具体失败原因
- 验证错误详情
- 重复字段信息
- 异常堆栈信息

### 4. 安全考虑

- 使用 `getCurrentUserId()` 安全获取用户ID
- 异步日志记录不影响主流程
- 敏感信息适当脱敏
- 异常处理防止日志记录失败影响业务

## 测试验证

- ✅ 构建测试通过
- ✅ TypeScript 类型检查通过  
- ✅ 与现有日志系统完全兼容

## 效果

现在创建博客的所有操作都会被详细记录：
- 管理员可以在活动日志页面查看所有博客创建活动
- 支持筛选成功/失败的创建记录
- 记录详细的失败原因，便于问题排查
- 包含完整的用户行为轨迹

## 使用方式

日志记录完全自动，无需额外配置。管理员可以通过以下方式查看：

1. 访问 `/admin/activity-logs` 页面
2. 筛选 `BLOG_CREATE` 活动类型
3. 查看成功/失败状态和详细信息

## 扩展建议

可以按照同样的模式为其他博客操作添加日志记录：
- 博客更新 (`BLOG_UPDATE`)
- 博客删除 (`BLOG_DELETE`) 
- 博客发布/取消发布 (`BLOG_PUBLISH` / `BLOG_UNPUBLISH`)

只需在相应的API端点中调用 `logBlogActivity()` 函数即可。