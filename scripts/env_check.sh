#!/bin/bash
# asterisk-token-router 环境检测脚本
# 在 CentOS 7.9 服务器上运行: bash env_check.sh

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "  ${GREEN}✓${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠${NC} $1"; }
fail() { echo -e "  ${RED}✗${NC} $1"; }
info() { echo -e "  $1"; }

echo "========================================="
echo " asterisk-token-router 环境检测"
echo " $(date '+%Y-%m-%d %H:%M:%S')"
echo "========================================="

# --- 1. 系统信息 ---
echo ""
echo "【1. 操作系统】"
cat /etc/centos-release 2>/dev/null || cat /etc/os-release 2>/dev/null | head -3
uname -r

echo ""
echo "【2. CPU】"
info "核心数: $(nproc)"
info "型号: $(grep 'model name' /proc/cpuinfo | head -1 | cut -d: -f2 | xargs)"

echo ""
echo "【3. 内存】"
free -h | grep -E '^Mem|^Swap'

echo ""
echo "【4. 磁盘】"
df -h / | tail -1

# --- 2. 基础环境 ---
echo ""
echo "【5. glibc 版本】"
ldd --version 2>&1 | head -1

echo ""
echo "【6. SELinux】"
if command -v getenforce &>/dev/null; then
    STATUS=$(getenforce 2>/dev/null)
    if [ "$STATUS" = "Disabled" ]; then
        pass "SELinux 已关闭"
    else
        warn "SELinux 状态: $STATUS (建议关闭: setenforce 0)"
    fi
else
    warn "无法检测 SELinux"
fi

echo ""
echo "【7. 防火墙】"
if command -v firewall-cmd &>/dev/null; then
    if systemctl is-active firewalld &>/dev/null; then
        warn "firewalld 运行中，需开放端口 3000/80/443"
    else
        pass "firewalld 未运行"
    fi
elif command -v iptables &>/dev/null; then
    warn "iptables 运行中"
else
    pass "防火墙未检测到"
fi

echo ""
echo "【8. 系统限制】"
info "open files: $(ulimit -n)"
info "max user processes: $(ulimit -u)"

# --- 3. MySQL ---
echo ""
echo "【9. MySQL】"
if command -v mysql &>/dev/null; then
    VER=$(mysql --version 2>/dev/null)
    pass "MySQL 已安装: $VER"
    if systemctl is-active mysqld &>/dev/null 2>&1; then
        pass "mysqld 服务运行中"
    else
        fail "mysqld 服务未运行"
    fi
    # 检查3306端口
    if ss -tlnp | grep -q ':3306'; then
        pass "端口 3306 已监听"
    else
        warn "端口 3306 未监听"
    fi
else
    fail "MySQL 未安装"
    echo "  安装命令:"
    echo "    rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-3.noarch.rpm"
    echo "    yum install -y mysql-community-server"
fi

# --- 4. Redis ---
echo ""
echo "【10. Redis】"
if command -v redis-cli &>/dev/null; then
    VER=$(redis-cli --version 2>/dev/null)
    pass "Redis 已安装: $VER"
    if systemctl is-active redis &>/dev/null 2>&1; then
        pass "redis 服务运行中"
    else
        fail "redis 服务未运行"
    fi
    if ss -tlnp | grep -q ':6379'; then
        pass "端口 6379 已监听"
    else
        warn "端口 6379 未监听"
    fi
    # 连通性
    PONG=$(redis-cli ping 2>/dev/null)
    if [ "$PONG" = "PONG" ]; then
        pass "redis-cli ping → PONG"
    else
        fail "redis 无响应"
    fi
else
    fail "Redis 未安装"
    echo "  安装命令:"
    echo "    yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm"
    echo "    yum --enablerepo=remi install -y redis"
fi

# --- 5. Nginx ---
echo ""
echo "【11. Nginx】"
if command -v nginx &>/dev/null; then
    VER=$(nginx -v 2>&1)
    pass "Nginx 已安装: $VER"
    if systemctl is-active nginx &>/dev/null 2>&1; then
        pass "nginx 服务运行中"
    else
        fail "nginx 服务未运行"
    fi
else
    fail "Nginx 未安装"
    echo "  安装命令: yum install -y nginx"
fi

# --- 6. 网络端口 ---
echo ""
echo "【12. 关键端口占用】"
for port in 3000 80 443 3306 6379; do
    if ss -tlnp | grep -q ":${port} "; then
        info "端口 $port: $(ss -tlnp | grep ":${port} " | awk '{print $NF}')"
    else
        info "端口 $port: 未占用"
    fi
done

# --- 7. 可用存储 ---
echo ""
echo "【13. /opt 目录】"
if [ -d /opt ]; then
    df -h /opt 2>/dev/null || df -h / | tail -1
    pass "/opt 目录存在"
else
    warn "/opt 目录不存在，将自动创建"
fi

# --- 汇总 ---
echo ""
echo "========================================="
echo " 检测完成"
echo "========================================="
echo ""
echo "【缺失组件安装命令汇总】"
echo "  MySQL:  rpm -Uvh https://dev.mysql.com/get/mysql80-community-release-el7-3.noarch.rpm && yum install -y mysql-community-server"
echo "  Redis:  yum install -y http://rpms.remirepo.net/enterprise/remi-release-7.rpm && yum --enablerepo=remi install -y redis"
echo "  Nginx:  yum install -y epel-release && yum install -y nginx"
echo ""
echo "【部署文件路径】"
echo "  二进制: /opt/asterisk-tr/asterisk-tr-linux"
echo "  配置:   /opt/asterisk-tr/.env"
echo "  日志:   /opt/asterisk-tr/logs/"
echo "  服务:   /etc/systemd/system/asterisk-tr.service"
