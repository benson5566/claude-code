#!/bin/bash
# 保養品資料庫備份腳本
# 用法：
#   ./backup.sh          手動備份
#   crontab: 0 3 * * * /path/to/skincare-db/backup.sh   每天凌晨 3 點自動備份

set -e

BACKUP_DIR="/data/skincare/backups"
DB_DIR="/data/skincare/postgres"
KEEP_DAYS=14   # 保留最近 14 天的備份

DATE=$(date +%Y-%m-%d_%H%M)
BACKUP_FILE="$BACKUP_DIR/skincare_$DATE.sql.gz"

mkdir -p "$BACKUP_DIR"

echo "[$(date)] 開始備份..."

# 從執行中的容器匯出 SQL
docker exec skincare_db pg_dump \
  -U "${POSTGRES_USER:-skincare}" \
  "${POSTGRES_DB:-skincare}" \
  | gzip > "$BACKUP_FILE"

SIZE=$(du -sh "$BACKUP_FILE" | cut -f1)
echo "[$(date)] 備份完成：$BACKUP_FILE（$SIZE）"

# 刪除超過 KEEP_DAYS 天的舊備份
find "$BACKUP_DIR" -name "skincare_*.sql.gz" -mtime +$KEEP_DAYS -delete
echo "[$(date)] 已清除 $KEEP_DAYS 天前的舊備份"

# 列出目前所有備份
echo ""
echo "目前備份清單："
ls -lh "$BACKUP_DIR"/skincare_*.sql.gz 2>/dev/null || echo "（無）"
