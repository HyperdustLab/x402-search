# x402 网站功能与路线图

本文档记录 x402 网站的新增功能和未来开发计划。

---

## 📅 更新时间

最后更新：2025年1月

---

## ✅ 已实现功能

### 1. 智能搜索系统

#### 1.1 自然语言搜索
- **文件**: `app/utils/nlp-search.ts`
- **功能**: 
  - 自动提取有意义的关键字（过滤停用词）
  - 支持词形变化和同义词匹配
  - 智能语义匹配（如 "price" ↔ "cost" ↔ "fee"）
- **使用场景**: 支持人类用户和 LLM 驱动的 AI Agent 查询

#### 1.2 多关键字搜索
- **实现**: AND 逻辑，所有关键字必须匹配
- **示例**: 搜索 "402 data" 会查找同时包含 "402" 和 "data" 的资源
- **相关性排序**: 按匹配度排序结果

#### 1.3 关键字高亮显示
- **文件**: `app/utils/highlight.tsx`
- **功能**: 
  - 在搜索结果中高亮匹配的关键字
  - 过滤停用词，只高亮有意义的词汇
  - 支持多关键字同时高亮

#### 1.4 搜索 API
- **端点**: `/api/search`
- **功能**: 
  - 自然语言查询支持
  - 支持类型和网络过滤
  - 返回格式适合人类和 AI Agent 使用
  - 聚合 facilitator 和 crawler 来源的资源

### 2. 自动爬虫系统

#### 2.1 后台持续爬取服务
- **文件**: `app/api/discovery/crawler-service.ts`, `instrumentation.ts`
- **功能**: 
  - 每 20 分钟自动执行爬取（可配置）
  - 后台运行，不影响前端使用
  - 自动启动，无需手动触发

#### 2.2 GitHub 爬虫增强
- **文件**: `app/api/discovery/crawler/sources/github.ts`
- **改进**:
  - ✅ GitHub Token 支持（提升 5 倍处理能力）
  - ✅ 自动速率限制检测和等待
  - ✅ 移除语言限制（支持多语言仓库）
  - ✅ 提升每查询处理数量（10 → 50 个仓库）
  - ✅ 并发处理优化（2 → 5 个并发请求）
  - ✅ 详细进度日志输出

**Token 配置**:
```bash
# .env.local
GITHUB_TOKEN=ghp_your_token_here
```

#### 2.3 端点验证优化
- **文件**: `app/api/discovery/crawler/utils/validator.ts`
- **改进**: 
  - 使用最宽松的验证条件（方案 1）
  - 支持 402 和 200 状态码
  - 灵活的 Content-Type 检查
  - 提升端点发现率

#### 2.4 爬虫进度追踪
- **文件**: `app/api/discovery/progress.ts`
- **功能**: 
  - 实时追踪爬取和验证进度
  - 详细日志输出（显示正在处理的 URL）
  - 通过 API 暴露进度信息

#### 2.5 统计数据 API
- **端点**: `/api/discovery/stats`
- **功能**: 
  - 端点总数统计
  - 爬虫进度和状态
  - 服务运行状态
  - 验证通过率等指标

### 3. 用户交互功能

#### 3.1 端点提交功能
- **组件**: `app/components/SubmitEndpointModal.tsx`
- **API**: `/api/resources/submit`
- **功能**: 
  - 用户可以通过表单提交新的 x402 端点
  - 自动验证端点有效性
  - 保存到数据库并加入索引

#### 3.2 Facilitator 同步按钮
- **组件**: `app/components/SyncFacilitatorsButton.tsx`
- **API**: `/api/discovery/facilitator-sync`
- **功能**: 
  - 一键同步所有已知 facilitator 的资源
  - 显示同步状态和结果
  - 自动隐藏结果提示

### 4. 数据存储

#### 4.1 JSON 文件存储
- **文件**: `app/api/discovery/db-json.ts`
- **存储位置**: `.data/resources.json`
- **原因**: 替代 SQLite，避免原生模块问题，提高 Next.js 兼容性
- **文件**: 
  - `endpoints.json`: 已验证的端点列表
  - `.data/resources.json`: 完整资源信息（包含 payment requirements）
  - `.data/crawler-progress.json`: 爬虫进度追踪

#### 4.2 多数据源聚合
- **来源**:
  - Facilitator Discovery API（1242 个资源）
  - 爬虫发现的端点（7 个已验证）
  - 用户提交的端点
- **不进行去重**: 保持所有来源的数据，便于追踪

### 5. Facilitator 同步

#### 5.1 自动后台同步
- **文件**: `app/api/discovery/facilitator-sync.ts`
- **功能**: 
  - 每 6 小时自动同步所有 facilitator
  - 支持手动触发同步
  - 并发控制（3 个并发请求）

#### 5.2 已知 Facilitator
- Coinbase CDP: 812 个资源
- PayAI: 430 个资源
- x402.org
- Mogami
- x402.rs
- Corbits

---

## 🚀 下一步计划

### 优先级 P0（核心功能）

#### 1. MCP 聚合服务器
**目标**: 创建一个聚合 MCP 服务器，统一接入所有支持 x402 的 MCP 服务器

**架构设计**:
```
智能体 (Claude Desktop)
    ↓
MCP 聚合服务器 (x402 Aggregator)
    ├─→ MCP Server 1 (x402-mcp-1)
    ├─→ MCP Server 2 (x402-mcp-2)
    └─→ ... 更多 MCP 服务器
```

**实现内容**:
- [ ] 创建 MCP 服务器注册表 (`app/api/mcp/registry.ts`)
- [ ] MCP 客户端连接器 (`app/mcp/aggregator/client-connector.ts`)
- [ ] 工具聚合层 (`app/mcp/aggregator/server.ts`)
- [ ] 自动发现机制 (`app/api/mcp/discovery.ts`)
- [ ] 工具路由和代理逻辑

**MCP 工具集合**:
1. `search_x402_resources` - 搜索 x402 资源（自然语言）
2. `list_x402_resources` - 获取资源列表（Discovery API）
3. `call_x402_resource` - 调用 x402 资源（自动处理支付）
4. `submit_x402_endpoint` - 提交新端点
5. `get_x402_statistics` - 获取统计信息
6. 聚合工具: `{serverId}_{toolName}` - 来自上游 MCP 服务器的工具

**文件结构**:
```
typescript/site/app/mcp/
  ├── aggregator/
  │   ├── server.ts           # 聚合服务器主文件
  │   ├── client-connector.ts  # MCP 客户端连接器
  │   └── tool-router.ts       # 工具路由逻辑
  ├── api/
  │   ├── registry.ts         # MCP 服务器注册表
  │   └── discovery.ts        # 自动发现机制
  └── package.json
```

#### 2. MCP 工具封装
**目标**: 将现有的 HTTP API 封装为 MCP 工具

**工具列表**:
- ✅ `search_x402_resources` - 封装 `/api/search`
- ✅ `list_x402_resources` - 封装 `/api/discovery/resources`
- ⏳ `call_x402_resource` - 封装 x402 资源调用
- ⏳ `submit_x402_endpoint` - 封装 `/api/resources/submit`
- ⏳ `get_x402_statistics` - 封装 `/api/discovery/stats`

#### 3. MCP 服务器自动发现
**功能**: 
- 从 Facilitator Discovery API 中发现 MCP 类型资源
- 支持 MCP 服务器注册表（在线或本地）
- 自动连接和工具聚合

### 优先级 P1（重要增强）

#### 4. 搜索功能增强
- [ ] 搜索结果缓存机制
- [ ] 搜索历史记录
- [ ] 高级过滤选项（价格范围、网络类型等）
- [ ] 搜索结果导出功能

#### 5. 爬虫系统优化
- [ ] 支持更多数据源（文档网站、API 目录等）
- [ ] 智能去重和合并
- [ ] 爬虫性能监控和告警
- [ ] 端点健康检查

#### 6. 前端体验优化
- [ ] 实时搜索建议
- [ ] 结果排序和过滤 UI
- [ ] 资源详情页面
- [ ] 收藏和分享功能

### 优先级 P2（未来计划）

#### 7. 数据分析仪表板
- [ ] 资源统计可视化
- [ ] 爬虫性能分析
- [ ] 用户行为分析

#### 8. API 网关功能
- [ ] 代理 x402 请求
- [ ] 请求日志和监控
- [ ] 使用统计

#### 9. 社区功能
- [ ] 端点评分和评论
- [ ] 资源标签和分类
- [ ] 用户贡献排行榜

---

## 📊 当前统计数据

### 资源统计
- **总资源数**: 1,250 个
- **Facilitator 来源**: 1,242 个 (99.36%)
  - Coinbase CDP: 812 个
  - PayAI: 430 个
- **爬虫来源**: 7 个已验证端点
- **用户提交**: 少量

### 爬虫统计
- **总发现 URL**: 405 个
- **验证通过**: 7 个
- **验证通过率**: 1.7%
- **爬虫间隔**: 20 分钟
- **Facilitator 同步间隔**: 6 小时

---

## 🔧 技术栈

### 后端
- Next.js 15+ (App Router)
- TypeScript
- JSON 文件存储（替代 SQLite）

### 前端
- React 19
- Tailwind CSS
- Heroicons
- Next.js Server Components

### 核心库
- `x402` - x402 协议核心
- `@modelcontextprotocol/sdk` - MCP 支持
- `viem` - 以太坊交互

---

## 📝 开发笔记

### 已解决的问题

1. **better-sqlite3 原生模块问题**
   - 解决方案: 切换到 JSON 文件存储
   - 文件: `db-json.ts`

2. **GitHub API 速率限制**
   - 解决方案: Token 支持 + 自动速率限制检测
   - 提升处理能力 5 倍

3. **爬虫阻塞前端**
   - 解决方案: 后台服务 + instrumentation.ts
   - 完全异步，不影响用户体验

4. **多关键字搜索**
   - 解决方案: NLP 关键字提取 + AND 逻辑
   - 支持自然语言查询

### 待优化项

1. **验证通过率低** (1.7%)
   - 可能原因: 端点暂时不可用、需要认证、验证条件仍需优化
   - 建议: 进一步放宽验证条件或添加重试机制

2. **MCP 服务器聚合**
   - 需要实现 MCP 客户端连接器
   - 需要工具路由和代理逻辑

3. **性能优化**
   - 大量资源时的搜索性能
   - 数据库查询优化

---

## 🔗 相关文档

- [爬虫系统文档](./app/api/discovery/CRAWLER_README.md)
- [直接发现 API 文档](./DIRECT_DISCOVERY.md)
- [搜索功能测试指南](./SEARCH_TESTING.md)
- [x402 协议规范](../specs/x402-specification.md)
- [MCP 传输协议](../specs/transports/mcp.md)

---

## 📧 反馈与贡献

如有问题或建议，请通过以下方式反馈：
- GitHub Issues: https://github.com/coinbase/x402
- 提交 PR 欢迎！

---

*本文档会随着功能开发持续更新*

