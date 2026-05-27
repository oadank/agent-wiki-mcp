# agents-to-im Git 分支策略

## 分支对应

| 实例 | 配置目录 | Git 分支 | 环境变量 |
|------|----------|----------|----------|
| OpenHuman | `/opt/.agents-to-im-openhuman` | `openhuman` | `CTI_GIT_BRANCH=openhuman` |
| Claude | `/opt/.agents-to-im-claude` | `claude` | `CTI_GIT_BRANCH=claude` |
| Codex | `/opt/.agents-to-im-codex` | `codex` | `CTI_GIT_BRANCH=codex` |

## 推送规则

**步骤**：
1. 确定当前操作的实例（看配置目录或 `CTI_DEFAULT_RUNTIME`）
2. 读取对应的 `CTI_GIT_BRANCH` 变量
3. 切换到对应分支并推送

**命令**：
```bash
cd /opt/agents-to-im

# 确定分支（根据当前实例的环境变量）
BRANCH=$(grep CTI_GIT_BRANCH /opt/.agents-to-im-openhuman/config.env | cut -d= -f2)
# 或
BRANCH=${CTI_GIT_BRANCH:-my-changes}

# 切换并推送
git checkout $BRANCH
git add -A
git commit -m "your message"
git push origin $BRANCH
```

## 通用修改

如果修改影响所有实例（如通用 bugfix），推送到 `my-changes`：
```bash
git checkout my-changes
git push origin my-changes
```

然后同步到其他分支：
```bash
git checkout openhuman && git merge my-changes && git push origin openhuman
git checkout claude && git merge my-changes && git push origin claude
git checkout codex && git merge my-changes && git push origin codex
```

## 仓库地址

https://github.com/oadank/agents-to-im
