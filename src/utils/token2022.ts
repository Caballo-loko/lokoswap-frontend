import { 
  PublicKey, 
  Connection, 
  Transaction,
  SystemProgram,
  Keypair
} from '@solana/web3.js';
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  ExtensionType,
  getMintLen,
  createInitializeTransferHookInstruction,
  createInitializeTransferFeeConfigInstruction,
  createInitializeMintInstruction,
  createAssociatedTokenAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from '@solana/spl-token';
import { DYNAMIC_FEE_HOOK_PROGRAM_ID } from '../constants/programs';

export interface TokenInfo {
  mint: string;
  symbol: string;
  name: string;
  decimals: number;
  hasTransferHook?: boolean;
  hasTransferFee?: boolean;
  isToken2022?: boolean;
}

// Common tokens for demo - includes SOL and hook tokens
export const DEMO_TOKENS: TokenInfo[] = [
  {
    mint: NATIVE_MINT.toString(),
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    isToken2022: false
  },
  // These will be dynamically created hook tokens
];

export interface CreateHookTokenParams {
  connection: Connection;
  payer: PublicKey;
  sendTransaction: (transaction: Transaction, connection: Connection, options?: any) => Promise<string>;
  symbol: string;
  name: string;
  decimals?: number;
  feeRate?: number; // basis points (e.g., 10 = 0.1%)
  maxFee?: number; // in base units
}


export async function createHookToken({
  connection,
  payer,
  sendTransaction,
  symbol,
  name,
  decimals = 9,
  feeRate = 10, // 0.1%
  maxFee = 100000000 // 0.1 tokens
}: CreateHookTokenParams): Promise<{ mint: PublicKey; transaction: string }> {
  const mintKeypair = Keypair.generate();
  
  // Create mint with BOTH transfer hook AND transfer fee extensions
  const extensions = [ExtensionType.TransferHook, ExtensionType.TransferFeeConfig];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);

  console.log('Creating hook token:');
  console.log('- Symbol:', symbol);
  console.log('- Name:', name);
  console.log('- Mint address:', mintKeypair.publicKey.toString());
  console.log('- Hook program:', DYNAMIC_FEE_HOOK_PROGRAM_ID.toString());
  console.log('- Fee rate (basis points):', feeRate);
  console.log('- Max fee:', maxFee);

  const transaction = new Transaction().add(
    SystemProgram.createAccount({
      fromPubkey: payer,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports: lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    createInitializeTransferHookInstruction(
      mintKeypair.publicKey,
      payer,
      DYNAMIC_FEE_HOOK_PROGRAM_ID,
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeTransferFeeConfigInstruction(
      mintKeypair.publicKey,
      payer, // withdraw withheld authority
      payer, // fee destination
      feeRate,
      BigInt(maxFee),
      TOKEN_2022_PROGRAM_ID,
    ),
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      decimals,
      payer,
      null,
      TOKEN_2022_PROGRAM_ID
    ),
  );

  try {
    // Get recent blockhash before signing
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = payer;
    
    // Add the mintKeypair as a signer to the transaction
    transaction.partialSign(mintKeypair);
    const signature = await sendTransaction(transaction, connection);
    console.log('Hook token created successfully!');
    return { mint: mintKeypair.publicKey, transaction: signature };
  } catch (error) {
    console.error('Failed to create hook token:', error);
    throw error;
  }
}


export interface SetupWSolAccountsParams {
  connection: Connection;
  payer: PublicKey;
  sendTransaction: (transaction: Transaction, connection: Connection, options?: any) => Promise<string>;
  poolConfig: PublicKey; // AMM PDA for creating AMM PDA WSOL account
  amount?: number;
}

export async function setupWSolAccounts({
  connection,
  payer,
  sendTransaction,
  poolConfig,
  amount = 0.1 * 10**9 // 0.1 SOL (reduced from test)
}: SetupWSolAccountsParams): Promise<{ 
  senderWSolAccount: PublicKey;
  delegateWSolAccount: PublicKey;
  ammPdaWSolAccount: PublicKey;
  signature: string;
}> {
  console.log('Setting up ALL hook-required WSOL accounts...');
  
  // Calculate all PDAs as in the working test
  const [delegatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegate")], 
    DYNAMIC_FEE_HOOK_PROGRAM_ID
  );
  
  // Calculate WSOL accounts
  const senderWSolAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    payer
  );

  const delegateWSolAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    delegatePDA,
    true // allowOwnerOffCurve for PDA
  );

  // AMM PDA WSOL account - needed for hook execution during withdrawals
  const ammPdaWSolAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    poolConfig,  // AMM PDA
    true // allowOwnerOffCurve for PDA
  );

  console.log('Calculated WSOL accounts:');
  console.log('- Sender WSOL:', senderWSolAccount.toString());
  console.log('- Delegate WSOL:', delegateWSolAccount.toString());
  console.log('- AMM PDA WSOL:', ammPdaWSolAccount.toString());

  // Create all WSOL accounts and fund them 
  const transaction = new Transaction().add(
    // Create sender WSOL account
    createAssociatedTokenAccountInstruction(
      payer,
      senderWSolAccount,
      payer,
      NATIVE_MINT
    ),
    // Create delegate WSOL account
    createAssociatedTokenAccountInstruction(
      payer,
      delegateWSolAccount,
      delegatePDA,
      NATIVE_MINT
    ),
    // Create AMM PDA WSOL account
    createAssociatedTokenAccountInstruction(
      payer,
      ammPdaWSolAccount,
      poolConfig,
      NATIVE_MINT
    ),
    // Fund sender WSOL account
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: senderWSolAccount,
      lamports: amount,
    }),
    createSyncNativeInstruction(senderWSolAccount),
    // Fund AMM PDA WSOL account for hook execution during withdrawals
    SystemProgram.transfer({
      fromPubkey: payer,
      toPubkey: ammPdaWSolAccount,
      lamports: amount,
    }),
    createSyncNativeInstruction(ammPdaWSolAccount),
  );

  try {
    const signature = await sendTransaction(transaction, connection);
    console.log('All WSOL accounts created and funded!');
    return { 
      senderWSolAccount,
      delegateWSolAccount,
      ammPdaWSolAccount,
      signature 
    };
  } catch (error) {
    console.error('Failed to setup WSOL accounts:', error);
    throw error;
  }
}

// Hook account calculation is no longer needed - Token-2022 handles this automatically
// This function has been removed as per the current LokoSwap implementation


export function createHookRemainingAccounts(
  hookMint: PublicKey, 
  userPubkey: PublicKey, 
  isWithdrawOperation = false,
  ammPdaWSolAccount?: PublicKey
) {
  // Calculate all required PDAs 
  const [extraAccountMetaListPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("extra-account-metas"), hookMint.toBuffer()],
    DYNAMIC_FEE_HOOK_PROGRAM_ID
  );

  const [delegatePDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("delegate")], 
    DYNAMIC_FEE_HOOK_PROGRAM_ID
  );

  const [feeStatsPDA] = PublicKey.findProgramAddressSync(
    [Buffer.from("fee_stats")],
    DYNAMIC_FEE_HOOK_PROGRAM_ID
  );

  const delegateWSolAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    delegatePDA,
    true // allowOwnerOffCurve for PDA
  );

  // Use AMM PDA WSOL account for withdrawals, user WSOL for deposits/swaps 
  const senderWSolAccount = isWithdrawOperation && ammPdaWSolAccount
    ? ammPdaWSolAccount
    : getAssociatedTokenAddressSync(NATIVE_MINT, userPubkey);

  // Return the EXACT structure - 9 accounts in specific order
  return [
    { pubkey: extraAccountMetaListPDA, isSigner: false, isWritable: false },       // Extra metas list
    { pubkey: NATIVE_MINT, isSigner: false, isWritable: false },                   // index 5 - WSOL mint
    { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },              // index 6 - Token program
    { pubkey: ASSOCIATED_TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },   // index 7 - Associated token program
    { pubkey: delegatePDA, isSigner: false, isWritable: true },                    // index 8 - Delegate PDA
    { pubkey: delegateWSolAccount, isSigner: false, isWritable: true },            // index 9 - Delegate WSOL
    { pubkey: senderWSolAccount, isSigner: false, isWritable: true },              // index 10 - Sender/AMM PDA WSOL
    { pubkey: feeStatsPDA, isSigner: false, isWritable: true },                    // index 11 - Fee stats PDA
    { pubkey: DYNAMIC_FEE_HOOK_PROGRAM_ID, isSigner: false, isWritable: false },        // Hook program ID
  ];
}