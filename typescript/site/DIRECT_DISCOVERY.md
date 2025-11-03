# Direct Discovery API 文档

## 概述

直接 Discovery API 实现了不依赖 facilitator Discovery API 的资源发现机制。它通过直接扫描互联网上的端点来发现 x402 资源。

## API 端点

### GET `/api/discovery/resources`

发现 x402 资源的端点，不依赖 facilitator。

**查询参数：**
- `type` (可选): 过滤资源类型，例如 `"http"`
- `limit` (可选): 返回的最大结果数，默认 20，最大 100
- `offset` (可选): 分页偏移量，默认 0
- `refresh` (可选): 强制刷新缓存，设置为 `"true"` 时忽略缓存

**响应格式：**

```json
{
  "x402Version": 1,
  "items": [
    {
      "resource": "https://api.example.com/premium-data",
      "type": "http",
      "x402Version": 1,
      "accepts": [
        {
          "scheme": "exact",
          "network": "base-sepolia",
          "maxAmountRequired": "10000",
          "resource": "https://api.example.com/premium-data",
          "description": "Access to premium market data",
          "mimeType": "application/json",
          "payTo": "0x209693Bc6afc0C5328bA36FaF03C514EF312287C",
          "maxTimeoutSeconds": 60,
          "asset": "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
          "extra": {
            "name": "USDC",
            "version": "2"
          }
        }
      ],
      "lastUpdated": "2024-01-15T10:30:00.000Z",
      "metadata": {
        "discoveredBy": "direct-probe",
        "discoveredAt": "2024-01-15T10:30:00.000Z"
      }
    }
  ],
  "pagination": {
    "limit": 20,
    "offset": 0,
    "total": 1
  }
}
```

## 使用方法

### 基本使用

```bash
# 获取资源列表
curl "http://localhost:3000/api/discovery/resources"

# 限制结果数量
curl "http://localhost:3000/api/discovery/resources?limit=10"

# 强制刷新缓存
curl "http://localhost:3000/api/discovery/resources?refresh=true"
```

### 与搜索 API 集成

搜索 API (`/api/search`) 现在优先使用直接 Discovery API：

1. **首先尝试直接 Discovery API** - 直接扫描端点
2. **回退到 Facilitator Discovery API** - 如果直接发现失败
3. **最后使用测试数据** - 如果都失败

搜索结果会标记数据来源：
- `facilitator: { name: "Direct Discovery", url: "N/A" }` - 来自直接发现
- `facilitator: { name: "x402.org", url: "..." }` - 来自 facilitator API
- `isTest: true` - 测试数据

## 工作原理

### 1. 端点探测

直接 Discovery API 通过以下方式发现资源：

1. **种子端点列表** - 扫描预定义的端点列表
2. **已知域名扫描** - 对已知域名尝试常见 API 路径
3. **HTTP 402 检测** - 检查端点是否返回 402 Payment Required 状态码
4. **支付要求解析** - 从 402 响应中提取 payment requirements

### 2. 缓存机制

- 发现的结果会被缓存 1 小时
- 使用 `refresh=true` 参数可以强制刷新
- 缓存减少了重复扫描的开销

### 3. 端点探测流程

```typescript
// 1. 请求端点（不带支付）
GET https://api.example.com/premium-data
Accept: application/json

// 2. 检查响应
HTTP/1.1 402 Payment Required
Content-Type: application/json

{
  "x402Version": 1,
  "error": "X-PAYMENT header is required",
  "accepts": [...]
}

// 3. 如果返回 402，解析并添加为已发现资源
```

## 配置

### 种子端点列表

编辑 `app/api/discovery/discover-resources.ts` 中的 `SEED_ENDPOINTS` 数组来添加已知端点：

```typescript
const SEED_ENDPOINTS = [
  "https://api.example.com/premium-data",
  "https://api.weather-service.com/forecast",
  // 添加更多端点...
];
```

### 已知域名

编辑 `discoverFromKnownDomains` 函数中的 `knownDomains` 数组：

```typescript
const knownDomains = [
  "api.example.com",
  "api.weather-service.com",
  // 添加更多域名...
];
```

## 性能考虑

- **批量处理**: 端点按批次探测（每批 10 个），避免过载
- **超时控制**: 每个端点有 5 秒超时
- **并发限制**: 使用 `Promise.allSettled` 控制并发
- **缓存**: 结果缓存 1 小时，减少重复扫描

## 扩展性

可以扩展以下发现策略：

1. **GitHub 扫描**: 从 GitHub 仓库中发现部署的端点
2. **API 目录集成**: 从 RapidAPI、ProgrammableWeb 等目录扫描
3. **DNS 查询**: 查询特定 DNS 记录来发现端点
4. **搜索引擎**: 使用搜索引擎 API 查找 x402 端点

## 限制

- **端点发现**: 只能发现公开的端点（返回 402 的端点）
- **扫描范围**: 需要手动维护种子列表和已知域名
- **性能**: 大规模扫描可能较慢
- **误报**: 某些端点可能误返回 402

## 未来改进

- [ ] 持久化存储（数据库）
- [ ] 定期后台刷新任务
- [ ] GitHub 自动发现
- [ ] API 目录集成
- [ ] 智能爬虫
- [ ] 资源健康检查

