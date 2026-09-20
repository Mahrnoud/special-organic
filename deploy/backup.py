#!/usr/bin/env python3
"""Online SQLite snapshot plus uploads; run as special_organic via systemd."""
from datetime import datetime, timedelta, timezone
from pathlib import Path
import os
import re
import shutil
import sqlite3
import tarfile

os.umask(0o077)
root = Path('/home/special_organic')
backups = root / 'backups'
now = datetime.now(timezone.utc)
name = now.strftime('%Y%m%dT%H%M%SZ')
pending = backups / ('.pending-' + name)
complete = backups / name
pending.mkdir(mode=0o700)
try:
    with sqlite3.connect(f'file:{root}/shared/database/store.db?mode=ro', uri=True) as source:
        with sqlite3.connect(pending / 'store.db') as snapshot:
            source.backup(snapshot)
            if snapshot.execute('PRAGMA integrity_check').fetchone()[0] != 'ok':
                raise RuntimeError('Database backup failed integrity check')
    with tarfile.open(pending / 'uploads.tar.gz', 'w:gz') as archive:
        archive.add(root / 'shared/uploads', arcname='uploads')
    pending.rename(complete)
except Exception:
    shutil.rmtree(pending)
    raise
for old in backups.iterdir():
    if old.is_dir() and re.fullmatch(r'\d{8}T\d{6}Z', old.name):
        created = datetime.strptime(old.name, '%Y%m%dT%H%M%SZ').replace(tzinfo=timezone.utc)
        if created < now - timedelta(days=7):
            shutil.rmtree(old)
print(f'Backup complete: {complete}')
