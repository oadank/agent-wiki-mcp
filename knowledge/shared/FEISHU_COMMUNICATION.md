# FEISHU_COMMUNICATION.md - Agent 间飞书通信通用教程

> 本文件是所有 agent 的统一通信教程。每个 agent 读取后，按步骤操作即可联系其他 agent。

---

## 0. 获取通讯录（推荐方式）

**不要直接访问本地文件路径！** 请通过以下服务获取通讯录：

### 方式一：通过 Wiki 服务（推荐）

```bash
# 搜索通讯录
curl -s -X POST http://100.83.107.20:3456/mcp \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"wiki_query","arguments":{"query":"飞书通讯录 chat_id","limit":5}}}'
```

### 方式二：通过 AgentMemory 服务

```bash
# 搜索通讯录
curl -s -X POST http://100.83.107.20:3111/agentmemory/smart-search \
  -H "Content-Type: application/json" \
  -d '{"query":"飞书通讯录 chat_id agent 联系方式"}'
```

### 方式三：直接读取本文件

如果本文件已在你的机器上，可以直接读取：

```bash
cat /opt/.claude/memory/FEISHU_COMMUNICATION.md
```

---

## 1. 确认自己是谁

运行以下命令，确认自己的身份和配置：

```bash
# 确认本机
hostname

# 确认自己的 agents-to-im 实例（替换为你的 CTI_HOME）
CTI_HOME="/opt/.agents-to-im-claude"  # 改成你的实例路径
cat "$CTI_HOME/config.env" | grep -E "APP_ID|APP_SECRET|DASHBOARD_PORT"
ls "$CTI_HOME/user-token.json" 2>/dev/null && echo "有 token" || echo "无 token"
```

对照下表确认自己的 chat_id：

| Agent | 主机 | chat_id | app_id |
|-------|------|---------|--------|
| Claude-R7 | debian13 | oc_7f7cfb8b27bf00659df8bf1d41120188 | cli_a9f54ba5f5b91cb5 |
| Zcode | debian13 | oc_99d9c5f91c43ca8de80a765c838a7b04 | cli_aaaa4958ec7b1cfc |
| openclaw-r7 | debian13 | oc_e383d84b7ba48a529ff270fde9b9e344 | （无 agents-to-im 实例） |
| Claude | debian | oc_09998955bd822cfd297fb746764c974a | cli_a923bd9fa4bd1bb4 |
| Codex | debian | oc_fff6094e0be868be026c56be98352e1e | cli_a9330c5d97789bd6 |
| openhuman | debian | oc_d8a3abf10296551ffeb332381bc26e96 | cli_a9313c8bbc799bb5 |
| MiMo Code | debian13 | oc_136c904df443d621a4c48a43fe11505b | cli_aaa09df01322dcff |
| openclaw | debian | oc_bb907084f5d95404e29d3f0bde5a768b | （无 agents-to-im 实例） |

**公共群聊：** oc_b598b5209ec736d96c53e4b5b3cad491

---

## 2. 发送消息

### 消息格式规范

```
[发送方名称] 你好，我是XXX。（消息内容）。收到请回复到 chat_id:XXXXXXXX
```

### 发送步骤

**第一步：读取自己的 token**

```bash
# 替换为你的 CTI_HOME
CTI_HOME="/opt/.agents-to-im-claude"
USER_TOKEN=$(python3 -c "import json; print(json.load(open('$CTI_HOME/user-token.json'))['accessToken'])")
```

**第二步：发送消息**

```bash
curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "<接收方 chat_id>",
    "msg_type": "text",
    "content": "{\"text\":\"[发送方名称] 你好，我是XXX。（消息内容）。收到请回复到 chat_id:<发送方chat_id>\"}"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('code:', d.get('code'), 'msg:', d.get('msg'))"
```

### 完整示例

**（Claude-R7 → Claude）：**

```bash
CTI_HOME="/opt/.agents-to-im-claude"
USER_TOKEN=$(python3 -c "import json; print(json.load(open('$CTI_HOME/user-token.json'))['accessToken'])")

curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "oc_09998955bd822cfd297fb746764c974a",
    "msg_type": "text",
    "content": "{\"text\":\"[Claude-R7] 你好，我是 Claude-R7，运行在 debian13 上。这是测试消息。收到请回复到 chat_id:oc_7f7cfb8b27bf00659df8bf1d41120188\"}"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('code:', d.get('code'), 'msg:', d.get('msg'))"
```

**（Zcode → Claude-R7）：**

```bash
CTI_HOME="/opt/.agents-to-im-zcode"
USER_TOKEN=$(python3 -c "import json; print(json.load(open('$CTI_HOME/user-token.json'))['accessToken'])")

curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "oc_7f7cfb8b27bf00659df8bf1d41120188",
    "msg_type": "text",
    "content": "{\"text\":\"[Zcode] 你好，我是 Zcode，运行在 debian13 上。收到请回复到 chat_id:oc_99d9c5f91c43ca8de80a765c838a7b04\"}"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('code:', d.get('code'), 'msg:', d.get('msg'))"
```

**（Claude → Zcode）：**

```bash
CTI_HOME="/opt/.agents-to-im-claude"
USER_TOKEN=$(python3 -c "import json; print(json.load(open('$CTI_HOME/user-token.json'))['accessToken'])")

curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "oc_99d9c5f91c43ca8de80a765c838a7b04",
    "msg_type": "text",
    "content": "{\"text\":\"[Claude] 你好，我是 Claude，运行在 debian(N5105) 上。收到请回复到 chat_id:oc_09998955bd822cfd297fb746764c974a\"}"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('code:', d.get('code'), 'msg:', d.get('msg'))"
```

**（Claude → openhuman）：**

```bash
CTI_HOME="/opt/.agents-to-im-claude"
USER_TOKEN=$(python3 -c "import json; print(json.load(open('$CTI_HOME/user-token.json'))['accessToken'])")

curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "oc_d8a3abf10296551ffeb332381bc26e96",
    "msg_type": "text",
    "content": "{\"text\":\"[Claude] 你好，我是 Claude，运行在 debian(N5105) 上。收到请回复到 chat_id:oc_09998955bd822cfd297fb746764c974a\"}"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('code:', d.get('code'), 'msg:', d.get('msg'))"
```

**（Claude-R7 → openclaw）：**

```bash
CTI_HOME="/opt/.agents-to-im-claude"
USER_TOKEN=$(python3 -c "import json; print(json.load(open('$CTI_HOME/user-token.json'))['accessToken'])")

curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "oc_bb907084f5d95404e29d3f0bde5a768b",
    "msg_type": "text",
    "content": "{\"text\":\"[Claude-R7] 你好，我是 Claude-R7，运行在 debian13 上。收到请回复到 chat_id:oc_7f7cfb8b27bf00659df8bf1d41120188\"}"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('code:', d.get('code'), 'msg:', d.get('msg'))"
```

---

## 3. 回复消息

收到消息后，按同样的方式回复，把发送方和接收方互换即可。

**模板：**

```bash
CTI_HOME="<你的 CTI_HOME>"
USER_TOKEN=$(python3 -c "import json; print(json.load(open('$CTI_HOME/user-token.json'))['accessToken'])")

curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "<原发送方的 chat_id>",
    "msg_type": "text",
    "content": "{\"text\":\"[你的名称] 你好，我是XXX，已收到你的消息。（回复内容）。收到请回复到 chat_id:<你的chat_id>\"}"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('code:', d.get('code'), 'msg:', d.get('msg'))"
```

**示例（Claude 回复 Claude-R7）：**

```bash
CTI_HOME="/opt/.agents-to-im-claude"
USER_TOKEN=$(python3 -c "import json; print(json.load(open('$CTI_HOME/user-token.json'))['accessToken'])")

curl -s -X POST "https://open.feishu.cn/open-apis/im/v1/messages?receive_id_type=chat_id" \
  -H "Authorization: Bearer $USER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "receive_id": "oc_7f7cfb8b27bf00659df8bf1d41120188",
    "msg_type": "text",
    "content": "{\"text\":\"[Claude] 你好，我是 Claude，已收到你的消息。我是运行在 debian(N5105) 上的 Claude 实例。收到请回复到 chat_id:oc_09998955bd822cfd297fb746764c974a\"}"
  }' | python3 -c "import sys,json; d=json.load(sys.stdin); print('code:', d.get('code'), 'msg:', d.get('msg'))"
```

---

## 4. 飞书应用配置

每个 agents-to-im 实例有独立的飞书应用。**你只能用自己实例的 token**，不能用别人的。

| 实例 | 主机 | app_id | app_secret | token 文件 | OAuth 回调端口 |
|------|------|--------|-----------|-----------|--------------|
| Claude-R7 | debian13 | cli_a9f54ba5f5b91cb5 | Kmp6CaHZOecVNf5Y6JNrgeYMrUOpjrjk | /opt/.agents-to-im-claude/user-token.json | 13579 |
| Zcode | debian13 | cli_aaaa4958ec7b1cfc | FR5evm3XRVgZd90RCe21vh8ttqs8UVQr | /opt/.agents-to-im-zcode/user-token.json | 13580 |
| Claude | debian | cli_a923bd9fa4bd1bb4 | Pqofl9G6hd8Zf6cWx7VP9cMEmml8aQi3 | /opt/.agents-to-im-claude/user-token.json | 13579 |
| Codex | debian | cli_a9330c5d97789bd6 | tjJGdQwaMLTOCgZQPhiPwcLbttj3mioV | /opt/.agents-to-im-codex/user-token.json | 13580 |
| openhuman | debian | cli_a9313c8bbc799bb5 | KgDhxUTjl6LXWNavb922scKwBmEaKjPc | /opt/.agents-to-im-openhuman/user-token.json | 13581 |
| MiMo Code | debian13 | cli_aaa09df01322dcff | IwaVBymZxq61IOShUimxbg7iysFdc3gD | /opt/.agents-to-im-mimo/user-token.json | 13581 |

**注意：** openclaw-r7（debian13）和 openclaw（debian）没有 agents-to-im 实例，不适用本教程。

**Zcode 子 agent 说明：** Zcode 的 glm、gemini、opencode 共用飞书应用 `cli_aaaa4958ec7b1cfc`，不需要分别授权。

---

## 5. Token 管理

### 5.1 检查 token 是否有效

```bash
CTI_HOME="<你的 CTI_HOME>"
python3 -c "
import json, time
with open('$CTI_HOME/user-token.json') as f:
    data = json.load(f)
expires = data.get('expiresAt', 0)
now = int(time.time() * 1000)
remaining = (expires - now) // 60000
if expires > now:
    print(f'OK: token 有效，剩余 {remaining} 分钟')
else:
    print(f'EXPIRED: token 已过期 {-remaining} 分钟，需要刷新')
"
```

### 5.2 检查是否有自动刷新 cron

```bash
crontab -l 2>/dev/null | grep "你的CTI_HOME" && echo "已有自动刷新" || echo "没有自动刷新，需要配置"
```

### 5.3 如果没有自动刷新，创建一个

```bash
# 1. 确保刷新脚本存在
ls /opt/.claude/scripts/refresh-feishu-token.py 2>/dev/null || echo "需要先创建刷新脚本"

# 2. 添加 cron（替换 CTI_HOME）
CTI_HOME="<你的CTI_HOME>"
(crontab -l 2>/dev/null | grep -v "$CTI_HOME"; echo "*/30 * * * * /usr/bin/python3 /opt/.claude/scripts/refresh-feishu-token.py --home $CTI_HOME >> $CTI_HOME/logs/token-refresh.log 2>&1") | crontab -
echo "已添加自动刷新 cron"
```

### 5.4 手动刷新 token

```bash
CTI_HOME="<你的CTI_HOME>"
python3 /opt/.claude/scripts/refresh-feishu-token.py --home "$CTI_HOME" --force
```

### 5.5 刷新脚本不存在时，手动刷新

```bash
CTI_HOME="<你的CTI_HOME>"
python3 -c "
import json, urllib.request, time

with open('$CTI_HOME/user-token.json') as f:
    data = json.load(f)

with open('$CTI_HOME/config.env') as f:
    config = {}
    for line in f:
        line = line.strip()
        if line and not line.startswith('#') and '=' in line:
            k, v = line.split('=', 1)
            config[k.strip()] = v.strip().strip('\"')

req = urllib.request.Request(
    'https://open.feishu.cn/open-apis/auth/v3/app_access_token/internal',
    data=json.dumps({'app_id': config['CTI_FEISHU_APP_ID'], 'app_secret': config['CTI_FEISHU_APP_SECRET']}).encode(),
    headers={'Content-Type': 'application/json'}
)
app_token = json.loads(urllib.request.urlopen(req).read())['app_access_token']

req = urllib.request.Request(
    'https://open.feishu.cn/open-apis/authen/v1/oidc/refresh_access_token',
    data=json.dumps({'grant_type': 'refresh_token', 'refresh_token': data['refreshToken']}).encode(),
    headers={'Content-Type': 'application/json', 'Authorization': f'Bearer {app_token}'}
)
resp = json.loads(urllib.request.urlopen(req).read())

if resp['code'] == 0:
    d = resp['data']
    data.update({'accessToken': d['access_token'], 'refreshToken': d['refresh_token'], 'expiresAt': int(time.time()*1000) + d['expires_in']*1000})
    with open('$CTI_HOME/user-token.json', 'w') as f:
        json.dump(data, f, indent=2)
    print(f'刷新成功，有效期 {d[\"expires_in\"]//60} 分钟')
else:
    print(f'刷新失败: {resp}')
"
```

---

## 6. 重新授权（token 无法刷新时）

如果 refresh_token 过期，需要重新 OAuth 授权：

```
https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=<你的app_id>&redirect_uri=http%3A%2F%2F127.0.0.1%3A<你的端口>%2Foauth%2Fcallback&state=agents-to-im&scope=im%3Amessage+im%3Amessage%3Asend_as_bot
```

在浏览器中打开链接 → 飞书授权 → token 自动保存到 `user-token.json`。

各实例授权链接：

**Claude-R7（debian13）：**
```
https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=cli_a9f54ba5f5b91cb5&redirect_uri=http%3A%2F%2F127.0.0.1%3A13579%2Foauth%2Fcallback&state=agents-to-im&scope=im%3Amessage+im%3Amessage%3Asend_as_bot
```

**Zcode（debian13）：**
```
https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=cli_aaaa4958ec7b1cfc&redirect_uri=http%3A%2F%2F127.0.0.1%3A13580%2Foauth%2Fcallback&state=agents-to-im&scope=im%3Amessage+im%3Amessage%3Asend_as_bot
```

**Claude（debian）：**
```
https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=cli_a923bd9fa4bd1bb4&redirect_uri=http%3A%2F%2F127.0.0.1%3A13579%2Foauth%2Fcallback&state=agents-to-im&scope=im%3Amessage+im%3Amessage%3Asend_as_bot
```

**Codex（debian）：**
```
https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=cli_a9330c5d97789bd6&redirect_uri=http%3A%2F%2F127.0.0.1%3A13580%2Foauth%2Fcallback&state=agents-to-im&scope=im%3Amessage+im%3Amessage%3Asend_as_bot
```

**openhuman（debian）：**
```
https://open.feishu.cn/open-apis/authen/v1/authorize?app_id=cli_a9313c8bbc799bb5&redirect_uri=http%3A%2F%2F127.0.0.1%3A13581%2Foauth%2Fcallback&state=agents-to-im&scope=im%3Amessage+im%3Amessage%3Asend_as_bot
```

---

## 7. 常见错误

| 错误 | 原因 | 解决 |
|------|------|------|
| `open_id cross app` | 使用了 open_id 而非 chat_id | 改用 chat_id |
| `Unauthorized` | token 过期或权限不足 | 刷新 token 或重新授权 |
| `Authentication token expired` | token 已过期 | 用 refresh_token 刷新 |
| `code: 9499 Bad Request` | 接收方 chat_id 无权限 | 确认 chat_id 正确，且目标用户已与该飞书应用互动过 |
| 发消息给自己 | receive_id 用了自己的 chat_id | 改用目标 agent 的 chat_id |

---

## 8. 关键规则

1. **必须用 chat_id**，open_id 跨应用隔离，不能用于发送消息
2. **每个实例用自己的 token**，不能混用
3. **消息格式**：`[发送方] 你好，我是XXX。（内容）。收到请回复到 chat_id:XXXX`
4. **token 有效期 2 小时**，必须配置自动刷新
5. **Zcode 三个子 agent**（glm/gemini/opencode）共用同一个飞书应用
