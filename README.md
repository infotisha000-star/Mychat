# Vortex Chat — Premium Private Real-Time Chat PWA

Vortex Chat is a mobile-first, production-ready, real-time private web application inspired by modern messaging platforms like Telegram. Built with a sleek glassmorphic UI, it features secure Admin authentication, a temporary access code validation system, low-latency Firestore real-time messaging, Appwrite media storage with multi-file upload & client-side canvas compression, message editing (max 3 edits), soft delete, message pinning, and progressive web app (PWA) capabilities.

---

## 1. Technology Stack

- **Frontend Core**: React 18, Vite 5, JavaScript (ESNext)
- **Styling**: Tailwind CSS, PostCSS, Autoprefixer
- **Animations & Icons**: Framer Motion, Lucide React, Canvas Confetti
- **Real-Time Data**: Firebase Firestore (`onSnapshot`)
- **Authentication**: Firebase Authentication
- **Media Storage**: Appwrite Storage (Client SDK + Netlify Functions)
- **Serverless / Secrets**: Netlify Functions (`APPWRITE_API_KEY`)
- **PWA & Offline**: `vite-plugin-pwa`, Workbox Service Worker, Web App Manifest
- **Hosting Target**: Netlify

---

## 2. Core Architecture & Folder Structure

```
d:/Mychat/
├── public/
│   ├── favicon.ico
│   ├── logo.svg
│   ├── manifest.webmanifest
│   ├── icon-192.png
│   └── icon-512.png
├── src/
│   ├── assets/
│   │   └── logo.svg
│   ├── components/
│   │   ├── admin/
│   │   │   ├── AccessCodeManager.jsx
│   │   │   ├── ActiveUsersList.jsx
│   │   │   └── AdminDashboard.jsx
│   │   ├── auth/
│   │   │   ├── AuthCard.jsx
│   │   │   ├── CodeJoinForm.jsx
│   │   │   └── LoginForm.jsx
│   │   ├── chat/
│   │   │   ├── ChatHeader.jsx
│   │   │   ├── LightboxViewer.jsx
│   │   │   ├── MediaGallery.jsx
│   │   │   ├── MediaUploader.jsx
│   │   │   ├── MessageComposer.jsx
│   │   │   ├── MessageItem.jsx
│   │   │   ├── MessageList.jsx
│   │   │   ├── PinnedBanner.jsx
│   │   │   └── VideoPlayerModal.jsx
│   │   ├── common/
│   │   │   ├── AppLogo.jsx
│   │   │   └── LoadingScreen.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Modal.jsx
│   │       ├── Skeleton.jsx
│   │       └── Toast.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   ├── ChatContext.jsx
│   │   └── ToastContext.jsx
│   ├── hooks/
│   │   ├── useAccessCodes.js
│   │   └── useAppwriteUpload.js
│   ├── services/
│   │   ├── appwrite.js
│   │   └── firebase.js
│   ├── styles/
│   │   └── index.css
│   ├── utils/
│   │   ├── codeGenerator.js
│   │   ├── imageCompressor.js
│   │   ├── textFormatter.js
│   │   └── timeAgo.js
│   ├── App.jsx
│   └── main.jsx
├── functions/
│   └── appwrite-admin.js
├── firestore.rules
├── firestore.indexes.json
├── netlify.toml
├── vite.config.js
├── tailwind.config.js
├── index.html
├── package.json
└── README.md
```

---

## 3. Environment Variables Configuration

Create a `.env` file in the project root based on `.env.example`:

```env
# Firebase Configuration (Public Frontend)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-app.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789012
VITE_FIREBASE_APP_ID=1:123456789012:web:...

# Appwrite Configuration (Public Frontend)
VITE_APPWRITE_ENDPOINT=https://nyc.cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=6a87160800235ef8688f
VITE_APPWRITE_BUCKET_ID=6a87163a0005ec2a2733

# Server-Side Netlify Function Privileged Key (NEVER EXPOSE IN FRONTEND BUNDLE)
APPWRITE_API_KEY=your_secret_appwrite_api_key
```

---

## 4. Firestore Database Collections & Schema

### `accessCodes` Collection
```json
{
  "code": "ROOM-7K92-X4P8",
  "createdAt": "Timestamp",
  "expiresAt": "Timestamp | null",
  "isActive": true,
  "maxUses": 1,
  "currentUses": 1,
  "assignedUserName": "Shakib",
  "lastActive": "Timestamp"
}
```

### `sessions` Collection
```json
{
  "codeId": "doc_id",
  "code": "ROOM-7K92-X4P8",
  "userName": "Shakib",
  "joinedAt": "Timestamp",
  "lastActive": "Timestamp",
  "isActive": true
}
```

### `messages` Collection
```json
{
  "roomId": "main_room",
  "senderId": "session_or_uid",
  "senderName": "Shakib",
  "senderRole": "temp_user | admin",
  "messageType": "text | image | video | media",
  "text": "Hello Admin!",
  "media": [
    {
      "fileId": "65b...",
      "bucketId": "6a87163a0005ec2a2733",
      "url": "https://...",
      "type": "image/jpeg",
      "size": 1048576,
      "width": 1920,
      "height": 1080
    }
  ],
  "timestamp": "Timestamp",
  "edited": false,
  "editCount": 0,
  "deleted": false,
  "pinned": false,
  "replyTo": null
}
```

---

## 5. Security Rules (`firestore.rules`)

Security rules strictly enforce:
1. **Admin Authorization**: Verified by email `info.shorif0000@gmail.com` or custom auth claim.
2. **Access Codes**: Read access permitted for verification; creation/update/deletion restricted to Admin.
3. **Message Edit Counter**: Messages can be edited up to a maximum of **3 times** (`request.resource.data.editCount <= 3`). 4th attempt is blocked.
4. **Soft Deletion**: Messages are soft-deleted (`deleted: true`), keeping chat timeline consistent.

---

## 6. Setup & Initial Configuration

### A. Admin Account Setup (Firebase Console)
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Select your Firebase project -> **Authentication** -> **Users**.
3. Click **Add User**:
   - **Email**: `info.shorif0000@gmail.com`
   - **Password**: Enter your strong password (do not commit passwords to source code).
4. Save the user. You can now use these credentials under the **ADMIN LOGIN** tab on the website.

### B. Appwrite Storage Bucket Setup
1. Log into your [Appwrite Console](https://cloud.appwrite.io/).
2. Open Project `6a87160800235ef8688f` -> **Storage** -> Bucket `6a87163a0005ec2a2733`.
3. Under **Permissions**, ensure file read & create permissions are granted to `Any` or authenticated roles for image and video uploads.

---

## 7. Local Development & Production Build

### Running Locally
```bash
# 1. Install Dependencies
npm install

# 2. Start Development Server
npm run dev
```
Open `http://localhost:3000` in your browser.

### Building for Production
```bash
# Production Build with Vite and PWA Service Worker
npm run build

# Preview Production Build locally
npm run preview
```

---

## 8. Deployment to Netlify

1. Push your repository to GitHub / GitLab.
2. Log into **Netlify** -> **Add new site** -> **Import an existing project**.
3. Set build configuration:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
   - **Functions directory**: `functions`
4. Add environment variables under **Site Settings** -> **Environment variables**:
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_APPWRITE_ENDPOINT`
   - `VITE_APPWRITE_PROJECT_ID`
   - `VITE_APPWRITE_BUCKET_ID`
   - `APPWRITE_API_KEY` (Server-Side Only)

---

## 9. PWA Installation

Vortex Chat is a standalone Progressive Web App:
- **iOS Safari**: Tap the Share icon -> **Add to Home Screen**.
- **Android Chrome**: Tap the three-dot menu -> **Install App**.
- **Desktop Chrome/Edge**: Click the Install icon in the address bar.

---

## 10. Key Features Checklist

- [x] Dual Login System (Admin Login vs User Code Entry)
- [x] Bangla validation error: `"দুঃখিত, এই কোডটি সঠিক নয় অথবা এর মেয়াদ শেষ হয়ে গেছে। অনুগ্রহ করে নতুন একটি কোড ব্যবহার করুন।"`
- [x] Admin Access Code Generator (custom expiry, copy, enable/disable, delete)
- [x] Temporary session lifecycle (historical messages remain intact)
- [x] Real-time low latency text & media streaming via Firestore `onSnapshot`
- [x] Multi-file photo & video upload to Appwrite Storage
- [x] Client-side canvas image dynamic compression
- [x] Step-by-step upload progress indicator (`Uploading 3/5...`)
- [x] Message editing with strict **3-edit maximum limit** and `"edited"` tag
- [x] Soft message deletion (`"এই বার্তাটি মুছে ফেলা হয়েছে।"`)
- [x] Message pinning with top header banner and click-to-scroll
- [x] Rich text formatting (`*bold*`, `_italic_`, `~strikethrough~`, `` `code` ``, `> quote`, links)
- [x] Touch-friendly image lightbox viewer & fullscreen video player
- [x] 100dvh mobile dynamic viewport responsiveness
- [x] Offline Service Worker & Web App Manifest PWA support
