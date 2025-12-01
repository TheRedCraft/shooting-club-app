# Trend-Charts Feature - Dokumentation

## Übersicht
Die Dashboard-Statistik-Kacheln sind jetzt interaktiv und zeigen beim Klick detaillierte Trend-Diagramme, die die Entwicklung der Leistung über verschiedene Zeiträume visualisieren.

## Implementierte Features

### 1. **Interaktive Dashboard-Kacheln**
**Datei:** `/src/app/dashboard/page.tsx`

Alle vier Haupt-Statistik-Kacheln sind jetzt klickbar:
- **Total Sessions** - Zeigt Anzahl der Sessions pro Zeitraum
- **Total Shots** - Zeigt Anzahl der Schüsse pro Zeitraum
- **Average Score** - Zeigt durchschnittlichen Score-Verlauf
- **Best Score** - Zeigt beste Scores im Zeitverlauf

**Visuelle Hinweise:**
- ✅ Hover-Effekt (Kachel hebt sich leicht an)
- ✅ "📈 Trend anzeigen" Text unter jeder Statistik
- ✅ Cursor ändert sich zu Pointer
- ✅ Sanfte Animationen

### 2. **Trend-Analyse API**
**Datei:** `/src/app/api/dashboard/trends/route.ts`

Neuer API-Endpunkt für Trend-Daten mit folgenden Features:

**Query-Parameter:**
- `metric` - Welche Metrik analysiert werden soll:
  - `score` - Durchschnittlicher Score
  - `sessions` - Anzahl Sessions
  - `shots` - Anzahl Schüsse
  - `bestScore` - Beste Scores
  - `consistency` - Konsistenz (Standardabweichung)
  
- `period` - Gruppierung der Daten:
  - `daily` - Täglich
  - `weekly` - Wöchentlich (nach Kalenderwochen)
  - `monthly` - Monatlich
  
- `limit` - Anzahl der Zeiträume (Standard: 12)

**API Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "Nov 24",
      "value": 285.5,
      "count": 15,
      "date": "2024-11-01T00:00:00.000Z"
    }
  ],
  "metric": "score",
  "period": "monthly",
  "totalSessions": 120
}
```

### 3. **Trend-Dialog-Komponente**
**Datei:** `/src/components/TrendDialog.tsx`

Eine umfassende Dialog-Komponente mit folgenden Features:

#### Chart-Typen
- **Liniendiagramm** - Zeigt kontinuierliche Entwicklung
- **Balkendiagramm** - Zeigt diskrete Vergleiche
- **Flächendiagramm** - Zeigt Entwicklung mit visueller Betonung

#### Interaktive Controls
- **Zeitraum-Auswahl**: Täglich, Wöchentlich, Monatlich
- **Chart-Typ-Auswahl**: Linie, Balken, Fläche
- **Responsive Design**: Optimiert für Desktop und Mobile

#### Statistik-Zusammenfassung
Am unteren Rand des Dialogs werden folgende Kennzahlen angezeigt:
- **Aktuellster Wert** - Letzter gemessener Wert
- **Durchschnitt** - Durchschnitt über alle Perioden
- **Höchster/Niedrigster Wert** - Extremwerte
- **Entwicklung** - Prozentuale Veränderung vom ersten zum letzten Wert
  - ↑ = Verbesserung (grün)
  - ↓ = Verschlechterung (rot)

### 4. **Recharts Integration**
Die Komponenten verwenden die Recharts-Bibliothek (bereits installiert):
- Responsive Charts
- Interaktive Tooltips
- Animationen
- Professionelle Visualisierung

## Verwendung

### Als Benutzer

1. **Dashboard öffnen**
2. **Auf eine Statistik-Kachel klicken** (z.B. "Average Score")
3. **Trend-Dialog öffnet sich automatisch**
4. **Zeitraum wählen**:
   - Täglich - Für detaillierte Kurzzeitanalyse
   - Wöchentlich - Für mittelfristige Trends
   - Monatlich - Für langfristige Entwicklung
5. **Chart-Typ wählen**:
   - Linie - Für kontinuierliche Trends
   - Balken - Für Perioden-Vergleiche
   - Fläche - Für visuell betonte Trends
6. **Statistiken analysieren** am unteren Rand
7. **Dialog schließen** mit "Schließen"-Button

### Als Entwickler

#### Trend-Dialog verwenden:
```tsx
import TrendDialog from '@/components/TrendDialog';

<TrendDialog
  open={trendDialogOpen}
  onClose={handleCloseTrendDialog}
  metric="score"  // 'score' | 'sessions' | 'shots' | 'bestScore' | 'consistency'
  title="Average Score"
/>
```

#### API aufrufen:
```typescript
const response = await api.get('/api/dashboard/trends', {
  params: {
    metric: 'score',
    period: 'monthly',
    limit: 12
  }
});
```

## Technische Details

### Algorithmen

#### Gruppierung nach Zeiträumen
```typescript
// Daily: YYYY-MM-DD
key = sessionDate.toISOString().split('T')[0];

// Weekly: Kalenderwochen
const weekStart = new Date(sessionDate);
weekStart.setDate(sessionDate.getDate() - sessionDate.getDay());

// Monthly: YYYY-MM
key = `${year}-${month.padStart(2, '0')}`;
```

#### Metriken-Berechnung
- **Score**: Durchschnitt aller Scores im Zeitraum
- **Sessions**: Anzahl der Sessions
- **Shots**: Summe aller Schüsse
- **Best Score**: Maximum aller Scores
- **Consistency**: Standardabweichung der Scores (niedriger = besser)

### Performance
- Daten werden erst beim Öffnen des Dialogs geladen
- Caching auf Client-Seite während Dialog-Session
- Effiziente Gruppierung mit Map-Datenstruktur
- Sortierung und Limitierung auf Server-Seite

### Responsive Design
**Desktop:**
- Volle Dialog-Breite (maxWidth: 'lg')
- Controls nebeneinander
- Chart-Höhe: 400px
- Vollständige Labels

**Mobile:**
- Fullscreen-Dialog
- Controls untereinander gestapelt
- Chart-Höhe: 300px
- Kompakte Icons in Controls
- 45° gedrehte X-Achsen-Labels

## Erweiterungsmöglichkeiten

### 1. Vergleichsansicht
Zwei Metriken gleichzeitig im selben Chart anzeigen:
```typescript
<LineChart>
  <Line dataKey="score" stroke="blue" />
  <Line dataKey="bestScore" stroke="green" />
</LineChart>
```

### 2. Export-Funktion
Trend-Daten als CSV oder PNG exportieren:
```typescript
const exportTrend = () => {
  // Chart als PNG speichern
  html2canvas(chartRef.current).then(canvas => {
    canvas.toBlob(blob => {
      saveAs(blob, 'trend.png');
    });
  });
};
```

### 3. Ziel-Linie
Persönliches Ziel als horizontale Linie im Chart:
```typescript
<ReferenceLine y={targetScore} stroke="red" strokeDasharray="3 3" />
```

### 4. Prognose
Trend-Prognose basierend auf historischen Daten:
```typescript
const predictedValue = calculateLinearRegression(trendData);
```

### 5. Vergleich mit Clubdurchschnitt
Eigenen Trend mit Club-Durchschnitt vergleichen:
```typescript
<Line dataKey="myScore" stroke="blue" name="Ich" />
<Line dataKey="clubAverage" stroke="gray" name="Club Ø" strokeDasharray="5 5" />
```

## Chart-Bibliothek

### Recharts Features
Die verwendete Recharts-Bibliothek bietet:
- ✅ Responsive Container
- ✅ Animationen
- ✅ Interaktive Tooltips
- ✅ Grid-Linien
- ✅ Legenden
- ✅ Verschiedene Chart-Typen
- ✅ Farbgradienten
- ✅ Customizable Achsen

### Verwendete Komponenten
- `LineChart` - Liniendiagramme
- `BarChart` - Balkendiagramme
- `AreaChart` - Flächendiagramme
- `ResponsiveContainer` - Automatische Größenanpassung
- `Tooltip` - Interaktive Hover-Informationen
- `Legend` - Chart-Legende
- `CartesianGrid` - Hintergrund-Gitter

## Troubleshooting

### Dialog öffnet sich nicht
- Prüfe Browser-Console auf JavaScript-Fehler
- Stelle sicher, dass `open={true}` gesetzt ist
- Verifiziere, dass die Komponente importiert ist

### Keine Daten im Chart
- Überprüfe API-Response in Network-Tab
- Stelle sicher, dass Sessions im gewählten Zeitraum existieren
- Prüfe, ob der Benutzer verlinkt ist

### Chart wird nicht korrekt dargestellt
- Stelle sicher, dass Recharts korrekt installiert ist: `npm install recharts`
- Prüfe Browser-Kompatibilität (moderne Browser erforderlich)
- Responsive Container benötigt eine definierte Höhe

### Performance-Probleme
- Reduziere `limit` Parameter (weniger Datenpunkte)
- Verwende monatliche statt tägliche Gruppierung
- Cache API-Responses auf Client-Seite

## Dateien

### Neue Dateien
- `/src/app/api/dashboard/trends/route.ts` - API-Endpunkt
- `/src/components/TrendDialog.tsx` - Dialog-Komponente
- `/TREND_CHARTS_FEATURE.md` - Diese Dokumentation

### Geänderte Dateien
- `/src/app/dashboard/page.tsx` - Dashboard mit klickbaren Kacheln
- `/src/lib/client/api.ts` - API-Client erweitert
- `/package.json` - Recharts bereits vorhanden

## Best Practices

1. **Sinnvolle Zeiträume wählen**
   - Täglich: Für letzte 30 Tage
   - Wöchentlich: Für letzte 12 Wochen
   - Monatlich: Für letztes Jahr

2. **Metriken kombinieren**
   - Score + Consistency zusammen betrachten
   - Sessions + Shots für Trainingsintensität

3. **Trends interpretieren**
   - Aufwärtstrend bei Score = Verbesserung ✅
   - Abwärtstrend bei Consistency = Verbesserung ✅
   - Schwankungen sind normal

4. **Datenqualität**
   - Mindestens 5-10 Datenpunkte für aussagekräftige Trends
   - Regelmäßiges Training für bessere Trends

