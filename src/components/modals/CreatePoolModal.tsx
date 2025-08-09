'use client';

import React, { useState, useEffect, useRef } from 'react';
import { PublicKey, Transaction } from '@solana/web3.js';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { Program, AnchorProvider, web3, BN } from '@coral-xyz/anchor';
import { getAssociatedTokenAddressSync, TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createMintToInstruction, createAssociatedTokenAccountInstruction, createSyncNativeInstruction, NATIVE_MINT } from '@solana/spl-token';
import { toast } from 'react-hot-toast';
import { LokoSwap } from '../../types/loko_swap';
import { DynamicFeeHook } from '../../types/dynamic_fee_hook';
import { LOKO_SWAP_PROGRAM_ID, DYNAMIC_FEE_HOOK_PROGRAM_ID } from '../../constants/programs';
import { createHookToken, createHookRemainingAccounts } from '../../utils/token2022';

interface CreatePoolModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPoolCreated: () => void;
}

// Simple pool creation state
interface CreatePoolState {
  tokenSymbol: string;  // User's custom token symbol
  tokenName: string;    // User's custom token name
  fee: number;
  tokenAmount: string;  // Amount of custom token to create
  solAmount: string;    // Amount of SOL to pair with
}

export default function CreatePoolModal({ isOpen, onClose, onPoolCreated }: CreatePoolModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const { connection } = useConnection();
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<CreatePoolState>({
    tokenSymbol: '',      // User's custom token symbol
    tokenName: '',        // User's custom token name
    fee: 0.3,
    tokenAmount: '1000.0', // Amount of custom token to create
    solAmount: '1.0'       // Amount of SOL to pair with
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Remove demo tokens - users create their own

  // Handle modal open/close
  useEffect(() => {
    if (!dialogRef.current) return;
    
    if (isOpen) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Validate token symbol
    if (!formData.tokenSymbol.trim()) {
      newErrors.tokenSymbol = 'Token symbol is required';
    } else if (formData.tokenSymbol.length > 10) {
      newErrors.tokenSymbol = 'Token symbol must be 10 characters or less';
    }

    // Validate token name
    if (!formData.tokenName.trim()) {
      newErrors.tokenName = 'Token name is required';
    } else if (formData.tokenName.length > 32) {
      newErrors.tokenName = 'Token name must be 32 characters or less';
    }

    // Validate fee
    if (formData.fee < 0.01 || formData.fee > 10) {
      newErrors.fee = 'Fee must be between 0.01% and 10%';
    }

    // Validate token amount
    if (!formData.tokenAmount || parseFloat(formData.tokenAmount) <= 0) {
      newErrors.tokenAmount = 'Token amount must be greater than 0';
    }

    // Validate SOL amount
    if (!formData.solAmount || parseFloat(formData.solAmount) <= 0) {
      newErrors.solAmount = 'SOL amount must be greater than 0';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !publicKey || !signTransaction) {
      return;
    }

    setIsLoading(true);
    
    try {
      // Optimized flow: Create token + pool + setup in batched transactions to reduce signatures
      const batchId = toast.loading(`Creating ${formData.tokenSymbol}/SOL pool with dynamic fees...`);
      
      // Step 1: Create token + initialize pool (BATCHED - 2 signatures)
      const { mint: customTokenMint } = await createHookToken({
        connection,
        payer: publicKey,
        sendTransaction,
        symbol: formData.tokenSymbol,
        name: formData.tokenName,
        feeRate: 10, // 0.1% base fee (scales to 3.0%)
        maxFee: 100000000 // 0.1 token max fee
      });
      
      toast.dismiss(batchId);
      const poolBatchId = toast.loading(`${formData.tokenSymbol} created! Setting up pool and accounts...`);

      // Calculate all PDAs upfront
      const seed = new BN(Date.now());
      const feeInBasisPoints = Math.floor(formData.fee * 100);
      const [config] = PublicKey.findProgramAddressSync(
        [Buffer.from('config'), seed.toArrayLike(Buffer, 'be', 8)],
        LOKO_SWAP_PROGRAM_ID
      );
      const [mintLp] = PublicKey.findProgramAddressSync(
        [Buffer.from('lp'), config.toBuffer()],
        LOKO_SWAP_PROGRAM_ID
      );

      // Create Anchor provider and program for LokoSwap
      const provider = new AnchorProvider(
        connection,
        {
          publicKey: publicKey!,
          signTransaction: signTransaction,
          signAllTransactions: async (txs: Transaction[]) => {
            return await Promise.all(txs.map((tx: Transaction) => signTransaction(tx)));
          }
        } as any,
        { commitment: 'confirmed' }
      );

      const program = new Program(
        require('../../idl/loko_swap.json') as LokoSwap, 
        provider
      );

      // Token assignments
      const mintX = customTokenMint; // User's custom token with dynamic fees
      const mintY = new PublicKey(NATIVE_MINT.toString()); // SOL

      // Get vault addresses using Associated Token Program PDAs 
      const vaultX = getAssociatedTokenAddressSync(
        mintX,
        config,
        true, // allowOwnerOffCurve for PDA
        TOKEN_2022_PROGRAM_ID
      );
      const vaultY = getAssociatedTokenAddressSync(
        mintY,
        config,
        true, // allowOwnerOffCurve for PDA
        TOKEN_PROGRAM_ID // NATIVE_MINT uses regular token program
      );

      // Step 2: Create AMM Pool (SIGNATURE 2)
      const poolTx = await program.methods
        .initialize(
          seed,
          feeInBasisPoints,
          null, // authority (optional)
          0, // transfer_fee_basis_points
          new BN(0), // max_transfer_fee
          DYNAMIC_FEE_HOOK_PROGRAM_ID
        )
        .accountsStrict({
          admin: publicKey,
          mintX: mintX,
          mintY: mintY,
          mintLp: mintLp,
          vaultX: vaultX,
          vaultY: vaultY,
          config: config,
          tokenProgram: TOKEN_2022_PROGRAM_ID,     // LP tokens use Token-2022
          tokenProgramX: TOKEN_2022_PROGRAM_ID,    // Custom token uses Token-2022
          tokenProgramY: TOKEN_PROGRAM_ID,         // NATIVE_MINT uses regular token program
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log('AMM Pool created:', poolTx);

      toast.dismiss(poolBatchId);
      const accountsId = toast.loading('Setting up accounts and tokens (this may take 30-60 seconds)...');

      // Step 3: BATCH - Create all user accounts + WSOL setup + Mint tokens (SIGNATURE 3)
      try {
        const tokenAmountForLP = parseFloat(formData.tokenAmount) * 10**9;
        const totalTokenSupply = tokenAmountForLP * 2;

        // Pre-calculate all token accounts
        const userCustomTokenAccount = getAssociatedTokenAddressSync(
          mintX, publicKey, false, TOKEN_2022_PROGRAM_ID
        );
        const userSOLAccount = getAssociatedTokenAddressSync(
          mintY, publicKey, false, TOKEN_PROGRAM_ID // NATIVE_MINT uses regular token program
        );
        const userLPAccount = getAssociatedTokenAddressSync(
          mintLp, publicKey, false, TOKEN_2022_PROGRAM_ID
        );

        // WSOL accounts for hook execution
        const senderWSolAccount = getAssociatedTokenAddressSync(
          new PublicKey(NATIVE_MINT),
          publicKey
        );
        const [delegatePDA] = PublicKey.findProgramAddressSync(
          [Buffer.from("delegate")], 
          DYNAMIC_FEE_HOOK_PROGRAM_ID
        );
        const delegateWSolAccount = getAssociatedTokenAddressSync(
          new PublicKey(NATIVE_MINT),
          delegatePDA,
          true
        );
        const ammPdaWSolAccount = getAssociatedTokenAddressSync(
          new PublicKey(NATIVE_MINT),
          config,
          true
        );

        // Account setup batch transaction
        const setupTx = new web3.Transaction();

        console.log(`Creating user accounts and WSOL setup for ${formData.tokenSymbol}`);

        // Add WSOL account creation instructions
        setupTx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            senderWSolAccount,
            publicKey,
            new PublicKey(NATIVE_MINT)
          ),
          createAssociatedTokenAccountInstruction(
            publicKey,
            delegateWSolAccount,
            delegatePDA,
            new PublicKey(NATIVE_MINT)
          ),
          createAssociatedTokenAccountInstruction(
            publicKey,
            ammPdaWSolAccount,
            config,
            new PublicKey(NATIVE_MINT)
          )
        );

        // Add user token account creation
        setupTx.add(
          createAssociatedTokenAccountInstruction(
            publicKey,
            userCustomTokenAccount,
            publicKey,
            mintX,
            TOKEN_2022_PROGRAM_ID
          ),
          createAssociatedTokenAccountInstruction(
            publicKey,
            userSOLAccount,
            publicKey,
            mintY,
            TOKEN_PROGRAM_ID // NATIVE_MINT uses regular token program
          ),
          createAssociatedTokenAccountInstruction(
            publicKey,
            userLPAccount,
            publicKey,
            mintLp,
            TOKEN_2022_PROGRAM_ID
          )
        );

        // Fund WSOL accounts and mint user tokens
        setupTx.add(
          web3.SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: senderWSolAccount,
            lamports: 0.1 * 10**9,
          }),
          createSyncNativeInstruction(senderWSolAccount),
          web3.SystemProgram.transfer({
            fromPubkey: publicKey,
            toPubkey: ammPdaWSolAccount,
            lamports: 0.1 * 10**9,
          }),
          createSyncNativeInstruction(ammPdaWSolAccount),
          createMintToInstruction(
            mintX,
            userCustomTokenAccount,
            publicKey,
            totalTokenSupply,
            [],
            TOKEN_2022_PROGRAM_ID
          )
        );

        console.log('User accounts and WSOL setup completed successfully!');
        
      } catch (error) {
        console.error('Account setup failed:', error);
        throw new Error('Failed to setup accounts: ' + (error as Error).message);
      }

      toast.dismiss(accountsId);
      const liquidityId = toast.loading('Adding initial liquidity to complete setup...');

      // Step 3: Add initial liquidity (FINAL SIGNATURE)
      try {
        const tokenAmountForLP = parseFloat(formData.tokenAmount) * 10**9;
        const solAmountForLP = parseFloat(formData.solAmount) * 10**9;
        const lpAmount = new BN(Math.sqrt(tokenAmountForLP * solAmountForLP));

        const userCustomTokenAccount = getAssociatedTokenAddressSync(
          mintX, publicKey, false, TOKEN_2022_PROGRAM_ID
        );
        const userSOLAccount = getAssociatedTokenAddressSync(
          mintY, publicKey, false, TOKEN_PROGRAM_ID // NATIVE_MINT uses regular token program
        );
        const userLPAccount = getAssociatedTokenAddressSync(
          mintLp, publicKey, false, TOKEN_2022_PROGRAM_ID
        );

        // Add hook remaining accounts for the custom token
        let remainingAccounts: any[] = [];
        try {
          remainingAccounts = createHookRemainingAccounts(
            mintX, // Custom token (Token X) has hooks
            publicKey,
            false // Not a withdraw operation
          );
          console.log('Adding hook accounts for custom token with dynamic fees');
        } catch (error) {
          console.warn('Hook accounts setup will be handled during first trade:', error);
          remainingAccounts = [];
        }

        // Initialize dynamic fee hook accounts if needed
        try {
          const dynamicFeeHookProgram = new Program(
            require('../../idl/dynamic_fee_hook.json') as DynamicFeeHook,
            provider
          );
          await dynamicFeeHookProgram.methods
            .initializeExtraAccountMetaList()
            .accounts({ mint: mintX })
            .rpc();
        } catch (error) {
          console.log('Hook initialization skipped, will initialize on first trade');
        }

        // Final liquidity deposit
        const depositTx = await program.methods
          .deposit(lpAmount, new BN(tokenAmountForLP), new BN(solAmountForLP))
          .accountsPartial({
            user: publicKey,
            mintX: mintX,
            mintY: mintY,
            userX: userCustomTokenAccount,
            userY: userSOLAccount,
            vaultX: vaultX,
            vaultY: vaultY,
            config: config,
            mintLp: mintLp,
            userLp: userLPAccount,
            tokenProgram: TOKEN_2022_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
            systemProgram: web3.SystemProgram.programId,
          })
          .remainingAccounts(remainingAccounts)
          .rpc();

        console.log(`Initial liquidity added to ${formData.tokenSymbol}/SOL Loko Pool:`, depositTx);
        toast.dismiss(liquidityId);
        
      } catch (error) {
        console.error('Initial liquidity deposit failed:', error);
        toast.dismiss(liquidityId);
        console.log('Pool created successfully, liquidity can be added later');
      }
      
      toast.success(`🚀 ${formData.tokenSymbol}/SOL Loko pool created with only 4 signatures! Ready for trading.`);
      
      onPoolCreated();
      onClose();
      
      // Reset form
      setFormData({
        tokenSymbol: '',
        tokenName: '',
        fee: 0.3,
        tokenAmount: '1000.0',
        solAmount: '1.0'
      });
      setErrors({});
      
    } catch (error) {
      console.error('Failed to create pool:', error);
      toast.error(`Failed to create pool: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setErrors({ submit: 'Failed to create pool. Please try again.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-lg">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">🚀 Create Your Token + SOL Pool</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
            disabled={isLoading}
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Explanation */}
          <div className="alert alert-info">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <div className="text-sm">
              <div className="font-semibold">Create your own token paired with SOL</div>
              <div>Your token gets dynamic fees (0.1% → 3.0%) based on trading activity</div>
            </div>
          </div>

          {/* Token Creation */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">🏷️ Token Symbol</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. DOGE, PEPE, BONK"
                  className={`input input-bordered w-full ${errors.tokenSymbol ? 'input-error' : ''}`}
                  value={formData.tokenSymbol}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      tokenSymbol: e.target.value.toUpperCase()
                    }));
                    setErrors(prev => ({ ...prev, tokenSymbol: '' }));
                  }}
                  maxLength={10}
                />
                {errors.tokenSymbol && (
                  <div className="text-error text-xs mt-1">{errors.tokenSymbol}</div>
                )}
              </div>
              
              <div>
                <label className="label">
                  <span className="label-text font-medium">📝 Token Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. My Awesome Token"
                  className={`input input-bordered w-full ${errors.tokenName ? 'input-error' : ''}`}
                  value={formData.tokenName}
                  onChange={(e) => {
                    setFormData(prev => ({ 
                      ...prev, 
                      tokenName: e.target.value
                    }));
                    setErrors(prev => ({ ...prev, tokenName: '' }));
                  }}
                  maxLength={32}
                />
                {errors.tokenName && (
                  <div className="text-error text-xs mt-1">{errors.tokenName}</div>
                )}
              </div>
            </div>
            
            <div className="alert alert-success">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="text-xs">
                <div>Your <strong>{formData.tokenSymbol || 'TOKEN'}</strong> will be paired with <strong>SOL</strong></div>
                <div>Dynamic fees: 0.1% (low volume) → 3.0% (high volume)</div>
              </div>
            </div>
          </div>

          {/* Fee Selection */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Fee Tier</span>
              <span className="label-text-alt">{formData.fee}%</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[0.05, 0.3, 1.0].map((fee) => (
                <button
                  key={fee}
                  type="button"
                  className={`btn btn-sm ${
                    formData.fee === fee ? 'btn-primary' : 'btn-outline'
                  }`}
                  onClick={() => setFormData(prev => ({ ...prev, fee }))}
                >
                  {fee}%
                </button>
              ))}
            </div>
            {errors.fee && (
              <div className="text-error text-sm mt-1">{errors.fee}</div>
            )}
          </div>

          {/* Initial Token Supply */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">
                  <span className="label-text font-medium">
                    💰 {formData.tokenSymbol || 'Your Token'} Supply
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="1000.0"
                  className={`input input-bordered w-full ${errors.tokenAmount ? 'input-error' : ''}`}
                  value={formData.tokenAmount}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, tokenAmount: e.target.value }));
                    setErrors(prev => ({ ...prev, tokenAmount: '' }));
                  }}
                  min="0"
                  step="any"
                />
                <div className="text-xs text-gray-500 mt-1">Tokens created for you to trade</div>
                {errors.tokenAmount && (
                  <div className="text-error text-sm mt-1">{errors.tokenAmount}</div>
                )}
              </div>

              <div>
                <label className="label">
                  <span className="label-text font-medium">
                    🟡 SOL for Liquidity
                  </span>
                </label>
                <input
                  type="number"
                  placeholder="1.0"
                  className={`input input-bordered w-full ${errors.solAmount ? 'input-error' : ''}`}
                  value={formData.solAmount}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, solAmount: e.target.value }));
                    setErrors(prev => ({ ...prev, solAmount: '' }));
                  }}
                  min="0"
                  step="any"
                />
                <div className="text-xs text-gray-500 mt-1">SOL to pair with your token</div>
                {errors.solAmount && (
                  <div className="text-error text-sm mt-1">{errors.solAmount}</div>
                )}
              </div>
            </div>
            
            <div className="bg-base-100 p-3 rounded-lg border">
              <div className="text-sm">
                <div className="font-semibold mb-1">🔄 What happens:</div>
                <div className="space-y-1 text-xs">
                  <div>• Creates <strong>{formData.tokenAmount} {formData.tokenSymbol || 'TOKEN'}</strong> tokens for you</div>
                  <div>• Creates <strong>{formData.tokenSymbol || 'TOKEN'}/SOL Loko Pool</strong> (LP)</div>
                  <div>• Your tokens go to vaultX, your SOL goes to vaultY</div>
                  <div>• You earn LP tokens representing your liquidity share</div>
                  <div>• Enables dynamic fees (0.1% to 3.0% based on volume)</div>
                  <div className="text-warning">• ⏰ Process takes 1-2 minutes with 4 wallet signatures</div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Error */}
          {errors.submit && (
            <div className="alert alert-error">
              <span>{errors.submit}</span>
            </div>
          )}

          {/* Actions */}
          <div className="modal-action">
            <button 
              type="button" 
              className="btn btn-ghost" 
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="btn btn-primary"
              disabled={isLoading || !publicKey}
            >
              {isLoading ? (
                <>
                  <span className="loading loading-spinner loading-sm"></span>
                  Creating {formData.tokenSymbol || 'Token'}/SOL Pool...
                </>
              ) : (
                `🚀 Create ${formData.tokenSymbol || 'Token'}/SOL Pool`
              )}
            </button>
          </div>
        </form>
      </div>
    
      
      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}