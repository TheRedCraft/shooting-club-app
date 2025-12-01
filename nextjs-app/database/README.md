# 🗄️ Database Setup & Management

## 📋 Dateien

- **`schema.sql`** - Komplettes Datenbank-Schema (für neue Installationen)
- **`update-schema.sql`** - Update-Script für bestehende Datenbanken
- **`make-admin.sh`** - Script um Benutzer zum Admin zu machen

---

## 🚀 Neue Installation

### 1. Datenbank erstellen und Schema laden:

```bash
# PostgreSQL Container starten (aus dem Hauptverzeichnis)
cd /home/raspap/shooting-club-app
docker-compose up -d

# Schema laden (aus nextjs-app/database)
cd nextjs-app/database
psql -h localhost -U dbuser -d shooting_club -f schema.sql
# Passwort: dbpassword
```

---

## 🔄 Bestehende Datenbank aktualisieren

Wenn du die Datenbank bereits hast und nur die neuen Spalten hinzufügen möchtest:

```bash
cd /home/raspap/shooting-club-app/nextjs-app/database

# Schema updaten
psql -h localhost -U dbuser -d shooting_club -f update-schema.sql
# Passwort: dbpassword
```

Das fügt folgende Spalten hinzu:
- ✅ `is_admin` - Admin-Rechte (Boolean)
- ✅ `is_linked` - Verknüpft mit Schütze (Boolean)
- ✅ `shooter_id` - Meyton Schützen-ID (String)
- ✅ Indexes für bessere Performance

---

## 👑 Benutzer zum Admin machen

### Option 1: Mit Script (empfohlen)

```bash
cd /home/raspap/shooting-club-app/nextjs-app/database

# Script ausführbar machen (nur einmal nötig)
chmod +x make-admin.sh

# Script ausführen
./make-admin.sh

# Oder direkt mit Email/Username:
./make-admin.sh deine@email.de
```

Das Script macht:
1. ✅ Schema-Update (falls nötig)
2. ✅ Zeigt alle Benutzer
3. ✅ Macht Benutzer zum Admin
4. ✅ Zeigt alle Admins

---

### Option 2: Manuell mit psql

```bash
# Mit Datenbank verbinden
psql -h localhost -U dbuser -d shooting_club

# Admin-Rechte vergeben
UPDATE users SET is_admin = true WHERE email = 'deine@email.de';

# Oder nach Username:
UPDATE users SET is_admin = true WHERE username = 'dein_username';

# Überprüfen
SELECT id, username, email, is_admin FROM users WHERE is_admin = true;

# Beenden
\q
```

---

### Option 3: Erster Benutzer automatisch Admin

Wenn du den ersten registrierten Benutzer automatisch zum Admin machen willst:

```sql
UPDATE users SET is_admin = true WHERE id = 1;
```

---

## 📊 Nützliche SQL-Befehle

### Alle Benutzer anzeigen:
```sql
SELECT 
    id, 
    username, 
    email, 
    is_admin, 
    is_linked, 
    shooter_id,
    created_at 
FROM users 
ORDER BY id;
```

### Alle Admins anzeigen:
```sql
SELECT username, email FROM users WHERE is_admin = true;
```

### Alle verknüpften Benutzer anzeigen:
```sql
SELECT 
    u.username, 
    u.email, 
    u.shooter_id,
    u.is_linked
FROM users u 
WHERE u.is_linked = true;
```

### Benutzer verknüpfen (manuell):
```sql
UPDATE users 
SET is_linked = true, shooter_id = '12345' 
WHERE email = 'user@example.com';
```

### Verknüpfung aufheben:
```sql
UPDATE users 
SET is_linked = false, shooter_id = NULL 
WHERE email = 'user@example.com';
```

### Admin-Rechte entziehen:
```sql
UPDATE users SET is_admin = false WHERE email = 'user@example.com';
```

---

## 🔧 Troubleshooting

### Problem: "Spalte is_admin existiert nicht"

**Lösung:**
```bash
cd /home/raspap/shooting-club-app/nextjs-app/database
psql -h localhost -U dbuser -d shooting_club -f update-schema.sql
```

---

### Problem: "Passwort falsch"

**Standard-Credentials:**
- Host: `localhost`
- Port: `5432`
- Database: `shooting_club`
- User: `dbuser`
- Password: `dbpassword`

Diese sind in `../../docker-compose.yml` definiert.

---

### Problem: "Connection refused"

**Lösung:**
```bash
# Prüfe ob Docker Container läuft
docker ps | grep postgres

# Falls nicht, starte ihn:
cd /home/raspap/shooting-club-app
docker-compose up -d
```

---

## 🗂️ Schema-Struktur

### Users Tabelle:
```sql
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    is_admin BOOLEAN NOT NULL DEFAULT false,    -- ✅ Admin-Rechte
    is_linked BOOLEAN NOT NULL DEFAULT false,   -- ✅ Verknüpft?
    shooter_id VARCHAR(100),                    -- ✅ Meyton ID
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 📝 Backup & Restore

### Backup erstellen:
```bash
pg_dump -h localhost -U dbuser shooting_club > backup-$(date +%Y%m%d).sql
```

### Backup wiederherstellen:
```bash
psql -h localhost -U dbuser -d shooting_club < backup-20241128.sql
```

---

## 🎯 Schnell-Referenz

```bash
# Schema laden (neue Installation)
cd /home/raspap/shooting-club-app/nextjs-app/database
psql -h localhost -U dbuser -d shooting_club -f schema.sql

# Schema updaten (bestehende DB)
psql -h localhost -U dbuser -d shooting_club -f update-schema.sql

# Admin machen
chmod +x make-admin.sh
./make-admin.sh deine@email.de

# Interaktive psql Session
psql -h localhost -U dbuser -d shooting_club
```

---

**Passwort für alle Befehle:** `dbpassword`

