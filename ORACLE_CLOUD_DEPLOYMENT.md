# Deploying Munim AI to Oracle Cloud Infrastructure (OCI) Always Free Tier

This guide walks you through deploying your **Munim AI** application onto **Oracle Cloud's Always Free Tier**.

---

## 🌟 Why Oracle Cloud Always Free?

Oracle Cloud provides one of the most generous free tiers:
* **Ampere A1 Compute (ARM64)**: Up to **4 OCPUs** and **24 GB RAM** (100% Free Forever).
* **Storage**: Up to 200 GB NVMe Block Volume free.
* **Outbound Data Transfer**: 10 TB/month free.
* **Public IPv4 Address**: 1 Free Ephemeral or Reserved Public IP.

Munim AI is compiled with native multi-architecture support (works out of the box on both **ARM64 / Ampere A1** and **AMD64 / Micro**).

---

## Step 1: Create Your Compute Instance in Oracle Cloud

1. Log into your [Oracle Cloud Console](https://cloud.oracle.com/).
2. Navigate to **Compute** → **Instances** → **Create Instance**.
3. Configure the instance:
   * **Name**: `munim-ai-server`
   * **Placement**: Default AD (Availability Domain)
   * **Image**: **Ubuntu 24.04 LTS** (or Ubuntu 22.04 LTS)
   * **Shape**: 
     * Select **Change Shape** → **Ampere (ARM)** → `VM.Standard.A1.Flex`.
     * Choose **2 to 4 OCPUs** and **12 to 24 GB RAM** (all within Always Free allowance).
     * *(Alternative: AMD Micro `VM.Standard.E2.1.Micro` with 1 GB RAM also works).*
   * **Networking**:
     * Select **Create new Virtual Cloud Network (VCN)** (or use default).
     * Ensure **Assign a public IPv4 address** is checked (**Yes**).
   * **Add SSH Keys**:
     * Generate an SSH key pair or upload your public key (`~/.ssh/id_rsa.pub`).
     * **Save your private key** on your computer if you generate one!
4. Click **Create** and wait ~60 seconds until the state changes to **RUNNING**.
5. Note your **Public IP Address** (e.g., `129.153.xx.xx`).

---

## Step 2: Open OCI VCN Ingress Rules (CRITICAL STEP)

> ⚠️ **Important**: Even if your server runs, Oracle's Cloud Virtual Firewall blocks all ports except Port 22 (SSH) by default. You **must** open Port 80 and 443 in the OCI Console.

1. On your instance page, click on your **Subnet** (under Primary VNIC).
2. Click on the **Default Security List for your VCN**.
3. Under **Ingress Rules**, click **Add Ingress Rules**:
   * **Source Type**: CIDR
   * **Source CIDR**: `0.0.0.0/0`
   * **IP Protocol**: TCP
   * **Destination Port Range**: `80,443`
   * **Description**: `Allow HTTP and HTTPS traffic for Munim AI`
4. Click **Add Ingress Rules**.

---

## Step 3: Connect via SSH & Fix Local OS Firewall

Connect from your terminal or command prompt:

```bash
ssh -i /path/to/your-private-key.key ubuntu@<YOUR_INSTANCE_PUBLIC_IP>
```

### The OCI Local Firewall Trap:
Ubuntu images on Oracle Cloud have pre-installed `iptables` drop rules that block incoming web ports even if you opened them in the OCI Security List. Run these commands to allow web traffic:

```bash
# Allow HTTP, HTTPS, and internal port 3000
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 3000 -j ACCEPT

# Save the iptables rules so they persist after reboot
sudo apt update && sudo apt install -y iptables-persistent netfilter-persistent
sudo netfilter-persistent save
```

*(Tip: You can also simply run `bash deploy/setup-oracle-vm.sh` once you clone the repo!)*

---

## Step 4: Transfer / Clone Munim AI to Your Server

You can clone from your GitHub repository or copy the project files to the VM:

```bash
# Clone your repository
git clone <YOUR_GIT_REPO_URL> munim-ai
cd munim-ai
```

### Configure `.env`
Create your production `.env` file:

```bash
cp .env.example .env
nano .env
```

Set your values:
```env
GEMINI_API_KEY="AIzaSy...your-gemini-api-key"
APP_URL="http://<YOUR_INSTANCE_PUBLIC_IP>"
NODE_ENV="production"
PORT=3000
```
Save with `Ctrl + O`, then `Enter`, and exit with `Ctrl + X`.

---

## Step 5: Deploy Using Docker (Recommended)

Docker is the cleanest method because it encapsulates Node.js 20, builds, and dependencies in an isolated container.

### 1. Install Docker & Compose (if not already installed):
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
newgrp docker
```

### 2. Build and Start the Application:
```bash
docker compose up -d --build
```

### 3. Check container status:
```bash
docker compose ps
docker compose logs -f
```

Your app is now running on `http://<YOUR_INSTANCE_PUBLIC_IP>:3000`!

---

## Step 6: Configure Nginx & Free SSL with Let's Encrypt (Port 80/443)

To access Munim AI on standard port 80/443 (and with a domain name and SSL certificate):

### 1. Install Nginx & Certbot:
```bash
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Copy the Nginx Configuration:
```bash
sudo cp deploy/nginx.conf /etc/nginx/sites-available/munim-ai
sudo ln -s /etc/nginx/sites-available/munim-ai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

Now you can visit `http://<YOUR_INSTANCE_PUBLIC_IP>` directly without typing `:3000`.

### 3. Add Free HTTPS / SSL (with your Domain):
If you have a domain (e.g., `munim.yourdomain.com`):
1. In your DNS provider (Cloudflare, GoDaddy, Namecheap), add an **A record**:
   * **Host**: `munim` (or `@`)
   * **Points to**: `<YOUR_INSTANCE_PUBLIC_IP>`
2. Update `/etc/nginx/sites-available/munim-ai` line 7:
   ```nginx
   server_name munim.yourdomain.com;
   ```
3. Test and reload Nginx:
   ```bash
   sudo nginx -t && sudo systemctl reload nginx
   ```
4. Issue free SSL certificate with 1 command:
   ```bash
   sudo certbot --nginx -d munim.yourdomain.com
   ```
   Certbot will automatically configure HTTPS redirection and set up auto-renewal cron!

---

## Alternative: Native Deployment with Node.js & Systemd (No Docker)

If you prefer running directly on Ubuntu without Docker:

```bash
# 1. Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# 2. Install dependencies & build
cd ~/munim-ai
npm ci
npm run build

# 3. Setup systemd background service
sudo cp deploy/munim-ai.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable munim-ai
sudo systemctl start munim-ai

# Check status
sudo systemctl status munim-ai
```

---

## Step 7: Firebase & Database Reminder

Because Munim AI connects to Firebase Firestore:
1. Ensure your instance can communicate with Firebase (outgoing HTTPS port 443 is allowed by default on OCI).
2. Ensure Firebase **Anonymous Authentication** is enabled in your Firebase Console:
   * **Authentication** → **Sign-in method** → **Anonymous** → **Enable**.
3. Deploy your security rules if you haven't already:
   ```bash
   # In your project directory
   npx firebase-tools deploy --only firestore:rules
   ```

---

## Useful Maintenance Commands

| Task | Docker Command | Native Systemd Command |
|---|---|---|
| View real-time logs | `docker compose logs -f` | `journalctl -u munim-ai -f` |
| Restart server | `docker compose restart` | `sudo systemctl restart munim-ai` |
| Update to latest code | `git pull && docker compose up -d --build` | `git pull && npm run build && sudo systemctl restart munim-ai` |
| Health probe | `curl http://localhost:3000/api/health` | `curl http://localhost:3000/api/health` |
