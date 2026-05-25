---
title: "VNC 远程桌面 + cc-haha 桌面端配置"
category: shared
date: 2026-05-16 00:42
tags: ["VNC","XFCE","cc-haha","远程桌面","N5105"]
---

> **TL;DR** VNC 远程桌面 + cc-haha 桌面端配置


sourceType: document
certainty: fact
status: active# VNC 远程桌面 + cc-haha 桌面端配置

## VNC 远程桌面配置

**Tailscale IP**: 100.110.110.12
**VNC 端口**: 5901
**VNC 密码**: vnc2025

**管理命令**:
- `vncserver -list` — 查看会话
- `vncserver -kill :1` — 停止 VNC
- `vncserver :1 -localhost no` — 启动（允许远程）

**客户端**: TigerVNC Viewer 或 TightVNC（Windows），RealVNC Viewer 兼容性有问题

## cc-haha 桌面端

**版本**: v0.2.6
**安装路径**: `/usr/lib/Claude Code Haha`
**可执行文件**: `/usr/bin/claude-code-desktop`

Linux x64 .deb 安装包下载：
https://github.com/NanmiCoder/cc-haha/releases/download/v0.2.6/Claude-Code-Haha_0.2.6_linux_x64_deb.deb

## 依赖安装

XFCE + VNC 需要的包：
- `xfce4 xfce4-goodies lightdm` — 桌面环境
- `tigervnc-standalone-server tigervnc-common` — VNC 服务
- `dbus-x11` — **必须**，否则 XFCE 无法正常启动
- `libayatana-appindicator3-1 libwebkit2gtk-4.1-0` — cc-haha 桌面端依赖

## xstartup 脚本

`~/.vnc/xstartup` 内容：
```bash
#!/bin/bash
unset SESSION_MANAGER
unset DBUS_SESSION_BUS_ADDRESS
export XKL_XMODMAP_DISABLE=1
startxfce4 &
while true; do sleep 3600; done
```

保持 VNC 不随 XFCE 会话退出而关闭。
