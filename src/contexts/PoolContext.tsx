'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { Program, AnchorProvider, BN } from '@coral-xyz/anchor';
import { LOKO_SWAP_PROGRAM_ID, NATIVE_MINT } from '../constants/programs';
import idl from '../idl/loko_swap.json';

// Define the Pool type with Hook support
export interface Pool {
  config: PublicKey;
  mintX: PublicKey;
  mintY: PublicKey;
  mintLp: PublicKey;
  seed: BN;
  fee: number;
  locked: boolean;
  authority: PublicKey | null;
  tokenXSymbol: string;
  tokenYSymbol: string;
  // Hook Support Properties
  supportsTransferHooks?: boolean;
  supportsTransferFees?: boolean;
  hookProgramId?: PublicKey | null;
  isToken2022Pool?: boolean;
}

interface PoolContextType {
  pools: Pool[];
  loading: boolean;
  error: string | null;
  refreshPools: () => Promise<void>;
  addPool: (pool: Pool) => void;
  discoveredTokens: DiscoveredToken[];
}

interface DiscoveredToken {
  mint: string;
  symbol: string;
  name?: string;
  hasTransferHook?: boolean;
  hasTransferFee?: boolean;
  isToken2022?: boolean;
}

const PoolContext = createContext<PoolContextType | undefined>(undefined);

export function usePoolContext() {
  const context = useContext(PoolContext);
  if (context === undefined) {
    throw new Error('usePoolContext must be used within a PoolProvider');
  }
  return context;
}

interface PoolProviderProps {
  children: ReactNode;
}

export function PoolProvider({ children }: PoolProviderProps) {
  const { connection } = useConnection();
  const wallet = useWallet();
  const [pools, setPools] = useState<Pool[]>([]);
  const [discoveredTokens, setDiscoveredTokens] = useState<DiscoveredToken[]>([
    // Initial known tokens
    {
      mint: NATIVE_MINT.toString(),
      symbol: 'SOL',
      name: 'Solana',
      hasTransferHook: false,
      hasTransferFee: false,
      isToken2022: false,
    }
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getProvider = () => {
    if (!wallet.publicKey || !wallet.signTransaction) return null;
    return new AnchorProvider(connection, wallet as any, { commitment: 'confirmed' });
  };

  const fetchPools = async () => {
    console.log('🔍 Starting to fetch LokoSwap pools with transfer hook support...');
    setLoading(true);
    setError(null);

    try {
      const provider = getProvider();
      if (!provider) {
        console.log('❌ No provider - wallet not connected');
        setError('Wallet not connected');
        setLoading(false);
        return;
      }

      // Create program with correct LokoSwap program ID
      const program = new Program(idl as any, provider);
      console.log('📋 LokoSwap program initialized:', LOKO_SWAP_PROGRAM_ID.toString());

      // Method 1: Try to get all Config accounts using getProgramAccounts
      let configAccounts: any[] = [];
      try {
        console.log('Attempting to fetch all Config accounts...');
        const accounts = await (program.account as any).config.all();
        configAccounts = accounts;
        console.log(`✅ Found ${accounts.length} Config accounts via program.account.config.all()`);
      } catch (err) {
        console.warn('⚠️ Could not fetch Config accounts via Anchor, trying manual approach:', err);
        
        // Method 2: Try manually using connection.getProgramAccounts with proper discriminator
        try {
          // Config account discriminator from IDL: [155, 12, 170, 224, 30, 250, 204, 130]
          const configDiscriminator = Buffer.from([155, 12, 170, 224, 30, 250, 204, 130]);
          
          const rawAccounts = await connection.getProgramAccounts(LOKO_SWAP_PROGRAM_ID, {
            filters: [
              {
                memcmp: {
                  offset: 0,
                  bytes: configDiscriminator.toString('base64'), // Use base64 encoding of discriminator
                }
              }
            ]
          });
          
          console.log(`Found ${rawAccounts.length} raw program accounts`);
          
          for (const rawAccount of rawAccounts) {
            try {
              const decoded = program.coder.accounts.decode('config', rawAccount.account.data);
              configAccounts.push({
                publicKey: rawAccount.pubkey,
                account: decoded
              });
            } catch (decodeError) {
              console.warn('Could not decode account:', rawAccount.pubkey.toString());
            }
          }
        } catch (rawErr) {
          console.warn('⚠️ Manual fetch also failed:', rawErr);
        }
      }

      const poolsData: Pool[] = [];
      const newDiscoveredTokens: DiscoveredToken[] = [...discoveredTokens];

      for (const account of configAccounts) {
        try {
          const config = account.account as any;

          console.log('Processing pool config:', {
            pubkey: account.publicKey.toString(),
            mintX: config.mintX?.toString(),
            mintY: config.mintY?.toString(),
            fee: config.fee,
            supportsTransferHooks: config.supportsTransferHooks,
            hookProgramId: config.defaultHookProgram?.toString(),
          });

          // Get token symbols and detect if they have transfer hooks
          const getTokenInfo = (mint: PublicKey): { symbol: string; hasHook: boolean; isToken2022: boolean } => {
            const mintStr = mint.toString();
            
            // Check if this is a known token
            if (mintStr === NATIVE_MINT.toString()) {
              return { symbol: 'SOL', hasHook: false, isToken2022: false };
            }
            
            // For unknown tokens, we'll use a truncated mint as symbol
            // In production, you'd fetch token metadata
            const symbol = `${mintStr.slice(0, 4)}...${mintStr.slice(-4)}`;
            
            // Check if this token has transfer hooks (indicated by pool supporting hooks)
            const hasHook = config.supportsTransferHooks === true;
            const isToken2022 = hasHook || config.supportsTransferFees === true;
            
            return { symbol, hasHook, isToken2022 };
          };

          const tokenXInfo = getTokenInfo(config.mintX);
          const tokenYInfo = getTokenInfo(config.mintY);

          // Add discovered tokens to our registry
          [
            { mint: config.mintX.toString(), info: tokenXInfo },
            { mint: config.mintY.toString(), info: tokenYInfo }
          ].forEach(({ mint, info }) => {
            if (!newDiscoveredTokens.find(t => t.mint === mint)) {
              newDiscoveredTokens.push({
                mint,
                symbol: info.symbol,
                hasTransferHook: info.hasHook,
                hasTransferFee: config.supportsTransferFees === true,
                isToken2022: info.isToken2022,
              });
            }
          });

          // Calculate LP mint PDA
          const [mintLp] = PublicKey.findProgramAddressSync(
            [Buffer.from('lp'), account.publicKey.toBuffer()],
            LOKO_SWAP_PROGRAM_ID
          );

          const pool: Pool = {
            config: account.publicKey,
            mintX: config.mintX,
            mintY: config.mintY,
            mintLp,
            seed: config.seed,
            fee: config.fee,
            locked: config.locked,
            authority: config.authority,
            tokenXSymbol: tokenXInfo.symbol,
            tokenYSymbol: tokenYInfo.symbol,
            supportsTransferHooks: config.supportsTransferHooks === true,
            supportsTransferFees: config.supportsTransferFees === true,
            hookProgramId: config.defaultHookProgram || null,
            isToken2022Pool: tokenXInfo.isToken2022 || tokenYInfo.isToken2022,
          };

          poolsData.push(pool);

          const hookInfo = pool.supportsTransferHooks ? ' 🔗 (with transfer hooks)' : '';
          console.log(`✅ Added pool: ${pool.tokenXSymbol}/${pool.tokenYSymbol}${hookInfo}`);
        } catch (poolError) {
          console.error('❌ Error processing pool config:', poolError);
        }
      }

      console.log(`🎉 Successfully loaded ${poolsData.length} pools`);
      setPools(poolsData);
      setDiscoveredTokens(newDiscoveredTokens);
      setError(null);

    } catch (err) {
      console.error('❌ Error fetching pools:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch pools');
      setPools([]);
    } finally {
      setLoading(false);
    }
  };

  const refreshPools = async () => {
    await fetchPools();
  };

  const addPool = (pool: Pool) => {
    setPools(prev => [...prev, pool]);
    
    // Also add any new tokens from this pool to discovered tokens
    const newTokens: DiscoveredToken[] = [];
    
    [
      { mint: pool.mintX.toString(), symbol: pool.tokenXSymbol },
      { mint: pool.mintY.toString(), symbol: pool.tokenYSymbol }
    ].forEach(({ mint, symbol }) => {
      if (!discoveredTokens.find(t => t.mint === mint)) {
        newTokens.push({
          mint,
          symbol,
          hasTransferHook: pool.supportsTransferHooks || false,
          hasTransferFee: pool.supportsTransferFees || false,
          isToken2022: pool.isToken2022Pool || false,
        });
      }
    });
    
    if (newTokens.length > 0) {
      setDiscoveredTokens(prev => [...prev, ...newTokens]);
    }
  };

  // Auto-fetch pools when wallet connects
  useEffect(() => {
    if (wallet.publicKey) {
      fetchPools();
    } else {
      setPools([]);
      setError(null);
    }
  }, [wallet.publicKey, connection]);

  // Auto-refresh pools every 60 seconds when wallet is connected
  useEffect(() => {
    if (!wallet.publicKey) return;

    const interval = setInterval(() => {
      console.log('🔄 Auto-refreshing pools...');
      fetchPools();
    }, 60000);

    return () => clearInterval(interval);
  }, [wallet.publicKey]);

  const value: PoolContextType = {
    pools,
    loading,
    error,
    refreshPools,
    addPool,
    discoveredTokens
  };

  return (
    <PoolContext.Provider value={value}>
      {children}
    </PoolContext.Provider>
  );
}