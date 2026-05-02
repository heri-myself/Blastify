#!/bin/bash
set -e

VPS="ubuntu@n8n.qbest.id"
SSH_KEY="$HOME/.ssh/id_ed25519"
REMOTE_DIR="/opt/wa-worker"
IMAGE="wa-broadcast-worker"

SSH="ssh -i $SSH_KEY"
SCP="scp -i $SSH_KEY"

echo "=== Deploy WA Broadcast Worker ke VPS ==="

# Build dari root workspace (butuh context monorepo)
cd "$(dirname "$0")/../.."

echo ">>> Build Docker image..."
docker build -f apps/worker/Dockerfile -t $IMAGE .

echo ">>> Save image ke tarball..."
docker save $IMAGE | gzip > /tmp/wa-worker.tar.gz

echo ">>> Upload ke VPS (~$(du -sh /tmp/wa-worker.tar.gz | cut -f1))..."
$SCP /tmp/wa-worker.tar.gz $VPS:/tmp/wa-worker.tar.gz

echo ">>> Load dan restart di VPS..."
$SSH $VPS << 'REMOTE'
  set -e
  sudo mkdir -p /opt/wa-worker/auth_sessions

  echo "Load Docker image..."
  sudo docker load < /tmp/wa-worker.tar.gz
  rm /tmp/wa-worker.tar.gz

  echo "Stop container lama (jika ada)..."
  sudo docker stop wa-worker 2>/dev/null || true
  sudo docker rm wa-worker 2>/dev/null || true

  echo "Start container baru..."
  sudo docker run -d \
    --name wa-worker \
    --restart unless-stopped \
    --env-file /opt/wa-worker/.env \
    -v /opt/wa-worker/auth_sessions:/app/auth_sessions \
    wa-broadcast-worker

  echo "Status:"
  sudo docker ps | grep wa-worker
  echo ""
  echo "Log (5 detik):"
  sleep 3
  sudo docker logs --tail 20 wa-worker
REMOTE

echo ""
echo "=== Deploy selesai! ==="
echo "Monitor: $SSH $VPS 'sudo docker logs -f wa-worker'"
