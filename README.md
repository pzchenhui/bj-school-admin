# 北京学校管理后台系统

一个基于 React + TypeScript + Supabase 的学校管理后台系统，提供全面的校园管理功能。

## 功能特性

- 📊 **仪表板** - 数据概览与统计
- 📝 **成绩管理** - 学生成绩录入与分析
- 👨‍🎓 **学生评语** - 学期评语管理
- 📅 **学期管理** - 学期安排与配置
- 🎪 **活动管理** - 校园活动组织
- 📢 **公告管理** - 校园公告发布
- 📝 **日志管理** - 工作日志记录
- 🔔 **值班管理** - 教师值班安排
- 🎉 **节日管理** - 节假日配置
- 🗣️ **演讲管理** - 演讲活动管理
- 📋 **工作计划** - 工作计划制定
- 🧠 **心理测评** - 学生心理测评
- 🔐 **安全设置** - 系统安全配置
- 🤖 **LLM 配置** - 大语言模型 API 管理

## 技术栈

- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite 6
- **UI 组件**: Radix UI + TailwindCSS
- **数据库**: Supabase (PostgreSQL)
- **图表**: Recharts
- **表单**: React Hook Form + Zod

## 快速开始

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 生产构建

```bash
pnpm build
```

### 预览构建

```bash
pnpm preview
```

## 环境变量

在项目根目录创建 `.env` 文件：

```env
VITE_SUPABASE_URL=http://localhost:3000
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 目录结构

```
├── src/
│   ├── components/     # 组件
│   ├── contexts/       # React Context
│   ├── hooks/          # 自定义 Hooks
│   ├── lib/            # 工具函数
│   ├── pages/          # 页面组件
│   ├── types/          # TypeScript 类型
│   └── db/             # 数据库配置
├── public/             # 静态资源
├── supabase/           # 数据库 Schema
└── dist/               # 构建输出
```

## 许可证

MIT License