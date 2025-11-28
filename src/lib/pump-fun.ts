import { Connection, PublicKey, TransactionInstruction, SystemProgram, SYSVAR_RENT_PUBKEY } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import BN from 'bn.js';
import { env } from '@/config/env';

export const PUMP_FUN_PROGRAM_ID = new PublicKey('6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P');
export const GLOBAL_ACCOUNT = new PublicKey('4wTV1YmiEkRvAtNtsSGPtUrqryQMe5hx1q7SPrqC9Ju');
// Service fee recipient for Mayhem platform (all fees except blockchain fees)
// Uses centralized community wallet address from env config
export const FEE_RECIPIENT = new PublicKey(env.communityWallet);
export const EVENT_AUTHORITY = new PublicKey('Ce6TQqeHC9p8KetsN6JsjHK7UTZk7nasjjnr7XxXp9F1');
export const RENT = new PublicKey('SysvarRent111111111111111111111111111111111');

const BONDING_CURVE_SEED = 'bonding-curve';

export class PumpFunSDK {
  static getBondingCurvePDA(mint: PublicKey) {
    return PublicKey.findProgramAddressSync(
      [Buffer.from(BONDING_CURVE_SEED), mint.toBuffer()],
      PUMP_FUN_PROGRAM_ID
    )[0];
  }

  static async getBondingCurveAccount(connection: Connection, bondingCurve: PublicKey) {
    const accountInfo = await connection.getAccountInfo(bondingCurve);
    if (!accountInfo) return null;

    // Layout: 8 bytes discriminator + 8 (virtualTokenReserves) + 8 (virtualSolReserves) + 8 (realTokenReserves) + 8 (realSolReserves) + 8 (tokenTotalSupply) + 1 (complete)
    // We just need virtual reserves for price calc
    const buffer = accountInfo.data;
    const virtualTokenReserves = new BN(buffer.slice(8, 16), 'le');
    const virtualSolReserves = new BN(buffer.slice(16, 24), 'le');
    const realTokenReserves = new BN(buffer.slice(24, 32), 'le');
    const realSolReserves = new BN(buffer.slice(32, 40), 'le');
    const tokenTotalSupply = new BN(buffer.slice(40, 48), 'le');
    const complete = buffer[48] !== 0;

    return {
      virtualTokenReserves,
      virtualSolReserves,
      realTokenReserves,
      realSolReserves,
      tokenTotalSupply,
      complete,
    };
  }

  static getBuyInstruction(
    buyer: PublicKey,
    mint: PublicKey,
    bondingCurve: PublicKey,
    associatedBondingCurve: PublicKey,
    associatedUser: PublicKey,
    amount: BN,
    maxSolCost: BN
  ): TransactionInstruction {
    // Instruction: Buy
    // Discriminator: global:buy = 66063d1201daebea
    const discriminator = Buffer.from([0x66, 0x06, 0x3d, 0x12, 0x01, 0xda, 0xeb, 0xea]);
    const amountBuf = amount.toArrayLike(Buffer, 'le', 8);
    const maxSolCostBuf = maxSolCost.toArrayLike(Buffer, 'le', 8);
    const data = Buffer.concat([discriminator, amountBuf, maxSolCostBuf]);

    const keys = [
      { pubkey: GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
      { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedUser, isSigner: false, isWritable: true },
      { pubkey: buyer, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: RENT, isSigner: false, isWritable: false },
      { pubkey: EVENT_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: PUMP_FUN_PROGRAM_ID,
      data,
    });
  }

  static getSellInstruction(
    seller: PublicKey,
    mint: PublicKey,
    bondingCurve: PublicKey,
    associatedBondingCurve: PublicKey,
    associatedUser: PublicKey,
    amount: BN,
    minSolOutput: BN
  ): TransactionInstruction {
    // Instruction: Sell
    // Discriminator: global:sell = 33e685a4017f83ad
    const discriminator = Buffer.from([0x33, 0xe6, 0x85, 0xa4, 0x01, 0x7f, 0x83, 0xad]);
    const amountBuf = amount.toArrayLike(Buffer, 'le', 8);
    const minSolOutputBuf = minSolOutput.toArrayLike(Buffer, 'le', 8);
    const data = Buffer.concat([discriminator, amountBuf, minSolOutputBuf]);

    const keys = [
      { pubkey: GLOBAL_ACCOUNT, isSigner: false, isWritable: false },
      { pubkey: FEE_RECIPIENT, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: bondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedBondingCurve, isSigner: false, isWritable: true },
      { pubkey: associatedUser, isSigner: false, isWritable: true },
      { pubkey: seller, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: EVENT_AUTHORITY, isSigner: false, isWritable: false },
      { pubkey: PUMP_FUN_PROGRAM_ID, isSigner: false, isWritable: false },
    ];

    return new TransactionInstruction({
      keys,
      programId: PUMP_FUN_PROGRAM_ID,
      data,
    });
  }

  static calculateBuyQuote(
    amountSol: BN,
    virtualSolReserves: BN,
    virtualTokenReserves: BN
  ): BN {
    // k = vSol * vToken
    // new_vSol = vSol + amountSol
    // new_vToken = k / new_vSol
    // tokens_out = vToken - new_vToken
    const k = virtualSolReserves.mul(virtualTokenReserves);
    const newVirtualSol = virtualSolReserves.add(amountSol);
    const newVirtualToken = k.div(newVirtualSol);
    const tokensOut = virtualTokenReserves.sub(newVirtualToken);
    return tokensOut;
  }

  static calculateSellQuote(
    amountTokens: BN,
    virtualSolReserves: BN,
    virtualTokenReserves: BN
  ): BN {
    // k = vSol * vToken
    // new_vToken = vToken + amountTokens
    // new_vSol = k / new_vToken
    // sol_out = vSol - new_vSol
    const k = virtualSolReserves.mul(virtualTokenReserves);
    const newVirtualToken = virtualTokenReserves.add(amountTokens);
    const newVirtualSol = k.div(newVirtualToken);
    const solOut = virtualSolReserves.sub(newVirtualSol);
    return solOut;
  }
}

