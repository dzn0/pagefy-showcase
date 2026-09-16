# Pagefy

**Finds local businesses with no website and generates a ready-to-sell site for each, from real Google data.**

Live at **[pagefy.app](https://pagefy.app)** · Brazilian Portuguese

Pagefy is a tool for people who sell websites to local businesses. It searches a city for businesses that have no website on their Google profile, builds a site for each one from its real name, address, phone, hours and photos, and publishes it on a public link the seller sends to the owner. Everything is credit-based, and the cost of every action is shown before it runs.

This repository is the **web app** (landing, app and public site pages). The API, database, payments and site generator live in a separate private repository.

## What's in here

- **Landing** with a live demo: type a city and see real businesses without a website, no signup.
- **Lead search** with map and list, filters, and a CRM kanban (New → Contacted → Proposal → Closed / Lost).
- **Site generator**: an AI chat that builds the site and applies focused edits, with desktop and mobile preview, publish link, "send to owner" WhatsApp message, and `.zip` download.
- **Public site pages** (`/p/[slug]`) served with a strict sandbox CSP, since the HTML is AI-written.
- **Checkout** in a side sheet (Pix and credit card), plans and one-off credit packs.
- **Funnel instrumentation**: first-visit attribution (UTM and referrer) and server-side events, no third-party pixels.
- **Terms of use, privacy policy and help center**, written from what the system actually does.

## Stack

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS 4**, design tokens on CSS variables, light and dark themes
- **Leaflet** for maps, **lucide-react** for icons
- Google sign-in (OAuth pop-up); session is an HttpOnly cookie issued by the API
- Deployed on **Vercel**

## Design

The visual system is documented in [`DESIGN.md`](./DESIGN.md): tokens, type scale, components and the rules behind them. In short: neutral grounds and white working surfaces with 1px hairlines, one green that means "do this", and a journey palette where each step of the path to a sale (find, build, offer, get paid) owns a hue.

## Running locally

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

The app runs on `http://localhost:3030`. Most screens need the private API running, so what works standalone is limited to the static pages (landing, terms, privacy, help).

## License

Copyright © 2026 André Pieri. **All rights reserved.**

This code is published for portfolio purposes only. No permission is granted to use, copy, modify or distribute it, in whole or in part.
