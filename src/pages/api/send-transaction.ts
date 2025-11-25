import { NextApiRequest, NextApiResponse } from 'next';
import { Connection, Keypair, sendAndConfirmRawTransaction, Transaction } from '@solana/web3.js';


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const RPC_URL = process.env.RPC_URL || process.env.NEXT_PUBLIC_RPC_URL || 'https://api.mainnet-beta.solana.com';

  if (!RPC_URL) {
    return res.status(500).json({ error: 'Missing required environment variables: RPC_URL or NEXT_PUBLIC_RPC_URL' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { signedTransaction, additionalSigners } = req.body as SendTransactionRequest;

    if (!signedTransaction) {
      return res.status(400).json({ error: 'Missing signed transaction' });
    }

    const connection = new Connection(RPC_URL, 'confirmed');
    const transaction = Transaction.from(Buffer.from(signedTransaction, 'base64'));

    // if (!transaction.recentBlockhash) {
    //   const { blockhash } = await connection.getLatestBlockhash();
    //   transaction.recentBlockhash = blockhash;
    // }

    // // Simulate transaction
    // const simulation = await connection.simulateTransaction(transaction);
    // if (simulation.value.err) {
    //   throw new Error(`Transaction simulation failed: ${JSON.stringify(simulation.value.err)}`);
    // }

    // console.log('additionalSigners', additionalSigners);

    // if (additionalSigners) {
    //   additionalSigners.forEach((signer) => {
    //     transaction.sign(signer);
    //   });
    // }

    // Send transaction
    const txSignature = await sendAndConfirmRawTransaction(connection, transaction.serialize(), {
      commitment: 'confirmed',
    });

    // Wait for confirmation
    // await connection.confirmTransaction(signature, 'confirmed');

    res.status(200).json({
      success: true,
      signature: txSignature,
    });
  } catch (error) {
    // Only log in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Transaction error:', error);
    }
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Transaction failed. Please try again.' 
    });
  }
}
