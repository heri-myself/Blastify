#!/bin/bash
set -e

VPS="ubuntu@n8n.qbest.id"
REMOTE_DIR="/opt/wa-worker"
IMAGE="wa-broadcast-worker"

echo "=== Deploy WA Broadcast Worker ke VPS ==="

# Build dari root workspace (butuh context monorepo)
cd "$(dirname "$0")/../.."

echo ">>> Build Docker image..."
docker build -f apps/worker/Dockerfile -t $IMAGE .

echo ">>> Save image ke tarball..."
docker save $IMAGE | gzip > /tmp/wa-worker.tar.gz

echo ">>> Upload ke VPS (~$(du -sh /tmp/wa-worker.tar.gz | cut -f1))..."
scp /tmp/wa-worker.tar.gz $VPS:/tmp/wa-worker.tar.gz

echo ">>> Load dan restart di VPS..."
ssh $VPS << 'REMOTE'
  set -e
  mkdir -p /opt/wa-worker/auth_sessions

  echo "Load Docker image..."
  docker load < /tmp/wa-worker.tar.gz
  rm /tmp/wa-worker.tar.gz

  echo "Stop container lama (jika ada)..."
  docker stop wa-worker 2>/dev/null || true
  docker rm wa-worker 2>/dev/null || true

  echo "Start container baru..."
  docker run -d \
    --name wa-worker \
    --restart unless-stopped \
    --env-file /opt/wa-worker/.env \
    -v /opt/wa-worker/auth_sessions:/app/auth_sessions \
    wa-broadcast-worker

  echo "Status:"
  docker ps | grep wa-worker
  echo ""
  echo "Log (5 detik):"
  sleep 3
  docker logs --tail 20 wa-worker
REMOTE

echo ""
echo "=== Deploy selesai! ==="
echo "Monitor: ssh $VPS 'docker logs -f wa-worker'"
