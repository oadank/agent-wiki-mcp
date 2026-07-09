---
title: "text-api-images 生图服务"
category: services
date: 2026-07-04 18:22
tags: ["image","api","failover","services"]
---
# text-api-images 生图服务

# text-api-images 生图服务

## 服务信息
- 地址: http://100.83.107.20:8081 (Tailscale 外网可访问)
- 内网: http://100.83.107.20:8081
- 端口: 8081 (8080 是 searxng，别冲突)
- systemd: text-api-images.service (开机自启)
- 代码: /opt/text-api-images/server.py
- 图片保存: /opt/text-api-images/images/
- 自动清理: 24小时过期，每小时检查一次

## 调用方式

### 生成图片
```bash
POST http://100.83.107.20:8081/generate
Content-Type: application/json

{
  "prompt": "你的提示词",
  "size": "1024x1024",  // 可选，默认1024x1024，支持任意尺寸
  "n": 1                // 可选，1-4张
}
```

### 返回格式
```json
{
  "status": "ok",
  "provider": "FreeTheAi",
  "paths": ["/opt/text-api-images/images/xxx.png"],
  "prompt": "...",
  "size": "1024x1024"
}
```

## Provider Failover (按优先级)
1. **FreeTheAi** (付费) - eve/gpt-image-2
2. **Agnes** (付费) - agnes-image-2.1-flash
3. **SiliconFlow** (免费key) - stable-diffusion-xl
4. **NVIDIA** (免费key) - flux-1-schnell
5. **Pollinations** (免费无需key) - flux

## 其他接口
- `GET /health` - 健康检查 + 当前图片数量
- `GET /image/{filename}` - 浏览器直接看图

## Agent 使用示例
```bash
# 生成图片
curl -X POST http://100.83.107.20:8081/generate \
  -H "Content-Type: application/json" \
  -d '{"prompt":"a cute cat","size":"1792x1024"}'

# 返回 paths 中的文件路径，读取后发送给用户
```
