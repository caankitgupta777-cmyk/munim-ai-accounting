# Munim AI – Production Security & Firebase Setup Guide

## 1. Firebase Authentication Configuration

To ensure user isolation and enforce Firestore security rules, Firebase Authentication must be enabled.

### Steps to Enable Anonymous Sign-In:
1. Open the [Firebase Console](https://console.firebase.google.com).
2. Select your project: **`ai-studio-indialedgerai-25c4db9f-3be1-483d-a4fc-950a14e64de9`**.
3. In the left navigation menu, go to **Build** → **Authentication**.
4. Click on the **Sign-in method** tab.
5. In the list of providers, locate **Anonymous**.
6. Toggle the switch to **Enable** and click **Save**.

> **Note:** Anonymous sign-in requires zero user interaction on the frontend. The application automatically initializes an authenticated session on load via `ensureFirebaseAuth()`, assigns a unique UID, and associates all created query records to that specific user.

---

## 2. Deploying Firestore Security Rules

The security rules enforce that users can only read, update, or delete records that belong to their authenticated UID.

### Rules Schema (`firestore.rules`):
```text
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isAuthenticated() && request.auth.uid == userId;
    }

    function isValidQueryRecord(data) {
      return data.size() <= 20
        && data.id is string
        && data.userId is string
        && data.userId == request.auth.uid
        && data.queryType in ['accounting', 'voucher', 'scan', 'compliance', 'financials']
        && data.title is string
        && data.title.size() <= 200
        && data.queryText is string
        && data.queryText.size() <= 10000;
    }

    match /queries/{queryId} {
      allow read, delete: if isOwner(resource.data.userId);
      allow create: if isAuthenticated()
                   && request.resource.data.userId == request.auth.uid
                   && isValidQueryRecord(request.resource.data);
      allow update: if false;
    }

    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

Deploy using the Firebase CLI:
```bash
firebase deploy --only firestore:rules
```
*(In AI Studio Build environment, this is deployed automatically via the `deploy_firebase` tool).*

---

## 3. Server-Side Rate Limiting & Tiered Access

The server-side Express runtime implements an in-memory sliding-window limiter:
- **Burst limit:** Maximum 25 requests per minute per IP / Bearer token.
- **Client Tier Header:** Clients can pass an optional `x-user-tier` header (`Free`, `Student`, `CA_Pro`) to adjust daily quotas.
- **Abuse Prevention:** Protects Gemini API tokens against runaway scripts or scrapers.

---

## 4. Local Build & Test Verification

Before pushing to production environments:
```bash
# 1. Install dependencies
npm install

# 2. Type-check with zero tolerance
npm run lint

# 3. Production client and server build
npm run build

# 4. Start full-stack server
npm run start
```
