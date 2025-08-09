import React, { useState } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { TOKEN_2022_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
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

interface SwapTokensProps {
  pools: Pool[];
}

export default function SwapTokens({ pools }: SwapTokensProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const { tokenAccounts } = useTokenAccounts();
  const [selectedTokenFrom, setSelectedTokenFrom] = useState<TokenAccount | null>(null);
  const [selectedTokenTo, setSelectedTokenTo] = useState<TokenAccount | null>(null);
  const [amountIn, setAmountIn] = useState('');
  const [amountOut, setAmountOut] = useState('');
  const [isSwapping, setIsSwapping] = useState(false);

  const getProvider = () => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
  };

  // Find a pool that supports the selected token pair
  const findPool = (tokenA: PublicKey, tokenB: PublicKey): Pool | null => {
    return pools.find(pool => 
      (pool.mintX.equals(tokenA) && pool.mintY.equals(tokenB)) ||
      (pool.mintX.equals(tokenB) && pool.mintY.equals(tokenA))
    ) || null;
  };

  const handleSwap = async () => {
    if (!selectedTokenFrom || !selectedTokenTo || !amountIn || !wallet.publicKey) {
      alert('Please fill in all fields');
      return;
    }

    const pool = findPool(selectedTokenFrom.mint, selectedTokenTo.mint);
    if (!pool) {
      alert('No pool found for this token pair');
      return;
    }

    setIsSwapping(true);
    try {
      const provider = getProvider();
      if (!provider) throw new Error('Wallet not connected');

      const program = new Program(idl as any, provider);

      // Convert amount to proper decimals
      const amountInBN = new BN(parseFloat(amountIn) * Math.pow(10, selectedTokenFrom.decimals));
      
      // Determine if we're swapping X for Y or Y for X
      const isX = pool.mintX.equals(selectedTokenFrom.mint);
      
      // Calculate minimum output (simplified - should use actual pool reserves)
      const minReceive = new BN(parseFloat(amountOut || '0') * Math.pow(10, selectedTokenTo.decimals) * 0.95); // 5% slippage

      // Get user token accounts using Token-2022
      const userFrom = await getAssociatedTokenAddress(
        selectedTokenFrom.mint, 
        wallet.publicKey, 
        false, 
        TOKEN_2022_PROGRAM_ID
      );
      const userTo = await getAssociatedTokenAddress(
        selectedTokenTo.mint, 
        wallet.publicKey, 
        false, 
        TOKEN_2022_PROGRAM_ID
      );

      // Get vault addresses using Token-2022
      const vaultX = await getAssociatedTokenAddress(
        pool.mintX, 
        pool.config, 
        true, 
        TOKEN_2022_PROGRAM_ID
      );
      const vaultY = await getAssociatedTokenAddress(
        pool.mintY, 
        pool.config, 
        true, 
        TOKEN_2022_PROGRAM_ID
      );

      // Get user LP account 
      const userLpAccount = await getAssociatedTokenAddress(
        pool.mintLp,
        wallet.publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      console.log('Swapping:');
      console.log('Pool:', pool.config.toString());
      console.log('Amount In:', amountIn);
      console.log('Is X:', isX);
      console.log('Min Receive:', minReceive.toString());

      // Add hook remaining accounts 
      let remainingAccounts: any[] = [];
      try {
        // PATTERN: Token X is WSOL (hook token), Token Y is SOL (native)
        remainingAccounts = createHookRemainingAccounts(
          pool.mintX, 
          wallet.publicKey,
          false 
        );
        console.log('Adding hook accounts for WSOL transfers (dynamic fees)');
      } catch (error) {
        console.warn('Failed to create hook remaining accounts:', error);
        // Continue without hook accounts if creation fails
        remainingAccounts = [];
      }

      const tx = await program.methods
        .swap(amountInBN, isX, minReceive)
        .accountsPartial({
          user: wallet.publicKey,
          mintX: pool.mintX,
          mintY: pool.mintY,
          userX: isX ? userFrom : userTo,
          userY: isX ? userTo : userFrom,
          vaultX: vaultX,
          vaultY: vaultY,
          config: pool.config,
          mintLp: pool.mintLp,                          
          userLp: userLpAccount,                        
          tokenProgram: TOKEN_2022_PROGRAM_ID,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,       
        })
        .remainingAccounts(remainingAccounts)
        .rpc();

      console.log('Swap completed! Transaction:', tx);
      alert(`Swap completed successfully!\nTransaction: ${tx}`);
      
      // Reset form
      setAmountIn('');
      setAmountOut('');
      
    } catch (error) {
      console.error('Error swapping:', error);
      alert('Failed to swap: ' + (error as Error).message);
    } finally {
      setIsSwapping(false);
    }
  };

  const availableTokensTo = selectedTokenFrom 
    ? tokenAccounts.filter(token => 
        !token.mint.equals(selectedTokenFrom.mint) && 
        findPool(selectedTokenFrom.mint, token.mint) !== null
      )
    : [];

  return (
    <div className="bg-gray-800 rounded-lg p-6 shadow-xl">
      <h2 className="text-xl font-semibold text-white mb-4">🔄 Swap SOL/WSOL</h2>
      
      {/* From Token */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          💰 From Token
        </label>
        <select
          value={selectedTokenFrom?.mint.toString() || ''}
          onChange={(e) => {
            const token = tokenAccounts.find(t => t.mint.toString() === e.target.value);
            setSelectedTokenFrom(token || null);
            setSelectedTokenTo(null); // Reset to token when from token changes
          }}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Select token to swap from (SOL/WSOL)</option>
          {tokenAccounts.map((token) => (
            <option key={token.mint.toString()} value={token.mint.toString()}>
              {token.symbol} - {formatTokenAmount(token.amount, token.decimals)}
            </option>
          ))}
        </select>
      </div>

      {/* Amount In */}
      {selectedTokenFrom && (
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Amount to Swap
          </label>
          <div className="relative">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0.0"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="absolute right-3 top-3 text-gray-400">
              {selectedTokenFrom.symbol}
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-1">
            Available: {formatTokenAmount(selectedTokenFrom.amount, selectedTokenFrom.decimals)}
          </p>
        </div>
      )}

      {/* Swap Arrow */}
      <div className="flex justify-center mb-4">
        <button 
          onClick={() => {
            // Swap the selected tokens
            const temp = selectedTokenFrom;
            setSelectedTokenFrom(selectedTokenTo);
            setSelectedTokenTo(temp);
            setAmountIn('');
            setAmountOut('');
          }}
          className="bg-gray-700 hover:bg-gray-600 rounded-full p-2 transition-colors"
        >
          <svg className="w-5 h-5 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
          </svg>
        </button>
      </div>

      {/* To Token */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🟡 To Token  
        </label>
        <select
          value={selectedTokenTo?.mint.toString() || ''}
          onChange={(e) => {
            const token = availableTokensTo.find(t => t.mint.toString() === e.target.value);
            setSelectedTokenTo(token || null);
          }}
          disabled={!selectedTokenFrom}
          className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:opacity-50"
        >
          <option value="">Select token to receive (SOL/WSOL)</option>
          {availableTokensTo.map((token) => (
            <option key={token.mint.toString()} value={token.mint.toString()}>
              {token.symbol} - {formatTokenAmount(token.amount, token.decimals)}
            </option>
          ))}
        </select>
        {selectedTokenFrom && availableTokensTo.length === 0 && (
          <p className="text-red-400 text-xs mt-1">
            ⚠️ No SOL/WSOL liquidity pools available for {selectedTokenFrom.symbol}
          </p>
        )}
      </div>

      {/* Amount Out (estimated) */}
      {selectedTokenTo && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            🎯 You will receive (estimated)
          </label>
          <div className="relative">
            <input
              type="number"
              value={amountOut}
              onChange={(e) => setAmountOut(e.target.value)}
              placeholder="0.0"
              className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
            <div className="absolute right-3 top-3 text-gray-400">
              {selectedTokenTo.symbol}
            </div>
          </div>
        </div>
      )}

      {/* Swap Button */}
      <button
        onClick={handleSwap}
        disabled={!wallet.publicKey || !selectedTokenFrom || !selectedTokenTo || !amountIn || isSwapping}
        className="w-full btn btn-primary disabled:btn-disabled font-semibold py-3 px-4 rounded-lg transition-colors"
      >
        {isSwapping ? '🔄 Swapping...' : !wallet.publicKey ? 'Connect Wallet' : '🚀 Swap Now'}
      </button>

      {selectedTokenFrom && selectedTokenTo && findPool(selectedTokenFrom.mint, selectedTokenTo.mint) && (
        <div className="mt-4 p-3 bg-gray-700 rounded-lg">
          <div className="text-sm text-gray-300">
            <div className="flex items-center justify-between">
              <span>💰 Pool: {selectedTokenFrom.symbol} / {selectedTokenTo.symbol}</span>
              <span className="text-xs bg-primary/20 px-2 py-1 rounded">Dynamic Fees 0.1-3.0%</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
