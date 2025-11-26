import { Keypair, PublicKey } from '@solana/web3.js';
import { getMint, createMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { connectionFromConfig, loadConfig, loadKeypair, saveState } from './utils.js';

async function main() {
  const cfg = loadConfig();
  const connection = connectionFromConfig(cfg);
  const payer = loadKeypair();

  console.log(`Using network: ${cfg.network}`);
  console.log(`Payer: ${payer.publicKey.toBase58()}`);

  const mintAuthority = payer.publicKey;
  const freezeAuthority = payer.publicKey;

  const mintPubkey = await createMint(
    connection,
    payer,
    mintAuthority,
    freezeAuthority,
    cfg.mintDecimals,
    undefined,
    { commitment: 'confirmed' },
    TOKEN_PROGRAM_ID
  );

  const mintInfo = await getMint(connection, mintPubkey);
  console.log('Created mint:', mintPubkey.toBase58());
  console.log('Decimals:', mintInfo.decimals);

  saveState({ mint: mintPubkey.toBase58() });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

