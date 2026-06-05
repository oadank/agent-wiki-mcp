#!/usr/bin/env python3
"""
sync-official-docs.py: 从本地安装的 OpenClaw 官方文档同步到 wiki
只更新文档文件和 manifest，不更新向量数据
"""
import os
import sys
import json
import hashlib
import shutil
from datetime import datetime, timezone

OFFICIAL_DOCS = '/usr/lib/node_modules/openclaw/docs'
VAULT = '/opt/agent-wiki-mcp'
MANIFEST_PATH = os.path.join(VAULT, '.manifest.json')
LOG_PATH = os.path.join(VAULT, 'log.md')

# 官方 docs 子目录 → wiki 目录映射
DIR_MAP = {
    'gateway': 'gateway',
    'channels': 'channels',
    'concepts': 'concepts',
    'plugins': 'plugins',
    'providers': 'providers',
    'install': 'install',
    'automation': 'automation',
    'cli': 'gateway',  # cli docs → gateway
    'debug': 'gateway',
    'diagnostics': 'gateway',
    'clawhub': 'plugins',
    'help': 'gateway',
}

SUPPORTED_EXTS = ('.md',)

def sha256(filepath):
    with open(filepath, 'rb') as f:
        return 'sha256:' + hashlib.sha256(f.read()).hexdigest()

def load_manifest():
    if os.path.exists(MANIFEST_PATH):
        with open(MANIFEST_PATH, 'r') as f:
            return json.load(f)
    return {'version': '1.1.0', 'sources': {}}

def save_manifest(manifest):
    with open(MANIFEST_PATH, 'w') as f:
        json.dump(manifest, f, indent=2)

def append_log(operation, status, details):
    line = f'| {datetime.now(timezone.utc).isoformat()} | {operation} | {status} | {details} |'
    with open(LOG_PATH, 'a') as f:
        f.write('\n' + line)

def make_frontmatter(filename, wiki_category, source_path, existing_fm=None):
    """生成 frontmatter，保留已有的 title 等"""
    title = filename.replace('.md', '').replace('-', ' ').replace('_', ' ').title()
    if existing_fm and 'title' in existing_fm:
        title = existing_fm['title']
    
    lines = [
        '---',
        f'title: "{title}"',
        f'category: {wiki_category}',
        f'sources:',
        f'  - "{source_path}"',
        f'tags: [{wiki_category.lower()}]',
        f'sourceType: document',
        f'certainty: high',
        f'status: active',
        f'syncedAt: {datetime.now(timezone.utc).isoformat()}',
        '---',
    ]
    return '\n'.join(lines) + '\n\n'

def parse_existing_frontmatter(content):
    """解析已有的 frontmatter"""
    if not content.startswith('---'):
        return {}, content
    end = content.find('---', 3)
    if end == -1:
        return {}, content
    fm_text = content[3:end]
    body = content[end+3:].lstrip('\n')
    fm = {}
    for line in fm_text.split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            fm[key.strip()] = val.strip().strip('"')
    return fm, body

def sync_docs():
    manifest = load_manifest()
    sources = manifest.get('sources', {})
    
    stats = {'updated': 0, 'added': 0, 'skipped': 0, 'errors': 0}
    
    for dirpath, dirnames, filenames in os.walk(OFFICIAL_DOCS):
        # 确定 wiki 分类
        rel = os.path.relpath(dirpath, OFFICIAL_DOCS)
        if rel == '.':
            wiki_category = 'gateway'  # 顶层文档归 gateway
        else:
            top_dir = rel.split('/')[0]
            wiki_category = DIR_MAP.get(top_dir, 'references')
        
        for filename in filenames:
            if not filename.endswith(SUPPORTED_EXTS):
                continue
            
            src_path = os.path.join(dirpath, filename)
            src_hash = sha256(src_path)
            
            # 目标路径
            wiki_subdir = DIR_MAP.get(rel.split('/')[0] if rel != '.' else '', 'references') if rel != '.' else 'gateway'
            if rel != '.':
                parts = rel.split('/')
                wiki_subdir = DIR_MAP.get(parts[0], 'references')
            else:
                wiki_subdir = 'gateway'
            
            dst_dir = os.path.join(VAULT, wiki_subdir)
            os.makedirs(dst_dir, exist_ok=True)
            dst_path = os.path.join(dst_dir, filename)
            
            # 检查是否已存在且未变更
            manifest_key = src_path
            if manifest_key in sources and sources[manifest_key].get('contentHash') == src_hash:
                stats['skipped'] += 1
                continue
            
            try:
                # 读取源文件
                with open(src_path, 'r', encoding='utf-8', errors='ignore') as f:
                    new_content = f.read()
                
                # 如果目标已存在，保留已有 title
                existing_fm = {}
                old_content = ''
                if os.path.exists(dst_path):
                    with open(dst_path, 'r', encoding='utf-8', errors='ignore') as f:
                        old_content = f.read()
                    existing_fm, _ = parse_existing_frontmatter(old_content)
                
                # 生成新的 frontmatter + 正文
                new_source_path = src_path
                frontmatter = make_frontmatter(filename, wiki_category, new_source_path, existing_fm)
                final_content = frontmatter + new_content
                
                # 写入
                with open(dst_path, 'w', encoding='utf-8') as f:
                    f.write(final_content)
                
                # 更新 manifest
                sources[manifest_key] = {
                    'contentHash': src_hash,
                    'wikiPath': f'{wiki_subdir}/{filename}',
                    'syncedAt': datetime.now(timezone.utc).isoformat(),
                    'version': '2026.6.1',
                }
                
                if os.path.exists(dst_path) and old_content != final_content:
                    stats['updated'] += 1
                    append_log('sync-docs', '✅', f'更新: {wiki_subdir}/{filename}')
                    print(f'📝 更新: {wiki_subdir}/{filename}')
                else:
                    stats['added'] += 1
                    append_log('sync-docs', '✅', f'新增: {wiki_subdir}/{filename}')
                    print(f'🆕 新增: {wiki_subdir}/{filename}')
                    
            except Exception as e:
                stats['errors'] += 1
                print(f'❌ 错误: {filename} - {e}')
    
    # 保存 manifest
    manifest['sources'] = sources
    manifest['lastSync'] = datetime.now(timezone.utc).isoformat()
    manifest['syncVersion'] = '2026.6.1'
    save_manifest(manifest)
    
    print(f'\n📊 同步完成:')
    print(f'   新增: {stats["added"]}')
    print(f'   更新: {stats["updated"]}')
    print(f'   跳过: {stats["skipped"]}')
    print(f'   错误: {stats["errors"]}')
    print(f'   向量: 跳过（手动更新）')
    
    return stats

if __name__ == '__main__':
    sync_docs()
