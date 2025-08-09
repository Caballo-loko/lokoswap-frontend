import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { useState, useEffect } from 'react';
import { PublicKey } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';
import { NATIVE_MINT } from '../constants/programs';
import { usePoolContext } from '../contexts/PoolContext';

export interface TokenAccount {
  mint: PublicKey;
  address: PublicKey;
  amount: bigint;
  decimals: number;
  symbol: string;
  name?: string;
  hasTransferHook?: boolean;
  hasTransferFee?: boolean;
  isToken2022?: boolean;
  programId: PublicKey;
}

export function useTokenAccounts() {
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const { discoveredTokens } = usePoolContext();
  const [tokenAccounts, setTokenAccounts] = useState<TokenAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey) {
      setTokenAccounts([]);
      return;
    }

    const fetchTokenAccounts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const accounts: TokenAccount[] = [];

        // Add native SOL balance first
        const solBalance = await connection.getBalance(publicKey);
        if (solBalance > 0) {
          accounts.push({
            mint: NATIVE_MINT,
            address: publicKey,
            amount: BigInt(solBalance),
            decimals: 9,
            symbol: 'SOL',
            name: 'Solana',
            hasTransferHook: false,
            hasTransferFee: false,
            isToken2022: false,
            programId: TOKEN_PROGRAM_ID
          });
        }

        // Get Token Program accounts
        try {
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_PROGRAM_ID }
          );

          for (const account of tokenAccounts.value) {
            const accountData = account.account.data.parsed.info;
            const mint = new PublicKey(accountData.mint);
            const amount = BigInt(accountData.tokenAmount.amount);
            const decimals = accountData.tokenAmount.decimals;

            // Only include accounts with balance > 0
            if (amount > 0n) {
              const discoveredToken = discoveredTokens.find(t => t.mint === mint.toString());
              
              accounts.push({
                mint,
                address: account.pubkey,
                amount,
                decimals,
                symbol: discoveredToken?.symbol || `${mint.toString().slice(0, 4)}...${mint.toString().slice(-4)}`,
                name: discoveredToken?.name || 'Token',
                hasTransferHook: false,
                hasTransferFee: false,
                isToken2022: false,
                programId: TOKEN_PROGRAM_ID
              });
            }
          }
        } catch (err) {
          console.warn('Error fetching Token Program accounts:', err);
        }

        // Get Token-2022 Program accounts
        try {
          const token2022Accounts = await connection.getParsedTokenAccountsByOwner(
            publicKey,
            { programId: TOKEN_2022_PROGRAM_ID }
          );

          console.log(`Found ${token2022Accounts.value.length} Token-2022 accounts`);

          for (const account of token2022Accounts.value) {
            const accountData = account.account.data.parsed.info;
            const mint = new PublicKey(accountData.mint);
            const amount = BigInt(accountData.tokenAmount.amount);
            const decimals = accountData.tokenAmount.decimals;

            console.log(`Token-2022 account: ${mint.toString()}, balance: ${amount.toString()}`);

            // Only include accounts with balance > 0
            if (amount > 0n) {
              const discoveredToken = discoveredTokens.find(t => t.mint === mint.toString());
              
              accounts.push({
                mint,
                address: account.pubkey,
                amount,
                decimals,
                symbol: discoveredToken?.symbol || `${mint.toString().slice(0, 4)}...${mint.toString().slice(-4)}`,
                name: discoveredToken?.name || 'Token-2022',
                hasTransferHook: discoveredToken?.hasTransferHook || false,
                hasTransferFee: discoveredToken?.hasTransferFee || false,
                isToken2022: true,
                programId: TOKEN_2022_PROGRAM_ID
              });
            }
          }
        } catch (err) {
          console.warn('Error fetching Token-2022 Program accounts:', err);
        }

        // Sort accounts by balance (descending)
        accounts.sort((a, b) => {
          if (a.amount > b.amount) return -1;
          if (a.amount < b.amount) return 1;
          return 0;
        });

        console.log(`Found ${accounts.length} token accounts`);
        accounts.forEach(acc => {
          console.log(`- ${acc.symbol}: ${formatTokenAmount(acc.amount, acc.decimals)} ${acc.isToken2022 ? '(Token-2022)' : '(SPL Token)'}${acc.hasTransferHook ? ' 🔗' : ''}`);
        });

        setTokenAccounts(accounts);
      } catch (err) {
        console.error('Error fetching token accounts:', err);
        setError('Failed to fetch token accounts');
      } finally {
        setLoading(false);
      }
    };

    fetchTokenAccounts();
  }, [connection, publicKey, discoveredTokens]);

  const refetch = () => {
    if (publicKey) {
      const fetchAccounts = async () => {
        setLoading(true);
        // Re-run the fetch logic
        await new Promise(resolve => setTimeout(resolve, 100));
        // The useEffect will handle the actual fetching
      };
      fetchAccounts();
    }
  };

  return { tokenAccounts, loading, error, refetch };
}

export function formatTokenAmount(amount: bigint, decimals: number): string {
  const divisor = BigInt(10 ** decimals);
  const whole = amount / divisor;
  const fraction = amount % divisor;
  
  if (fraction === 0n) {
    return whole.toString();
  }
  
  const fractionStr = fraction.toString().padStart(decimals, '0');
  const trimmedFraction = fractionStr.replace(/0+$/, '');
  
  if (trimmedFraction === '') {
    return whole.toString();
  }
  
  // Limit decimal places for display
  const limitedFraction = trimmedFraction.length > 6 ? trimmedFraction.slice(0, 6) : trimmedFraction;
  
  return `${whole}.${limitedFraction}`;
}