# asterisk-token-router 部署指南 (CentOS 7.9)

> **目标服务器**: CentOS 7.9, 64核, 64GB RAM, 2TB SSD

---

## 1. 环境准备

### 1.1 基础依赖

```bash
# EPEL 源（CentOS 7 必备）
yum install -y epel-release

# 基础工具
yum install -y git wget curl vim net-tools

# 关闭防火墙或开放端口
firewall-cmd --add-port=3000/tcp --permanent
firewall-cmd --add-port=80/tcp --permanent
firewall-cmd --add-port=443/tcp --permanent
firewall-cmd --reload
# 或直接关: systemctl stop firewalld
```

### 1.2 MySQL 8.0

```bash
# 添加 MySQL 8.0 源
rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-3.noarch.rpm

yum install -y mysql-community-server
systemctl start mysqld
systemctl enable mysqld

# 获取临时密码
grep 'temporary password' /var/log/mysqld.log

# 安全配置
mysql_secure_installation

# 创建数据库
mysql -u root -p <<SQL
CREATE DATABASE asterisk_token_router CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'asterisk'@'localhost' IDENTIFIED BY 'YourStrongPass123!';
GRANT ALL ON asterisk_token_router.* TO 'asterisk'@'localhost';
FLUSH PRIVILEGES;
SQL
```

### 1.3 Redis 7

```bash
# CentOS 7 自带 Redis 太老(3.x)，用 Remi 源装新版
yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm
yum --enablerepo=remi install -y redis

# 配置 Redis
sed -i 's/^bind 127.0.0.1/bind 127.0.0.1/' /etc/redis.conf
sed -i 's/^maxmemory .*/maxmemory 2gb/' /etc/redis.conf
sed -i 's/^# maxmemory-policy .*/maxmemory-policy allkeys-lru/' /etc/redis.conf

systemctl start redis
systemctl enable redis
redis-cli ping  # 应返回 PONG
```

### 1.4 Nginx

```bash
yum install -y nginx
systemctl start nginx
systemctl enable nginx
```

---

## 2. 部署 Token Router

### 2.1 编译（在 macOS 上交叉编译）

```bash
# 在开发机上
cd /Users/daojun/Dev/asterisk-token-router

# 静态编译（避免 CentOS 7 glibc 版本问题）
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 \
  go build -ldflags="-s -w" -o asterisk-tr-linux .

# 上传到服务器
scp asterisk-tr-linux root@<server-ip>:/opt/asterisk-tr/
```

### 2.2 服务器配置

```bash
# 创建目录
mkdir -p /opt/asterisk-tr/{logs,data}
cd /opt/asterisk-tr

# 赋予执行权限
chmod +x asterisk-tr-linux

# 创建环境变量文件
cat > .env <<EOF
SQL_DSN=asterisk:YourStrongPass123!@tcp(127.0.0.1:3307)/asterisk_token_router?charset=utf8mb4&parseTime=True&loc=Local
REDIS_CONN_STRING=redis://127.0.0.1:6379
SESSION_SECRET=$(openssl rand -hex 32)
SYNC_FREQUENCY=60
TZ=Asia/Shanghai
EOF
```

### 2.3 Systemd 服务

```bash
cat > /etc/systemd/system/asterisk-tr.service <<'SVC'
[Unit]
Description=asterisk-token-router
After=network.target mysqld.service redis.service

[Service]
Type=simple
User=root
WorkingDirectory=/opt/asterisk-tr
ExecStart=/opt/asterisk-tr/asterisk-tr-linux --port 3000 --log-dir /opt/asterisk-tr/logs
Restart=always
RestartSec=5
LimitNOFILE=65535

[Install]
WantedBy=multi-user.target
SVC

systemctl daemon-reload
systemctl enable asterisk-tr
systemctl start asterisk-tr
systemctl status asterisk-tr
```

---

## 3. Nginx 反向代理

```bash
cat > /etc/nginx/conf.d/asterisk-tr.conf <<'NGX'
upstream token_router {
    server 127.0.0.1:3000;
    keepalive 64;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 64m;
    proxy_read_timeout 300s;
    proxy_send_timeout 300s;

    # SSE stream support
    proxy_buffering off;
    proxy_cache off;
    proxy_http_version 1.1;
    chunked_transfer_encoding on;

    location / {
        proxy_pass http://token_router;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket upgrade for stream
    location /v1/ {
        proxy_pass http://token_router;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_read_timeout 86400s;
        proxy_buffering off;
    }
}
NGX

nginx -t && systemctl restart nginx
```

---

## 4. 生产调优

### 4.1 MySQL

```ini
# /etc/my.cnf 追加
[mysqld]
innodb_buffer_pool_size = 16G
innodb_log_file_size = 1G
innodb_flush_log_at_trx_commit = 2
max_connections = 500
```

### 4.2 Redis

```bash
# 已配置 maxmemory 2gb, allkeys-lru
```

### 4.3 系统限制

```bash
cat >> /etc/security/limits.conf <<EOF
* soft nofile 65535
* hard nofile 65535
EOF

cat >> /etc/sysctl.conf <<EOF
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 8192
EOF
sysctl -p
```

---

## 5. 部署检查清单

- [ ] MySQL 8.0 运行中，数据库已创建
- [ ] Redis 运行中，`redis-cli ping` → PONG
- [ ] 上传并编译/复制二进制文件到 /opt/asterisk-tr/
- [ ] .env 配置正确（数据库密码、Redis、SESSION_SECRET）
- [ ] Systemd 服务启动成功，`systemctl status asterisk-tr`
- [ ] Nginx 配置生效，`curl http://localhost/api/status` 返回 JSON
- [ ] 管理员登录后台，创建渠道和用户
- [ ] 测试 API 调用：`curl -X POST http://server/v1/chat/completions ...`

---

## 6. 安全建议

- [ ] 管理后台设置强密码
- [ ] 关闭开放注册（系统设置）
- [ ] 配置 HTTPS（Let's Encrypt + certbot）
- [ ] API Key 定期轮换
- [ ] 数据库定期备份（mysqldump + cron）
- [ ] 日志保留策略（> 180 天）
