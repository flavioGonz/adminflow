# 🚀 AdminFlow Remote Installation Guide

## Quick Start

This guide covers deploying AdminFlow improvements to a remote server.

---

## Prerequisites on Remote Server

- **Node.js**: Version 18.x or higher
- **npm**: Installed with Node.js
- **Git**: For cloning the repository
- **MongoDB**: (Optional) For MongoDB database backend
- **Port Access**: Ports 3000 (client) and 3001 (server) must be available

---

## Method 1: Using Automated Clone Script (Recommended)

### On Your Local Machine

```powershell
# For Windows
.\deploy-clone.ps1

# For Linux/Mac
bash deploy-clone.sh
```

This creates a clean `adminflow-production` directory ready to upload.

### Upload to Remote Server

```bash
# Using SCP (Linux/Mac)
scp -r adminflow-production/ user@remote-server:/opt/

# Or use SFTP, git, or your preferred method
```

---

## Method 2: Direct Clone on Remote Server

### SSH into Remote Server

```bash
ssh user@remote-server
cd /opt/  # (or your preferred directory)
```

### Clone Repository

```bash
git clone https://github.com/flavioGonz/adminflow.git
cd adminflow
```

---

## Backend Installation

### Install Dependencies

```bash
cd server
npm install
```

### Validate Installation (Optional)

```bash
npm run validate:install
```

**Expected Output:**
```
✅ Installation validation passed
- .installed file status: Ready
- Database configuration: Valid
- MongoDB connection: OK (if configured)
```

### Start Server

#### Development Mode

```bash
npm start
```

Server will start on `http://localhost:3001`

#### Production Mode

```bash
# Build first (if applicable)
npm run build

# Start with process manager (PM2 recommended)
npm install -g pm2

pm2 start npm --name "adminflow-server" -- start
pm2 startup
pm2 save
```

### First Time Setup

When you visit `http://remote-server:3001` for the first time:

1. **Installation Wizard** will appear
2. **Select Database Engine**: SQLite (default) or MongoDB
3. **Configure Database**:
   - For SQLite: Auto-configured
   - For MongoDB: Enter connection URI (e.g., `mongodb://localhost:27017/adminflow`)
4. **Create Admin User**: Email and password
5. **Complete**: System initializes and redirects to dashboard

---

## Frontend Installation

### In Another Terminal

```bash
cd client
npm install
```

### Configure Environment

Create `.env.local`:

```bash
cat > .env.local << EOF
NEXT_PUBLIC_API_URL=http://remote-server:3001
EOF
```

Or on Windows PowerShell:

```powershell
@"
NEXT_PUBLIC_API_URL=http://remote-server:3001
"@ | Out-File .env.local -Encoding UTF8
```

### Start Development Server

```bash
npm run dev
```

Application available at `http://localhost:3000`

### Production Build

```bash
npm run build
npm start
```

Or with PM2:

```bash
pm2 start npm --name "adminflow-client" -- start
```

---

## Improvement Validation

### Check Installation Integrity

```bash
cd server
npm run validate:install
```

**This validates:**
- ✅ `.installed` file exists
- ✅ `.selected-db.json` exists
- ✅ Company configuration saved
- ✅ Database connection works
- ✅ Required tables/collections created

### Test API Endpoints

```bash
# Test installation status
curl http://localhost:3001/api/install/status

# Response should be:
# {"installed": true}

# Test installation validation
curl http://localhost:3001/api/install/validate

# Response should be:
# {"valid": true, "errors": [], "warnings": [], ...}
```

---

## Troubleshooting

### Installation Wizard Not Appearing

**Problem:** System says already installed, but you want to reinstall

**Solution:**

```bash
# Backup current data
cp server/.installed server/.installed.backup
cp server/.selected-db.json server/.selected-db.json.backup

# Reset installation
rm server/.installed
rm server/.selected-db.json

# Restart server
npm start
```

### Database Connection Failed

**For MongoDB:**

```bash
# Verify connection URI
curl "mongodb://your-uri"

# Check MongoDB service
systemctl status mongod

# Or for manual MongoDB
ps aux | grep mongod
```

**For SQLite:**

```bash
# Verify database file exists
ls -la server/database/database.sqlite

# Check permissions
chmod 644 server/database/database.sqlite
```

### Port Already in Use

```bash
# Find process on port 3001
lsof -i :3001  # (macOS/Linux)
netstat -ano | findstr :3001  # (Windows)

# Kill process or use different port
PORT=3002 npm start
```

### Cache Headers Issue (503 Response Caching)

**Problem:** 503 responses are being cached by CDN/proxy

**Verify Fix Applied:**

```bash
curl -i http://localhost:3001/api/clients

# Response headers should include:
# Cache-Control: no-store
# Pragma: no-cache
# Expires: 0
```

---

## Production Deployment Tips

### 1. Use Process Manager (PM2)

```bash
# Install PM2 globally
npm install -g pm2

# Start both applications
pm2 start npm --name "adminflow-server" --cwd ./server -- start
pm2 start npm --name "adminflow-client" --cwd ./client -- start

# Auto-restart on reboot
pm2 startup
pm2 save
```

### 2. Configure Reverse Proxy (Nginx)

```nginx
# /etc/nginx/sites-available/adminflow

upstream server {
    server localhost:3001;
}

upstream client {
    server localhost:3000;
}

server {
    listen 80;
    server_name your-domain.com;

    # API routes
    location /api/ {
        proxy_pass http://server;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Client routes
    location / {
        proxy_pass http://client;
        proxy_set_header Host $host;
    }
}
```

### 3. Enable HTTPS (Let's Encrypt)

```bash
# Install Certbot
sudo apt-get install certbot python3-certbot-nginx

# Generate certificate
sudo certbot certonly --nginx -d your-domain.com

# Auto-renew
sudo systemctl enable certbot.timer
```

### 4. Environment Variables

Create `.env` in `server/`:

```env
NODE_ENV=production
PORT=3001
SECRET_KEY=your-secret-key-here
MONGODB_URI=mongodb://production-mongo:27017/adminflow
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### 5. Backup Strategy

```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups/adminflow"
mkdir -p $BACKUP_DIR

# SQLite backup
cp server/database/database.sqlite $BACKUP_DIR/database-$(date +%Y%m%d).sqlite

# MongoDB backup (if used)
mongodump --uri="mongodb://..." --out $BACKUP_DIR/mongo-$(date +%Y%m%d)

# Cleanup old backups (keep 30 days)
find $BACKUP_DIR -mtime +30 -delete
```

---

## Monitoring

### View Logs

```bash
# With PM2
pm2 logs adminflow-server
pm2 logs adminflow-client

# Direct logs
tail -f server/logs/*.log  # (if logging configured)
```

### Health Check

```bash
# Server health
curl -s http://localhost:3001/api/install/status | jq .

# Client health
curl -s http://localhost:3000/ | head -20
```

---

## Updating Production System

### Pull Latest Changes

```bash
git pull origin main
cd server && npm install
cd ../client && npm install

# Restart applications
pm2 restart all
```

### Run Validation After Update

```bash
cd server
npm run validate:install
```

---

## Support

If you encounter issues:

1. **Check logs**: Review both server and client logs
2. **Validate installation**: `npm run validate:install`
3. **Review GIT_COMPARISON_REPORT.md**: Understanding what changed
4. **Backup & Rollback**: Always keep backups for recovery

---

## Next Steps

1. ✅ Choose deployment method (automated script or direct clone)
2. ✅ Set up remote server with prerequisites
3. ✅ Clone/upload repository
4. ✅ Install dependencies
5. ✅ Configure environment variables
6. ✅ Start services
7. ✅ Complete installation wizard
8. ✅ Validate installation integrity
9. ✅ Test application functionality
10. ✅ Set up monitoring and backups

---

**Your AdminFlow system is now ready for remote deployment!**
