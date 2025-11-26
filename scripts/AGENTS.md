Agent Guidelines (Scripts)

Scope: Applies to files under scripts/.

Purpose
- Provide safe, reproducible execution for Solana-related scripts.

Execution
- Prefer devnet when testing; switch to mainnet only with explicit confirmation.
- Load config from precedence: CLI flags > scripts/config.json (if any) > environment > sane defaults.
- Required: RPC_URL (or NEXT_PUBLIC_RPC_URL). Use .env.local and dotenv.
- Default keypair path: %USERPROFILE%/.config/solana/id.json (Windows) or $HOME/.config/solana/id.json.

Commands (package.json)
- create:mint: ts-node scripts/create-mint.ts
- allocate: ts-node scripts/allocate-supply.ts
- set:metadata: ts-node scripts/set-metadata.ts
- sell:buyin: ts-node scripts/sell-buyin.ts (if present).

Safety
- Never embed private keys or API keys in code or commits.
- Print a dry-run summary (addresses, amounts, fees) before sending a transaction when feasible.
- Log transaction signatures and RPC endpoint used.

Style
- Use existing helper in scripts/utils.ts for connection and keypair loading.
- Avoid adding new dependencies without need.
- Keep files small and single-purpose; factor shared logic into scripts/utils.ts.