#!/usr/bin/env node
/**
 * OpenClaw Wiki MCP Server
 *
 * 暴露 agent-wiki-mcp 知识库为 MCP 工具
 * 支持跨平台：Claude Code、Codex、Cursor、VS Code Copilot
 *
 * 用法:
 *   node server.js                    # stdio 模式（默认）
 *   node server.js --http 3456        # HTTP 模式，监听 0.0.0.0:3456
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
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { z } from 'zod';
import { spawn } from 'child_process';
import { execSync } from 'child_process';
import { createServer } from 'http';
import { randomUUID } from 'crypto';
import { readFile, readdir, stat, writeFile, appendFile } from 'fs/promises';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── 解析参数 ────────────────────────────────────────────
const args = process.argv.slice(2);
let WIKI_DIR = join(__dirname, '..');
const wikiArgIdx = args.indexOf('--wiki');
if (wikiArgIdx >= 0 && args[wikiArgIdx + 1]) {
  WIKI_DIR = args[wikiArgIdx + 1];
}

// HTTP 模式：--http <port>
const httpPortIdx = args.indexOf('--http');
const HTTP_PORT = httpPortIdx >= 0 ? parseInt(args[httpPortIdx + 1], 10) : null;

const SCRIPTS_DIR = join(WIKI_DIR, 'scripts');
const MEMORIES_DIR = join(WIKI_DIR, 'memories');
const SHARED_DIR = join(WIKI_DIR, 'shared');
const PROJECTS_DIR = join(WIKI_DIR, 'projects');

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

// 调用 Python 脚本（pgvector）
async function runPython(scriptName, args = [], timeout = 60000) {
  const scriptPath = join(WIKI_DIR, '.pgvector', scriptName);
  if (!existsSync(scriptPath)) {
    throw new Error(`脚本不存在: ${scriptPath}`);
  }

  return new Promise((resolve, reject) => {
    const proc = spawn('python3', [scriptPath, ...args], {
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
      const output = await runScript('unified-search.cjs', [query, String(limit)], 30000);
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
      const output = await runScript('unified-search.cjs', [query, String(limit), '--mode', 'deep'], 180000);
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
      const pgvectorPath = join(WIKI_DIR, '.pgvector');

      let status = `# Wiki 状态检查\n\n`;
      status += `Wiki 目录: ${WIKI_DIR}\n`;
      status += `脚本目录: ${SCRIPTS_DIR}\n\n`;

      // 检查核心文件
      status += `## 核心文件\n`;
      status += `- index.md: ${existsSync(indexPath) ? '✅ 存在' : '❌ 缺失'}\n`;
      status += `- .manifest.json: ${existsSync(manifestPath) ? '✅ 存在' : '❌ 缺失'}\n`;
      status += `- .pgvector/: ${existsSync(pgvectorPath) ? '✅ 存在' : '❌ 缺失'}\n\n`;

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

// 10. wiki_add - 单文件入库
server.tool(
  'wiki_add',
  '单文件入库到向量数据库。入库后索引自动更新。',
  {
    filepath: z.string().describe('文件路径（相对于 wiki 根目录）')
  },
  async ({ filepath }) => {
    try {
      const output = await runPython('wiki-pgvector.py', ['add', filepath], 60000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `入库失败: ${err.message}` }], isError: true };
    }
  }
);

// 11. wiki_delete - 单文件删除
server.tool(
  'wiki_delete',
  '从向量数据库删除单文件。删除后索引自动更新。',
  {
    filepath: z.string().describe('文件路径（相对于 wiki 根目录）')
  },
  async ({ filepath }) => {
    try {
      const output = await runPython('wiki-pgvector.py', ['delete', filepath], 30000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `删除失败: ${err.message}` }], isError: true };
    }
  }
);

// 12. wiki_incremental - 增量入库
server.tool(
  'wiki_incremental',
  '增量入库。扫描新增页面入库，不重建索引，适合日常维护。',
  {},
  async () => {
    try {
      const output = await runPython('wiki-pgvector.py', ['incremental'], 300000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `增量入库失败: ${err.message}` }], isError: true };
    }
  }
);

// ── 记忆层工具 ──────────────────────────────────────────────

// 13. wiki_remember - 记忆（知识库层，共享）
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

      // 支持中文和 CJK 字符：\u4e00-\u9fa5 (中文), \u3040-\u30ff (日文), \uac00-\ud7a3 (韩文)
      const filename = title.replace(/[^\u4e00-\u9fff\uac00-\ud7a3a-zA-Z0-9_-]/g, '_') + '.md';
      const filePath = join(SHARED_DIR, filename);

      const frontmatter = `---
title: "${title}"
category: ${category}
date: ${toBeijingTime()}
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

// 14. wiki_recall - 查询记忆/项目
server.tool(
  'wiki_recall',
  '查询共享知识/记忆/项目进度。搜索 user-preferences、project-decisions 或指定项目。',
  {
    query: z.string().min(1).max(200).describe('搜索关键词'),
    project: z.string().optional().describe('项目名（如 my-webapp），指定后搜索项目进度'),
    limit: z.number().min(1).max(20).default(5).describe('返回数量')
  },
  async ({ query, project, limit }) => {
    try {
      // 指定项目时，优先返回项目进度
      if (project) {
        const progressPath = join(PROJECTS_DIR, project, 'progress.md');
        if (existsSync(progressPath)) {
          const progress = await readFile(progressPath, 'utf-8');
          let result = `# 项目进度: ${project}\n\n${progress}`;
          // 同时搜索项目相关内容
          const projectQuery = `projects/${project} ${query}`;
          const related = await runScript('unified-search.cjs', [projectQuery, String(limit)], 30000);
          result += `\n\n---\n\n## 相关内容\n\n${related}`;
          return { content: [{ type: 'text', text: result }] };
        }
        return { content: [{ type: 'text', text: `❌ 项目不存在: ${project}` }], isError: true };
      }

      // 默认搜索 shared + projects 目录
      const sharedQuery = `shared ${query}`;
      const output = await runScript('unified-search.cjs', [sharedQuery, String(limit)], 30000);
      return { content: [{ type: 'text', text: output }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `查询记忆失败: ${err.message}` }], isError: true };
    }
  }
);

// 15. wiki_explain - 解释知识来源
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

// ── 项目进度工具 ──────────────────────────────────────────────

// 16. wiki_update_progress - 更新项目进度
server.tool(
  'wiki_update_progress',
  '更新项目进度记录。AI 完成任务后追加一条进度日志，任何 AI 接手都能看到。',
  {
    project: z.string().describe('项目名（如 my-webapp）'),
    task: z.string().describe('任务描述'),
    ai: z.string().describe('执行的 AI（Claude/Codex/Hermes/OpenClaw）'),
    status: z.enum(['✅', '🚧', '❌']).describe('任务状态：完成/进行中/失败'),
    note: z.string().optional().describe('备注信息')
  },
  async ({ project, task, ai, status, note }) => {
    try {
      const projectDir = join(PROJECTS_DIR, project);
      const progressPath = join(projectDir, 'progress.md');

      if (!existsSync(progressPath)) {
        return { content: [{ type: 'text', text: `❌ 项目不存在: ${project}\n请先创建 projects/${project}/progress.md` }], isError: true };
      }

      // 追加进度日志
      const timestamp = toBeijingTime();
      const logLine = `| ${timestamp} | ${ai} | ${task} | ${status} | ${note || ''} |\n`;

      const { appendFile } = await import('fs/promises');
      await appendFile(progressPath, logLine, 'utf-8');

      // 同步入库向量库
      const relativePath = `projects/${project}/progress.md`;
      try {
        await runPython('wiki-pgvector.py', ['add', relativePath], 30000);
      } catch (e) {
        // 入库失败不影响进度记录
      }

      return { content: [{ type: 'text', text: `✅ 进度已更新: ${project}\n${logLine}` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `更新进度失败: ${err.message}` }], isError: true };
    }
  }
);

// 17. wiki_get_progress - 获取项目进度
server.tool(
  'wiki_get_progress',
  '获取项目当前进度。返回 progress.md 内容，AI 接手项目时先调用此工具。',
  {
    project: z.string().describe('项目名（如 my-webapp）')
  },
  async ({ project }) => {
    try {
      const progressPath = join(PROJECTS_DIR, project, 'progress.md');

      if (!existsSync(progressPath)) {
        return { content: [{ type: 'text', text: `❌ 项目不存在: ${project}\n可用项目: ${await listProjects()}` }], isError: true };
      }

      const content = await readFile(progressPath, 'utf-8');
      return { content: [{ type: 'text', text: content }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `获取进度失败: ${err.message}` }], isError: true };
    }
  }
);

// 18. wiki_list_projects - 列出所有项目
server.tool(
  'wiki_list_projects',
  '列出所有项目。返回 projects/ 目录下的项目列表。',
  {},
  async () => {
    try {
      const projects = await listProjects();
      return { content: [{ type: 'text', text: `# 项目列表\n\n${projects}` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `列出项目失败: ${err.message}` }], isError: true };
    }
  }
);

async function listProjects() {
  if (!existsSync(PROJECTS_DIR)) return '(无项目)';
  const dirs = await readdir(PROJECTS_DIR);
  const projects = dirs.filter(d => {
    const p = join(PROJECTS_DIR, d);
    return existsSync(join(p, 'progress.md'));
  });
  if (projects.length === 0) return '(无项目)';
  return projects.map(p => `- ${p}`).join('\n');
}

// ── 项目智能跟踪系统 ──────────────────────────────────────────────

const REGISTRY_PATH = join(PROJECTS_DIR, 'registry.json');
const SYNC_INTERVAL = 5 * 60 * 1000; // 5分钟检查一次
let syncTimer = null;

// 北京时间格式化（UTC+8）
function toBeijingTime(date = new Date()) {
  const beijing = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString().slice(0, 16).replace('T', ' ');
}

// 北京时间 ISO 格式（用于存储，find 命令兼容）
function toBeijingISO(date = new Date()) {
  const beijing = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return beijing.toISOString();
}

// 加载注册表
function loadRegistry() {
  try {
    if (!existsSync(REGISTRY_PATH)) {
      return { version: 1, projects: {} };
    }
    return JSON.parse(readFileSync(REGISTRY_PATH, 'utf-8'));
  } catch (e) {
    return { version: 1, projects: {} };
  }
}

// 保存注册表
function saveRegistry(registry) {
  writeFileSync(REGISTRY_PATH, JSON.stringify(registry, null, 2), 'utf-8');
}

// 加载项目 meta
function loadMeta(projectName) {
  const metaPath = join(PROJECTS_DIR, projectName, 'meta.json');
  try {
    if (!existsSync(metaPath)) return null;
    return JSON.parse(readFileSync(metaPath, 'utf-8'));
  } catch (e) {
    return null;
  }
}

// 保存项目 meta
function saveMeta(projectName, meta) {
  const projectDir = join(PROJECTS_DIR, projectName);
  if (!existsSync(projectDir)) {
    mkdirSync(projectDir, { recursive: true });
  }
  writeFileSync(join(projectDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
}

// 检测项目变化（支持多路径）
function detectChanges(projectName) {
  const registry = loadRegistry();
  const proj = registry.projects[projectName];

  if (!proj) return { type: 'not_registered' };

  // 收集所有检测路径：主路径 + relatedPaths
  const allPaths = [proj.path];
  if (proj.relatedPaths && Array.isArray(proj.relatedPaths)) {
    allPaths.push(...proj.relatedPaths);
  }

  const meta = loadMeta(projectName) || { lastSession: toBeijingTime() };
  const changes = [];
  const lastSessionTime = new Date(meta.lastSession);

  // 对每个路径检测变化
  for (const path of allPaths) {
    // 检查路径是否存在
    if (!existsSync(path)) {
      changes.push({ type: 'path_missing', path });
      continue;
    }

    // 检查目录下最近修改的文件
    try {
      const findResult = execSync(
        `find . -type f -newermt "${lastSessionTime.toISOString()}" ` +
        `-not -path "./node_modules/*" -not -path "./.git/*" ` +
        `-not -path "./__pycache__/*" -not -path "./.cache/*" ` +
        `-not -path "./dist/*" -not -path "./build/*" ` +
        `2>/dev/null | head -20`,
        { cwd: path, encoding: 'utf-8', timeout: 10000 }
      ).trim();

      if (findResult) {
        const files = findResult.split('\n').filter(s => s && !s.includes('.pyc'));
        if (files.length > 0) {
          changes.push({
            type: 'files_modified',
            path: path,
            count: files.length,
            files: files.slice(0, 10)
          });
        }
      }
    } catch (e) {
      // find 命令失败，跳过此路径
    }
  }

  // 计算距离上次更新的天数
  const daysSince = Math.floor((Date.now() - lastSessionTime.getTime()) / (24 * 60 * 60 * 1000));

  return {
    type: 'checked',
    projectName,
    realPath: proj.path,
    relatedPaths: proj.relatedPaths || [],
    changes,
    daysSinceUpdate: daysSince,
    lastSession: meta.lastSession,
    lastAI: meta.lastAI
  };
}

// 执行自动同步
async function autoSync() {
  const registry = loadRegistry();
  const reports = [];

  for (const [name, proj] of Object.entries(registry.projects)) {
    if (proj.status !== 'active') continue;

    const result = detectChanges(name);

    if (result.type === 'project_missing') {
      // 项目路径不存在，标记为 archived
      proj.status = 'archived';
      proj.archivedAt = toBeijingTime();
      proj.archiveReason = '项目路径不存在';
      saveRegistry(registry);

      // 移动到 _archived 目录
      const oldDir = join(PROJECTS_DIR, name);
      const archivedDir = join(PROJECTS_DIR, '_archived', name);
      if (existsSync(oldDir)) {
        try {
          mkdirSync(join(PROJECTS_DIR, '_archived'), { recursive: true });
          execSync(`mv "${oldDir}" "${archivedDir}"`, { encoding: 'utf-8' });
        } catch (e) {}
      }

      reports.push({ project: name, action: 'archived', reason: '路径不存在' });
      continue;
    }

    if (result.type === 'not_registered') continue;

    // 有变化则更新
    if (result.changes.length > 0) {
      const meta = loadMeta(name) || {};
      meta.lastSession = toBeijingTime();
      meta.daysSinceUpdate = 0;
      meta.pendingChanges = result.changes;

      saveMeta(name, meta);

      // 更新注册表检查时间
      proj.lastCheck = toBeijingTime();
      saveRegistry(registry);

      // 自动入库（保持搜索及时性）
      const progressPath = join(PROJECTS_DIR, name, 'progress.md');
      if (existsSync(progressPath)) {
        try {
          await runPython('wiki-pgvector.py', ['add', `projects/${name}/progress.md`], 30000);
        } catch (e) {}
      }

      reports.push({ project: name, action: 'synced', changes: result.changes });
    }
  }

  if (reports.length > 0) {
    console.error('[自动同步]', reports.map(r => `${r.project}: ${r.action}`).join(', '));
  }

  return reports;
}

// 19. wiki_register_project - 注册新项目
server.tool(
  'wiki_register_project',
  '注册新项目到跟踪系统。建立项目名与实际路径的映射，开启自动跟踪。',
  {
    name: z.string().min(1).describe('项目名（如 my-webapp）'),
    path: z.string().describe('项目实际路径（如 /opt/.openclaw/workspace/skills/my-app）')
  },
  async ({ name, path }) => {
    try {
      // 检查路径是否存在
      if (!existsSync(path)) {
        return { content: [{ type: 'text', text: `❌ 项目路径不存在: ${path}` }], isError: true };
      }

      const registry = loadRegistry();

      // 检查是否已注册
      if (registry.projects[name]) {
        return { content: [{ type: 'text', text: `⚠️ 项目已注册: ${name}\n路径: ${registry.projects[name].path}` }] };
      }

      // 注册项目
      registry.projects[name] = {
        path,
        status: 'active',
        createdAt: toBeijingTime(),
        lastCheck: toBeijingTime()
      };
      saveRegistry(registry);

      // 创建项目目录和初始文件
      const projectDir = join(PROJECTS_DIR, name);
      mkdirSync(projectDir, { recursive: true });

      // 复制模板
      const templateProgress = join(PROJECTS_DIR, '.templates', 'progress.md');
      const templateMeta = join(PROJECTS_DIR, '.templates', 'meta.json');

      if (existsSync(templateProgress)) {
        let progressContent = readFileSync(templateProgress, 'utf-8');
        progressContent = progressContent.replace('{{项目名}}', name);
        writeFileSync(join(projectDir, 'progress.md'), progressContent, 'utf-8');
      }

      // 创建 meta.json
      const meta = {
        projectName: name,
        realPath: path,
        status: 'active',
        createdAt: toBeijingTime(),
        lastSession: toBeijingTime(),
        lastAI: '注册',
        currentTask: '项目初始化',
        taskStatus: '✅',
        pendingChanges: [],
        totalSessions: 0,
        daysSinceUpdate: 0,
        indexed: false,
        indexUpdatedAt: toBeijingTime()
      };
      saveMeta(name, meta);

      // 入库
      try {
        await runPython('wiki-pgvector.py', ['add', `projects/${name}/progress.md`], 30000);
        meta.indexed = true;
        saveMeta(name, meta);
      } catch (e) {}

      return { content: [{ type: 'text', text: `✅ 项目已注册: ${name}\n路径: ${path}\n跟踪目录: projects/${name}/` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `注册失败: ${err.message}` }], isError: true };
    }
  }
);

// 20. wiki_auto_sync - 手动触发同步（或查看同步状态）
server.tool(
  'wiki_auto_sync',
  '手动触发项目同步检查。显示所有活跃项目的变化状态。',
  {},
  async () => {
    try {
      const reports = await autoSync();
      if (reports.length === 0) {
        return { content: [{ type: 'text', text: '✅ 所有项目无变化，无需同步' }] };
      }

      let text = '# 项目同步报告\n\n';
      for (const r of reports) {
        if (r.action === 'synced') {
          text += `✅ **${r.project}**\n`;
          for (const c of r.changes) {
            if (c.type === 'files_modified') {
              const pathLabel = c.path.split('/').pop();
              text += `   - ${pathLabel}: ${c.count} 个变化\n`;
            } else if (c.type === 'path_missing') {
              text += `   - ⚠️ 路径不存在: ${c.path}\n`;
            }
          }
        } else if (r.action === 'archived') {
          text += `📦 **${r.project}**: 已归档 (${r.reason})\n`;
        }
      }
      return { content: [{ type: 'text', text: text }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `同步失败: ${err.message}` }], isError: true };
    }
  }
);

// 21. wiki_wake_check - 项目唤醒检查
server.tool(
  'wiki_wake_check',
  '检查项目唤醒状态。如果项目长时间未更新，返回提醒信息供 AI 展示给用户。',
  {
    project: z.string().describe('项目名')
  },
  async ({ project }) => {
    try {
      const result = detectChanges(project);

      if (result.type === 'not_registered') {
        return { content: [{ type: 'text', text: `❌ 项目未注册: ${project}` }], isError: true };
      }

      if (result.type === 'project_missing') {
        return { content: [{ type: 'text', text: `⚠️ 项目路径已不存在: ${result.path}\n建议归档或更新路径` }], isError: true };
      }

      const meta = loadMeta(project) || {};
      const daysSince = result.daysSinceUpdate;

      // 长时间未更新（>1天）才提醒
      if (daysSince > 1) {
        let text = `📊 **项目唤醒提醒: ${project}**\n\n`;
        text += `- 最后编辑: **${meta.lastAI || '未知'}**\n`;
        text += `- 最后时间: ${meta.lastSession || '未知'}\n`;
        text += `- 当前任务: ${meta.currentTask || '未知'}\n`;
        text += `- 任务状态: ${meta.taskStatus || '未知'}\n`;
        text += `- 已暂停: **${daysSince} 天**\n`;
        if (meta.pendingChanges?.length > 0) {
          text += `- 待处理变化: ${meta.pendingChanges.length} 个\n`;
        }
        text += `\n是否继续此项目？`;
        return { content: [{ type: 'text', text: text }] };
      }

      // 短时间内，静默返回状态
      return { content: [{ type: 'text', text: `✅ ${project}: 正常（${daysSince} 天前更新）` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `唤醒检查失败: ${err.message}` }], isError: true };
    }
  }
);

// 22. wiki_archive_project - 归档项目
server.tool(
  'wiki_archive_project',
  '归档项目。保留所有记录但停止自动跟踪。',
  {
    project: z.string().describe('项目名'),
    reason: z.string().optional().describe('归档原因')
  },
  async ({ project, reason }) => {
    try {
      const registry = loadRegistry();
      if (!registry.projects[project]) {
        return { content: [{ type: 'text', text: `❌ 项目未注册: ${project}` }], isError: true };
      }

      registry.projects[project].status = 'archived';
      registry.projects[project].archivedAt = new Date().toISOString();
      registry.projects[project].archiveReason = reason || '用户手动归档';
      saveRegistry(registry);

      // 移动到 _archived
      const oldDir = join(PROJECTS_DIR, project);
      const archivedDir = join(PROJECTS_DIR, '_archived', project);
      if (existsSync(oldDir) && !existsSync(archivedDir)) {
        mkdirSync(join(PROJECTS_DIR, '_archived'), { recursive: true });
        execSync(`mv "${oldDir}" "${archivedDir}"`, { encoding: 'utf-8' });
      }

      return { content: [{ type: 'text', text: `📦 项目已归档: ${project}\n原因: ${reason || '用户手动归档'}\n记录保留在: projects/_archived/${project}/` }] };
    } catch (err) {
      return { content: [{ type: 'text', text: `归档失败: ${err.message}` }], isError: true };
    }
  }
);


// ── 资源定义 ──────────────────────────────────────────────

// 1. 静态资源：Wiki状态
server.resource(
  'wiki-status',
  'wiki://status',
  { title: 'Wiki 状态', description: 'Wiki 知识库状态信息', mimeType: 'text/markdown' },
  async () => {
    const indexPath = join(WIKI_DIR, 'index.md');
    const manifestPath = join(WIKI_DIR, '.manifest.json');
    
    let status = `# Wiki 状态\n\n`;
    status += `- Wiki 目录: ${WIKI_DIR}\n`;
    status += `- 索引文件: ${existsSync(indexPath) ? '✅ 存在' : '❌ 不存在'}\n`;
    status += `- 清单文件: ${existsSync(manifestPath) ? '✅ 存在' : '❌ 不存在'}\n`;
    
    try {
      const files = await readdir(WIKI_DIR).catch(() => []);
      const mdFiles = files.filter(f => f.endsWith('.md'));
      status += `- Markdown 文件: ${mdFiles.length} 个\n`;
    } catch (e) {
      status += `- 读取目录失败: ${e.message}\n`;
    }
    
    return { contents: [{ uri: 'wiki://status', mimeType: 'text/markdown', text: status }] };
  }
);

// 2. 资源模板：Wiki搜索
server.resource(
  'wiki-search',
  new ResourceTemplate('wiki://search{?query,limit}', { list: undefined }),
  { title: 'Wiki 搜索', description: '搜索 Wiki 知识库', mimeType: 'text/markdown' },
  async (uri, variables) => {
    const query = variables.query || '';
    const limit = parseInt(variables.limit || '10', 10);
    
    if (!query) {
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: '# 错误\n\n缺少查询参数: query' }] };
    }
    
    try {
      const output = await runScript('unified-search.cjs', [query, String(limit)], 30000);
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: output }] };
    } catch (err) {
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: `# 搜索失败\n\n${err.message}` }] };
    }
  }
);

// 3. 资源模板：Wiki深度搜索
server.resource(
  'wiki-deep-search',
  new ResourceTemplate('wiki://deep{?query,limit}', { list: undefined }),
  { title: 'Wiki 深度搜索', description: '深度搜索 Wiki 知识库（LLM综合）', mimeType: 'text/markdown' },
  async (uri, variables) => {
    const query = variables.query || '';
    const limit = parseInt(variables.limit || '10', 10);
    
    if (!query) {
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: '# 错误\n\n缺少查询参数: query' }] };
    }
    
    try {
      const output = await runScript('unified-search.cjs', [query, String(limit), '--mode', 'deep'], 180000);
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: output }] };
    } catch (err) {
      return { contents: [{ uri: uri.href, mimeType: 'text/markdown', text: `# 深度搜索失败\n\n${err.message}` }] };
    }
  }
);

// 启动定时同步（后台）
function startAutoSync() {
  if (syncTimer) return;
  syncTimer = setInterval(async () => {
    try {
      await autoSync();
    } catch (e) {
      console.error('[自动同步错误]', e.message);
    }
  }, SYNC_INTERVAL);
  console.error(`[自动同步] 已启动，间隔 ${SYNC_INTERVAL / 60000} 分钟`);
}

// ── 启动 Server ──────────────────────────────────────────────
async function main() {
  if (HTTP_PORT) {
    // HTTP 模式：每个请求一个 stateless transport，共享同一个 McpServer
    const httpServer = createServer(async (req, res) => {
      // CORS headers
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Mcp-Session-Id');

      if (req.method === 'OPTIONS') {
        res.writeHead(204);
        res.end();
        return;
      }

      // 只处理 /mcp 路径
      if (req.url !== '/mcp' && !req.url.startsWith('/mcp/')) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not Found. Use POST /mcp');
        return;
      }

      // 解析请求体
      let body = '';
      for await (const chunk of req) body += chunk;
      let parsedBody;
      try { parsedBody = JSON.parse(body); } catch { parsedBody = undefined; }

      // 每个请求创建 stateless transport
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined, // stateless 模式
      });

      // 连接到共享的 McpServer
      await server.connect(transport);

      // 处理请求
      await transport.handleRequest(req, res, parsedBody);
    });

    httpServer.listen(HTTP_PORT, '0.0.0.0', () => {
      console.error(`[openclaw-wiki-mcp] HTTP 模式启动: http://0.0.0.0:${HTTP_PORT}/mcp`);
      console.error(`[openclaw-wiki-mcp] Wiki 目录: ${WIKI_DIR}`);
    });
  } else {
    // stdio 模式（默认）
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('[openclaw-wiki-mcp] stdio 模式启动，等待 MCP 客户端连接...');
  }

  // 启动自动同步（后台定时检查）
  startAutoSync();
}

main().catch((err) => {
  console.error('[openclaw-wiki-mcp] 启动失败:', err);
  process.exit(1);
});