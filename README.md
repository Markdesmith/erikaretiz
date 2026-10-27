# Erika Retiz

Portfolio site for Erika Retiz: a link page (`/`), an actor portfolio (`/actress`) and an admin (`/admin`) for editing both. React + Vite, with content in Firebase (Firestore, Storage, Auth).

## Develop

```
npm install
npm run dev
```

## Deploy

Every push to `main` deploys automatically through `.github/workflows/deploy.yml`: it builds the site, publishes the Firestore and Storage security rules, then publishes to Firebase Hosting. It needs the `FIREBASE_SERVICE_ACCOUNT` repository secret (a service-account JSON key from Firebase Console → Project settings → Service accounts). In Google Cloud IAM that service account also needs the **Service Usage Consumer** and **Firebase Admin** roles, or the deploy fails with a 403.

To deploy by hand instead: `npm run build && npx firebase deploy`.

## Admin access

Only these accounts can edit, and their email must be verified:

- markdesmith@gmail.com (Google sign-in)
- actress_erikaretiz@outlook.com (email + password; use "Forgot password?" to set one)

To add someone, update the list in all three places: `src/firebase/admins.js`, `firestore.rules`, `storage.rules`.

## Photo galleries

Galleries are stored as JSON in a portfolio item's `content` (see `src/components/Portfolio/gallery.js`; older plain URL arrays are upgraded on read). Uploads are resized in the browser to a 2400px master plus a 640px thumbnail. Edits (crop, rotate, filters) are rendered in the browser and saved as new files, keeping the original so edits can be reverted. The editor reads stored images into a canvas, which needs the bucket CORS settings in `storage.cors.json`; the deploy workflow applies them.
