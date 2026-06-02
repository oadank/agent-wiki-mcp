# Debian 13 远程桌面终极方案 (XRDP + NoVNC + LightDM AutoLogin)

## 核心架构
**目标**：开机即用，RDP/NoVNC 双通道稳定，彻底解决 XRDP `no ip set` 报错。
**策略**：放弃 XRDP 创建原生 Xorg 会话（不稳定），改为 **XRDP 代理 VNC 模式**。

### 链路流向
1.  **开机**：LightDM 自动登录 `root`，抢占 `:0` 并启动 XFCE 桌面。
2.  **抓屏**：`x11vnc` 启动，绑定 `:0`，将画面输出到 `localhost:5900`。
3.  **接入**：
    - **NoVNC**：浏览器访问 `6080` -> 代理到 `5900`。
    - **RDP**：XRDP 监听 `3389` -> 通过 `libvnc.so` 转发给 `5900`。

## 关键配置清单

### 1. 自动登录配置
**文件**: `/etc/lightdm/lightdm.conf.d/50-autologin.conf`
```ini
[Seat:*]
autologin-user=root
autologin-user-timeout=0
user-session=xfce
```
*说明：保证系统启动后 `:0` 必定有桌面环境，无需用户手动 RDP 登录。*

### 2. x11vnc 抓屏服务
**文件**: `/etc/systemd/system/x11vnc.service`
```ini
[Unit]
Description=x11vnc Server
After=display-manager.service

[Service]
Type=forking
User=root
Environment=DISPLAY=:0
ExecStart=/usr/bin/x11vnc -display :0 -nopw -forever -shared -bg -rfbport 5900 -noxrecord -noxdamage -xkb -auth /root/.Xauthority
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```
*说明：必须 `After=display-manager.service`，确保桌面起来后再抓屏。*

### 3. XRDP 代理配置
**文件**: `/etc/xrdp/xrdp.ini`
**关键修改**:
1.  **Globals 段**: 添加 `autorun=VNC-Console`
2.  **VNC-Console 段**: 指向本地 5900
```ini
[VNC-Console]
name=Console
lib=libvnc.so
ip=127.0.0.1
port=5900
username=na
password=na
```
*说明：XRDP 不再创建会话，只做协议转换，稳定性极高。*

## 故障排查
- **RDP 黑屏/报错**: 检查 `x11vnc` 是否运行 (`ps aux | grep x11vnc`)。
- **NoVNC 连不上**: 检查 `5900` 端口是否监听 (`ss -tlnp | grep 5900`)。
- **分辨率问题**: 在 XFCE 桌面内调整，RDP/NoVNC 会自动跟随。
