'use client';

import React, { useState, useMemo } from 'react';
import { usePoolContext, Pool } from '../../contexts/PoolContext';

interface SidebarProps {
  onCreatePoolClick: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  className?: string;
}

export default function Sidebar({
  onCreatePoolClick,
  isCollapsed,
  onToggleCollapse,
  className = ""
}: SidebarProps) {
  const { pools, loading, error, refreshPools } = usePoolContext();
  const [searchTerm, setSearchTerm] = useState('');

  // Filter pools based on search term
  const filteredPools = useMemo(() => {
    if (!searchTerm) return pools;

    return pools.filter(pool =>
      pool.tokenXSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pool.tokenYSymbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${pool.tokenXSymbol}/${pool.tokenYSymbol}`.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [pools, searchTerm]);

  const formatTVL = (_pool: Pool) => {
    // Placeholder for TVL calculation - would need actual token balances
    return "$0.00";
  };

  const formatVolume = (_pool: Pool) => {
    // Placeholder for 24h volume calculation
    return "$0.00";
  };

  const formatFee = (fee: number) => {
    return `${(fee / 100).toFixed(2)}%`;
  };

  return (
    <aside className={`bg-base-200 border-r border-base-300 flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-80'
    } ${className}`}>
      {/* Sidebar Header */}
      <div className="p-4 border-b border-base-300">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-base-content">Liquidity Pools</h2>
          )}
          <button
            onClick={onToggleCollapse}
            className="btn btn-ghost btn-sm btn-circle"
            title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <svg 
              className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {/* Search Bar */}
        {!isCollapsed && (
          <div className="mt-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search pools..."
                className="input input-sm w-full pl-8 bg-base-100"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <svg 
                className="w-4 h-4 absolute left-2.5 top-2 text-base-content/50" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {/* Pool List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {isCollapsed ? (
          // Collapsed view - just show pool count
          <div className="text-center">
            {loading ? (
              <div className="loading loading-spinner loading-sm"></div>
            ) : (
              <>
                <div className="text-xs text-base-content/70">{pools.length}</div>
                <div className="text-xs text-base-content/50">Pools</div>
              </>
            )}
          </div>
        ) : (
          <>
            {loading ? (
              <div className="text-center py-8">
                <div className="loading loading-spinner loading-md"></div>
                <div className="text-sm text-base-content/70 mt-2">Loading pools...</div>
              </div>
            ) : error ? (
              <div className="text-center py-8">
                <div className="text-error text-sm mb-2">Failed to load pools</div>
                <div className="text-xs text-base-content/50 mb-3">{error}</div>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={refreshPools}
                >
                  Retry
                </button>
              </div>
            ) : filteredPools.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-base-content/50">
                  {searchTerm ? 'No pools found' : pools.length === 0 ? 'No pools available' : 'No pools match your search'}
                </div>
                {searchTerm && (
                  <button
                    className="btn btn-link btn-sm mt-2"
                    onClick={() => setSearchTerm('')}
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              filteredPools.map((pool) => (
                <div 
                  key={pool.config.toString()} 
                  className="card bg-base-100 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="card-body p-4">
                    {/* Pool Header */}
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold text-base">
                        {pool.tokenXSymbol}/{pool.tokenYSymbol}
                      </h3>
                      <div className="flex items-center space-x-1">
                        {pool.locked && (
                          <div className="badge badge-error badge-xs" title="Pool is locked">
                            🔒
                          </div>
                        )}
                        <div className="badge badge-outline badge-xs">
                          {formatFee(pool.fee)}
                        </div>
                      </div>
                    </div>

                    {/* Pool Stats */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <div className="text-base-content/70">TVL</div>
                        <div className="font-medium">{formatTVL(pool)}</div>
                      </div>
                      <div>
                        <div className="text-base-content/70">24h Volume</div>
                        <div className="font-medium">{formatVolume(pool)}</div>
                      </div>
                    </div>

                    {/* Pool Address (truncated) */}
                    <div className="text-xs text-base-content/50 mt-2">
                      {pool.config.toString().slice(0, 8)}...{pool.config.toString().slice(-8)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </>
        )}
      </div>

      {/* Create Pool Button */}
      <div className="p-4 border-t border-base-300">
        <button
          onClick={onCreatePoolClick}
          className={`btn btn-primary w-full ${isCollapsed ? 'btn-circle' : ''}`}
          title="Create New Pool"
        >
          {isCollapsed ? (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Create Pool
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
