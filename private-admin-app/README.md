# Little to Large Admin Studio

A separate, admin-only responsive PWA for publishing clothing products, product photos/videos, and homepage banners to the existing website API.

It is also configured as a Capacitor project, so the same private app can be previewed in VS Code and packaged for Android/iOS.

## Run locally

1. Start the website API from the repository root: `npm start`
2. Open `private-admin-app/index.html` with VS Code Live Server, or run `npm run preview` inside this folder.
3. On the login screen, keep the API connection at `http://localhost:3000` for local development. For a phone, set it to the live website HTTPS URL and open the app from that host.
4. Sign in with the existing administrator account. Only `admin@littlelarge.in` is accepted by the client, and the backend verifies the JWT too.

## Phone install

On Android Chrome or iOS Safari, open the hosted app and use the browser menu's Add to Home Screen action. The app uses the existing `/api/auth/login`, `/api/products`, and `/api/promotions` endpoints; uploads are stored by the existing backend/Cloudinary flow and become visible to the storefront after the API responds successfully.

This folder intentionally sits outside `public`, so Express does not expose it as a normal shopper route. It does not contain credentials or a second database.

## Native app setup

From this folder:

```powershell
npm install
npm run sync
```

The Android and iOS platform projects are already generated in this folder. If they are ever removed, recreate them with `npx cap add android` and `npx cap add ios`.

For Android, install Android Studio with Android SDK and SDK Platform tools, then run `npm run build:apk`. The debug APK is created at `android/app/build/outputs/apk/debug/app-debug.apk`.

For iOS, run `npm run build:ios` on macOS with Xcode installed. Apple does not provide an iOS compiler/signing workflow on Windows; the generated `ios` project can be opened on a Mac for simulator/device builds and App Store signing.

For VS Code mobile preview, use the already-installed Live Server extension on `index.html`, or run `npm run preview` and open the printed localhost URL in a browser/device on the same network.
