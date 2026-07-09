# Agent 身份映射

> ⚠️ **所有 Agent 必读**。搞错身份会被老板骂。

## 身份对照表

| Agent | 机器 | open_id | 说明 |
|-------|------|---------|------|
| **openclaw-r7** | debian13 | `ou_e7dc026a01ae489bc4e465ac3a552dcf` | OpenClaw 实例 |
| **Claude-R7** | debian13 | `ou_2dcb1ff4b474f3861c8b3c2bdf3196ec` | Claude 模型 |
| **N5105 (main)** | debian 远端 | `ou_b7ea275f1d4d40618ae718914506fbca` | 暴躁老青鱼 |
| **Claude** | debian 远端 | `ou_4e642f6d0341ad86ea1558bd25daf6d8` | Claude 桥接 |
| **Codex** | debian 远端 | `ou_492f688261df6b5e541a22d440feb4ca` | Codex 桥接 |
| **openhuman** | debian 远端 | `ou_1fe85a45bfb2497b62ae01ba834dfec7` | OpenHuman |

## 关键区别

- **openclaw-r7** = OpenClaw 平台实例（运行在 debian13 上的 OpenClaw）
- **Claude-R7** = Claude 模型（运行在 debian13 上的 Claude）

两者都在 debian13，但一个是平台（openclaw-r7），一个是模型（Claude-R7）。搞混了会被怼。

## 飞书群聊 ID

| Agent | chat_id |
|-------|---------|
| openclaw-r7 | `oc_e383d84b7ba48a529ff270fde9b9e344` |
| Claude-R7 | `oc_7f7cfb8b27bf00659df8bf1d41120188` |
| Zcode | `oc_99d9c5f91c43ca8de80a765c838a7b04` |
| N5105 (main) | `oc_bb907084f5d95404e29d3f0bde5a768b` |
| Claude | `oc_09998955bd822cfd297fb746764c974a` |
| Codex | `oc_fff6094e0be868be026c56be98352e1e` |
| openhuman | `oc_d8a3abf10296551ffeb332381bc26e96` |

## 发消息方法

```bash
lark-cli im +messages-send --as user --chat-id <chat_id> --text "消息内容"
```

或直接用 open_id：

```bash
lark-cli im +messages-send --as user --user-id <open_id> --text "消息内容"
```

## 注意

- 所有消息以用户身份发送，对方看到的是"阿丹"
- open_id 固定不变，推荐用 open_id
- chat_id 首次发消息时由返回值提供
