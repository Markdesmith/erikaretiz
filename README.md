# Erika Retiz

Portfolio site for Erika Retiz: a link page (`/`), an actor portfolio (`/actress`) and an admin (`/admin`) for editing both. React + Vite, with content in Firebase (Firestore, Storage, Auth).

## Develop

```
npm install
npm run dev
```

## Deploy

Every push to `main` deploys automatically through `.github/workflows/deploy.yml`: it builds the site, publishes the Firestore and Storage security rules, then publishes to Firebase Hosting. It needs the `FIREBASE_SERVICE_ACCOUNT` repository secret (a service-account JSON key from Firebase Console → Project settings → Service accounts).

To deploy by hand instead: `npm run build && npx firebase deploy`.

## Admin access

Only these accounts can edit, and their email must be verified:

- markdesmith@gmail.com (Google sign-in)
- actress_erikaretiz@outlook.com (email + password; use "Forgot password?" to set one)

To add someone, update the list in all three places: `src/firebase/admins.js`, `firestore.rules`, `storage.rules`.
