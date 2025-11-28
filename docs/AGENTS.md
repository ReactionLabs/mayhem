Agent Guidelines (Repo-Wide)

Scope: Applies to the entire repository unless a deeper AGENTS.md overrides it.

Objectives
- Keep changes minimal, focused, and reversible.
- Prefer clarity and safety for Solana mainnet interactions.
- Follow existing project conventions before introducing new ones.

Environment
- Required env vars: NEXT_PUBLIC_RPC_URL, RPC_URL. See .env.example.
- Never commit secrets or private keys. Use local env files only.
- For Solana keypairs, default path follows Solana CLI: %USERPROFILE%/.config/solana/id.json on Windows.

Running & Build
- Node: use the version implied by lockfile; avoid in-repo upgrades unless asked.
- Install: npm ci when lockfile present; otherwise npm install.
- TypeScript build for scripts: npm run build or run via ts-node scripts provided in package.json.

Code Changes
- Do not rename or move files unless necessary for the task.
- Match existing style (TypeScript/React in src, TS scripts in scripts).
- Avoid adding new deps unless essential; prefer using existing utilities.
- Update documentation if behavior or flags change.

Safety (Blockchain)
- Default to devnet/test environment when testing code that can send transactions.
- If a task requires mainnet, prompt for confirmation and amounts.
- Respect rate limits and API quotas for RPC providers.

Review & Validation
- Prefer targeted validation: build the changed package, run affected scripts.
- Do not fix unrelated issues; call them out separately if noticed.

Conflict Resolution
- If a deeper directory has its own AGENTS.md, that file takes precedence for code within that subtree.