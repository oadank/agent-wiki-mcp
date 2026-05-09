#!/usr/bin/env python3
"""
Wiki Vector Search - PostgreSQL + pgvector (N5105 优化版)
用法:
  python3 wiki-pgvector.py build              # 重建向量索引（延迟索引策略）
  python3 wiki-pgvector.py search "关键词" 5  # 搜索
  python3 wiki-pgvector.py clean              # 清理已删除页面
"""

import os
import sys
import time
import psycopg2
import requests
from pathlib import Path

# 配置
VAULT = os.environ.get("WIKI_VAULT_PATH", Path(__file__).parent.parent.resolve())
EMBED_URL = os.environ.get("EMBEDDING_URL", "http://localhost:11435/v1/embeddings")
MODEL = "bge-small-zh-v1.5"
DIMENSIONS = 512
BATCH_SIZE = 10       # 每批处理数量
BATCH_DELAY = 5       # 每批后等待秒数（给系统呼吸）
EMBED_DELAY = 1       # 每次embedding后等待秒数

# PostgreSQL 连接
PG_CONN = {
    "host": "localhost",
    "database": "postgres",
    "user": "postgres"
}

SKIP_DIRS = [".", "..", ".git", ".pgvector", "scripts", "_raw", "_meta",
             ".drafts", ".olw", "plan", "refactor", "mcp_server", "node_modules",
             "shared", ".pnpm-store"]


def get_embedding(texts, retries=3):
    """调用 BGE embedding 服务，带重试和延迟"""
    payload = {
        "input": texts,
        "model": MODEL,
        "encoding_format": "float"
    }
    for attempt in range(retries):
        try:
            resp = requests.post(EMBED_URL, json=payload, timeout=120)
            resp.raise_for_status()
            data = resp.json().get("data", [])
            time.sleep(EMBED_DELAY)  # 请求后等待
            return [item["embedding"] for item in data]
        except Exception as e:
            if attempt < retries - 1:
                print(f"  ⚠️ embedding 失败 (尝试 {attempt+1}/{retries}): {e}")
                time.sleep(5)  # 失败后等待更长
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

    if content.startswith("---\n"):
        parts = content.split("---\n", 2)
        if len(parts) >= 3:
            fm = parts[1]
            for line in fm.split("\n"):
                if line.startswith("title:"):
                    title = line.split(":", 1)[1].strip().strip('"').strip("'")
                elif line.startswith("summary:"):
                    summary = line.split(":", 1)[1].strip().strip('"').strip("'")

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
    """重建向量索引（延迟索引策略，避免 N5105 卡死）"""
    print("📄 收集页面...")
    pages = collect_pages()
    total = len(pages)
    print(f"  收集到 {total} 个页面")

    conn = psycopg2.connect(**PG_CONN)
    cur = conn.cursor()

    # ========== 延迟索引策略 ==========
    # 1. 删除 HNSW 索引（入库时不更新索引）
    print("🗑️ 删除旧索引...")
    cur.execute("DROP INDEX IF EXISTS wiki_embedding_idx")
    conn.commit()

    # 2. 清空旧数据
    cur.execute("TRUNCATE wiki_vectors")
    conn.commit()

    # 3. 批量插入数据（无索引压力）
    print("📦 批量入库...")
    success = 0
    failed = 0
    start_time = time.time()

    for i in range(0, total, BATCH_SIZE):
        batch = pages[i:i + BATCH_SIZE]
        texts = [clean_nul(p["content"]) for p in batch]

        # 进度显示
        elapsed = time.time() - start_time
        rate = success / elapsed if elapsed > 0 else 0
        eta = (total - i) / rate / 60 if rate > 0 else 0
        print(f"  进度: {i}/{total} ({i*100//total}%) | 成功: {success} | ETA: {eta:.1f}分钟")

        try:
            embeddings = get_embedding(texts)
        except Exception as e:
            print(f"  ⚠️ embedding 批次失败: {e}")
            failed += len(batch)
            continue

        for page, emb in zip(batch, embeddings):
            try:
                cur.execute("""
                    INSERT INTO wiki_vectors (path, title, summary, content, embedding, category)
                    VALUES (%s, %s, %s, %s, %s, %s)
                """, (page["path"], clean_nul(page["title"]), clean_nul(page["summary"]),
                      clean_nul(page["content"]), emb, page["category"]))
                success += 1
            except Exception as e:
                print(f"  ⚠️ INSERT 失败: {page['path']}: {e}")
                failed += 1

        conn.commit()
        time.sleep(BATCH_DELAY)  # 每批后等待，给系统呼吸

    # 4. 重建 HNSW 索引（一次性）
    print("🔧 重建 HNSW 索引...")
    cur.execute("CREATE INDEX wiki_embedding_idx ON wiki_vectors USING hnsw (embedding vector_cosine_ops)")
    conn.commit()

    cur.close()
    conn.close()

    elapsed = time.time() - start_time
    print(f"✅ 向量库已重建: {success} 页 (失败 {failed}) | 耗时 {elapsed/60:.1f} 分钟")


def search(query, top_k=10):
    """向量搜索"""
    print(f"🔍 搜索: \"{query}\"")

    query_emb = get_embedding([query])[0]

    conn = psycopg2.connect(**PG_CONN)
    cur = conn.cursor()

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