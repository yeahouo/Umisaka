# MCP Git Server

一个用于自动 Git 操作的 MCP (Model Context Protocol) 服务器。

## 功能

- 自动检测文件变更
- 智能生成提交信息
- 自动提交和推送
- 查看文件差异
- Git 状态检查

## 安装

1. 进入 MCP 服务器目录：
```bash
cd mcp-server
```

2. 安装依赖：
```bash
npm install
```

3. 构建项目：
```bash
npm run build
```

## 配置 Claude Code

在 Claude Code 的配置文件中添加以下配置：

```json
{
  "mcpServers": {
    "git": {
      "command": "node",
      "args": ["/path/to/your/project/mcp-server/dist/index.js"],
      "env": {}
    }
  }
}
```

## 使用方法

### 在 Claude Code 中：

1. **检查 Git 状态**：
   ```
   帮我检查一下 git 状态
   ```

2. **自动提交**：
   ```
   帮我提交代码
   ```
   或
   ```
   /git
   ```

3. **查看文件差异**：
   ```
   帮我看看改了什么
   ```

### 可用工具

- `git_status` - 检查 Git 状态
- `git_auto_commit` - 自动提交
- `git_commit` - 手动提交（需要指定提交信息）
- `git_diff` - 查看文件差异

## 开发

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 运行
npm start
```