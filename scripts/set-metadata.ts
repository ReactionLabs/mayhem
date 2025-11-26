import { PublicKey } from '@solana/web3.js';
import { loadConfig, connectionFromConfig, loadKeypair, loadState } from './utils.js';
import { createCreateMetadataAccountV3Instruction, PROGRAM_ID } from '@metaplex-foundation/mpl-token-metadata';
import { getAssociatedTokenAddress } from '@solana/spl-token';

async function main() {
  const cfg = loadConfig();
  const state = loadState();
  if (!state?.mint) throw new Error('Mint not found. Run create-mint first.');

  const connection = connectionFromConfig(cfg);
  const payer = loadKeypair();
  const mint = new PublicKey(state.mint);

  const [metadataPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('metadata'), PROGRAM_ID.toBuffer(), mint.toBuffer()],
    PROGRAM_ID
  );

  const dataV2 = {
    name: cfg.tokenName,
    symbol: cfg.tokenSymbol,
    uri: cfg.metadataUri,
    sellerFeeBasisPoints: 0,
    creators: null,
    collection: null,
    uses: null,
  };

  const ix = createCreateMetadataAccountV3Instruction(
    {
      metadata: metadataPda,
      mint,
      mintAuthority: payer.publicKey,
      payer: payer.publicKey,
      updateAuthority: payer.publicKey,
    },
    {
      createMetadataAccountArgsV3: {
        data: dataV2,
        isMutable: true,
        collectionDetails: null,
      },
    }
  );

  const tx = await connection.sendTransaction({
    feePayer: payer.publicKey,
    recentBlockhash: (await connection.getLatestBlockhash()).blockhash,
    instructions: [ix],
    signers: [payer],
  } as any);
  console.log('Metadata tx:', tx);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

