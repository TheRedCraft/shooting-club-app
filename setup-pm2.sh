#!/bin/bash

echo "🚀 Shooting Club App - PM2 Setup"
echo "================================"
echo ""

# Prüfe ob PM2 installiert ist
if ! command -v pm2 &> /dev/null; then
    echo "📦 PM2 wird installiert..."
    sudo npm install -g pm2
    echo "✅ PM2 installiert"
else
    echo "✅ PM2 ist bereits installiert"
fi

# Wechsle ins Next.js App Verzeichnis
cd "$(dirname "$0")/nextjs-app" || exit

echo ""
echo "📦 Dependencies werden installiert..."
npm install

echo ""
echo "🔨 Production Build wird erstellt..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build fehlgeschlagen! Bitte Fehler beheben."
    exit 1
fi

echo ""
echo "✅ Build erfolgreich!"
echo ""
echo "📝 Nächste Schritte:"
echo "1. Stelle sicher, dass deine .env.local Datei korrekt konfiguriert ist"
echo "2. Starte PM2 mit: pm2 start ../ecosystem.config.js"
echo "3. Speichere PM2 Konfiguration: pm2 save"
echo "4. Richte Auto-Start ein: pm2 startup (folge den Anweisungen)"
echo ""
echo "📚 Nützliche PM2 Befehle:"
echo "   pm2 status              - Status anzeigen"
echo "   pm2 logs shooting-club-app - Logs anzeigen"
echo "   pm2 restart shooting-club-app - App neu starten"
echo "   pm2 monit               - Monitoring Dashboard"
echo ""

