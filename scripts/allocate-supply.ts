import { getOrCreateAssociatedTokenAccount, mintTo, transfer } from '@solana/spl-token';
import { connectionFromConfig, loadConfig, loadKeypair, loadState, atomsPerDisplayUnit } from './utils.js';

async function main() {
  const cfg = loadConfig();
  const state = loadState();
  if (!state?.mint) throw new Error('Mint not found in .state/state.json. Run create-mint first.');

  const connection = connectionFromConfig(cfg);
  const payer = loadKeypair();
  const mint = state.mint;

  const unit = atomsPerDisplayUnit(cfg.mintDecimals);
  const totalAtoms = BigInt(cfg.totalSupply) * unit;
  const ownerAtoms = (BigInt(cfg.ownerSharePercent) * totalAtoms) / BigInt(100);
  const treasuryAtoms = totalAtoms - ownerAtoms;

  console.log('Mint:', mint);
  console.log('Total atoms:', totalAtoms.toString());
  console.log('Owner atoms:', ownerAtoms.toString());
  console.log('Treasury atoms:', treasuryAtoms.toString());

  // Mint all to payer initially
  const ownerAta = await getOrCreateAssociatedTokenAccount(connection, payer, mint, payer.publicKey);
  await mintTo(connection, payer, mint, ownerAta.address, payer.publicKey, Number(totalAtoms));
  console.log('Minted total supply to owner ATA:', ownerAta.address.toBase58());

  // If you want to split to a treasury (another address), put it in env or config
  // For now, keep both halves in owner’s ATA and just log the allocation amounts.
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

