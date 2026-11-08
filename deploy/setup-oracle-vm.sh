#!/usr/bin/env bash
# ==============================================================================
# Oracle Cloud VM Quick Setup Script for Munim AI
# Run on fresh Ubuntu 22.04 / 24.04 (Ampere A1 or AMD Micro)
# ==============================================================================
set -e

echo "==> [1/4] Updating package lists..."
sudo apt update && sudo apt upgrade -y

echo "==> [2/4] Configuring Oracle Cloud local firewall (iptables/ufw)..."
# Oracle Cloud images include default iptables rules that drop incoming traffic.
# We insert ACCEPT rules for HTTP (80) and HTTPS (443) before the default REJECT/DROP rule.
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT || true
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT || true

# Persist iptables rules across reboots
sudo apt install -y iptables-persistent netfilter-persistent
sudo netfilter-persistent save

echo "==> [3/4] Installing Docker and Docker Compose..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker $USER
    sudo systemctl enable docker
    sudo systemctl start docker
    rm get-docker.sh
    echo "Docker installed successfully!"
else
    echo "Docker is already installed."
fi

echo "==> [4/4] Installing Nginx & Certbot for SSL (Optional reverse proxy)..."
sudo apt install -y nginx certbot python3-certbot-nginx

echo "=============================================================================="
echo " Setup complete! Remember to open ports 80 & 443 in the OCI Security List!"
echo " Log out and log back in (or run 'newgrp docker') to use docker without sudo."
echo "=============================================================================="
