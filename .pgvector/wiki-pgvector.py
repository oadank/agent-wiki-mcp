#!/usr/bin/env python3
"""
Wiki Vector Search - PostgreSQL + pgvector
用法:
  python3 wiki-pgvector.py build              # 重建向量索引
  python3 wiki-pgvector.py search "关键词" 5  # 搜索
  python3 wiki-pgvector.py clean              # 清理已删除页面
"""

import os
import sys
import json
import psycopg2
import requests
from pathlib import Path

# 配置
VAULT = os.environ.get("WIKI_VAULT_PATH", Path(__file__).parent.parent.resolve())
EMBED_URL = os.environ.get("EMBEDDING_URL", "http://localhost:11435/v1/embeddings")
MODEL = "bge-small-zh-v1.5"
DIMENSIONS = 512
BATCH_SIZE = 5  # 降低批次大小，避免 BGE 服务过载

# PostgreSQL 连接
PG_CONN = {
    "host": "localhost",
    "database": "postgres",
    "user": "postgres"
}

SKIP_DIRS = [".", "..", ".git", ".pgvector", "scripts", "_raw", "_meta",
             ".drafts", ".olw", "plan", "refactor", "mcp_server", "node_modules",
             "shared", ".pnpm-store"]


import time

def get_embedding(texts, retries=3):
    """调用 BGE embedding 服务，带重试"""
    payload = {
        "input": texts,
        "model": MODEL,
        "encoding_format": "float"
    }
    for attempt in range(retries):
        try:
            resp = requests.post(EMBED_URL, json=payload, timeout=300)
            resp.raise_for_status()
            data = resp.json().get("data", [])
            return [item["embedding"] for item in data]
        except Exception as e:
            if attempt < retries - 1:
                print(f"  ⚠️ embedding 失败 (尝试 {attempt+1}/{retries}): {e}")
                time.sleep(2)  # 等待 2 秒后重试
            else:
                raise


def collect_pages():
    """递归收集所有 .md 文件"""
    pages = []

    def scan_dir(dir_path, depth=0):
        if depth > 3:
            return
        for name in sorted(os.listdir(dir_path)):
            full_path = dir_path / name
            if not full_path.exists():
                continue
            if full_path.is_dir():
                if name in SKIP_DIRS or name.startswith("."):
                    continue
                scan_dir(full_path, depth + 1)
            elif name.endswith(".md"):
                try:
                    content = full_path.read_text(encoding="utf-8")
                    rel_path = str(full_path.relative_to(VAULT))
                    title, summary = extract_meta(content, name)
                    pages.append({
                        "path": rel_path,
                        "title": title,
                        "summary": summary,
                        "content": content[:3000],
                        "category": Path(rel_path).parent.parts[0] if "/" in rel_path else "root"
                    })
                except Exception as e:
                    print(f"  ⚠️ 读取失败: {full_path}: {e}")

    scan_dir(Path(VAULT))
    return pages


def extract_meta(content, filename):
    """提取 title 和 summary"""
    title = filename.replace(".md", "").replace("-", " ")
    summary = ""

    # 解析 frontmatter
    if content.startswith("---\n"):
        parts = content.split("---\n", 2)
        if len(parts) >= 3:
            fm = parts[1]
            for line in fm.split("\n"):
                if line.startswith("title:"):
                    title = line.split(":", 1)[1].strip().strip('"').strip("'")
                elif line.startswith("summary:"):
                    summary = line.split(":", 1)[1].strip().strip('"').strip("'")

    # 从内容提取
    if not title:
        for line in content.split("\n"):
            if line.startswith("# "):
                title = line[2:].strip()
                break

    return title, summary


def clean_nul(text):
    """过滤 NUL 字符"""
    return text.replace("\x00", "") if text else text


def build_index():
    """重建向量索引"""
    print("📄 收集页面...")
    pages = collect_pages()
    print(f"  收集到 {len(pages)} 个页面")

    conn = psycopg2.connect(**PG_CONN)
    cur = conn.cursor()

    # 清空旧数据
    cur.execute("TRUNCATE wiki_vectors")
    conn.commit()

    # 分批处理
    for i in range(0, len(pages), BATCH_SIZE):
        batch = pages[i:i + BATCH_SIZE]
        texts = [clean_nul(p["content"]) for p in batch]
        print(f"  进度: {i}/{len(pages)}")

        try:
            embeddings = get_embedding(texts)
        except Exception as e:
            print(f"  ⚠️ embedding 失败: {e}")
            continue

        for page, emb in zip(batch, embeddings):
            cur.execute("""
                INSERT INTO wiki_vectors (path, title, summary, content, embedding, category)
                VALUES (%s, %s, %s, %s, %s, %s)
            """, (page["path"], clean_nul(page["title"]), clean_nul(page["summary"]),
                  clean_nul(page["content"]), emb, page["category"]))

        conn.commit()

    cur.close()
    conn.close()
    print(f"✅ 向量库已重建: {len(pages)} 页")


def search(query, top_k=10):
    """向量搜索"""
    print(f"🔍 搜索: \"{query}\"")

    # 获取查询向量
    query_emb = get_embedding([query])[0]

    conn = psycopg2.connect(**PG_CONN)
    cur = conn.cursor()

    # cosine similarity 搜索
    cur.execute("""
        SELECT path, title, summary, category,
               1 - (embedding <=> %s::vector) as similarity
        FROM wiki_vectors
        ORDER BY embedding <=> %s::vector
        LIMIT %s
    """, (query_emb, query_emb, top_k))

    results = cur.fetchall()
    cur.close()
    conn.close()

    for i, (path, title, summary, category, sim) in enumerate(results, 1):
        print(f"\n[{i}] {path}")
        print(f"    标题: {title}")
        print(f"    分类: {category}")
        print(f"    相似度: {sim:.4f}")
        if summary:
            print(f"    摘要: {summary[:100]}...")

    print(f"\n--- 共 {len(results)} 条结果 ---")


def clean_deleted():
    """清理已删除的页面"""
    print("🧹 清理已删除页面...")

    conn = psycopg2.connect(**PG_CONN)
    cur = conn.cursor()

    cur.execute("SELECT path FROM wiki_vectors")
    db_paths = set(row[0] for row in cur.fetchall())

    deleted = []
    for path in db_paths:
        full_path = Path(VAULT) / path
        if not full_path.exists():
            deleted.append(path)
            cur.execute("DELETE FROM wiki_vectors WHERE path = %s", (path,))

    conn.commit()
    cur.close()
    conn.close()

    print(f"✅ 已清理 {len(deleted)} 条")
    for p in deleted:
        print(f"  - {p}")


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    cmd = sys.argv[1]

    if cmd == "build":
        build_index()
    elif cmd == "search":
        if len(sys.argv) < 3:
            print("用法: python3 wiki-pgvector.py search \"关键词\" [数量]")
            sys.exit(1)
        query = sys.argv[2]
        top_k = int(sys.argv[3]) if len(sys.argv) > 3 else 10
        search(query, top_k)
    elif cmd == "clean":
        clean_deleted()
    else:
        print(f"未知命令: {cmd}")
        print(__doc__)


if __name__ == "__main__":
    main()