#!/usr/bin/env node
/**
 * wiki-query: 在 wiki 中搜索并回答问题
 * 用法: node scripts/query.js "你的问题" [数量]
 */

const fs = require('fs');
const path = require('path');

const VAULT = process.env.WIKI_VAULT_PATH || '/opt/.openclaw/workspace/skills/agent-wiki-mcp';

function scanDir(dir, candidates, terms, depth = 0) {
  if (depth > 3 || !fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const fullpath = path.join(dir, file);
    const stat = fs.statSync(fullpath);
    if (stat.isDirectory()) {
      scanDir(fullpath, candidates, terms, depth + 1);
    } else if (file.endsWith('.md')) {
      try {
        const content = fs.readFileSync(fullpath, 'utf8');
        const relPath = path.relative(VAULT, fullpath);
        const fmMatch = content.match(/^---\n([\s\S]*?)\n---\n/);
        const frontmatter = fmMatch ? fmMatch[1] : '';
        const titleMatch = frontmatter.match(/title:\s*"?([^"\n]+)"?/);
        const title = titleMatch ? titleMatch[1].trim() : file.replace('.md', '');

        let score = 0;
        const lowerTitle = title.toLowerCase();
        const lowerContent = content.toLowerCase();
        for (const term of terms) {
          if (lowerTitle.includes(term)) score += 10;
          if (lowerContent.includes(term)) score += 1;
        }

        if (score > 0) {
          candidates.push({ path: relPath, title, score });
        }
      } catch (e) {}
    }
  }
}

function findPages(query, limit = 10) {
  const terms = query.toLowerCase().split(/\s+/).filter(t => t.length > 1);
  const candidates = [];

  for (const cat of ['knowledge', 'shared']) {
    const dir = path.join(VAULT, cat);
    scanDir(dir, candidates, terms);
  }

  candidates.sort((a, b) => b.score - a.score);
  return candidates.slice(0, limit);
}

function listPages(limit = 30) {
  const pages = [];
  for (const cat of ['knowledge', 'shared']) {
    const dir = path.join(VAULT, cat);
    scanDirAll(dir, pages);
  }
  return pages.slice(0, limit);
}

function scanDirAll(dir, pages, depth = 0) {
  if (depth > 3 || !fs.existsSync(dir)) return;
  for (const file of fs.readdirSync(dir)) {
    const fullpath = path.join(dir, file);
    const stat = fs.statSync(fullpath);
    if (stat.isDirectory()) {
      scanDirAll(fullpath, pages, depth + 1);
    } else if (file.endsWith('.md')) {
      const relPath = path.relative(VAULT, fullpath);
      pages.push(relPath);
    }
  }
}

async function main() {
  const args = process.argv.slice(2);
  const limit = parseInt(args[args.length - 1]) || 30;
  const query = args.filter(a => !a.match(/^\d+$/)).join(' ');

  if (!query) {
    // 无查询词，列出页面
    const pages = listPages(limit);
    console.log(`📑 Wiki 页面 (${pages.length} 条):\n`);
    for (const p of pages) {
      console.log(`  - ${p}`);
    }
    return;
  }

  // 有查询词，搜索
  console.log(`🔍 搜索: "${query}"\n`);
  const pages = findPages(query, limit);
  if (pages.length === 0) {
    console.log('❌ 没有找到相关页面');
    return;
  }

  console.log(`📋 找到 ${pages.length} 个页面:\n`);
  for (const p of pages) {
    console.log(`  [${p.score}] ${p.path} — ${p.title}`);
  }
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});