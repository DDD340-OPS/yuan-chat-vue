# 智能心理对话研究系统

基于大语言模型的心理健康研究工作台，支持多轮心理对话、流式回复、语音输入与录音留存、结构化情绪/风险分析、会话归档筛选和研究数据导出。

项目由前端研究工作台和后端模型网关两部分组成：

- 前端：`Vue 3 + Vite + Pinia + Vue Router`
- 后端：`Node.js + Express`
- 语音能力：`Web Speech API + MediaRecorder`
- 富文本与性能优化：`Markdown-it + Highlight.js + vue-virtual-scroller`
- 模型接入：讯飞 MaaS 推理服务（当前已验证可用配置）

## 主要能力

- 多轮心理对话研究工作台
- LLM 流式输出与逐字渲染
- 心理对话结构化分析协议
- 情绪分类、风险分层、干预建议展示
- 语音转写、录音留存与音频元数据分析
- 会话历史缓存与上下文恢复
- 会话归档筛选与 JSON/CSV 导出
- 组件懒加载与虚拟列表渲染
- Markdown 富文本渲染与代码高亮

## 技术栈

### 前端

- Vue 3
- Vite
- Pinia
- Vue Router
- Markdown-it
- Highlight.js
- vue-virtual-scroller

### 后端

- Node.js
- Express
- dotenv
- multer
- cors

### 模型与音频

- 讯飞 MaaS 推理服务
- Web Speech API
- MediaRecorder

## 项目结构

```text
yuan-chat-vue/
├─ backend/                    # 后端模型网关与音频上传服务
│  ├─ index.js                 # 后端主服务
│  ├─ .env.example             # 后端环境变量示例
│  └─ uploads/audio/           # 录音留存目录（运行后生成）
├─ src/
│  ├─ components/              # 业务高内聚组件
│  ├─ composables/             # 组合式逻辑
│  ├─ modules/research/        # 研究域逻辑
│  ├─ services/                # LLM / 音频 / 导出 / 缓存服务
│  ├─ stores/                  # Pinia 状态中心
│  ├─ views/                   # 页面视图
│  ├─ App.vue                  # 应用壳层
│  └─ main.js                  # 前端入口
├─ .env.example                # 前端环境变量示例
└─ .env.local                  # 前端本地接口配置（可自行创建）
```

## 当前讯飞接入说明

项目当前已验证可用的讯飞接入方式为：

- `base_url`: `https://maas-api.cn-huabei-1.xf-yun.com/v2`
- `model`: `xop35qwen2b`
- `Authorization`: `Bearer APIKey:APISecret`

也就是说，后端里使用的是：

```env
LLM_API_KEY=your_api_key:your_api_secret
LLM_BASE_URL=https://maas-api.cn-huabei-1.xf-yun.com/v2
LLM_MODEL=xop35qwen2b
LLM_ANALYSIS_MODEL=xop35qwen2b
```

## 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/DDD340-OPS/yuan-chat-vue.git
cd yuan-chat-vue
```

### 2. 安装依赖

前端：

```bash
npm install
```

后端：

```bash
cd backend
npm install
cd ..
```

### 3. 配置前端环境变量

在项目根目录创建 `.env.local`：

```env
VITE_API_BASE_URL=http://localhost:3000
```

### 4. 配置后端环境变量

在 `backend/` 目录创建 `.env`：

```env
PORT=3000
LLM_API_KEY=your_api_key:your_api_secret
LLM_BASE_URL=https://maas-api.cn-huabei-1.xf-yun.com/v2
LLM_MODEL=xop35qwen2b
LLM_ANALYSIS_MODEL=xop35qwen2b
LLM_TEMPERATURE=0.6
LLM_MAX_TOKENS=1200
AUDIO_UPLOAD_DIR=uploads/audio
```

### 5. 启动后端

```bash
cd backend
npm run dev
```

后端启动后可访问：

- 健康检查：`http://localhost:3000/health`

### 6. 启动前端

在项目根目录新开终端：

```bash
npm run dev
```

前端默认运行在：

- `http://localhost:5173`

## 已实现页面

- `研究总览`
- `研究工作台`
- `会话归档`
- `系统设计`

## 研究工作台功能

### 对话能力

- 多轮上下文管理
- 流式响应渲染
- 结构化分析事件接收
- Markdown 富文本显示

### 语音能力

- 语音识别转写
- 浏览器录音采集
- 录音文件上传
- 音频留存列表展示

### 研究分析能力

- 情绪状态展示
- 风险等级展示
- 干预建议展示
- 推荐追问展示
- 标签与上下文记忆沉淀

### 研究管理能力

- 本地缓存恢复
- 会话归档筛选
- 研究数据导出
- 实验配置面板

## 关键接口

### 后端健康检查

```http
GET /health
```

### 对话流式接口

```http
POST /api/chat
```

请求体示例：

```json
{
  "messages": [
    {
      "role": "user",
      "content": "最近总是睡不好，我有点焦虑。"
    }
  ],
  "sessionContext": {
    "summary": "初始测试会话",
    "interventionFocus": "支持性倾听",
    "riskLevel": "低",
    "researchTags": ["测试"]
  },
  "experimentConfig": {
    "structuredAnalysis": true,
    "model": "xop35qwen2b",
    "analysisModel": "xop35qwen2b",
    "temperature": 0.6,
    "maxTokens": 800
  }
}
```

流式事件类型包括：

- `open`
- `delta`
- `analysis`
- `done`
- `error`

### 音频上传接口

```http
POST /api/audio/upload
```

字段包括：

- `audio`
- `sessionId`
- `transcript`
- `durationMs`

## 本地构建

前端生产构建：

```bash
npm run build
```

后端语法检查：

```bash
node --check backend/index.js
```

## 常见问题

### 1. 前端打开后仍然走 Mock 模式

检查根目录是否存在：

```env
VITE_API_BASE_URL=http://localhost:3000
```

修改后需要重启前端开发服务。

### 2. 讯飞接口返回鉴权错误

请优先检查：

- `LLM_BASE_URL` 是否是 `https://maas-api.cn-huabei-1.xf-yun.com/v2`
- `LLM_MODEL` 是否和服务卡片一致
- `LLM_API_KEY` 是否使用 `APIKey:APISecret` 的完整形式
- 当前凭证是否已被授权调用对应模型服务

### 3. 语音按钮不可用

请确认：

- 浏览器支持 `Web Speech API`
- 已授权麦克风权限
- 使用的是支持 `MediaRecorder` 的现代浏览器

## 后续可继续扩展

- 更专业的情绪识别与量表评估
- 数据库持久化替代 localStorage
- 多研究员协作与权限管理
- 音频声学特征分析
- 模型切换与实验版本管理

## 许可证

MIT
