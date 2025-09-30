#!/usr/bin/env node
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import { GitHelper } from './git-utils.js';
// 创建 MCP 服务器实例
const server = new Server({
    name: 'mcp-git-server',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// 创建 Git 助手实例
const gitHelper = new GitHelper();
// 列出可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'git_status',
                description: '检查 Git 状态，获取当前所有文件变更',
                inputSchema: {
                    type: 'object',
                    properties: {},
                    required: [],
                },
            },
            {
                name: 'git_auto_commit',
                description: '自动检测变更、生成提交信息并提交到远程仓库',
                inputSchema: {
                    type: 'object',
                    properties: {
                        custom_message: {
                            type: 'string',
                            description: '自定义提交信息（可选）',
                        },
                    },
                    required: [],
                },
            },
            {
                name: 'git_commit',
                description: '使用指定信息提交当前变更',
                inputSchema: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: '提交信息',
                        },
                        push: {
                            type: 'boolean',
                            description: '是否推送到远程仓库（默认：true）',
                            default: true,
                        },
                    },
                    required: ['message'],
                },
            },
            {
                name: 'git_diff',
                description: '查看文件差异',
                inputSchema: {
                    type: 'object',
                    properties: {
                        file: {
                            type: 'string',
                            description: '指定文件路径（可选，不指定则查看所有文件）',
                        },
                    },
                    required: [],
                },
            },
        ],
    };
});
// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        switch (name) {
            case 'git_status':
                return await handleGitStatus();
            case 'git_auto_commit':
                return await handleGitAutoCommit(args?.custom_message);
            case 'git_commit':
                return await handleGitCommit(args?.message, args?.push);
            case 'git_diff':
                return await handleGitDiff(args?.file);
            default:
                throw new Error(`未知工具: ${name}`);
        }
    }
    catch (error) {
        return {
            content: [
                {
                    type: 'text',
                    text: `❌ 操作失败: ${error instanceof Error ? error.message : String(error)}`,
                },
            ],
            isError: true,
        };
    }
});
// 处理 Git 状态检查
async function handleGitStatus() {
    const status = await gitHelper.getStatus();
    if (!status.hasChanges) {
        return {
            content: [
                {
                    type: 'text',
                    text: '📝 工作区干净，没有检测到任何更改',
                },
            ],
        };
    }
    const changeSummary = status.changes.map(change => {
        const icon = change.type === 'modified' ? '🔄' :
            change.type === 'added' ? '➕' :
                change.type === 'deleted' ? '❌' :
                    change.type === 'renamed' ? '🔄' : '❓';
        return `${icon} ${change.file} (${change.type})`;
    }).join('\n');
    const diffStat = await gitHelper.getDiffStat();
    return {
        content: [
            {
                type: 'text',
                text: `📋 Git 状态检查结果:\n\n分支: ${status.branch}\n\n📁 变更文件:\n${changeSummary}\n\n📊 修改统计:\n${diffStat}`,
            },
        ],
    };
}
// 处理自动提交
async function handleGitAutoCommit(customMessage) {
    const status = await gitHelper.getStatus();
    if (!status.hasChanges) {
        return {
            content: [
                {
                    type: 'text',
                    text: '📝 没有检测到任何更改，无需提交',
                },
            ],
        };
    }
    const commitMessage = customMessage || gitHelper.generateCommitMessage(status.changes);
    try {
        await gitHelper.addAll();
        const commitHash = await gitHelper.commit(commitMessage);
        let pushResult = '';
        try {
            await gitHelper.push();
            pushResult = '\n✅ 已推送到远程仓库';
        }
        catch (pushError) {
            pushResult = '\n⚠️ 推送到远程仓库失败，但本地提交成功';
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `🎉 自动提交成功！\n\n📝 提交信息: "${commitMessage}"\n🔖 提交哈希: ${commitHash}${pushResult}`,
                },
            ],
        };
    }
    catch (error) {
        throw new Error(`提交失败: ${error}`);
    }
}
// 处理手动提交
async function handleGitCommit(message, push = true) {
    if (!message?.trim()) {
        throw new Error('提交信息不能为空');
    }
    try {
        await gitHelper.addAll();
        const commitHash = await gitHelper.commit(message);
        let pushResult = '';
        if (push) {
            try {
                await gitHelper.push();
                pushResult = '\n✅ 已推送到远程仓库';
            }
            catch (pushError) {
                pushResult = '\n⚠️ 推送到远程仓库失败，但本地提交成功';
            }
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `✅ 提交成功！\n\n📝 提交信息: "${message}"\n🔖 提交哈希: ${commitHash}${push ? pushResult : ''}`,
                },
            ],
        };
    }
    catch (error) {
        throw new Error(`提交失败: ${error}`);
    }
}
// 处理差异查看
async function handleGitDiff(file) {
    try {
        const diff = await gitHelper.getDiff(file);
        if (!diff.trim()) {
            return {
                content: [
                    {
                        type: 'text',
                        text: file ? `📄 文件 ${file} 没有更改` : '📄 没有检测到任何更改',
                    },
                ],
            };
        }
        return {
            content: [
                {
                    type: 'text',
                    text: `📊 文件差异${file ? ` (${file})` : ''}:\n\n${diff}`,
                },
            ],
        };
    }
    catch (error) {
        throw new Error(`获取差异失败: ${error}`);
    }
}
// 启动服务器
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('MCP Git Server 已启动');
}
main().catch((error) => {
    console.error('启动 MCP 服务器失败:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map