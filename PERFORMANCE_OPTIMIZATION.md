# 博客性能优化记录

## 问题背景

原博客在显示长文章时存在性能问题：
- 行数较多的博客内容页面卡顿
- 加载博客内容时占用内存过多
- 长文章缺乏有效的阅读体验优化

## 解决方案

### 1. BytemdViewer 组件优化

**实现文件**: `components/bytemd/viewer.tsx`、`components/bytemd/hooks/use-code-block-enhancement.ts`

**优化内容**:
- 使用 `React.memo` 缓存组件，避免不必要的重渲染
- 将 DOM 操作逻辑提取为自定义 hook (`useCodeBlockEnhancement`)
- 优化代码块处理，避免重复创建复制按钮
- 使用 `requestAnimationFrame` 优化 DOM 操作时机

### 2. 内容分页机制

**实现文件**: 
- `components/bytemd/hooks/use-content-pagination.ts` - 分页逻辑
- `components/bytemd/pagination-nav.tsx` - 分页导航组件
- `components/bytemd/paginated-viewer.tsx` - 分页查看器

**功能特性**:
- 基于标题结构智能分页（每页约800字符）
- 支持页面导航和章节预览
- 保持 URL 同步，支持深链接
- 自动判断是否需要分页（字数和标题数量阈值）

### 3. 虚拟滚动优化

**实现文件**: 
- `components/bytemd/hooks/use-virtual-scroll.ts` - 虚拟滚动逻辑
- `components/bytemd/virtual-viewer.tsx` - 虚拟滚动组件

**功能特性**:
- 将超长内容分割成多个内容块
- 只渲染可视区域内的内容块
- 支持预加载（overscan）机制
- 自动判断是否启用（内容块数量阈值）

### 4. 插件延迟加载

**实现文件**: 
- `components/bytemd/config-optimized.ts` - 优化的插件配置
- `components/bytemd/optimized-viewer.tsx` - 支持延迟加载的查看器

**优化策略**:
- 核心插件优先加载（breaks, frontmatter）
- 扩展插件延迟加载（gfm, highlight, medium-zoom 等）
- 语法高亮和自定义插件按需异步加载
- 插件缓存机制，避免重复加载

### 5. 内存管理优化

**实现文件**: `components/bytemd/hooks/use-memory-management.ts`

**功能特性**:
- 图片懒加载，减少内存占用
- 不可见代码块的语法高亮清理
- 自动内存压力监测和清理
- 组件卸载时的资源清理
- 开发环境下的手动垃圾回收

### 6. 智能渲染策略

**实现文件**: `components/bytemd/smart-viewer.tsx`

**策略选择**:
- **简单渲染**: < 5K 字符的短文章
- **分页渲染**: 5K-20K 字符且有 3+ 个标题的中等文章
- **虚拟滚动**: > 20K 字符或 > 1000 行的超长文章

## 性能指标

### 渲染策略阈值
```typescript
const THRESHOLDS = {
  SIMPLE_MAX: 5000,        // 5k字符以下使用简单渲染
  PAGINATION_MAX: 20000,   // 20k字符以下使用分页
  // 超过20k字符使用虚拟滚动
};
```

### 分页配置
```typescript
const WORDS_PER_PAGE = 800; // 每页建议字数
```

### 虚拟滚动配置
```typescript
const DEFAULT_CONFIG = {
  itemHeight: 100,         // 预估每个内容块的高度
  containerHeight: 800,    // 容器高度
  overscan: 3,            // 上下额外渲染的项目数量
};
```

## 使用方法

在博客详情页面中，直接使用智能查看器：

```tsx
import { SmartBytemdViewer } from "@/components/bytemd";

// 自动选择最佳渲染策略
<SmartBytemdViewer body={blog.body || ""} />

// 强制指定策略
<SmartBytemdViewer 
  body={blog.body || ""} 
  forceStrategy="paginated" 
/>
```

## 开发调试

在开发环境下，智能查看器会显示性能调试信息：
- 当前使用的渲染策略
- 内容长度和行数统计
- 强制垃圾回收按钮

## 文件结构

```
components/bytemd/
├── hooks/
│   ├── use-code-block-enhancement.ts    # 代码块增强
│   ├── use-content-pagination.ts        # 内容分页
│   ├── use-virtual-scroll.ts            # 虚拟滚动
│   └── use-memory-management.ts         # 内存管理
├── viewer.tsx                           # 原始查看器
├── paginated-viewer.tsx                # 分页查看器
├── virtual-viewer.tsx                  # 虚拟滚动查看器
├── optimized-viewer.tsx               # 优化查看器
├── smart-viewer.tsx                    # 智能查看器（推荐）
├── pagination-nav.tsx                  # 分页导航
├── config.ts                          # 原始插件配置
├── config-optimized.ts               # 优化插件配置
└── index.ts                          # 统一导出
```

## 效果预期

1. **内存占用减少**: 长文章不再一次性渲染全部内容
2. **加载速度提升**: 插件延迟加载，核心内容优先显示
3. **滚动性能改善**: 虚拟滚动只渲染可视区域
4. **用户体验优化**: 分页导航提供更好的阅读体验
5. **自动资源管理**: 避免内存泄漏和资源浪费

## 兼容性

- 向后兼容：原有的 `BytemdViewer` 组件仍可正常使用
- 渐进增强：根据内容特性自动选择最优策略
- 降级处理：插件加载失败时自动回退到核心功能