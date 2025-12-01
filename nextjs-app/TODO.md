# 📋 TODO Liste - Shooting Club App

## 🚀 Status: In Entwicklung
**Letzte Aktualisierung:** 30. November 2024

---

## ✅ Erledigte Aufgaben

### Migration & Grundstruktur
- [x] React/Express App zu Next.js migriert
- [x] Backend Port auf 3001 geändert
- [x] Alle API Routes zu Next.js API Routes konvertiert
- [x] Authentication mit JWT implementiert
- [x] Protected Routes implementiert
- [x] AuthContext erstellt

### Admin Panel
- [x] Admin Panel Grundstruktur erstellt
- [x] User Management implementiert
- [x] Pending Users Tab (Freigabe von neuen Accounts)
- [x] Link Users Tab (Verknüpfung mit Meyton Schützen)
- [x] Admin-Rolle in Datenbank implementiert (`is_admin`)

### Meyton Integration
- [x] Meyton MySQL Datenbank (SSMDB2) angebunden
- [x] Shooter-Daten von Meyton abrufen
- [x] Sessions und Schüsse von Meyton abrufen
- [x] Score-Formatierung (Ring01/TotalRing01 → Dezimal)
- [x] Shooter ID Format auf `Nachname|Vorname` umgestellt
- [x] Deduplizierung von Schützen nach Namen

### Datenbank Schema
- [x] PostgreSQL Schema aktualisiert
- [x] `is_admin` Spalte hinzugefügt
- [x] `is_linked` Spalte hinzugefügt
- [x] `shooter_id` Spalte hinzugefügt (Format: `Nachname|Vorname`)
- [x] Alte `user_shooter_links` Tabelle deprecated
- [x] Alle API Routes auf neues Schema migriert

### UI/UX
- [x] Dashboard mit Statistiken
- [x] Leaderboard
- [x] Profile Seite
- [x] Pending Link Seite (für nicht-verknüpfte User)
- [x] Admin Panel mit Tabs
- [x] Suchfunktion im Link Users Tab

### Berechtigungen & Zugriffskontrolle
- [x] Unlinked Users können nur auf `/pending-link` zugreifen
- [x] Admins haben Zugriff auf alle Seiten
- [x] Linked Users haben Zugriff auf Dashboard/Leaderboard/Profile

---

## 🔥 Hochpriorität (Kritische Bugs & Sicherheit)

### Schussbild-Visualisierung (TEILWEISE ERLEDIGT, BUGS OFFEN!)
- [x] **Meyton X/Y Koordinaten auslesen**
  - ✅ API Endpoint erstellt: `/api/sessions/[id]/shots`
  - ✅ X/Y Koordinaten, Ring, Teiler pro Schuss werden abgerufen
  - ✅ Koordinaten-Konvertierung: 1/100mm → mm (korrekt für LG & KK)
  
- [x] **Canvas Scheiben-Renderer** erstellt
  - ✅ Komponente: `TargetVisualization.tsx`
  - ✅ LG 10m Scheibe mit korrekten ISSF Maßen (Ring 10: 0.5mm Ø)
  - ✅ KK 50m Scheibe mit korrekten ISSF Maßen (Ring 10: 10.4mm Ø, Innenzehn: 5.0mm Ø)
  - ✅ Schüsse als farbige Punkte mit Nummern
  - ✅ Zoom-Funktion (Slider 2x-10x)
  - ✅ Automatische Disziplin-Erkennung (LG vs KK)
  
- [x] **Schuss-Analyse Algorithmen**
  - ✅ Teiler-Berechnung implementiert
  - ✅ Streuwert-Berechnung (Standardabweichung X/Y)
  - ✅ Mittelpunkt-Berechnung
  - ✅ Verschiebungs-Vektor & Offset
  - ✅ Tendenz-Analyse (Quadranten)
  - ✅ Utility-Datei: `src/lib/utils/shotAnalysis.ts`
  
- [x] **Session Details Modal** erstellt
  - ✅ Modal-Komponente: `SessionDetailsModal.tsx`
  - ✅ Trefferbild Visualisierung mit allen Features
  - ✅ Statistiken-Panels (Teiler, Streuung, Verschiebung)
  - ✅ Toggle-Optionen (Teiler-Linie, Streukreis, Mittelpunkt)
  - ✅ Link vom Dashboard (Details-Button)
  
- [x] **Ring-Display Toggle** implementiert
  - ✅ Globaler Context: `RingModeContext.tsx`
  - ✅ LocalStorage Persistenz
  - ✅ Dashboard-Toggle für globale Einstellung
  - ✅ Modal-Toggle für lokale Ansicht
  - ✅ Korrekte Formatierung (Normal: Math.floor, Decimal: .toFixed(1))

### ⚠️ **OFFENE BUGS - Schussbild-Visualisierung**
- [ ] **🐛 KK Scheiben-Darstellung fehlerhaft**
  - **Problem:** Proportionen, Schussabstände oder Skalierung stimmen nicht
  - **Status:** Koordinaten sind korrekt (1/100mm → mm), Scale angepasst (LG: 5px/mm, KK: 3.5px/mm)
  - **Weitere Analyse nötig:**
    - Sind die ISSF-Maße für KK korrekt implementiert? (10.4mm + 8.0mm Ringabstand)
    - Stimmt die Schussgröße? (KK: 1.2mm vs LG: 1.0mm)
    - Canvas-Rendering korrekt?
    - Zoom-Level optimal?
  - **Nächste Schritte:**
    - Mit echten KK-Daten testen
    - Visueller Vergleich mit Meyton-System
    - Ggf. alternative Skalierungsfaktoren testen
  - **Dateien:** `TargetVisualization.tsx`, `SessionDetailsModal.tsx`

### Sicherheit
- [ ] **JWT Token Expiration** implementieren
  - Aktuell: Tokens laufen nie ab
  - TODO: Expiration Zeit setzen (z.B. 7 Tage)
  - TODO: Refresh Token Mechanismus implementieren
  
- [ ] **Rate Limiting** für API Routes
  - Schutz vor Brute-Force Attacken auf `/api/auth/login`
  - Schutz vor API Spam
  
- [ ] **Input Validation** verbessern
  - Zod oder Yup Schema Validation für alle API Inputs
  - XSS Protection
  
- [ ] **Password Policy** implementieren
  - Mindestlänge, Komplexität prüfen
  - Aktuell: Keine Validierung

### Datenbank
- [ ] **Alte Tabellen aufräumen**
  - `user_shooter_links` Tabelle entfernen (deprecated)
  - `meyton_shooters` Tabelle prüfen (wird sie noch gebraucht?)
  - Migration Script für bestehende Produktions-Daten

- [ ] **Database Indexes** optimieren
  - Index auf `users.shooter_id`
  - Index auf `users.is_linked`
  - Performance-Tests durchführen

### Fehlerbehandlung
- [x] **Error Boundaries** in React ✅
  - ✅ Loading Skeletons für Dashboard
  - ✅ Error Messages mit Retry-Button
  - ✅ Empty State für keine Sessions
  - [ ] Globale Error Boundary Komponente (noch offen)
  
- [ ] **API Error Logging**
  - Strukturiertes Logging (Winston/Pino)
  - Error Tracking (Sentry?)

---

## 🎯 Hohe Priorität (Features & Verbesserungen)

### Admin Panel
- [ ] **User bearbeiten** Funktion
  - Username/Email ändern
  - Password zurücksetzen
  
- [ ] **User löschen** Funktion
  - Mit Bestätigungs-Dialog
  - GDPR-konform (alle Daten löschen)

### Dashboard
- [x] **Zeitfilter** für Statistiken ✅
  - ✅ Letzte 7 Tage, 30 Tage, 90 Tage, Jahr, Gesamt
  - ✅ Dropdown mit FilterList Icon
  - ✅ API Routes unterstützen timeRange Parameter
  
- [x] **Erweiterte Statistiken anzeigen** ✅
  - ✅ Bester Teiler (kleinster Abstand zwischen zwei Schüssen)
  - ✅ Streuwerte (Standardabweichung X/Y)
  - ✅ Durchschnittliche Verschiebung vom Zentrum
  - ✅ Farbige Cards mit Icons
  - [ ] Ringverteilung visualisieren (noch offen)
  
- [x] **Ring-Anzeigemodus** ✅
  - ✅ Toggle zwischen Zentelringen (10.5) und normalen Ringen (10)
  - ✅ User-Präferenz in LocalStorage gespeichert
  - ✅ In allen Ansichten konsistent (Dashboard, Modal)
  
- [ ] **Charts/Diagramme** verbessern
  - Score Trend über Zeit (Liniendiagramm)
  - Schussverteilung (Balkendiagramm)
  - Vergleich mit Durchschnitt des Vereins
  
- [ ] **Export Funktion**
  - Statistiken als PDF exportieren
  - Sessions als CSV exportieren

### Leaderboard
- [ ] **Filter-Optionen**
  - Nach Disziplin filtern
  - Nach Zeitraum filtern

  
- [ ] **Mehr Statistiken**
  - Beste Serie
  - Konsistenz-Score
  - Improvement Rate (Verbesserung über Zeit)

### Profile
- [ ] **Eigene Daten bearbeiten**
  - Email ändern
  - Password ändern
  - Profil-Bild hochladen?
  
- [ ] **Session Details Ansicht** (HOCHPRIORITÄT)
  - Gezeichnete Scheibe mit allen Schüssen visualisieren
  - X/Y Koordinaten aus Meyton DB verwenden
  - Schüsse als Punkte auf der Scheibe darstellen
  - Nummerierung der Schüsse (Reihenfolge)
  - Farbcodierung nach Score (10er = grün, 9er = gelb, etc.)
  
- [ ] **Erweiterte Trefferbild-Analyse**
  - **Teiler anzeigen**: Linie zwischen zwei nächsten Schüssen mit Abstand
  - **Tendenz-Anzeige**: Verteilung der Schüsse visualisieren
    - Oben/Unten Tendenz
    - Links/Rechts Tendenz
    - Heatmap-ähnliche Darstellung
  - **Streukreis**: Kreis um alle Schüsse mit Radius = Standardabweichung
  - **Mittelpunkt**: Durchschnittliche Position aller Schüsse
  - **Verschiebung**: Vektor vom Zentrum zum Mittelpunkt der Schüsse
  
- [ ] **Statistiken pro Session**
  - Bester Teiler (kleinster Abstand zwischen zwei Schüssen)
  - Schlechtester Teiler (größter Abstand)
  - Durchschnittlicher Teiler
  - Streuwert X-Achse (Standardabweichung)
  - Streuwert Y-Achse (Standardabweichung)
  - Gesamtstreuwert (kombiniert)
  - Durchschnittliche Verschiebung vom Zentrum (X/Y)
  - Verschiebungs-Richtung (z.B. "2.3mm nach rechts, 1.1mm nach oben")
  
- [ ] **Vergleichs-Ansichten**
  - Mehrere Sessions nebeneinander vergleichen
  - Entwicklung von Streuung über Zeit
  - Tendenz-Verbesserung visualisieren
  
- [ ] **Persönliche Statistiken**
  - Beste Session ever
  - Durchschnitt letzter Monat vs. diesen Monat
  - Zielerreichung (wenn Ziele gesetzt wurden)

---

## 💡 Mittlere Priorität (Nice-to-Have)

### Internationalisierung
- [ ] **Sprachen-Unterstützung**
  - Deutsch ✅ (teilweise vorhanden)
  - Englisch ✅ (teilweise vorhanden)
  - Konsistente Übersetzungen überall
  
- [ ] **i18n Library** integrieren
  - next-i18next oder next-intl
  - Sprache per User-Einstellung

### Benachrichtigungen
- [ ] **In-App Benachrichtigungen**
  - Neue Bestleistung
  - Neue Position im Leaderboard
  - Admin-Nachrichten

### Gamification
- [ ] **Achievements/Badges**
  - "100 Sessions geschossen"
  - "Erste 10er Serie"
  - "Konstanz-Meister"
  
- [ ] **Challenges**
  - Wöchentliche Challenges
  - Challenges zwischen Mitgliedern

### Social Features
- [ ] **Kommentare** zu Sessions
  - "Was lief heute gut/schlecht?"
  
- [ ] **Team/Gruppe** Funktionalität
  - Teams erstellen
  - Team-Leaderboard
  - Team-Statistiken

### Mobile App
- [ ] **Progressive Web App (PWA)**
  - Installierbar auf Smartphone
  - Offline-Fähigkeit
  - Push-Benachrichtigungen
  
---


## 📊 Niedrige Priorität (Zukunft)

### Features
- [ ] **KI-gestützte Tipps** (Verbesserungsvorschläge mit OpenRouter API)
- [ ] **Statistik-Export** für Trainer

---

## 🐛 Bekannte Bugs

### Kritisch
- (keine bekannt)

### Wichtig
- (keine bekannt)

### Klein
- [ ] **Dashboard**: Loading State bei langsamer Meyton DB
- [ ] **Admin Panel**: Keine Rückmeldung wenn Linking fehlschlägt (außer Console)

---

## 📝 Notizen & Ideen

### Architektur-Überlegungen
- Sollten wir Meyton Daten in unserer DB cachen?
  - Pro: Schneller, weniger Load auf Meyton DB
  - Contra: Sync-Probleme, mehr Speicher
  
- Multi-Tenancy für mehrere Vereine?
  - Aktuell: Single-Tenant
  - Könnte interessant sein für SaaS-Modell

### Design-Ideen
- Dark Mode implementieren?
- Mobile-First Design überarbeiten
- Barrierefreiheit (WCAG 2.1) verbessern

### Business-Ideen
- Premium Features?
- White-Label Version für andere Vereine?
- API für Drittanbieter-Integration?

---

## 🔄 Update Log

### 2024-11-30
- ✅ Dashboard erweiterte Statistiken implementiert (Teiler, Streuung, Verschiebung)
- ✅ Zeitfilter für Dashboard hinzugefügt (7/30/90 Tage, Jahr, Gesamt)
- ✅ Session-basierte Analyse für Recent Sessions
- ✅ Loading States & Error Handling verbessert
- ✅ Schussbild-Visualisierung implementiert (LG & KK Targets)
- ⚠️ KK Scheiben-Darstellung Bug identifiziert (weitere Analyse nötig)

### 2024-11-29
- TODO Liste erstellt
- Migration zu Next.js abgeschlossen
- Admin Panel MVP fertiggestellt
- Shooter ID Format auf `Nachname|Vorname` umgestellt
- Alle API Routes auf neues DB Schema migriert
- Protected Routes für unlinked Users implementiert

---