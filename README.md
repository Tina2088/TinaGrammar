# TinaGrammar - AI 英语语法实验室

这是一个基于 Google Gemini API 的英语语法互动练习平台。

## 部署步骤 (Vercel)

1. **上传到 GitHub**:
   - 初始化 git 并提交所有文件。
   - 创建一个新的 GitHub 仓库并推送代码。

2. **在 Vercel 部署**:
   - 登录 Vercel，选择 **Add New Project**。
   - 导入你的 GitHub 仓库。
   - **关键步骤**：在 `Environment Variables` 中添加 `API_KEY`，其值为你的 Google Gemini API Key。
   - 点击 **Deploy**。

## 本地开发

1. 安装依赖：`npm install`
2. 运行项目：`npm run dev`
3. 确保你的环境变量中有 `API_KEY`。

## 技术栈
- React 19
- Vite
- Tailwind CSS
- Google Gemini API (gemini-3-flash-preview)
- Lucide React (图标库)