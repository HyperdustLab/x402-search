# x402 搜索功能测试指南

## 如何测试搜索功能

### 方法 1: 通过网页界面测试

1. **启动开发服务器**
   ```bash
   cd typescript/site
   pnpm dev
   ```

2. **访问搜索页面**
   - 打开浏览器访问: `http://localhost:3000/search`
   - 或者点击导航栏中的 "Search" 链接

3. **进行搜索**
   - 在搜索框中输入关键词
   - 点击 "Search" 按钮或按 Enter 键

### 方法 2: 通过 API 直接测试

使用 `curl` 或任何 HTTP 客户端:

```bash
# 基本搜索
curl "http://localhost:3000/api/search?q=weather"

# 搜索特定网络
curl "http://localhost:3000/api/search?q=api&network=base"

# 限制结果数量
curl "http://localhost:3000/api/search?q=data&limit=5"

# 组合参数
curl "http://localhost:3000/api/search?q=finance&network=base-sepolia&limit=10&offset=0"
```

### 方法 3: 在浏览器控制台测试

打开浏览器开发者工具（F12），在 Console 中运行:

```javascript
// 基本搜索
fetch('/api/search?q=weather')
  .then(r => r.json())
  .then(console.log);

// 带过滤的搜索
fetch('/api/search?q=api&network=base&limit=5')
  .then(r => r.json())
  .then(console.log);
```

## 测试关键词列表

### 按类别分类的关键词

#### 1. 金融相关
- `finance`
- `market`
- `stock`
- `data`
- `analytics`
- `premium`
- `quote`

**预期结果**: 
- `https://api.example.com/premium-data` (金融数据)
- `https://api.stock-data.io/quote` (股票报价)

#### 2. 天气相关
- `weather`
- `forecast`
- `meteorology`

**预期结果**:
- `https://api.weather-service.com/forecast` (天气预报)

#### 3. AI 相关
- `ai`
- `generate`
- `text`
- `gpt`
- `nlp`

**预期结果**:
- `https://api.ai-text-service.com/generate` (AI文本生成)

#### 4. 图像相关
- `image`
- `processing`
- `transform`
- `filters`

**预期结果**:
- `https://api.image-processing.com/transform` (图像处理)

#### 5. 翻译相关
- `translation`
- `language`

**预期结果**:
- `https://api.translation-service.com/translate` (翻译服务)

#### 6. 通用关键词
- `api`
- `service`
- `data`
- `base` (会匹配网络名称)
- `sepolia` (会匹配网络名称)

### 按网络过滤

#### Base 网络
- 搜索: `weather`
- 参数: `?q=weather&network=base`

**预期结果**: 只返回支持 base 网络的端点

#### Base Sepolia 网络
- 搜索: `data`
- 参数: `?q=data&network=base-sepolia`

**预期结果**: 只返回支持 base-sepolia 网络的端点

### 测试场景

#### 场景 1: 精确匹配
```
搜索: "premium-data"
预期: 找到 https://api.example.com/premium-data
```

#### 场景 2: 部分匹配
```
搜索: "stock"
预期: 找到包含 "stock" 的资源，如 stock-data.io
```

#### 场景 3: 描述匹配
```
搜索: "real-time"
预期: 找到描述中包含 "real-time" 的资源
```

#### 场景 4: 元数据匹配
```
搜索: "finance"
预期: 找到 metadata.category 为 "finance" 的资源
```

#### 场景 5: 无结果
```
搜索: "nonexistent-keyword-12345"
预期: 返回空结果，显示 "No results found"
```

#### 场景 6: 空搜索
```
搜索: "" (空字符串)
预期: 不执行搜索，显示提示信息
```

#### 场景 7: URL 参数搜索
```
访问: /search?q=weather
预期: 自动执行搜索并显示结果
```

## 当前测试数据

测试系统包含以下示例端点:

1. **Premium Market Data API**
   - URL: `https://api.example.com/premium-data`
   - 类别: finance
   - 网络: base-sepolia
   - 价格: $0.01
   - 关键词: `finance`, `market`, `data`, `analytics`, `premium`

2. **Weather Forecast API**
   - URL: `https://api.weather-service.com/forecast`
   - 类别: weather
   - 网络: base
   - 价格: $0.005
   - 关键词: `weather`, `forecast`, `meteorology`

3. **Stock Quote API**
   - URL: `https://api.stock-data.io/quote`
   - 类别: finance
   - 网络: base-sepolia
   - 价格: $0.02
   - 关键词: `stock`, `quote`, `trading`, `market-data`

4. **AI Text Generation API**
   - URL: `https://api.ai-text-service.com/generate`
   - 类别: ai
   - 网络: base
   - 价格: $0.015
   - 关键词: `ai`, `text`, `generate`, `gpt`, `nlp`

5. **Image Processing API**
   - URL: `https://api.image-processing.com/transform`
   - 类别: media
   - 网络: base-sepolia
   - 价格: $0.008
   - 关键词: `image`, `processing`, `transform`, `filters`

6. **Translation API**
   - URL: `https://api.translation-service.com/translate`
   - 类别: language
   - 网络: base
   - 价格: $0.003
   - 关键词: `translation`, `language`, `nlp`

## 验证检查点

测试时检查以下内容:

- [ ] 搜索结果是否正确显示
- [ ] URL 链接是否可点击
- [ ] 价格信息是否正确格式化
- [ ] 网络信息是否正确显示
- [ ] 描述信息是否完整
- [ ] 元数据是否可以展开查看
- [ ] 空结果时是否显示友好提示
- [ ] 加载状态是否正确显示
- [ ] 错误处理是否正确
- [ ] URL 参数是否正确保存（可刷新页面查看）

## 调试技巧

如果搜索没有返回预期结果:

1. **检查浏览器控制台**
   - 查看是否有错误信息
   - 检查网络请求是否成功

2. **检查服务器日志**
   - 查看终端中的日志输出
   - 检查 API 调用是否成功

3. **检查测试数据**
   - 确认 `test-data.ts` 文件存在
   - 验证测试数据格式是否正确

4. **使用 API 直接测试**
   - 直接访问 `/api/search?q=keyword`
   - 查看返回的 JSON 数据

## 下一步

当 facilitator discovery API 有实际数据时，搜索功能会自动切换到使用真实数据。测试数据将作为后备方案。

