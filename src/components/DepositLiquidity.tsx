import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { createHookRemainingAccounts } from '../utils/token2022';
import { useTokenAccounts, TokenAccount, formatTokenAmount } from '../hooks/useTokenAccounts';
import idl from '../idl/loko_swap.json';

interface Pool {
  config: PublicKey;
  mintX: PublicKey;
  mintY: PublicKey;
  mintLp: PublicKey;
  seed: BN;
  tokenXSymbol: string;
  tokenYSymbol: string;
}

interface DepositLiquidityProps {
  pools: Pool[];
  onDeposit: () => void;
}

export default function DepositLiquidity({ pools, onDeposit }: DepositLiquidityProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { tokenAccounts } = useTokenAccounts();
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [amountX, setAmountX] = useState('');
  const [amountY, setAmountY] = useState('');
  const [isDepositing, setIsDepositing] = useState(false);

  const getProvider = () => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
  };

  const getTokenAccount = (mint: PublicKey): TokenAccount | undefined => {
    return tokenAccounts.find(account => account.mint.equals(mint));
  };

  const depositLiquidity = async () => {
    if (!selectedPool || !wallet.publicKey || !amountX || !amountY) {
      alert('Please fill in all fields');
      return;
    }

    const tokenAccountX = getTokenAccount(selectedPool.mintX);
    const tokenAccountY = getTokenAccount(selectedPool.mintY);

    if (!tokenAccountX || !tokenAccountY) {
      alert('You do not have the required tokens for this pool');
      return;
    }

    setIsDepositing(true);
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Wallet not connected');

      const program = new Program(idl as any, provider);

      // Convert amounts to proper decimals
      const amountXBN = new BN(parseFloat(amountX) * Math.pow(10, tokenAccountX.decimals));
      const amountYBN = new BN(parseFloat(amountY) * Math.pow(10, tokenAccountY.decimals));

      // Calculate LP amount (simplified - should be based on pool reserves)
      const lpAmount = amountXBN.add(amountYBN).div(new BN(2));

      // Determine token programs - use Token-2022 for all operations to support extensions
      const tokenProgram = TOKEN_2022_PROGRAM_ID;

      // Get user token accounts
      const userX = await getAssociatedTokenAddress(selectedPool.mintX, wallet.publicKey, false, tokenProgram);
      const userY = await getAssociatedTokenAddress(selectedPool.mintY, wallet.publicKey, false, tokenProgram);
      const userLp = await getAssociatedTokenAddress(selectedPool.mintLp, wallet.publicKey, false, tokenProgram);

      // Get vault addresses
      const vaultX = await getAssociatedTokenAddress(selectedPool.mintX, selectedPool.config, true, tokenProgram);
      const vaultY = await getAssociatedTokenAddress(selectedPool.mintY, selectedPool.config, true, tokenProgram);

      console.log('Adding SOL/WSOL liquidity:');
      console.log('Pool:', selectedPool.config.toString());
      console.log('WSOL Amount (X):', amountX, 'SOL Amount (Y):', amountY);
      console.log('LP tokens to mint:', lpAmount.toString());

      // Add hook remaining accounts 
      let remainingAccounts: any[] = [];
      
      // PATTERN: Token X is WSOL (hook token), Token Y is SOL (native)
      const hasHooks = tokenAccountX?.isToken2022 && tokenAccountX?.hasTransferHook;
      if (hasHooks) {
        console.log('Adding hook accounts for WSOL transfers (dynamic fees)');
        try {
          remainingAccounts = createHookRemainingAccounts(
            selectedPool.mintX, // Token X is WSOL (hook token)
            wallet.publicKey,
            false // Not a withdraw operation
          );
        } catch (error) {
          console.warn('Failed to create hook remaining accounts:', error);
          // Continue without hook accounts if creation fails
          remainingAccounts = [];
        }
      }

      // Use accountsPartial 
      const tx = await program.methods
        .deposit(lpAmount, amountXBN, amountYBN)
        .accountsPartial({
          user: wallet.publicKey,
          mintX: selectedPool.mintX,
          mintY: selectedPool.mintY,
          userX: userX,
          userY: userY,
          vaultX: vaultX,
          vaultY: vaultY,
          config: selectedPool.config,
          mintLp: selectedPool.mintLp,
          userLp: userLp,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .remainingAccounts(remainingAccounts)
        .rpc();

      console.log('SOL/WSOL liquidity added! Transaction:', tx);
      alert(`SOL/WSOL liquidity added successfully!\nTransaction: ${tx}`);
      onDeposit();
      
      // Reset form
      setAmountX('');
      setAmountY('');
      
    } catch (error) {
      console.error('Error depositing liquidity:', error);
      alert('Failed to deposit liquidity: ' + (error as Error).message);
    } finally {
      setIsDepositing(false);
    }
  };

  const tokenAccountX = selectedPool ? getTokenAccount(selectedPool.mintX) : null;
  const tokenAccountY = selectedPool ? getTokenAccount(selectedPool.mintY) : null;

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-4">💰 Add SOL/WSOL Liquidity</h2>
      
      {/* Pool Selection */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🎯 Select a Loko Pool
        </label>
        <select
          value={selectedPool?.config.toString() || ''}
          onChange={(e) => {
            const pool = pools.find(p => p.config.toString() === e.target.value);
            setSelectedPool(pool || null);
          }}
          className="w-full select select-bordered bg-base-200 border-base-300 rounded-lg px-4 py-3 text-base-content focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value="">Select a Loko pool</option>
          {pools.map((pool) => (
            <option key={pool.config.toString()} value={pool.config.toString()}>
              💰 {pool.tokenXSymbol} / 🟡 {pool.tokenYSymbol} (Dynamic Fees)
            </option>
          ))}
        </select>
      </div>

      {selectedPool && (
        <>
          {/* Amount X Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              💰 {selectedPool.tokenXSymbol} Amount (Hook Token)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amountX}
                onChange={(e) => setAmountX(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="absolute right-3 top-3 text-gray-400">
                {selectedPool.tokenXSymbol}
              </div>
            </div>
            {tokenAccountX && (
              <p className="text-xs text-gray-400 mt-1">
                Available: {formatTokenAmount(tokenAccountX.amount, tokenAccountX.decimals)}
              </p>
            )}
          </div>

          {/* Amount Y Input */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-300 mb-2">
              🟡 {selectedPool.tokenYSymbol} Amount (Native SOL)
            </label>
            <div className="relative">
              <input
                type="number"
                value={amountY}
                onChange={(e) => setAmountY(e.target.value)}
                placeholder="0.0"
                className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <div className="absolute right-3 top-3 text-gray-400">
                {selectedPool.tokenYSymbol}
              </div>
            </div>
            {tokenAccountY && (
              <p className="text-xs text-gray-400 mt-1">
                Available: {formatTokenAmount(tokenAccountY.amount, tokenAccountY.decimals)}
              </p>
            )}
          </div>

          {/* Deposit Button */}
          <button
            onClick={depositLiquidity}
            disabled={!wallet.publicKey || !amountX || !amountY || isDepositing || !tokenAccountX || !tokenAccountY}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg transition-colors"
          >
            {isDepositing ? '💰 Adding Liquidity...' : '🚀 Add Liquidity'}
          </button>

          {(!tokenAccountX || !tokenAccountY) && (
            <div className="text-red-400 text-sm mt-2">
              <div className="flex items-center gap-2">
                <span>⚠️</span>
                <div>
                  <div>You need both tokens to add liquidity:</div>
                  <div className="text-xs mt-1">
                    • 💰 {selectedPool.tokenXSymbol} (WSOL with dynamic fees)<br/>
                    • 🟡 {selectedPool.tokenYSymbol} (Native SOL)
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
