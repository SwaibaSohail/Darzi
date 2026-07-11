# Darzi — Bespoke Tailoring, Online

A full-stack e-commerce platform for a tailoring shop: browse ready-made garments and fabrics, order **custom stitching with your own measurements**, track every order through a six-stage tailoring pipeline that updates **live**, and chat with the tailor in **real time** on each order.

**Live:** _client URL coming after deploy_ · **API:** _Render URL coming after deploy_

Built with **React 19 + TypeScript**, **Node.js (Express 5)**, **Firebase** (Auth + Firestore), **Socket.io**, and **Cloudinary** — deployed on **Vercel** (client) and **Render** (API).

---

## Features

**Customers**
- Email/password + Google sign-in
- Catalog with category filters and search; product pages with size selection
- **Custom stitching wizard** — pick a service, choose shop fabric or bring your own, enter measurements (or reuse a saved profile), pick style options with live price deltas, attach a reference photo
- Saved, reusable measurement profiles (cm/in)
- Cart that mixes ready-made and custom items, cash-on-delivery checkout
- Order tracking: `placed → confirmed → cutting → stitching → ready → delivered`, with the stepper advancing **live** over websockets
- **Per-order real-time chat** with the tailor: typing indicators, unread badges, persistent history
- Cancel before work starts (stock restored automatically)

**Shop owner (admin)**
- Dashboard with live stats (active orders, delivered revenue, chats needing reply)
- Orders queue with status filters and one-click stage transitions (state-machine enforced)
- Full stitching detail per order: measurement snapshot, style choices, notes, reference image
- Chat inbox with unread counters, replies in real time
- Product & service management with image upload and a style-option builder

## Architecture

```
┌────────────────────────┐         ┌──────────────────────────────┐
│  React SPA (Vercel)    │  HTTPS  │  Node.js API (Render)        │
│  Vite · TS · Tailwind  │◄───────►│  Express 5 + Socket.io       │
│  firebase-js-sdk       │  REST + │  firebase-admin              │
│  (Auth ONLY)           │  WSS    │  (ALL Firestore access)      │
└──────────┬─────────────┘         └───────┬──────────────┬───────┘
           │ sign-in / ID token            │              │
           ▼                               ▼              ▼
   ┌───────────────┐              ┌────────────────┐  ┌───────────┐
   │ Firebase Auth │              │   Firestore    │  │ Cloudinary│
   └───────────────┘              │ (deny-all rules)│  │  (images) │
                                  └────────────────┘  └───────────┘
```

- The client talks to Firebase **only for authentication**. Every data read/write goes through the Express API, which verifies the Firebase ID token on **every request and every websocket handshake**.
- Firestore security rules are **deny-all** — verifiable by probing the Firestore REST API with the public client key: `PERMISSION_DENIED`. The Admin SDK (service account) is the only path to data, making the API the single audited chokepoint for authorization, validation, and pricing.
- Socket.io runs on Render (Vercel's serverless functions can't hold websocket connections). Real-time events: `order:status`, `chat:message`, `chat:typing`, `chat:unread`.
- Money is handled as **integer paisa** (PKR minor unit) end-to-end; formatting happens only at render.

## Run locally

Prereqs: Node 20+, a Firebase project (Auth + Firestore in production mode with deny-all rules), a Cloudinary account.

```bash
git clone https://github.com/SwaibaSohail/darzi.git

# API
cd server
cp .env.example .env        # fill: FIREBASE_SERVICE_ACCOUNT_B64 (base64 of service-account JSON),
                            #       CLOUDINARY_* keys
npm install
npx tsx src/scripts/seed.ts # seed 12 products + 4 stitching services
npm run dev                 # :8080

# Client
cd ../client
cp .env.example .env        # fill: VITE_FIREBASE_* from your Firebase web app config
npm install
npm run dev                 # :5173
```

Grant the shop-owner role (deliberately script-only — there is no endpoint for this):

```bash
cd server && npx tsx src/scripts/grantAdmin.ts owner@example.com
```

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · TanStack Query · React Router 7 · Express 5 · Socket.io 4 · Firebase Auth · Firestore · Cloudinary · Zod · Pino · Vitest · Supertest · Testing Library
