#!/bin/bash
set -e

VPS="ubuntu@n8n.qbest.id"
SSH_KEY="$HOME/.ssh/id_ed25519"
REPO="https://github.com/heri-myself/Blastify.git"
REMOTE_DIR="/opt/wa-worker"

SSH="ssh -i $SSH_KEY"

echo "=== Deploy WA Broadcast Worker ke VPS (build di VPS) ==="

$SSH $VPS << REMOTE
  set -e

  echo ">>> Siapkan folder..."
  sudo mkdir -p $REMOTE_DIR/auth_sessions

  echo ">>> Clone / update kode dari GitHub..."
  if [ -d "$REMOTE_DIR/repo" ]; then
    cd $REMOTE_DIR/repo
    sudo git fetch origin main
    sudo git reset --hard origin/main
  else
    sudo git clone $REPO $REMOTE_DIR/repo
    cd $REMOTE_DIR/repo
  fi

  echo ">>> Build Docker image di VPS..."
  cd $REMOTE_DIR/repo
  sudo docker build -f apps/worker/Dockerfile -t wa-broadcast-worker .

  echo ">>> Stop container lama (jika ada)..."
  sudo docker stop wa-worker 2>/dev/null || true
  sudo docker rm wa-worker 2>/dev/null || true

  echo ">>> Start container baru..."
  sudo docker run -d \
    --name wa-worker \
    --restart unless-stopped \
    --env-file $REMOTE_DIR/.env \
    -v $REMOTE_DIR/auth_sessions:/app/auth_sessions \
    wa-broadcast-worker

  echo ""
  echo "Status container:"
  sudo docker ps | grep wa-worker || echo "(tidak ditemukan - ada error)"
  echo ""
  echo "Log awal (5 detik):"
  sleep 5
  sudo docker logs --tail 30 wa-worker
REMOTE

echo ""
echo "=== Deploy selesai! ==="
echo "Untuk monitor log: $SSH $VPS 'sudo docker logs -f wa-worker'"
