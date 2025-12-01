# Leaderboard-System - Dokumentation

## Übersicht
Ein vollständiges Ranglisten-System mit gewichteten Statistiken, dynamischer Sortierung und Zeitfiltern.

## Features

### 1. **Gewichtete Statistiken** ✅
Alle Metriken berücksichtigen die unterschiedliche Anzahl von Schüssen:

- **Avg Score (Ringe/Schuss)**: Gesamtringe ÷ Gesamtschüsse
- **Best Score (Ringe/Schuss)**: Höchster Score pro Schuss in allen Sessions
- **Best Session Score**: Höchste Gesamtringe in einer einzelnen Session
- **Best Teiler**: Kleinster gemessener Teiler über alle Sessions

### 2. **Dynamische Sortierung** ✅
Fünf verschiedene Sortierkriterien:

| Kriterium | Beschreibung | Sortierung |
|-----------|--------------|------------|
| Durchschn. Score | Ringe pro Schuss (gewichtet) | Höher = besser |
| Bester Score | Höchste Ringe/Schuss | Höher = besser |
| Beste Session | Höchste Gesamtringe | Höher = besser |
| Bester Teiler | Kleinster Abstand | Niedriger = besser |
| Meiste Sessions | Anzahl Sessions | Mehr = besser |

### 3. **Zeitfilter** ✅
Vier Zeiträume verfügbar:

- **Gesamt**: Alle Sessions seit Beginn
- **30 Tage**: Letzte 30 Tage
- **90 Tage**: Letzte 3 Monate
- **365 Tage**: Letztes Jahr

### 4. **Ranking-System** ✅
- **Gold-Medaille** 🥇: Platz 1 (Gold mit schwarzer Schrift)
- **Silber-Medaille** 🥈: Platz 2 (Silber mit weißer Schrift)
- **Bronze-Medaille** 🥉: Platz 3 (Bronze mit weißer Schrift)
- **Nummerierte Ränge**: Platz 4+

### 5. **Persönliche Hervorhebung** ✅
- Eigener Rang wird farblich hervorgehoben
- "Du"-Badge neben dem eigenen Namen
- Persönliche Stats-Card am Seitenanfang
- Zeigt eigenen Rang, Score, Teiler, Sessions

## API-Endpunkt

### `/api/leaderboard`

**Query-Parameter:**
```typescript
{
  sortBy?: 'avgScore' | 'bestScore' | 'bestSessionScore' | 'bestTeiler' | 'totalSessions',
  timeRange?: 'all' | '30' | '90' | '365',
  limit?: number  // Standard: 50, Max: 50
}
```

**Response:**
```json
{
  "success": true,
  "leaderboard": [
    {
      "rank": 1,
      "userId": 5,
      "username": "max_shooter",
      "firstName": "Max",
      "lastName": "Mustermann",
      "sessionsCount": 45,
      "totalShots": 2700,
      "avgScore": 9.85,
      "bestScore": 10.2,
      "bestSessionScore": 595.5,
      "bestTeiler": 12.3,
      "memberSince": "2024-01-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "totalPlayers": 25,
    "sortBy": "avgScore",
    "timeRange": "all",
    "generatedAt": "2024-11-30T15:30:00.000Z"
  }
}
```

## Berechnungsmethoden

### 1. Average Score (Gewichtet)
```typescript
// Summe aller Ringe / Summe aller Schüsse
let totalRings = 0;
let totalShots = 0;

for (const session of sessions) {
  totalRings += session.total_score_decimal / 10;
  totalShots += session.shots_count;
}

avgScore = totalShots > 0 ? totalRings / totalShots : 0;
```

**Beispiel:**
```
Session 1: 60 Schüsse, 590 Ringe
Session 2: 40 Schüsse, 385 Ringe
Session 3: 20 Schüsse, 185 Ringe

avgScore = (590 + 385 + 185) / (60 + 40 + 20) 
         = 1160 / 120
         = 9.67 Ringe/Schuss
```

### 2. Best Score (Ringe/Schuss)
```typescript
// Höchster Score pro Schuss über alle Sessions
let bestScore = 0;

for (const session of sessions) {
  const scorePerShot = sessionTotalRings / session.shots_count;
  if (scorePerShot > bestScore) {
    bestScore = scorePerShot;
  }
}
```

**Beispiel:**
```
Session 1: 60 Schüsse, 590 Ringe → 9.83 Ringe/Schuss
Session 2: 10 Schüsse, 102 Ringe → 10.2 Ringe/Schuss ← BEST
Session 3: 40 Schüsse, 380 Ringe → 9.5 Ringe/Schuss

bestScore = 10.2
```

### 3. Best Session Score (Gesamtringe)
```typescript
// Höchste Gesamtringe in einer Session
let bestSessionScore = 0;

for (const session of sessions) {
  const totalRings = session.total_score_decimal / 10;
  if (totalRings > bestSessionScore) {
    bestSessionScore = totalRings;
  }
}
```

### 4. Best Teiler
```typescript
// Kleinster Teiler über alle Sessions
const teilerValues = sessions
  .map(s => s.best_teiler_raw ? s.best_teiler_raw / 10 : null)
  .filter(t => t !== null && t > 0);

bestTeiler = teilerValues.length > 0 ? Math.min(...teilerValues) : null;
```

## Frontend-Komponenten

### Hauptkomponenten

**1. Persönliche Stats-Card**
- Zeigt eigenen Rang mit Medaille/Nummer
- Schnellübersicht: Avg Score, Best Score, Best Teiler, Sessions
- Farblich hervorgehoben (primary.light)

**2. Filter-Bereich**
- Sortierung auswählen (5 Optionen)
- Zeitraum filtern (4 Optionen)
- Anzahl Spieler anzeigen
- Refresh-Button

**3. Leaderboard-Tabelle**
- Responsive Design
- Tooltips bei Icons
- Farbcodierung:
  - Gold/Silber/Bronze für Top 3
  - Primary für eigenen Eintrag
  - Success für beste Werte
- Hover-Effekte

### Spalten

| Spalte | Icon | Beschreibung | Format |
|--------|------|--------------|--------|
| Rang | 🏆 | Position im Ranking | Medaille/Nummer |
| Schütze | - | Name + Username | Text |
| Sessions | - | Anzahl Sessions | Ganzzahl |
| Schüsse | - | Gesamtschüsse | Tausendertrennzeichen |
| Ø Score | 📈 | Durchschn. Ringe/Schuss | 2 Dezimalstellen |
| Best | ⭐ | Bester Score | 2 Dezimalstellen |
| Top | 🎯 | Beste Session | 1 Dezimalstelle |
| Teiler* | 📏 | Bester Teiler | 1 Dezimalstelle + mm |

*Nur sichtbar wenn nach Teiler sortiert

## Verwendung

### Als Benutzer

1. **Leaderboard öffnen** über Navigation
2. **Filter anpassen**:
   - Sortierung wählen (z.B. "Bester Teiler")
   - Zeitraum wählen (z.B. "Letzte 30 Tage")
3. **Eigenen Rang sehen** in der hervorgehobenen Card oben
4. **Rangliste durchsehen**:
   - Gold/Silber/Bronze für Top 3
   - Eigener Eintrag ist farblich markiert
   - Hover für Details

### Als Entwickler

#### API aufrufen:
```typescript
import { leaderboardService } from '@/lib/client/api';

// Standard (Avg Score, Gesamt)
const response = await leaderboardService.getLeaderboard();

// Mit Filtern
const response = await leaderboardService.getLeaderboard(
  'bestTeiler',  // Sortierung
  '30',          // Zeitraum in Tagen
  25             // Limit
);

const { leaderboard, meta } = response.data;
```

#### Eigene Sortierung hinzufügen:

**Backend (`/api/leaderboard/route.ts`):**
```typescript
// 1. Neue Metrik zu Query-Parametern hinzufügen
const sortBy = searchParams.get('sortBy') || 'avgScore';

// 2. Metrik berechnen (in der for-Schleife)
let myNewMetric = 0;
// ... Berechnung ...

// 3. Zu leaderboardData hinzufügen
leaderboardData.push({
  // ... andere Felder ...
  myNewMetric: myNewMetric
});

// 4. Sortierung hinzufügen
leaderboardData.sort((a, b) => {
  switch (sortBy) {
    case 'myNewMetric':
      return b.myNewMetric - a.myNewMetric; // oder a - b für aufsteigend
    // ... andere cases ...
  }
});
```

**Frontend (`/app/leaderboard/page.tsx`):**
```typescript
// 1. Interface erweitern
interface LeaderboardEntry {
  // ... andere Felder ...
  myNewMetric: number;
}

// 2. Select Option hinzufügen
<MenuItem value="myNewMetric">Meine Neue Metrik</MenuItem>

// 3. TableCell hinzufügen (falls immer sichtbar)
<TableCell align="right">
  {entry.myNewMetric.toFixed(2)}
</TableCell>
```

## Performance

### Optimierungen

1. **Caching**: API-Response wird im Frontend gecacht während Filter-Session
2. **Lazy Loading**: Nur Top 50 werden standardmäßig geladen
3. **Parallele Berechnung**: Alle User-Stats werden parallel berechnet
4. **Zeitfilter**: Reduziert die Anzahl zu analysierender Sessions

### Ladezeiten (Beispiel)

- **10 Benutzer**: ~2-3 Sekunden
- **25 Benutzer**: ~5-7 Sekunden
- **50 Benutzer**: ~10-15 Sekunden

*Hängt ab von Sessions pro Benutzer und Server-Performance*

## Besonderheiten

### 1. Fairness durch Gewichtung
Sessions mit unterschiedlicher Schussanzahl werden fair behandelt:
```
Benutzer A: 10 Sessions × 60 Schüsse = 600 Schüsse
Benutzer B: 60 Sessions × 10 Schüsse = 600 Schüsse

→ Beide haben gleiche Gewichtung im Durchschnitt
```

### 2. Mehrere Sortier-Dimensionen
Erlaubt verschiedene Ranking-Perspektiven:
- Konsistenz → Avg Score
- Spitzenleistung → Best Score
- Aktivität → Total Sessions
- Präzision → Best Teiler

### 3. Zeitliche Relevanz
30-Tage-Filter zeigt aktuelle Form:
- Wer hat sich verbessert?
- Wer ist aktuell in Topform?
- Saisonale Vergleiche

## Zukünftige Erweiterungen (Optional)

### 1. Detailansicht
Klick auf Benutzer → Profil mit:
- Vollständige Statistiken
- Session-Historie
- Vergleich mit eigenem Profil

### 2. Kategorien
Separate Ranglisten für:
- LG 10m
- KK 50m
- Altersgruppen
- Geschlechter

### 3. Achievements/Badges
- 🏆 Top 3 des Monats
- 🎯 10er-Durchschnitt erreicht
- 📈 Größte Verbesserung
- 🔥 Längste Streak

### 4. Export
- PDF-Export der Rangliste
- CSV für Excel-Analyse
- Share-Link für soziale Medien

### 5. Live-Updates
- WebSocket für Echtzeit-Updates
- Benachrichtigung bei Rang-Änderung
- "Jemand hat dich überholt!"

## Troubleshooting

### Keine Daten sichtbar
**Problem**: Leere Tabelle
**Lösung**: 
- Prüfe ob Benutzer verlinkt sind (`is_linked = true`)
- Prüfe ob Sessions im gewählten Zeitraum existieren
- Prüfe Browser Console auf Fehler

### Falsche Sortierung
**Problem**: Reihenfolge macht keinen Sinn
**Lösung**:
- Prüfe `sortBy` Parameter in Network-Tab
- Für "Best Teiler": Niedriger = besser!
- Cache löschen und neu laden

### Performance-Probleme
**Problem**: Lange Ladezeiten
**Lösung**:
- Reduziere `limit` Parameter
- Verwende Zeitfilter (30 statt all)
- Prüfe Anzahl Sessions pro User

## Testing

### Manueller Test
1. Erstelle Testdaten mit verschiedenen Schussanzahlen
2. Wechsle Sortierung → Reihenfolge sollte sich ändern
3. Wechsle Zeitfilter → Anzahl Einträge sollte sich ändern
4. Prüfe eigenen Rang in Card und Tabelle

### Beispiel-Testdaten
```sql
-- User 1: Viele Schüsse, guter Durchschnitt
Sessions: 5 × 60 Schüsse, Avg: 9.5 Ringe/Schuss

-- User 2: Wenige Schüsse, exzellent
Sessions: 2 × 10 Schüsse, Avg: 10.2 Ringe/Schuss

-- User 3: Mittel
Sessions: 10 × 40 Schüsse, Avg: 9.2 Ringe/Schuss
```

Erwartetes Ranking (Avg Score):
1. User 2: 10.2
2. User 1: 9.5
3. User 3: 9.2

## Dateien

**Backend:**
- `/src/app/api/leaderboard/route.ts` - API-Endpunkt

**Frontend:**
- `/src/app/leaderboard/page.tsx` - Haupt-Komponente
- `/src/lib/client/api.ts` - API-Client

**Dokumentation:**
- `/LEADERBOARD_SYSTEM.md` - Diese Datei
- `/WEIGHTED_AVERAGES.md` - Gewichtungs-Details

## Zusammenfassung

Das Leaderboard-System bietet:
✅ Faire, gewichtete Statistiken
✅ Flexible Sortierung (5 Kriterien)
✅ Zeitfilter (4 Zeiträume)
✅ Visuell ansprechendes Design
✅ Persönliche Hervorhebung
✅ Performance-optimiert
✅ Erweiterbar für zukünftige Features

Perfekt für Wettbewerb und Motivation im Schützenverein! 🎯

