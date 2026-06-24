# Toki PWA Setup

This build is PWA-ready.

## What is included

- `app/manifest.ts` for the web app manifest
- `app/pwa-register.tsx` for service worker registration
- `app/install-prompt.tsx` for an install prompt on supported browsers
- `app/offline/page.tsx` for offline fallback
- `public/sw.js` for app shell caching
- `public/icon.svg`, `public/icon-192.png`, `public/icon-512.png`, and `public/apple-touch-icon.png`
- Apple web app metadata in `app/layout.tsx`

## How to test locally

Service workers work on `localhost`, but this project registers the service worker only in production mode to avoid development caching bugs.

```bash
npm install
npm run build
npm start
```

Open:

```txt
http://localhost:3000
```

Then open Chrome DevTools → Application → Manifest / Service Workers.

## How to test installability

In Chrome / Edge:

1. Run production mode with `npm run build && npm start`.
2. Open `http://localhost:3000`.
3. Look for the install button in the address bar or the in-app install prompt.
4. Install the app.
5. Open it from your dock / launcher.

On iPhone / iPad:

1. Deploy the app to HTTPS, for example Vercel.
2. Open the site in Safari.
3. Tap Share.
4. Tap Add to Home Screen.

## Deploying

Use Vercel or another HTTPS host. PWA installability requires HTTPS in real deployment.

## Notes

The app can open offline after the shell is cached, but AI extraction needs internet because it calls the Agnes API. Calendar export also works best online.
