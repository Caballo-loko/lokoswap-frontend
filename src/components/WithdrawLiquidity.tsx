'use client';

import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { TOKEN_2022_PROGRAM_ID, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, NATIVE_MINT } from '@solana/spl-token';
import { createHookRemainingAccounts } from '../utils/token2022';
import { useTokenAccounts, TokenAccount, formatTokenAmount } from '../hooks/useTokenAccounts';
import { Pool } from '../contexts/PoolContext';
import idl from '../idl/loko_swap.json';

interface WithdrawLiquidityProps {
  pools: Pool[];
  onWithdraw?: () => void;
}

export default function WithdrawLiquidity({ pools, onWithdraw }: WithdrawLiquidityProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { tokenAccounts } = useTokenAccounts();
  const [selectedPool, setSelectedPool] = useState<string>('');
  const [withdrawAmount, setWithdrawAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  const getProvider = () => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
  };

  const getTokenAccount = (mint: PublicKey): TokenAccount | undefined => {
    return tokenAccounts.find(account => account.mint.equals(mint));
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPool || !withdrawAmount || !wallet.publicKey) {
      alert('Please fill in all fields and connect wallet');
      return;
    }

    const selectedPoolData = pools.find(p => p.config.toString() === selectedPool);
    if (!selectedPoolData) {
      alert('Selected pool not found');
      return;
    }

    const lpTokenAccount = getTokenAccount(selectedPoolData.mintLp);
    if (!lpTokenAccount) {
      alert('You do not have LP tokens for this pool');
      return;
    }

    setIsLoading(true);
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Wallet not connected');

      const program = new Program(idl as any, provider);

      // Convert withdrawal amount to proper decimals
      const withdrawAmountBN = new BN(parseFloat(withdrawAmount) * Math.pow(10, lpTokenAccount.decimals));
      
      // Calculate minimum amounts (simplified - should be based on pool reserves)
      const minAmountX = new BN(parseFloat(withdrawAmount) * Math.pow(10, 9) * 0.95); // 5% slippage
      const minAmountY = new BN(parseFloat(withdrawAmount) * Math.pow(10, 9) * 0.95); // 5% slippage

      // Get user token accounts using Token-2022
      const userX = await getAssociatedTokenAddress(
        selectedPoolData.mintX, 
        wallet.publicKey, 
        false, 
        TOKEN_2022_PROGRAM_ID
      );
      const userY = await getAssociatedTokenAddress(
        selectedPoolData.mintY, 
        wallet.publicKey, 
        false, 
        TOKEN_2022_PROGRAM_ID
      );
      const userLp = await getAssociatedTokenAddress(
        selectedPoolData.mintLp, 
        wallet.publicKey, 
        false, 
        TOKEN_2022_PROGRAM_ID
      );

      // Get vault addresses using Token-2022
      const vaultX = await getAssociatedTokenAddress(
        selectedPoolData.mintX, 
        selectedPoolData.config, 
        true, 
        TOKEN_2022_PROGRAM_ID
      );
      const vaultY = await getAssociatedTokenAddress(
        selectedPoolData.mintY, 
        selectedPoolData.config, 
        true, 
        TOKEN_2022_PROGRAM_ID
      );

      console.log('Withdrawing liquidity:');
      console.log('Pool:', selectedPoolData.config.toString());
      console.log('LP Amount:', withdrawAmount);
      console.log('Min Amount X:', minAmountX.toString());
      console.log('Min Amount Y:', minAmountY.toString());

      // Add hook remaining accounts for withdrawal - using AMM PDA WSOL account
      let remainingAccounts: any[] = [];
      try {
        // For withdrawals, we need to use the AMM PDA WSOL account (different from deposits/swaps)
        const ammPdaWSolAccount = await getAssociatedTokenAddress(
          NATIVE_MINT,
          selectedPoolData.config, // AMM PDA
          true, // allowOwnerOffCurve for PDA
          TOKEN_PROGRAM_ID // WSOL uses regular Token Program
        );

        remainingAccounts = createHookRemainingAccounts(
          selectedPoolData.mintX, // Token X is hook token (matches test pattern)
          wallet.publicKey,
          true, // This IS a withdraw operation
          ammPdaWSolAccount // Pass AMM PDA WSOL account for withdrawals
        );
        console.log('Adding hook accounts for Token-2022 withdrawals (Token X = hook, using AMM PDA WSOL)');
      } catch (error) {
        console.warn('Failed to create hook remaining accounts:', error);
        // Continue without hook accounts if creation fails
        remainingAccounts = [];
      }

      // Use accountsPartial 
      const tx = await program.methods
        .withdraw(withdrawAmountBN, minAmountX, minAmountY)
        .accountsPartial({
          user: wallet.publicKey,
          mintX: selectedPoolData.mintX,
          mintY: selectedPoolData.mintY,
          userX: userX,
          userY: userY,
          vaultX: vaultX,
          vaultY: vaultY,
          config: selectedPoolData.config,
          mintLp: selectedPoolData.mintLp,
          userLp: userLp,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();

      console.log('Liquidity withdrawn! Transaction:', tx);
      alert(`Liquidity withdrawn successfully!\nTransaction: ${tx}`);
      
      if (onWithdraw) {
        onWithdraw();
      }
      
      // Reset form
      setWithdrawAmount('');
    } catch (error) {
      console.error('Withdrawal failed:', error);
      alert('Failed to withdraw liquidity: ' + (error as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const selectedPoolData = pools.find(p => p.config.toString() === selectedPool);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">Withdraw Liquidity</h2>
        <p className="text-base-content/70">
          Remove your liquidity from pools
        </p>
      </div>

      {pools.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-6xl mb-4">🏊</div>
          <h3 className="text-xl font-semibold mb-2">No Pools Available</h3>
          <p className="text-base-content/70">Create a pool first to provide liquidity</p>
        </div>
      ) : (
        <form onSubmit={handleWithdraw} className="space-y-4">
          {/* Pool Selection */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Select Pool</span>
            </label>
            <select
              className="select select-bordered w-full"
              value={selectedPool}
              onChange={(e) => setSelectedPool(e.target.value)}
            >
              <option value="">Choose a pool...</option>
              {pools.map((pool) => (
                <option key={pool.config.toString()} value={pool.config.toString()}>
                  {pool.tokenXSymbol} / {pool.tokenYSymbol}
                </option>
              ))}
            </select>
          </div>

          {selectedPoolData && (
            <>
              {/* Pool Info */}
              <div className="bg-base-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Pool Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-base-content/70">Pool Address:</span>
                    <div className="font-mono text-xs">{selectedPoolData.config.toString().slice(0, 8)}...</div>
                  </div>
                  <div>
                    <span className="text-base-content/70">Fee Rate:</span>
                    <div className="font-mono">{selectedPoolData.fee / 100}%</div>
                  </div>
                </div>
              </div>

              {/* Withdrawal Amount */}
              <div>
                <label className="label">
                  <span className="label-text font-medium">LP Tokens to Withdraw</span>
                  {selectedPoolData && (() => {
                    const lpAccount = getTokenAccount(selectedPoolData.mintLp);
                    return lpAccount ? (
                      <span className="label-text-alt">
                        Available: {formatTokenAmount(lpAccount.amount, lpAccount.decimals)}
                      </span>
                    ) : (
                      <span className="label-text-alt text-error">No LP tokens</span>
                    );
                  })()}
                </label>
                <div className="join w-full">
                  <input
                    type="number"
                    placeholder="0.0"
                    className="input input-bordered join-item flex-1"
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    min="0"
                    step="any"
                  />
                  <button
                    type="button"
                    className="btn btn-outline join-item"
                    onClick={() => {
                      const lpAccount = selectedPoolData ? getTokenAccount(selectedPoolData.mintLp) : null;
                      if (lpAccount) {
                        const maxAmount = formatTokenAmount(lpAccount.amount, lpAccount.decimals);
                        setWithdrawAmount(maxAmount);
                      }
                    }}
                    disabled={!selectedPoolData || !getTokenAccount(selectedPoolData.mintLp)}
                  >
                    Max
                  </button>
                </div>
              </div>

              {/* Withdrawal Preview */}
              <div className="bg-base-100 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">You will receive (estimated):</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>{selectedPoolData.tokenXSymbol}:</span>
                    <span className="font-mono">~{withdrawAmount || '0'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{selectedPoolData.tokenYSymbol} 🔗:</span>
                    <span className="font-mono">~{withdrawAmount || '0'}</span>
                  </div>
                </div>
                <div className="text-xs text-base-content/70 mt-2">
                  * Estimates for demo purposes - actual amounts depend on pool reserves
                </div>
              </div>

              {/* Status Notice */}
              {selectedPoolData && !getTokenAccount(selectedPoolData.mintLp) && (
                <div className="alert alert-warning">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-sm">
                    You don't have LP tokens for this pool. Provide liquidity first to receive LP tokens.
                  </span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                className="btn btn-primary w-full"
                disabled={
                  isLoading || 
                  !withdrawAmount || 
                  !wallet.publicKey || 
                  (selectedPoolData && !getTokenAccount(selectedPoolData.mintLp))
                }
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Withdrawing...
                  </>
                ) : !wallet.publicKey ? (
                  'Connect Wallet'
                ) : selectedPoolData && !getTokenAccount(selectedPoolData.mintLp) ? (
                  'No LP Tokens'
                ) : (
                  `Withdraw ${withdrawAmount || '0'} LP Tokens`
                )}
              </button>
            </>
          )}
        </form>
      )}
    </div>
  );
}