# OpenCord

OpenCord is now a backend-only Convex workspace. The frontend/Vite app has been removed so the repository only contains the Convex backend, shared permission/domain helpers, and the minimal project setup needed to run Convex locally or deploy it.

## Stack

- Convex realtime backend
- Convex Auth (`Anonymous` for local testing, `Google` + `Discord` when configured)
- Cloudflare RealtimeKit integration helpers
- Cloudflare R2 storage adapter scaffolding

## Getting started

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local` if you want local env defaults.
3. Configure Convex env vars for Convex Auth providers and Cloudflare.
4. Run `npm run dev` to start `convex dev`.

## Included backend surfaces

- Convex Auth setup with handle onboarding
- Friends and DM discovery
- Server, role, channel, and invite management
- Live DM and server messaging
- Voice presence and Cloudflare RealtimeKit join token flow
- Storage helpers for Cloudflare R2

## Repo layout

- `convex/`: backend functions, schema, auth, HTTP routes, and integrations
- `shared/`: shared domain and permission helpers used by Convex
