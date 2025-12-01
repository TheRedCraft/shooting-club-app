# Gewichtete Durchschnitte - Implementierung

## Problem
Bei der Berechnung von durchschnittlichen Werten (Streuung, Verschiebung) wurden alle Sessions gleich gewichtet, unabhängig von der Anzahl der Schüsse. Das führte zu ungenauen Durchschnitten:

### Beispiel (ohne Gewichtung):
```
Session 1: 60 Schüsse, Streuung = 10mm
Session 2: 10 Schüsse, Streuung = 30mm
Falscher Durchschnitt = (10 + 30) / 2 = 20mm
```

Session 2 mit nur 10 Schüssen hatte das gleiche Gewicht wie Session 1 mit 60 Schüssen!

## Lösung: Gewichtete Durchschnitte

### Formel
```
Gewichteter Durchschnitt = (Summe(Wert * Anzahl Schüsse)) / (Summe(Anzahl Schüsse))
```

### Beispiel (mit Gewichtung):
```
Session 1: 60 Schüsse, Streuung = 10mm → 10 * 60 = 600
Session 2: 10 Schüsse, Streuung = 30mm → 30 * 10 = 300
Korrekter Durchschnitt = (600 + 300) / (60 + 10) = 900 / 70 = 12.86mm
```

Viel genauer! Session 1 hat mehr Einfluss, weil sie mehr Schüsse hat.

## Implementierte Änderungen

### 1. Trend-API (`/api/dashboard/trends`)

**Datei:** `/src/app/api/dashboard/trends/route.ts`

#### avgSpread (Durchschnittliche Streuung)
```typescript
// VORHER (falsch):
const spreadValues: number[] = [];
spreadValues.push(analysis.spread.total);
value = spreadValues.reduce((sum, v) => sum + v, 0) / spreadValues.length;

// NACHHER (korrekt):
let totalSpreadWeighted = 0;
let totalShotsForSpread = 0;

for (const session of periodSessions) {
  // ... analyse ...
  totalSpreadWeighted += analysis.spread.total * sessionShots.length;
  totalShotsForSpread += sessionShots.length;
}

value = totalSpreadWeighted / totalShotsForSpread;
```

#### avgOffset (Durchschnittliche Verschiebung)
```typescript
// VORHER (falsch):
const offsetValues: number[] = [];
offsetValues.push(analysis.center.offset);
value = offsetValues.reduce((sum, v) => sum + v, 0) / offsetValues.length;

// NACHHER (korrekt):
let totalOffsetWeighted = 0;
let totalShotsForOffset = 0;

for (const session of periodSessions) {
  // ... analyse ...
  totalOffsetWeighted += analysis.center.offset * sessionShots.length;
  totalShotsForOffset += sessionShots.length;
}

value = totalOffsetWeighted / totalShotsForOffset;
```

### 2. Stats-API (`/api/dashboard/stats`)

**Datei:** `/src/app/api/dashboard/stats/route.ts`

#### avgSpread
```typescript
// VORHER (falsch):
spreadValues.push(analysis.spread.total);
const avgSpread = spreadValues.reduce((a, b) => a + b, 0) / spreadValues.length;

// NACHHER (korrekt):
spreadValues.push({
  value: analysis.spread.total,
  shotCount: sessionShots.length
});

const avgSpread = spreadValues.length > 0 
  ? spreadValues.reduce((sum, s) => sum + (s.value * s.shotCount), 0) / 
    spreadValues.reduce((sum, s) => sum + s.shotCount, 0)
  : null;
```

#### avgOffset
```typescript
// VORHER (falsch):
offsetValues.push({
  x: analysis.center.x,
  y: analysis.center.y,
  distance: analysis.center.offset
});

const avgOffset = {
  x: offsetValues.reduce((sum, o) => sum + o.x, 0) / offsetValues.length,
  y: offsetValues.reduce((sum, o) => sum + o.y, 0) / offsetValues.length,
  distance: offsetValues.reduce((sum, o) => sum + o.distance, 0) / offsetValues.length
};

// NACHHER (korrekt):
offsetValues.push({
  x: analysis.center.x,
  y: analysis.center.y,
  distance: analysis.center.offset,
  shotCount: sessionShots.length
});

const avgOffset = {
  x: offsetValues.reduce((sum, o) => sum + (o.x * o.shotCount), 0) / 
     offsetValues.reduce((sum, o) => sum + o.shotCount, 0),
  y: offsetValues.reduce((sum, o) => sum + (o.y * o.shotCount), 0) / 
     offsetValues.reduce((sum, o) => sum + o.shotCount, 0),
  distance: offsetValues.reduce((sum, o) => sum + (o.distance * o.shotCount), 0) / 
           offsetValues.reduce((sum, o) => sum + o.shotCount, 0)
};
```

## Vorteile

### 1. **Genauigkeit**
Sessions mit mehr Schüssen haben mehr Einfluss auf den Durchschnitt → realistischere Werte

### 2. **Fairness**
Eine Session mit nur 5 Schüssen (z.B. Testschüsse) hat weniger Gewicht als eine vollständige 60-Schuss-Session

### 3. **Statistische Korrektheit**
Entspricht der Standardmethode für gewichtete Durchschnitte in der Statistik

## Anwendungsfälle

### Typische Szenarien:

**Szenario 1: Training vs. Wettkampf**
```
Training (20 Schüsse): Streuung = 15mm
Wettkampf (60 Schüsse): Streuung = 12mm

Ohne Gewichtung: (15 + 12) / 2 = 13.5mm ❌
Mit Gewichtung: (15*20 + 12*60) / (20+60) = 12.75mm ✅
```

**Szenario 2: Verschiedene Disziplinen**
```
LG 10m (40 Schüsse): Offset = 2mm
KK 50m (60 Schüsse): Offset = 5mm

Ohne Gewichtung: (2 + 5) / 2 = 3.5mm ❌
Mit Gewichtung: (2*40 + 5*60) / (40+60) = 3.8mm ✅
```

**Szenario 3: Unvollständige Sessions**
```
Session 1 (60 Schüsse): Streuung = 10mm
Session 2 (5 Schüsse - abgebrochen): Streuung = 25mm

Ohne Gewichtung: (10 + 25) / 2 = 17.5mm ❌ (stark verfälscht!)
Mit Gewichtung: (10*60 + 25*5) / (60+5) = 11.15mm ✅ (realistisch!)
```

## Betroffene Metriken

### ✅ Gewichtet (nach Anzahl Schüsse):
- **avgSpread** - Durchschnittliche Streuung
- **avgOffset** - Durchschnittliche Verschiebung
- **avgOffset.x** - X-Koordinate der Verschiebung
- **avgOffset.y** - Y-Koordinate der Verschiebung
- **avgOffset.distance** - Distanz der Verschiebung

### ℹ️ Nicht gewichtet (nach Anzahl Sessions):
- **avgScore** - Durchschnittlicher Score (Sessions sind Einheit)
- **bestScore** - Bester Score (Maximum-Funktion)
- **bestTeiler** - Bester Teiler (Minimum-Funktion)

## Mathematische Begründung

### Warum keine Gewichtung bei Scores?

**Score** wird pro Session gemessen, nicht pro Schuss:
```
Session 1: 60 Schüsse → Score: 590 Ringe
Session 2: 10 Schüsse → Score: 95 Ringe

Durchschnitt MUSS (590 + 95) / 2 = 342.5 Ringe sein
(Das ist der durchschnittliche Score pro Session)
```

Gewichtung wäre hier falsch, weil sie fragen würde: "Was ist der Score pro Schuss?" → Das ist nicht sinnvoll.

### Warum Gewichtung bei Streuung/Offset?

**Streuung/Offset** sind statistische Maße **über alle Schüsse**:
```
Session 1: 60 Schüsse → 60 Datenpunkte für Streuungsberechnung
Session 2: 10 Schüsse → 10 Datenpunkte für Streuungsberechnung

Gesamtstreuung über 70 Schüsse = Gewichteter Durchschnitt
```

## Testing

### Manuelle Überprüfung:
1. Erstelle 2 Sessions:
   - Session A: 60 Schüsse, Streuung = 10mm
   - Session B: 10 Schüsse, Streuung = 30mm

2. Überprüfe Dashboard-Statistiken:
   - Erwarteter Wert: ~12.86mm (nicht 20mm)

3. Überprüfe Trend-Diagramm:
   - Monat mit vielen Schüssen hat mehr Einfluss

### Automatisierte Tests (optional):
```typescript
describe('Weighted Averages', () => {
  it('should calculate weighted spread average correctly', () => {
    const sessions = [
      { spread: 10, shots: 60 },
      { spread: 30, shots: 10 }
    ];
    const weighted = (10*60 + 30*10) / (60+10);
    expect(weighted).toBeCloseTo(12.86);
  });
});
```

## Performance-Überlegungen

Die Gewichtung hat **keinen negativen Performance-Impact**:
- Gleiche Anzahl an Berechnungen
- Nur zusätzliche Multiplikationen (sehr schnell)
- Keine zusätzlichen Datenbankabfragen

## Backwards Compatibility

✅ **Vollständig kompatibel** - Die Änderung ist transparent für Frontend-Komponenten:
- API-Schnittstellen bleiben gleich
- Response-Format bleibt gleich
- Nur die Berechnungslogik wurde verbessert

## Geänderte Dateien

1. `/src/app/api/dashboard/trends/route.ts` - Trend-Berechnungen
2. `/src/app/api/dashboard/stats/route.ts` - Dashboard-Statistiken

## Nächste Schritte (optional)

### Weitere mögliche Gewichtungen:

1. **Zeitbasierte Gewichtung**: Neuere Sessions stärker gewichten
```typescript
const ageWeight = Math.exp(-daysSince / 90); // Exponentieller Abfall
```

2. **Qualitätsbasierte Gewichtung**: Vollständige Sessions höher gewichten
```typescript
const qualityWeight = actualShots / expectedShots;
```

3. **Disziplin-basierte Gewichtung**: Wettkampf-Sessions höher gewichten
```typescript
const disciplineWeight = isCompetition ? 1.5 : 1.0;
```

Diese erweiterten Gewichtungen würden das System noch genauer machen, sind aber nicht zwingend notwendig.

