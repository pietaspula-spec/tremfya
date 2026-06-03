# Tremfya Praćenje Terapije — PWA

## Opis
Progressive Web App za praćenje Tremfya biološke terapije. Sve podatke sprema lokalno u IndexedDB.

## Tehnologije
- React 19 + TypeScript
- Vite + vite-plugin-pwa
- Material UI (MUI)
- date-fns
- idb (IndexedDB wrapper)
- jsPDF + qrcode (PDF izvještaj)
- chart.js + react-chartjs-2 (statistika)

## Pokretanje lokalno

```bash
npm install
npm run dev
```

Otvori: http://localhost:5173

## Build za produkciju

```bash
npm run build
```

Output u `/dist` mapi.

## Deploy

### GitHub Pages
```bash
npm run build
# kopiraj sadržaj /dist na GitHub Pages
```

### Lokalni server (test build)
```bash
npm install -g serve
serve dist
```

## Instalacija PWA
1. Otvori aplikaciju u Chrome/Edge/Samsung Browser
2. Klikni na "Instaliraj" banner ili → Više → Instaliranje aplikacije
3. Aplikacija radi offline nakon instalacije

## Stranice aplikacije

| Ruta | Opis |
|------|------|
| `/` | Dashboard — statusni banner, hero card, statistika |
| `/termini` | Popis svih termina s filterom prošli/nadolazeći |
| `/kalendar` | Mjesečni kalendar s označenim terminima |
| `/crta` | Vremenska crta terapije |
| `/statistika` | Grafikoni i statistika |
| `/dnevnik` | Dnevnik nuspojava |
| `/postavke` | Backup/restore, PDF izvještaj, interval, podsjetnici |

## Modul: Backup
- Izvoz: JSON datoteka s potpunim stanjem
- Uvoz: vraća stanje iz JSON datoteke

## Modul: PDF za liječnika
- Generira se u `/postavke`
- Sadržaj: svi termini, statistika, QR kod sa sažetkom
- Prikladano za ispis A4

## Napomene za razvoj
- `src/types/index.ts` — svi TypeScript tipovi
- `src/services/db.ts` — IndexedDB operacije
- `src/utils/scheduling.ts` — sva logika rasporeda
- `src/hooks/useApp.tsx` — globalni React Context
