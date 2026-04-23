# Bilge AI Asistan

- **Kök** = React (Vite), `package.json`  
- **`/server`** = ayrı Node.js paketi: `server.js`, OpenAI, kendi `package.json` (Express, CORS, dotenv, openai)  
- Ortam: proje **kökünde** `.env` (`VITE_*`, `OPENAI_API_KEY`, `PORT=5001` varsayılan)

- **Arayüz:** `src/`, `index.html`, `vite.config.ts`, `public/`
- **API:** `server/server.js`, `server/openaiService.js` (`POST /api/bilge`, `PORT` ile, varsayılan 5001)
- **Veri / kimlik:** Firebase (Auth + Firestore), `firestore.rules`

## Hızlı başlangıç

```bash
cd bilge-ai-asistan
npm install
cp .env.example .env
# .env: VITE_FIREBASE_* ve OPENAI_API_KEY
npm run dev
```

`postinstall` kökten `server/node_modules` kurar.

- Arayüz: `http://localhost:5173`  
- API: `http://localhost:5001` (veya `.env` içindeki `PORT`, Chat CORS)  
- `GET /api/health` · `POST /api/bilge` (gövde: `{ "message", "userId" }`)

## Firebase

1. [Firebase Console](https://console.firebase.google.com) — proje, Auth (Google + isteğe bağlı e-posta), Firestore.
2. `firestore.rules` bu repodan Konsol’a yükleyin.
3. Web uygulaması anahtarlarını kök `.env` içine `VITE_*` olarak girin.

## OpenAI (backend)

Kök `.env` içine `OPENAI_API_KEY=sk-...` yazın. Sunucu `server/server.js` bunu `process.env` ile okur.  
Ayrıca: `cd server && npm start` (veya `npm run start:api` kökten), port **.env** → `PORT` (yoksa **5001**).

## Build

```bash
npm run build
```

Çıktı: `dist/`. Sadece API: `npm run start:api`.

## Güvenlik (ileri seviye)

- `POST /api/bilge` için ileride Firebase ID token ile sunucu doğrulaması eklenebilir.

---

**Bilge AI Asistan** — turuncu/amber, lacivert, açık arka plan.
