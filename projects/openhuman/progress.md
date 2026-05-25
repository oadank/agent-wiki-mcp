---
title: "OpenHuman 项目信息"
category: projects/openhuman
tags: [openhuman, desktop, server]
status: active
updated: 2026-05-23
---

# OpenHuman 项目信息

## 基本信息

| 项目 | 内容 |
|------|------|
| **项目名** | OpenHuman |
| **仓库** | https://github.com/AusAgentSmith/openhuman（修改版） |
| **本地源码** | `/opt/openhuman/` |
| **Core 二进制** | `/usr/local/bin/openhuman-core` |
| **运行时数据** | `/root/.openhuman/` |
| **飞书桥接** | `/opt/.agents-to-im-openhuman/` |
| **服务管理** | `systemctl start openhuman openhuman-web` |

## 服务组件

| 服务 | 端口 | 说明 |
|------|------|------|
| openhuman-core | 7788 | Core RPC 服务 |
| openhuman-web | — | Web SPA 前端 |
| openhuman-feishu-bridge | — | 飞书桥接 |

## 关键配置文件

| 文件 | 作用 |
|------|------|
| `/root/.openhuman/.env` | 环境变量（token、端口） |
| `/root/.openhuman/users/<uid>/config.toml` | 主配置文件 |
| `/root/.openhuman/users/<uid>/workspace/state/app-state.json` | 工具启用状态 |
| `/opt/openhuman/app/dist-web/` | Web SPA 静态文件 |
| `/opt/.agents-to-im-openhuman/config.env` | 飞书桥接配置 |
| `/opt/.agents-to-im-openhuman/bridge.py` | 飞书桥接脚本 |

## System Tray 参考代码（PyQt5）

> 文件已删除（2026-05-23），留此记录供将来参考。
> 原始路径：`/opt/openhuman-system-tray.py`

功能：系统托盘图标管理 OpenHuman 桌面版后台运行，支持启动/停止/状态检查。

```python
#!/usr/bin/env python3
"""
OpenHuman System Tray Application
Provides a system tray icon to manage the OpenHuman desktop application
so it can run in the background even when the window is closed.
"""
import sys, subprocess, signal, os, tempfile, threading, time
from PyQt5.QtWidgets import QApplication, QSystemTrayIcon, QMenu, QAction, QMessageBox
from PyQt5.QtGui import QIcon, QPixmap
from PyQt5.QtCore import QTimer, QObject, pyqtSignal

class OpenHumanManager(QObject):
    process_started = pyqtSignal()
    process_stopped = pyqtSignal()
    def __init__(self):
        super().__init__()
        self.process = None
        self.is_running = False
    def start_openhuman(self):
        if self.is_running and self.process and self.process.poll() is None:
            return True
        try:
            env = os.environ.copy()
            env['DISPLAY'] = ':0'
            env['XAUTHORITY'] = '/root/.Xauthority'
            env['OPENHUMAN_OLLAMA_BASE_URL'] = 'http://127.0.0.1:11434'
            self.process = subprocess.Popen([
                '/usr/bin/OpenHuman',
                '--enable-features=UseOzonePlatform',
                '--ozone-platform=x11', '--no-sandbox'
            ], env=env)
            self.is_running = True
            self.process_started.emit()
            return True
        except Exception as e:
            print(f"Failed to start OpenHuman: {e}")
            return False
    def stop_openhuman(self):
        if self.process and self.process.poll() is None:
            try:
                self.process.terminate()
                try: self.process.wait(timeout=5)
                except subprocess.TimeoutExpired: self.process.kill()
                self.is_running = False
                self.process_stopped.emit()
                return True
            except Exception as e:
                print(f"Failed to stop OpenHuman: {e}")
                return False
        else:
            self.is_running = False
            return True
    def check_status(self):
        if self.process: self.is_running = self.process.poll() is None
        else: self.is_running = False
        return self.is_running

# 完整代码约 230 行，包含：托盘图标、右键菜单、自动启动、5s 状态轮询、
# 双击显示、退出确认对话框。
# 依赖：PyQt5
```

## 历史变更

| 日期 | 变更 |
|------|------|
| 2026-05-23 | 模型组从 chat-v1 改为 codex-model |
| 2026-05-23 | 删除 system-tray.py，内容归档到此 |
