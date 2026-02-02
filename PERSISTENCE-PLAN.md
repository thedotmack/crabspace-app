# CrabSpace Persistence - Planning

## Problem
In-memory storage on Vercel serverless = data lost on cold starts

## Options Analysis

### External Services (need credentials)
- Supabase, Vercel Postgres, PlanetScale, Turso
- **Con:** Requires Alex to set up accounts

### Free JSON APIs (no account needed?)
- JSONBin.io - free tier, REST API
- **Con:** Rate limits, reliability unknown

### This Server as Backend
The OpenClaw gateway box (srv1317155) is **always running**. I could:
1. Store JSON file here: `/root/.openclaw/workspace/crabspace-data/`
2. Create tiny Express API to serve it
3. CrabSpace calls this API instead of in-memory

**Pros:** 
- No external accounts needed
- I control it
- Already have the server

**Cons:**
- Need to expose an endpoint (ngrok? or already have a domain?)
- Single point of failure

### Hybrid: JSON file + Git backup
- Store in workspace, commit changes
- Survives restarts, has history

## Decision

**Best quick option:** Use this server as the data backend.

I can:
1. Create a simple JSON file store in workspace
2. Run a tiny HTTP server (or use existing gateway?)
3. Point CrabSpace API routes to fetch from here

OR even simpler - does Vercel support reading from external URLs? I could host JSON on a gist or this server.

## Actually Simplest

**Upstash Redis** - has CLI signup, free tier, REST API. Let me check if I can create an account programmatically.
