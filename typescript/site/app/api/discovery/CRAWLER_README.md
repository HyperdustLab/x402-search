# 自动爬虫系统文档

## 概述

自动爬虫系统用于自动发现和扩展 x402 端点列表，无需手动维护。系统会从多个来源爬取可能的端点 URL，验证它们是否真的是 x402 端点，并自动更新端点列表。

## 工作流程

1. **爬取阶段**：从多个来源收集潜在的端点 URL
   - GitHub 仓库（搜索 x402 相关项目）
   - 生态系统伙伴网站
   - 文档网站
   
2. **验证阶段**：检查每个 URL 是否真的是 x402 端点
   - 发送 GET 请求
   - 检查是否返回 402 状态码
   - 验证响应结构（x402Version, accepts 等）
   
3. **存储阶段**：将验证通过的端点保存到 `endpoints.json`

4. **探测阶段**：直接探测这些端点，获取真实的 payment requirements

## 文件结构

```
app/api/discovery/
├── crawler/
│   ├── index.ts                    # 爬虫主入口
│   ├── sources/
│   │   ├── github.ts              # GitHub 爬虫
│   │   └── ecosystem.ts           # 生态系统爬虫
│   └── utils/
│       ├── url-extractor.ts       # URL 提取工具
│       └── validator.ts            # 端点验证器
├── endpoint-list.ts                # 端点列表管理
├── discover-resources.ts           # 资源发现（使用端点列表）
└── endpoints.json                  # 自动生成的端点列表（被 .gitignore）
```

## 使用方法

### 自动发现

系统会在以下情况自动运行爬虫：

1. **端点列表为空**：首次运行时
2. **列表过期**：超过 24 小时未更新
3. **强制刷新**：调用 API 时使用 `refresh=true` 参数

### API 调用

```bash
# 正常使用（使用缓存）
curl "http://localhost:3000/api/discovery/resources"

# 强制刷新（触发爬虫）
curl "http://localhost:3000/api/discovery/resources?refresh=true"
```

### 手动触发

```typescript
import { discoverAndUpdateEndpoints } from './app/api/discovery/endpoint-list';

// 强制刷新端点列表
const endpoints = await discoverAndUpdateEndpoints(true);
```

## 配置

### GitHub Token（强烈推荐）

设置 GitHub token 可以大幅提高爬虫的处理能力：

**无 Token 时的限制**：
- 每分钟：10 次请求
- 每小时：5000 次请求
- 每查询处理：10 个仓库
- 并发请求：2 个

**有 Token 时的提升**：
- 每分钟：30 次请求（提升 3 倍）
- 每小时：5000 次请求
- 每查询处理：50 个仓库（提升 5 倍）
- 并发请求：5 个（提升 2.5 倍）
- 自动速率限制检测和等待机制

**设置方法**：

1. 获取 GitHub Token：
   - 访问：https://github.com/settings/tokens
   - 点击 "Generate new token" -> "Generate new token (classic)"
   - 设置权限：至少需要 `public_repo` 权限
   - 生成后复制 token

2. 在项目根目录创建 `.env.local` 文件：

```bash
# .env.local
GITHUB_TOKEN=ghp_your_github_token_here
```

3. 重启开发服务器使配置生效

### 环境变量

- `GITHUB_TOKEN`: GitHub API token（强烈推荐，大幅提升爬虫能力）
- `NODE_ENV`: 开发环境会进行更多扫描

## 爬虫来源

### 1. GitHub 爬虫

- 搜索包含 "x402" 的仓库（支持多语言，不限于 TypeScript）
- 从 README 文件中提取 URL
- 自动检测和遵守 GitHub API 速率限制
- 智能并发控制，根据 token 状态调整处理能力

**搜索关键词**：
- "x402"
- "x402 payment"
- "x402 protocol"
- "coinbase x402"
- "x402 endpoint"
- "x402 api"

**处理能力**：
- **无 Token**：每查询 10 个仓库，2 并发，每分钟 10 请求
- **有 Token**：每查询 50 个仓库，5 并发，每分钟 30 请求

**速率限制处理**：
- 自动检测速率限制状态（通过响应头）
- 接近限制时自动等待
- 超出限制时智能重试
- 实时显示剩余请求数

### 2. 生态系统爬虫

- 从 `app/ecosystem/partners-data` 读取伙伴信息
- 爬取每个伙伴的 websiteUrl
- 从 HTML 中提取 API 端点 URL

**限制**：
- 最多处理 50 个伙伴网站
- 每个网站 5 秒超时

## URL 提取规则

系统会从文本中提取以下类型的 URL：

1. **标准 HTTP(S) URL**：`https://api.example.com/endpoint`
2. **代码中的配置**：
   - `api_url: "https://..."`
   - `endpoint = "https://..."`
   - `BASE_URL = "https://..."`
3. **必须是 API 端点**：
   - 域名包含 `api.`
   - 路径包含 `/api`, `/v1`, `/v2`, `/endpoint`
   - 包含 `x402` 关键字

## 端点验证

每个提取的 URL 都会经过验证：

1. **HTTP 状态码检查**：必须返回 402
2. **Content-Type 检查**：必须是 `application/json`
3. **响应结构检查**：
   - 必须有 `x402Version`
   - 必须有 `accepts` 数组
   - `accepts` 必须包含有效的 payment requirements

## 性能优化

1. **批量处理**：每批处理 10 个端点
2. **并发控制**：使用 `Promise.allSettled` 避免阻塞
3. **超时控制**：每个请求 5 秒超时
4. **缓存机制**：端点列表缓存 24 小时
5. **去重**：自动去除重复的端点

## 数据存储

端点列表保存在 `app/api/discovery/endpoints.json`：

```json
{
  "endpoints": [
    "https://api.example.com/endpoint1",
    "https://api.example.com/endpoint2"
  ],
  "lastUpdated": 1234567890,
  "sources": {
    "crawl": 10
  },
  "stats": {
    "totalDiscovered": 50,
    "totalValidated": 10,
    "lastCrawlTime": 1234567890
  }
}
```

**注意**：此文件会被 `.gitignore` 忽略，因为它是自动生成的。

## 扩展爬虫来源

### 添加新的爬虫源

1. 在 `crawler/sources/` 创建新文件
2. 实现爬取函数，返回 URL 数组
3. 在 `crawler/index.ts` 中导入并调用

示例：

```typescript
// crawler/sources/custom.ts
export async function crawlCustom(): Promise<string[]> {
  const urls: string[] = [];
  // 实现你的爬虫逻辑
  return urls;
}

// crawler/index.ts
import { crawlCustom } from './sources/custom';

export async function crawlAllSources(): Promise<string[]> {
  // ...
  try {
    const customUrls = await crawlCustom();
    customUrls.forEach(url => allUrls.add(url));
  } catch (error) {
    console.warn('Custom crawl failed:', error);
  }
  // ...
}
```

### 可能的扩展源

- **API 目录**：RapidAPI, ProgrammableWeb
- **搜索引擎**：Google Custom Search, Bing Search API
- **文档站点**：从 x402 文档中提取示例端点
- **社交媒体**：从 Twitter, Reddit 等提取端点 URL
- **DNS 查询**：查询特定 DNS 记录

## 故障排除

### 爬虫没有发现端点

1. **检查日志**：查看控制台输出
2. **检查网络**：确保可以访问外部 URL
3. **检查 GitHub Token**：如果有，确保有效
4. **手动添加端点**：可以手动调用 `addEndpoint(url)`

### 验证失败

- 某些端点可能需要认证
- 某些端点可能暂时不可用
- 正常现象，系统会跳过无效端点

### 性能问题

- 如果端点列表很大，探测可能需要时间
- 考虑增加并发批次大小（谨慎使用）
- 考虑添加速率限制

## 监控和统计

端点列表包含统计信息：

- `totalDiscovered`: 总共发现多少个 URL
- `totalValidated`: 验证通过多少个端点
- `lastCrawlTime`: 最后爬取时间

可以通过 API 查看：

```typescript
import { getEndpointListStats } from './endpoint-list';

const stats = getEndpointListStats();
console.log(stats);
```

## 最佳实践

1. **定期运行**：设置定期任务（如每天）自动刷新
2. **监控结果**：定期检查发现的新端点
3. **手动审核**：对于重要端点，建议手动验证
4. **社区贡献**：允许社区提交端点 URL

## 未来改进

- [ ] 持久化到数据库
- [ ] 更智能的 URL 提取（机器学习）
- [ ] 端点健康检查（定期验证可用性）
- [ ] 社区提交机制
- [ ] 更多爬虫来源
- [ ] 分布式爬取（提高性能）

