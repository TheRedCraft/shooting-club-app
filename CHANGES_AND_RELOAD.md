# Wann werden Änderungen übernommen?

## Development-Modus (npm run dev)

Wenn du die App im **Development-Modus** startest:

```bash
cd nextjs-app
npm run dev
```

### ✅ Automatisch übernommen (Hot Reload):
- **React-Komponenten** (.tsx, .ts Dateien) - Sofort, ohne Neustart
- **Styling-Änderungen** (CSS, MUI sx props) - Sofort
- **API Routes** - Automatisch neu kompiliert
- **Übersetzungen** (translations.ts) - Automatisch neu geladen

### ⚠️ Benötigt Neustart:
- **Environment Variables** (.env.local) - Server neu starten
- **next.config.ts** - Server neu starten
- **package.json** (neue Dependencies) - `npm install` + Neustart

---

## Production-Modus (PM2 / npm start)

Wenn die App im **Production-Modus** läuft (mit PM2):

```bash
pm2 start ecosystem.config.js
# Oder: npm start
```

### ❌ Änderungen werden NICHT automatisch übernommen!

Du musst nach Änderungen **immer neu bauen und neu starten**:

### Workflow für Änderungen:

1. **Code ändern** (z.B. in `.tsx` Dateien)

2. **Production Build erstellen:**
```bash
cd /home/raspap/shooting-club-app/nextjs-app
npm run build
```

3. **PM2 neu starten:**
```bash
pm2 restart shooting-club-app
```

### Schneller Workflow (alles in einem):
```bash
cd /home/raspap/shooting-club-app/nextjs-app && npm run build && pm2 restart shooting-club-app
```

---

## Was benötigt einen Neustart?

### ✅ Benötigt Neustart:
- **Alle Code-Änderungen** (.tsx, .ts, .tsx Dateien)
- **Übersetzungen** (translations.ts)
- **Styling-Änderungen**
- **API Routes**
- **Environment Variables** (.env.local)
- **Konfigurationsdateien** (next.config.ts, etc.)

### ⚠️ Benötigt zusätzlich `npm install`:
- **Neue Dependencies** in package.json
- **Aktualisierte Packages**

---

## Empfohlener Workflow

### Für schnelle Tests (Development):
```bash
# Terminal 1: Development Server
cd nextjs-app
npm run dev

# Änderungen werden automatisch übernommen!
```

### Für Production-Updates:
```bash
# 1. Code ändern
# 2. Build erstellen
cd /home/raspap/shooting-club-app/nextjs-app
npm run build

# 3. PM2 neu starten
pm2 restart shooting-club-app

# 4. Logs prüfen
pm2 logs shooting-club-app
```

---

## Automatisches Deployment Script

Erstelle `update-app.sh` für einfache Updates:

```bash
#!/bin/bash
cd /home/raspap/shooting-club-app/nextjs-app
echo "📦 Installiere Dependencies..."
npm install
echo "🔨 Erstelle Production Build..."
npm run build
if [ $? -eq 0 ]; then
    echo "✅ Build erfolgreich! Starte App neu..."
    pm2 restart shooting-club-app
    echo "✅ App neu gestartet!"
    pm2 logs shooting-club-app --lines 20
else
    echo "❌ Build fehlgeschlagen!"
    exit 1
fi
```

Verwendung:
```bash
chmod +x update-app.sh
./update-app.sh
```

---

## Zusammenfassung

| Modus | Änderungen übernommen? | Neustart nötig? |
|-------|----------------------|-----------------|
| **Development** (`npm run dev`) | ✅ Automatisch (Hot Reload) | ❌ Nein |
| **Production** (`npm start` / PM2) | ❌ Nein | ✅ Ja (nach Build) |

**Wichtig:** In Production immer `npm run build` vor dem Neustart!

