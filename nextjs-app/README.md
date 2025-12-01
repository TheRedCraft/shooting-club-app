# 🎯 Shooting Club Analytics - Next.js Version

Eine vollständige Next.js Migration des Shooting Club Analytics Projekts mit Meyton-Integration.

## ✨ Features

- 🔐 **JWT Authentication** - Sicheres Login-System
- 📊 **Dashboard** - Persönliche Schießstatistiken
- 👥 **Admin Panel** - Benutzerverwaltung und Meyton-Verknüpfung
- 🏆 **Leaderboard** - Vereinsweite Bestenliste
- 📈 **Analytics** - Detaillierte Schussanalysen und Trends
- 🌐 **Mehrsprachig** - Deutsch & Englisch
- 🎨 **Material-UI** - Modernes, responsives Design
- 🔗 **Meyton Integration** - Direkte Anbindung an SSMDB2

## 🚀 Quick Start

### 1. Dependencies installieren:
```bash
npm install
```

### 2. Datenbank starten:
```bash
cd ..
docker-compose up -d
```

### 3. Umgebungsvariablen anpassen:
Datei `.env.local` ist bereits konfiguriert. Prüfe die Werte:
- Database Credentials
- Meyton Database IP/Credentials
- JWT Secret

### 4. Development Server starten:
```bash
npm run dev
```

Öffne [http://localhost:3000](http://localhost:3000)

## 📂 Projektstruktur

```
src/
├── app/              # Next.js App Router
│   ├── api/         # Backend API Routes
│   ├── dashboard/   # Dashboard Page
│   ├── login/       # Login Page
│   └── ...
├── components/      # React Components
├── lib/
│   ├── db/         # Database Connections
│   ├── services/   # Backend Services
│   ├── middleware/ # Auth Middleware
│   └── client/     # Client-Side API
└── i18n/           # Translations
```

## 🔧 Wichtige Commands

```bash
# Development
npm run dev

# Production Build
npm run build
npm start

# Type Check
npm run build  # zeigt TypeScript Fehler
```

## 📖 Vollständige Dokumentation

Siehe [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md) für:
- Detaillierte Migrations-Anleitung
- API Dokumentation
- Page-Konvertierung Beispiele
- Troubleshooting

## 🎯 Status

### ✅ Komplett:
- Backend API (alle Routes)
- Datenbank-Integration
- Authentication & JWT
- Login & Register Pages
- Dashboard (Basis)
- MUI Theme & i18n

### 🚧 In Arbeit:
- Admin Panel (muss von React Router konvertiert werden)
- Leaderboard Page
- Profile Page
- Session Details
- Alle Dashboard-Widgets

Siehe `MIGRATION_GUIDE.md` für Details zur Fertigstellung.

## 🤝 Development

1. Alle API Routes sind unter `/api/*` verfügbar
2. Frontend Pages unter `/app/*`
3. Komponenten können direkt aus dem alten Projekt übernommen werden
4. Nur Routing muss angepasst werden (React Router → Next.js)

## 📝 Environment Variables

Alle Variablen sind in `.env.local`:
- `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD`
- `MEYTON_DB_*` - Meyton Database Connection
- `JWT_SECRET` - JWT Signierung
- `NODE_ENV` - development/production

## 🐛 Troubleshooting

**Port bereits in Verwendung:**
```bash
lsof -ti:3000 | xargs kill -9
```

**Database Connection Error:**
```bash
docker ps  # Prüfe ob PostgreSQL läuft
docker-compose restart
```

**TypeScript Errors:**
```bash
npm run build  # Zeigt alle Fehler
```

## 📄 License

Dieses Projekt ist für den internen Gebrauch im Schützenverein.

---

**Entwickelt mit ❤️ für den Schützenverein**
