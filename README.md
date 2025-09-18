# QuickBite 🍔🚀

Food Pre-order & Pickup App — **Campus-first, scale-ready**.

## 📌 Overview

QuickBite solves the real problem of **long queues, missed orders, and wasted time** at cafeterias and food vendors.
Students can pre-order meals, vendors can manage orders in real-time, and everyone saves time.

### 🎯 Core Users

* **Students** — Browse menus, pre-order, get notified when food is ready.
* **Vendors** — Manage menus, receive orders, update order status.
* **Admins** — Oversee platform, vendors, payments, and disputes.

---

## ⚡ Features

### MVP

* Student app (React Native): Browse, order, get pickup notifications.
* Vendor dashboard (React Web): Manage menu + real-time orders.
* Backend (Node.js + Express + TypeScript): Auth, menus, orders, payments.
* Database (PostgreSQL via Prisma): Users, vendors, menus, orders.
* Realtime updates: Socket.IO + push notifications (FCM).
* Payments: Cash initially, optional Paystack.

### Expansion (future)

* Delivery option.
* Vendor analytics dashboard.
* Order scheduling.
* Loyalty & rewards system.

---

## 🛠️ Tech Stack

* **Frontend (mobile):** React Native (Expo, TypeScript)
* **Frontend (web):** React (Vite/Next, TypeScript)
* **Backend:** Node.js + Express + TypeScript
* **Database:** PostgreSQL (via Prisma ORM)
* **Realtime:** WebSocket (Socket.IO), FCM push
* **Payments:** Paystack
* **Storage:** Cloudinary (images)
* **Cache/Queues:** Redis + BullMQ
* **Infra:** Vercel (web), Expo EAS (mobile), Render (backend)

---

## 📐 System Design

* Full **ERD**, **API specs**, and **Prisma schema** included in [/docs](./docs).
* Key flows: student places order → vendor accepts → vendor marks ready → student gets notified.

---

## 🚀 Getting Started

### Prerequisites

* Node.js (>=18)
* PostgreSQL (local or hosted e.g. Neon/Supabase)
* Redis (for queues)

### Setup

```bash
# Clone repo
git clone https://github.com/sssholabright/quickbite.git
cd quickbite

# Install deps
npm install

# Setup env
cp .env.example .env
# update DATABASE_URL, REDIS_URL, JWT_SECRET, etc.

# Run migrations
pnpm prisma migrate dev

# Start backend
pnpm dev:api

# Start vendor web dashboard
pnpm dev:web

# Start student app (Expo)
pnpm dev:mobile
```

---

## 📲 Demo Flow

1. Student places an order from mobile app.
2. Vendor receives order instantly in web dashboard.
3. Vendor updates status → *ready for pickup*.
4. Student receives push notification, shows order code, picks up meal.

---

## 🧩 Project Structure

```
quickbite/
  apps/
    mobile/   # React Native Expo app
    web/      # Vendor dashboard (React)
    api/      # Backend (Node + Express + Prisma)
  packages/
    shared/   # Shared types, DTOs, utilities
  docs/       # System design docs (ERD, APIs)
```

---

## 🔒 Security & Notes

* JWT auth with refresh tokens.
* Passwords hashed with Argon2.
* Webhooks verified for payments.
* Orders auto-cancelled if vendor doesn’t accept in time.
* Idempotency enforced for order creation and payment webhooks.

---

## 📌 Roadmap

* [x] MVP (campus pre-order + pickup)
* [ ] Paystack integration
* [ ] Vendor analytics
* [ ] Delivery option
* [ ] Loyalty system

---

## 👨‍💻 Author

**Bright** — Full-stack developer (React, React Native, Node.js, PostgreSQL, Django).
Portfolio project: QuickBite.

---

## 📜 License

MIT License — feel free to fork, build, and improve.
