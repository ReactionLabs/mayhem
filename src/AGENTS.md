Agent Guidelines (App)

Scope: Applies to files under src/.

Architecture
- Next.js app using TypeScript and React.
- Keep server-only code in pages/api and avoid leaking secrets to the client.

Environment
- Client-safe env vars must be prefixed with NEXT_PUBLIC_.
- Use NEXT_PUBLIC_RPC_URL on the client; use RPC_URL or NEXT_PUBLIC_RPC_URL on the server as fallback.

Conventions
- Match existing component structure and naming.
- Prefer functional components, hooks, and existing context providers in src/contexts.
- Re-use utilities in src/lib; avoid duplicating helpers.

Logging & Errors
- Gate verbose logging behind process.env.NODE_ENV === 'development'.
- Use ErrorBoundary for UI-level catch where patterns exist.

Testing & Validation
- Run type-checks and ensure pages build. Avoid adding new tooling unless requested.
- Don’t alter routing structure or API endpoints unless part of the task.