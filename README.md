# H-Labs Ecosystem OS

一个基于 React + Vite 的现代化 Web 应用,集成 Twitter/X API 和 Telegram 数据分析功能。

## 🚀 快速开始

### 环境要求
- Node.js 20+
- npm 或 yarn

### 本地开发

1. **克隆仓库**
```bash
git clone <your-repo-url>
cd 001-app-h-labs
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
# 复制环境变量示例文件
cp .env.example .env

# 编辑 .env 文件,填入你的 API 密钥
# VITE_X_API_KEY=your_twitter_api_key_here
```

4. **启动开发服务器**
```bash
npm run dev
```

访问 `http://localhost:5173` 查看应用。

## 📦 构建

```bash
npm run build
```

构建产物将输出到 `dist` 目录。

## 🌐 部署

### Cloudflare Pages 自动部署

本项目已配置 GitHub Actions 自动部署到 Cloudflare Pages。

**前置步骤:**

1. 在 GitHub 仓库中配置以下 Secrets (Settings → Secrets and variables → Actions):
   - `VITE_X_API_KEY` - Twitter/X API 密钥
   - `CLOUDFLARE_API_TOKEN` - Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID` - Cloudflare Account ID

2. 推送代码到 `main` 分支,GitHub Actions 会自动构建并部署

**详细部署指南:** 查看 [DEPLOYMENT.md](./DEPLOYMENT.md)

## 📚 文档

- [QUICKSTART.md](./QUICKSTART.md) - 快速开始指南
- [DEPLOYMENT.md](./DEPLOYMENT.md) - 详细的部署文档
- [CONFIG_SUMMARY.md](./CONFIG_SUMMARY.md) - 配置总结

## 🔑 环境变量

| 变量名 | 说明 | 必需 |
|--------|------|------|
| `VITE_X_API_KEY` | Twitter/X API 密钥 | ✅ |

**注意:** 所有客户端使用的环境变量必须以 `VITE_` 开头。

## 🛠️ 技术栈

- **框架:** React 19 + Vite 6
- **语言:** TypeScript
- **UI:** Lucide React Icons
- **后端服务:** Firebase
- **部署:** Cloudflare Pages
- **CI/CD:** GitHub Actions

## 📁 项目结构

```
├── .github/
│   └── workflows/
│       ├── deploy.yml      # Cloudflare Pages 部署工作流
│       └── verify.yml      # 构建验证工作流
├── dashboard/              # 仪表板组件
│   ├── KolPortalView.tsx   # KOL 门户视图
│   └── WarDash/
│       └── TelegramAlpha.tsx  # Telegram 数据展示
├── components/             # 可复用组件
├── .env.example           # 环境变量示例
├── .gitignore            # Git 忽略规则
└── vite.config.ts        # Vite 配置
```

## 🔐 安全

- ✅ `.env` 文件已被 Git 忽略
- ✅ 敏感信息通过 GitHub Secrets 管理
- ✅ 生产环境变量在构建时注入
- ❌ 不要在代码中硬编码 API 密钥

## 📝 开发规范

- 使用 TypeScript 进行类型检查
- 遵循 React Hooks 最佳实践
- 代码需要清晰的注释
- 优先使用函数式组件

## 🤝 贡献

欢迎提交 Issue 和 Pull Request!

## 📄 许可证

MIT License
