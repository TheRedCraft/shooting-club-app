# 🎯 Shooting Club Analytics App

Eine moderne Web-Anwendung zur Verwaltung und Analyse von Schießsport-Daten, integriert mit dem Meyton System.

## 📋 Überblick

Diese Anwendung ermöglicht es Schützen und Vereinsadministratoren:
- 📊 **Persönliche Statistiken** einzusehen (Sessions, Scores, Trends)
- 🏆 **Leaderboard** mit Vereinsranglisten
- 👥 **User Management** für Admins
- 🔗 **Integration** mit Meyton Schießstand-System (SSMDB2)
- 📈 **Detaillierte Analysen** von Schussverteilungen und Score-Entwicklung

## 🏗️ Architektur

**Frontend & Backend:**
- Next.js 15 (App Router)
- TypeScript
- Material-UI (MUI)

**Datenbanken:**
- PostgreSQL (User-Daten, Authentication)
- MySQL (Meyton SSMDB2 - Read-Only)

**Deployment:**
- Docker & Docker Compose
- Reverse Proxy (optional)

## 📁 Projekt-Struktur

```
shooting-club-app/
├── nextjs-app/              # Haupt-Anwendung (Next.js)
│   ├── src/
│   │   ├── app/            # Pages & API Routes
│   │   ├── components/     # React Components
│   │   ├── contexts/       # React Context (Auth)
│   │   ├── lib/            # Services, Utils, DB
│   │   └── types/          # TypeScript Types
│   ├── database/           # SQL Scripts & Tools
│   ├── public/             # Static Assets
│   ├── TODO.md            # 📋 Aufgaben-Liste
│   └── .env.local         # Environment Variables
├── docker-compose.yml      # Docker Setup
└── README.md              # Diese Datei
```

## 🚀 Schnellstart

### Voraussetzungen
- Node.js 18+ 
- Docker & Docker Compose
- Zugriff auf Meyton MySQL Datenbank (SSMDB2)

### Installation

1. **Repository klonen**
```bash
git clone [repository-url]
cd shooting-club-app
```

2. **Environment Variables einrichten**
```bash
cd nextjs-app
cp .env.example .env.local
# .env.local bearbeiten und Datenbank-Credentials eintragen
```

3. **Docker Container starten**
```bash
cd ..
docker-compose up -d
```

4. **Datenbank Schema erstellen**
```bash
cd nextjs-app/database
./init-db.sh
```

5. **Dependencies installieren & App starten**
```bash
cd ..
npm install
npm run dev
```

6. **Ersten Admin-User erstellen**
```bash
cd database
./make-admin.sh
```

Die App läuft jetzt auf: **http://localhost:3000**

## 🔑 Standard-Login

Nach dem Setup mit `make-admin.sh`:
- **Username:** `admin`
- **Email:** `admin@shooting-club.local`
- **Password:** `admin123` (bitte ändern!)

## 📊 Features

### Für Schützen
- ✅ Dashboard mit persönlichen Statistiken
- ✅ Verlauf aller Sessions
- ✅ Score-Trends über Zeit
- ✅ Schussverteilungs-Analyse
- ✅ Leaderboard mit Vereinsranking
- ✅ Profil-Seite

### Für Admins
- ✅ User Management (Freigabe, Verknüpfung)
- ✅ Meyton Shooter Linking
- ✅ Suchfunktion für Schützen
- ✅ Übersicht aller User
- 🔄 Activity Log (geplant)
- 🔄 Bulk Actions (geplant)

## 🔐 Berechtigungen

| Route | Nicht eingeloggt | Unlinked User | Linked User | Admin |
|-------|------------------|---------------|-------------|-------|
| `/login` | ✅ | ✅ | ✅ | ✅ |
| `/register` | ✅ | ✅ | ✅ | ✅ |
| `/pending-link` | ❌ | ✅ | ❌ | ✅ |
| `/dashboard` | ❌ | ❌ | ✅ | ✅ |
| `/leaderboard` | ❌ | ❌ | ✅ | ✅ |
| `/profile` | ❌ | ✅ | ✅ | ✅ |
| `/admin` | ❌ | ❌ | ❌ | ✅ |

## 🗄️ Datenbank Schema

### `users` Tabelle (PostgreSQL)
- `id` - User ID
- `username` - Benutzername (unique)
- `email` - Email (unique)
- `password_hash` - Gehashtes Passwort (bcrypt)
- `is_admin` - Admin-Berechtigung
- `is_linked` - Mit Meyton Schütze verknüpft?
- `shooter_id` - Meyton Shooter ID (Format: `Nachname|Vorname`)

### Meyton `Scheiben` Tabelle (MySQL - Read-Only)
- `ScheibenID` - Session ID
- `Nachname`, `Vorname` - Schützen-Name
- `SportpassID` - DSB Sportpass Nummer
- `Zeitstempel` - Session Datum/Zeit
- `Disziplin` - Disziplin (z.B. "LG 10m")
- `TotalRing01` - Gesamtscore (letzte Ziffer = Dezimal)
- `Trefferzahl` - Anzahl Schüsse

## 🛠️ Entwicklung

### Wichtige Kommandos

```bash
# Development Server starten
npm run dev

# Production Build
npm run build
npm start

# Linting
npm run lint

# Type Checking
npm run type-check

# Datenbank Schema prüfen
cd database
./check-schema.sh

# User zum Admin machen
./make-admin.sh
```

### Environment Variables

Siehe `.env.local`:
```env
# PostgreSQL (User-Daten)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=shooting_club
DB_USER=dbuser
DB_PASSWORD=dbpassword

# Meyton MySQL (Read-Only)
MEYTON_DB_HOST=192.168.1.100
MEYTON_DB_PORT=3306
MEYTON_DB_NAME=SSMDB2
MEYTON_DB_USER=meyton
MEYTON_DB_PASSWORD=meytonpassword

# JWT Secret
JWT_SECRET=your-secret-key-here
```

## 📝 TODO & Roadmap

Siehe **[TODO.md](nextjs-app/TODO.md)** für:
- Geplante Features
- Bekannte Bugs
- Verbesserungsideen
- Priorisierung

## 🐛 Bekannte Probleme

- Keine (Stand: 29.11.2024)

Bei Problemen siehe [GitHub Issues](link-einfügen) oder TODO.md

## 🤝 Beitragen

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request erstellen

## 📄 Lizenz

[Lizenz eintragen]

## 👥 Team

- **Entwicklung:** [Name]
- **Admin:** [Name]
- **Support:** [Email]

## 🙏 Danksagungen

- Meyton GmbH für das Schießstand-System
- Material-UI Team
- Next.js Team
- Alle Contributors

---

**Version:** 1.0.0  
**Letzte Aktualisierung:** 29. November 2024
