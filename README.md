# AI Image Prompts 图像提示词库

一个现代化的 AI 图像生成提示词收集和展示网站，支持中英文切换、搜索、分类筛选等功能。

## 功能特性

- 🔍 **全文搜索** - 搜索标题、提示词内容、作者
- 🏷️ **标签筛选** - 按风格标签快速过滤
- 📂 **分类浏览** - 按工作、生活、学习等分类查看
- 🌐 **中英文切换** - 支持多语言界面
- 📋 **一键复制** - 快速复制提示词到剪贴板
- 📱 **响应式设计** - 支持桌面端和移动端

## 技术栈

- **框架**: Next.js 14 (App Router)
- **样式**: TailwindCSS
- **图标**: Lucide React
- **语言**: TypeScript
- **部署**: GitHub Pages

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

## 部署到 GitHub Pages

1. **创建 GitHub 仓库** 并推送代码

2. **配置 GitHub Pages**:
   - 进入仓库 Settings → Pages
   - Source 选择 "GitHub Actions"

3. **推送到 main 分支**，自动触发部署

4. 如果仓库名不是 `username.github.io`，需要修改 `next.config.js`:

```js
const nextConfig = {
  output: 'export',
  basePath: '/your-repo-name',
  assetPrefix: '/your-repo-name/',
  // ...
}
```

## 数据结构

### prompts.json

```json
{
  "title": "提示词标题",
  "preview": "预览图 URL",
  "prompt": "完整提示词内容",
  "author": "@作者名",
  "link": "来源链接",
  "mode": "generate | edit",
  "category": "分类",
  "sub_category": "子分类"
}
```

### tags.json

```json
{
  "id": "tag-1",
  "name_zh": "中文名",
  "name_en": "english_name",
  "slug": "url-slug",
  "count": 100
}
```

## 添加新提示词

编辑 `prompts.json`，添加新的提示词对象到数组开头（最新的在前）。

## 许可

MIT License
