import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePoolContext, Pool } from '../contexts/PoolContext';
import { formatTokenAmount } from '../hooks/useTokenAccounts';

interface PoolListProps {
  pools?: Pool[]; 
  onPoolsUpdate?: (pools: Pool[]) => void; 
}

export default function PoolList({ pools: propPools }: PoolListProps) {
  const { publicKey } = useWallet();
  const { pools: contextPools, loading, error, refreshPools } = usePoolContext();
  
  const pools = propPools || contextPools;

  if (loading) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🏊 Available Pools</h2>
          <div className="flex items-center justify-center py-8">
            <span className="loading loading-spinner loading-md mr-3"></span>
            <span>Loading pools...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">🏊 Available Pools</h2>
          <div className="alert alert-error">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <div className="font-bold">Failed to load pools</div>
              <div className="text-sm">{error}</div>
            </div>
          </div>
          <div className="card-actions justify-center">
            <button
              onClick={refreshPools}
              className="btn btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body">
        <div className="flex justify-between items-center mb-4">
          <h2 className="card-title">🏊 Available Pools</h2>
          <button
            onClick={refreshPools}
            className="btn btn-sm btn-outline"
            disabled={loading}
          >
            {loading ? (
              <span className="loading loading-spinner loading-xs mr-2"></span>
            ) : (
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
            Refresh
          </button>
        </div>
        
        {pools.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">🏊‍♂️</div>
            <h3 className="text-lg font-semibold mb-2">No Pools Found</h3>
            <p className="text-base-content/70 mb-6">
              Create the first liquidity pool with transfer hook support!
            </p>
            <div className="text-sm text-base-content/50">
              {!publicKey ? 'Connect your wallet to view and create pools.' : 'Be the first to create a pool with Token-2022 transfer hooks.'}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {pools.map((pool) => (
              <div 
                key={pool.config.toString()} 
                className="card bg-base-100 shadow-sm border hover:shadow-md transition-shadow"
              >
                <div className="card-body">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-xl font-bold text-primary">
                        {pool.tokenXSymbol} / {pool.tokenYSymbol}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="badge badge-outline">
                          {(pool.fee / 100).toFixed(2)}% fee
                        </span>
                        {pool.supportsTransferHooks && (
                          <span className="badge badge-primary">
                            🔗 Transfer Hooks
                          </span>
                        )}
                        {pool.supportsTransferFees && (
                          <span className="badge badge-secondary">
                            💰 Transfer Fees
                          </span>
                        )}
                        {pool.isToken2022Pool && (
                          <span className="badge badge-accent">
                            Token-2022
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <span className={`badge ${
                        pool.locked 
                          ? 'badge-error' 
                          : 'badge-success'
                      }`}>
                        {pool.locked ? '🔒 Locked' : '✅ Active'}
                      </span>
                      {pool.authority && pool.authority.equals(publicKey!) && (
                        <div className="text-xs text-base-content/50 mt-1">
                          You own this pool
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Pool Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-semibold text-base-content/70 mb-1">Pool Configuration</div>
                      <div className="font-mono text-xs break-all bg-base-200 p-2 rounded">
                        {pool.config.toString()}
                      </div>
                    </div>
                    
                    <div>
                      <div className="font-semibold text-base-content/70 mb-1">Token Pair</div>
                      <div className="space-y-1">
                        <div className="text-xs">
                          <span className="font-semibold">X:</span>{' '}
                          <span className="font-mono break-all">
                            {pool.mintX.toString().slice(0, 8)}...{pool.mintX.toString().slice(-8)}
                          </span>
                        </div>
                        <div className="text-xs">
                          <span className="font-semibold">Y:</span>{' '}
                          <span className="font-mono break-all">
                            {pool.mintY.toString().slice(0, 8)}...{pool.mintY.toString().slice(-8)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Hook Program Info */}
                  {pool.hookProgramId && (
                    <div className="mt-3 p-3 bg-primary/10 rounded-lg">
                      <div className="font-semibold text-primary text-sm mb-1">
                        🔗 Transfer Hook Program
                      </div>
                      <div className="font-mono text-xs break-all">
                        {pool.hookProgramId.toString()}
                      </div>
                    </div>
                  )}
                  
                  {/* Pool Actions */}
                  <div className="card-actions justify-end mt-4">
                    {!pool.locked && (
                      <>
                        <button className="btn btn-sm btn-primary">
                          Trade
                        </button>
                        <button className="btn btn-sm btn-outline">
                          Add Liquidity
                        </button>
                      </>
                    )}
                    {pool.authority && pool.authority.equals(publicKey!) && (
                      <button 
                        className={`btn btn-sm ${
                          pool.locked ? 'btn-success' : 'btn-error'
                        }`}
                      >
                        {pool.locked ? 'Unlock Pool' : 'Lock Pool'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {pools.length > 0 && (
          <div className="mt-6 text-center text-sm text-base-content/50">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>
                Showing {pools.length} pool{pools.length !== 1 ? 's' : ''} 
                {pools.filter(p => p.supportsTransferHooks).length > 0 && (
                  <> • {pools.filter(p => p.supportsTransferHooks).length} with transfer hooks</>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}