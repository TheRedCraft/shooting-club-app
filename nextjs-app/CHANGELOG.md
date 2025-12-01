# 📜 Changelog

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/),
und dieses Projekt folgt [Semantic Versioning](https://semver.org/lang/de/).

---

## [1.0.0] - 2024-11-29

### 🎉 Initial Release

#### ✨ Hinzugefügt
- **Next.js Migration**: Komplette Migration von React/Express zu Next.js 15
- **Authentication System**: JWT-basierte Authentifizierung mit bcrypt
- **User Management**: Registrierung, Login, Profilverwaltung
- **Admin Panel**: 
  - Pending Users Tab (User freigeben)
  - Link Users Tab (User mit Meyton Schützen verknüpfen)
  - User Management Tab (Übersicht aller User)
- **Dashboard**: Persönliche Statistiken mit:
  - Total Sessions
  - Total Shots
  - Average Score
  - Best Score
  - Recent Sessions Liste
- **Leaderboard**: Vereins-Rangliste mit Top-Schützen
- **Profile Page**: Persönliche Daten und Shooter-Info
- **Pending Link Page**: Warteseite für nicht-verknüpfte User
- **Protected Routes**: Zugriffskontrolle basierend auf:
  - Authentication Status
  - Linked Status
  - Admin Role
- **Meyton Integration**:
  - Anbindung an Meyton MySQL Datenbank (SSMDB2)
  - Abruf von Shooter-Daten
  - Abruf von Sessions und Scores
  - Score-Formatierung (Ring01/TotalRing01 → Dezimal)
- **Database Schema**:
  - PostgreSQL für User-Daten
  - `is_admin` Spalte für Admin-Rolle
  - `is_linked` Spalte für Verknüpfungs-Status
  - `shooter_id` Spalte (Format: `Nachname|Vorname`)
- **Search Functionality**: Suche im Admin Panel für Schützen
- **Docker Setup**: Docker Compose für PostgreSQL
- **Documentation**:
  - README.md mit Setup-Anleitung
  - TODO.md mit Roadmap
  - env.template für Environment Variables

#### 🔄 Geändert
- **Backend Port**: Von 3000 auf 3001 geändert
- **Shooter ID Format**: Von `ScheibenID` zu `Nachname|Vorname`
- **Database Structure**: `shooter_id` direkt in `users` Tabelle statt separate `user_shooter_links` Tabelle

#### ⚙️ Optimiert
- **API Routes**: Alle Routes nutzen neues DB Schema
- **Deduplication**: Mehrfach-Einträge von Schützen werden gefiltert
- **Error Handling**: Bessere Fehlerbehandlung in API Routes
- **UI/UX**: Material-UI Komponenten überall konsistent

#### 🐛 Behoben
- **Login Error**: `password_hash` Spalte korrekt verwendet
- **Admin Access**: `is_admin` Check in Middleware korrigiert
- **User Linking**: API Routes nutzen jetzt `users.shooter_id` direkt
- **Dashboard Error**: "User is not linked" Fehler durch Schema-Migration behoben
- **Duplicate Keys**: React Key Warning bei Schützen-Liste behoben
- **React Export Error**: Protected Routes direkter in Page-Komponenten implementiert

#### 🔒 Sicherheit
- **Password Hashing**: bcrypt mit Salt Rounds
- **JWT Tokens**: Sichere Token-Generierung
- **SQL Injection Protection**: Prepared Statements überall
- **Auth Middleware**: Tokens werden bei jedem Request validiert

#### 📝 Dokumentation
- Setup-Anleitung im README
- Database Schema Dokumentation
- API Route Übersicht
- Environment Variables Template
- TODO Liste mit Roadmap
- SHOOTER_ID_FORMAT.md Dokumentation

#### 🛠️ Tools & Scripts
- `database/init-db.sh`: Datenbank initialisieren
- `database/check-schema.sh`: Schema überprüfen
- `database/make-admin.sh`: User zum Admin machen
- `database/schema.sql`: Aktuelles Schema
- `database/update-schema.sql`: Migration Scripts

---

## [Unreleased]

### 🔮 Geplant für nächste Versionen

#### Version 1.1.0 (Q1 2025)
- [ ] JWT Token Expiration & Refresh Tokens
- [ ] Rate Limiting für API Routes
- [ ] Zeitfilter für Dashboard (7d, 30d, 90d, 1y)
- [ ] User bearbeiten Funktion im Admin Panel
- [ ] Activity Log für Admin-Aktionen
- [ ] Error Boundaries im Frontend
- [ ] Strukturiertes Logging

#### Version 1.2.0 (Q2 2025)
- [ ] Export Funktionen (PDF, CSV)
- [ ] Charts/Diagramme im Dashboard
- [ ] Filter-Optionen im Leaderboard
- [ ] Email Benachrichtigungen
- [ ] Caching Layer (Redis)
- [ ] Performance Optimierungen

#### Version 2.0.0 (Q3 2025)
- [ ] Progressive Web App (PWA)
- [ ] Offline-Modus
- [ ] Real-time Updates
- [ ] Team/Gruppe Funktionalität
- [ ] Achievements & Badges
- [ ] Mobile App (React Native)

Siehe [TODO.md](TODO.md) für vollständige Roadmap.

---

## Versioning Schema

- **MAJOR**: Grundlegende Änderungen, Breaking Changes
- **MINOR**: Neue Features, abwärtskompatibel
- **PATCH**: Bugfixes, kleine Verbesserungen

---

## Links

- [GitHub Repository](link-einfügen)
- [Issue Tracker](link-einfügen)
- [Documentation](link-einfügen)

---

**Letzte Aktualisierung:** 29. November 2024
