#!/usr/bin/env node
/**
 * OpenClaw Wiki MCP Server
 *
 * 暴露 agent-wiki-mcp 知识库为 MCP 工具
 * 支持跨平台：Claude Code、Codex、Cursor、VS Code Copilot
 *
 * 用法:
 *   node server.js                    # 使用默认 wiki 路径
 *   node server.js --wiki /path/wiki  # 自定义 wiki 路径
 *
 * MCP 配置示例 (Claude Code settings.json):
 *   {
 *     "mcpServers": {
 *       "openclaw-wiki": {
 *         "command": "node",
 *         "args": ["/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/server.js"]
 *       }
 *     }
 *   }
 *
 * MCP 配置示例 (Codex config.toml):
 *   [mcp_servers.openclaw-wiki]
 *   command = "node"
 *   args = ["/opt/.openclaw/workspace/skills/agent-wiki-mcp/mcp_server/server.js"]
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { spawn } from 'child_process';
import { readFile, readdir, stat } from 'fs/promises';
import { existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 解析参数 ────────────────────────────────────────────
const args = process.argv.slice(2);
let WIKI_DIR = join(__dirname, '..');
const wikiArgIdx = args.indexOf('--wiki');
if (wikiArgIdx >= 0 && args[wikiArgIdx + 1]) {
  WIKI_DIR = args[wikiArgIdx + 1];
}

const SCRIPTS_DIR = join(WIKI_DIR, 'scripts');
const MEMORIES_DIR = join(WIKI_DIR, 'memories');
const SHARED_DIR = join(WIKI_DIR, 'shared');

console.error(`[openclaw-wiki-mcp] Wiki 目录: ${WIKI_DIR}`);
console.error(`[openclaw-wiki-mcp] 脚本目录: ${SCRIPTS_DIR}`);

// ── MCP Server ──────────────────────────────────────────────
const server = new McpServer({
  name: 'openclaw-wiki',
  version: '1.0.0',
  title: 'OpenClaw Wiki 知识库',
  description: 'OpenClaw Wiki 知识库 + 记忆层。支持关键词搜索、语义联想、深度综合回答。'
});

// ── 工具：调用脚本的辅助函数 ──────────────────────────────────
async function runScript(scriptName, args = [], timeout = 60000) {
  const scriptPath = join(SCRIPTS_DIR, scriptName);
  if (!existsSync(scriptPath)) {
    throw new Error(`脚本不存在: ${scriptPath}`);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('node', [scriptPath, ...args], {
      cwd: WIKI_DIR,
      timeout,
      env: { ...process.env, WIKI_VAULT_PATH: WIKI_DIR }
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => stdout += data);
    proc.stderr.on('data', (data) => stderr += data);

    proc.on('close', (code) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(stderr || `脚本退出码: ${code}`));
      }
    });

    proc.on('error', (err) => reject(err));
  });
}

async function readMarkdownFile(filePath) {
  if (!existsSync(filePath)) {
    return null;
  }
  return readFile(filePath, 'utf-8');
}

// ── 工具定义 ──────────────────────────────────────────────

// 1. wiki_query - 快速搜索
server.tool(
  'wiki_query',
  '搜索 Wiki 知识库（快速模式）。返回匹配的文档列表，支持 grep 精确匹配 + 向量语义搜索双重验证。',
  {
    query: z.string().min(1).max(200).describe('搜索关键词或问题'),
    limit: z.number().min(1).max(50).default(10).describe('返回结果数量')
  },
  async ({ query, limit }) => {
    try {
      const output = await runScript('unified-search.js', [query, String(limit)], 30000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `搜索失败: ${err.message}` }], isError: true };
    }
  }
);

// 2. wiki_deep_query - 深度搜索（LLM 综合）
server.tool(
  'wiki_deep_query',
  '深度搜索 Wiki 知识库。读取相关页面并调用 LLM 综合回答，适合复杂问题如"怎么配置"、"报错排查"。',
  {
    query: z.string().min(1).max(500).describe('搜索问题或关键词'),
    limit: z.number().min(1).max(20).default(10).describe('读取页面数量')
  },
  async ({ query, limit }) => {
    try {
      const output = await runScript('unified-search.js', [query, String(limit), '--mode', 'deep'], 180000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `深度搜索失败: ${err.message}` }], isError: true };
    }
  }
);

// 3. wiki_brief - 工作前预加载
server.tool(
  'wiki_brief',
  '获取 Wiki 工作摘要。包含近 24 小时的操作记录、活跃话题等，适合开始工作前快速了解状态。',
  {},
  async () => {
    try {
      const output = await runScript('wiki-brief.js', [], 30000);
      return { content: [{ type: 'text', text: output || '无近期操作记录' }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `获取 brief 失败: ${err.message}` }], isError: true };
    }
  }
);

// 4. wiki_status - Wiki 状态检查
server.tool(
  'wiki_status',
  '检查 Wiki 知识库状态。包含目录结构、文档数量、索引状态等信息。',
  {},
  async () => {
    try {
      const indexPath = join(WIKI_DIR, 'index.md');
      const manifestPath = join(WIKI_DIR, '.manifest.json');
      const lancedbPath = join(WIKI_DIR, '.lancedb');

      let status = `# Wiki 状态检查\n\n`;
      status += `Wiki 目录: ${WIKI_DIR}\n`;
      status += `脚本目录: ${SCRIPTS_DIR}\n\n`;

      // 检查核心文件
      status += `## 核心文件\n`;
      status += `- index.md: ${existsSync(indexPath) ? '✅ 存在' : '❌ 缺失'}\n`;
      status += `- .manifest.json: ${existsSync(manifestPath) ? '✅ 存在' : '❌ 缺失'}\n`;
      status += `- .lancedb/: ${existsSync(lancedbPath) ? '✅ 存在' : '❌ 缺失'}\n\n`;

      // 统计文档数量
      const files = await readdir(WIKI_DIR);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      status += `## 文档统计\n`;
      status += `- Markdown 文件: ${mdFiles.length} 个\n`;

      // 子目录
      const dirs = files.filter(async f => {
        const s = await stat(join(WIKI_DIR, f));
        return s.isDirectory();
      });

      return { content: [{ type: 'text', text: status }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `状态检查失败: ${err.message}` }], isError: true };
    }
  }
);

// 5. wiki_ingest_status - 消化状态检查
server.tool(
  'wiki_ingest_status',
  '检查源文件消化状态。显示哪些 raw 文件待消化、哪些已过期需要更新。',
  {},
  async () => {
    try {
      const output = await runScript('ingest.js', ['--status'], 30000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `检查消化状态失败: ${err.message}` }], isError: true };
    }
  }
);

// 6. wiki_ingest - 消化源文件
server.tool(
  'wiki_ingest',
  '消化源文件到 Wiki。将 raw 目录的文档转换为 Wiki 页面，支持多种格式。',
  {
    source: z.string().describe('源文件路径（相对 raw 目录）'),
    force: z.boolean().default(false).describe('强制重新消化')
  },
  async ({ source, force }) => {
    try {
      const args = force ? ['--force', source] : [source];
      const output = await runScript('ingest.js', args, 120000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `消化失败: ${err.message}` }], isError: true };
    }
  }
);

// 7. wiki_pages - 列出页面
server.tool(
  'wiki_pages',
  '列出 Wiki 页面。按类型或关键词筛选，返回页面列表。',
  {
    category: z.string().optional().describe('分类筛选（如 plugins、litellm、gateway）'),
    limit: z.number().min(1).max(100).default(30).describe('返回数量')
  },
  async ({ category, limit }) => {
    try {
      const args = category ? [category, String(limit)] : [String(limit)];
      const output = await runScript('query.js', args, 30000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `列出页面失败: ${err.message}` }], isError: true };
    }
  }
);

// 8. wiki_rebuild_index - 重建索引
server.tool(
  'wiki_rebuild_index',
  '重建 Wiki 索引。用于添加新文档后更新搜索索引。',
  {},
  async () => {
    try {
      const output = await runScript('wiki-maintain.js', ['--rebuild-index'], 60000);
      return { content: [{ type: 'text', text: output || '索引重建完成' }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `重建索引失败: ${err.message}` }], isError: true };
    }
  }
);

// 9. wiki_validate - 验证 Wiki
server.tool(
  'wiki_validate',
  '验证 Wiki 结构完整性。检查索引、链接、文件一致性。',
  {},
  async () => {
    try {
      const output = await runScript('lint.js', [], 60000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `验证失败: ${err.message}` }], isError: true };
    }
  }
);

// ── 记忆层工具 ──────────────────────────────────────────────

// 10. wiki_remember - 记忆（知识库层，共享）
server.tool(
  'wiki_remember',
  '记录共享知识到 Wiki。用于项目决策、用户偏好、技术事实等可跨平台共享的信息。',
  {
    title: z.string().min(1).max(100).describe('记忆标题'),
    content: z.string().min(1).max(2000).describe('记忆内容'),
    category: z.string().default('shared').describe('分类（shared/user-preferences/project-decisions）'),
    tags: z.array(z.string()).optional().describe('标签列表')
  },
  async ({ title, content, category, tags }) => {
    try {
      // 确保 shared 目录存在
      if (!existsSync(SHARED_DIR)) {
        return { content: [{ type: 'text', text: `错误: shared 目录不存在 (${SHARED_DIR})` }], isError: true };
      }

      const filename = title.replace(/[^a-zA-Z0-9_-]/g, '_') + '.md';
      const filePath = join(SHARED_DIR, filename);

      const frontmatter = `---
title: "${title}"
category: ${category}
date: ${new Date().toISOString()}
tags: ${JSON.stringify(tags || [])}
---
# ${title}

${content}
`;

      // 写入文件（通过脚本或直接）
      const { writeFile } = await import('fs/promises');
      await writeFile(filePath, frontmatter, 'utf-8');

      return { content: [{ type: 'text', text: `✅ 已记录共享知识: ${filename}\n路径: ${filePath}` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `记录失败: ${err.message}` }], isError: true };
    }
  }
);

// 11. wiki_recall - 查询记忆
server.tool(
  'wiki_recall',
  '查询共享知识/记忆。搜索 user-preferences、project-decisions 等共享内容。',
  {
    query: z.string().min(1).max(200).describe('搜索关键词'),
    limit: z.number().min(1).max(20).default(5).describe('返回数量')
  },
  async ({ query, limit }) => {
    try {
      // 限定搜索 shared 目录
      const sharedQuery = `shared ${query}`;
      const output = await runScript('unified-search.js', [sharedQuery, String(limit)], 30000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `查询记忆失败: ${err.message}` }], isError: true };
    }
  }
);

// 12. wiki_explain - 解释知识来源
server.tool(
  'wiki_explain',
  '解释 Wiki 页面来源。显示页面的原始 URL、消化时间、关联文档。',
  {
    page: z.string().describe('页面路径（如 plugins/xxx 或 litellm-proxy/xxx）')
  },
  async ({ page }) => {
    try {
      const manifestPath = join(WIKI_DIR, '.manifest.json');
      if (!existsSync(manifestPath)) {
        return { content: [{ type: 'text', text: '.manifest.json 不存在' }] };
      }

      const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
      const pagePath = page.endsWith('.md') ? page : page + '.md';

      let info = `# 页面来源: ${page}\n\n`;

      for (const [srcId, src] of Object.entries(manifest.sources || {})) {
        if (src.pagesCreated?.includes(pagePath)) {
          info += `## 来源信息\n`;
          info += `- **原文标题**: ${src.articleTitle || '未知'}\n`;
          info += `- **原文 URL**: ${src.articleUrl || '无'}\n`;
          info += `- **消化时间**: ${src.ingestedAt || '未知'}\n`;
          info += `- **创建页面**: ${src.pagesCreated?.join(', ') || '无'}\n`;
          break;
        }
      }

      if (info === `# 页面来源: ${page}\n\n`) {
        info += '未找到来源信息。可能是本地创建或 manifest 未记录。';
      }

      return { content: [{ type: 'text', text: info }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `解释失败: ${err.message}` }], isError: true };
    }
  }
);

// ── 启动 Server ──────────────────────────────────────────────
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('[openclaw-wiki-mcp] Server 已启动，等待 MCP 客户端连接...');
}

main().catch((err) => {
  console.error('[openclaw-wiki-mcp] 启动失败:', err);
  process.exit(1);
});