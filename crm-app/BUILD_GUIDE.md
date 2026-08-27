# NightMare Esports CRM — Build Guide

## Prerequisites
- Node.js 18+
- Expo CLI: `npm install -g @expo/cli eas-cli`
- Expo account (free): https://expo.dev/signup

## Setup
```bash
cd crm-app
npm install
```

## Run locally (Expo Go app on phone)
```bash
npx expo start
# Scan QR code with Expo Go app
```

## Build APK (free, cloud build)

1. Login to Expo:
```bash
eas login
```

2. Configure project:
```bash
eas build:configure
```

3. Build APK:
```bash
npm run build:apk
# Or: eas build --platform android --profile preview
```

4. Download APK from Expo dashboard: https://expo.dev

## Login Credentials

| Username | Password     | Role    |
|----------|-------------|---------|
| admin    | nightmare2025 | Owner   |
| manager  | nm@manager   | Manager |
| coach    | nm@coach     | Coach   |

## Features
- **Dashboard** — Overview stats, quick actions, activity feed
- **Players** — Full roster with game/role/rank/status, add/delete
- **Teams** — Team management with win/loss stats
- **Tournaments** — Event tracking with prize pools and placements
- **Sponsors** — Sponsor CRM with deal values and renewal dates
- **Tasks** — Task management with priorities and completion tracking
- **Profile** — User info and logout

## Customization
- Change org name/colors in `src/utils/theme.js`
- Replace assets in `assets/` (icon.png 1024×1024, splash.png 1242×2436)
- Add credentials in `src/screens/Auth/LoginScreen.js` → `ADMIN_CREDENTIALS`
