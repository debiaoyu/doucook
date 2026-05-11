# 🍳 doucook

dou cook = 豆厨 —— 抖音菜谱管理器。粘贴抖音链接，自动检测是否为做饭视频，下载视频并通过 AI 生成文字菜谱。

## 功能

- **URL 导入** — 粘贴抖音视频链接，自动检测是否为做饭视频，下载并生成菜谱
- **批量导入** — 扫描抖音收藏/喜欢的视频，批量筛选做饭类视频导入
- **文字菜谱导入** — 手动创建菜谱，支持食材清单、步骤，可附任意来源链接
- **视频播放** — 内嵌播放器，直接观看已导入的视频
- **AI 总结** — 每个视频自动生成 AI 烹饪摘要
- **智能问答** — 基于视频内容提问，AI 回答
- **笔记** — 为每个菜谱添加个人笔记
- **搜索筛选** — 按名称/食材搜索，按分类筛选
- **分类管理** — 自定义分类标签，组织菜谱
- **重复检测** — 相同视频自动识别，防止重复导入

## 快速开始

### 依赖

- Python 3.10+
- Node.js 18+
- [dousub](https://github.com/anomalyco/dousub) 命令行工具（`pip install dousub`）

### 启动

```bash
# 终端 1 — 启动后端
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000

# 终端 2 — 启动前端
cd frontend
npm install
npm run dev
```

浏览器打开 `http://localhost:3000`，前端开发服务器自动代理 `/api` 到后端。

### 生产模式

```bash
cd frontend && npm run build
# 后端自动托管 frontend/dist/ 作为静态文件
```

### 抖音登录（批量导入 & 问答需要）

```bash
dousub login
# 生成 cookies.txt — 在设置页面配置路径
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18, TypeScript, Vite, Ant Design 5 (中文) |
| 后端 | Python, FastAPI, SQLAlchemy, SQLite |
| 外部依赖 | [dousub](https://github.com/anomalyco/dousub) SDK（抖音视频检测、AI 总结、批量导入） |

## 项目结构

```
backend/      — FastAPI 应用（routers/, services/, models/）
frontend/     — React SPA（pages/, components/, api/）
data/         — SQLite 数据库、视频文件、缩略图（自动创建）
```

## API

所有接口以 `/api` 为前缀：

- `GET /api/health` — 健康检查
- `GET/PATCH/DELETE /api/recipes/...` — 菜谱增删改查
- `POST /api/import/url|manual|batch` — 三种导入方式
- `GET /api/search?query=` — 搜索菜谱
- `GET/PUT /api/notes/:id` — 菜谱笔记
- `POST /api/ai/ask/:id` — AI 问答
- `GET /api/settings` — 应用设置
- `GET /api/video/:path` — 视频文件

## License

MIT
