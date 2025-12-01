#!/bin/bash

echo "🔄 Shooting Club App - Update Script"
echo "====================================="
echo ""

cd "$(dirname "$0")/nextjs-app" || exit

echo "📦 Installiere Dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ npm install fehlgeschlagen!"
    exit 1
fi

echo ""
echo "🔨 Erstelle Production Build..."
npm run build

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Build erfolgreich!"
    echo ""
    echo "🔄 Starte App neu..."
    pm2 restart shooting-club-app
    
    if [ $? -eq 0 ]; then
        echo ""
        echo "✅ App erfolgreich neu gestartet!"
        echo ""
        echo "📊 Status:"
        pm2 status shooting-club-app
        echo ""
        echo "📝 Letzte Logs (20 Zeilen):"
        pm2 logs shooting-club-app --lines 20 --nostream
    else
        echo "❌ PM2 Restart fehlgeschlagen!"
        exit 1
    fi
else
    echo ""
    echo "❌ Build fehlgeschlagen! Bitte Fehler beheben."
    exit 1
fi

