'use client';

import React from 'react';
import { PoolProvider, usePoolContext } from '../contexts/PoolContext';
import { UIProvider, useUIContext } from '../contexts/UIContext';
import MainLayout from './layout/MainLayout';
import SwapTokens from './SwapTokens';
import DepositLiquidity from './DepositLiquidity';
import WithdrawLiquidity from './WithdrawLiquidity';
import SettingsModal from './modals/SettingsModal';
import CreatePoolModal from './modals/CreatePoolModal';

function LokoSwapContent() {
  const { pools, loading, error, refreshPools } = usePoolContext();
  const {
    isSettingsModalOpen,
    setSettingsModalOpen,
    isCreatePoolModalOpen,
    setCreatePoolModalOpen,
    currentView,
    setCurrentView
  } = useUIContext();

  const handlePoolCreated = async () => {
    // Refresh pools list
    console.log('Pool created, refreshing list...');
    await refreshPools();
    setCreatePoolModalOpen(false);
  };

  const handleDeposit = async () => {
    console.log('Liquidity deposited, refreshing list...');
    await refreshPools();
  };

  const hookEnabledPools = pools.filter(p => p.supportsTransferHooks);
  const totalPools = pools.length;

  return (
    <>
      <MainLayout
        onCreatePoolClick={() => setCreatePoolModalOpen(true)}
        onSettingsClick={() => setSettingsModalOpen(true)}
      >
        {/* Main Content Area */}
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6 text-center">
            <div className="card bg-gradient-to-r from-primary/10 to-secondary/10 shadow-xl">
              <div className="card-body">
                <h2 className="card-title justify-center text-2xl mb-2">
                  🚀 LokoSwap AMM
                </h2>
                <p className="text-base-content/80 mb-4">
                  <span className="font-bold text-primary">SOL/WSOL</span>Loko pools with <span className="font-bold text-accent">Dynamic Fee Scaling</span>
                </p>
                
                {/* Pool Statistics */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="stat bg-base-100/50 rounded-lg">
                    <div className="stat-value text-lg">{totalPools}</div>
                    <div className="stat-desc">Total Pools</div>
                  </div>
                  <div className="stat bg-base-100/50 rounded-lg">
                    <div className="stat-value text-lg text-accent">{hookEnabledPools.length}</div>
                    <div className="stat-desc">💰 Loko Pools</div>
                  </div>
                </div>

                {loading && (
                  <div className="flex items-center justify-center mt-4">
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    <span>Loading pools...</span>
                  </div>
                )}

                {error && (
                  <div className="alert alert-warning mt-4">
                    <span>{error}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* View Toggle */}
          <div className="mb-6">
            <div className="tabs tabs-boxed bg-base-200 p-1">
              <button
                className={`tab ${currentView === 'swap' ? 'tab-active' : ''}`}
                onClick={() => setCurrentView('swap')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                🔄 Swap SOL/WSOL 
              </button>
              <button
                className={`tab ${currentView === 'deposit' ? 'tab-active' : ''}`}
                onClick={() => setCurrentView('deposit')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                💰 Add SOL/WSOL
              </button>
              <button
                className={`tab ${currentView === 'withdraw' ? 'tab-active' : ''}`}
                onClick={() => setCurrentView('withdraw')}
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4M12 4l-8 8 8 8" />
                </svg>
                Withdraw
              </button>
            </div>
          </div>

          {/* Main Interface */}
          <div className="card bg-base-200 shadow-xl">
            <div className="card-body">
              {currentView === 'swap' && <SwapTokens pools={pools} />}
              {currentView === 'deposit' && <DepositLiquidity pools={pools} onDeposit={handleDeposit} />}
              {currentView === 'withdraw' && <WithdrawLiquidity pools={pools} onWithdraw={handleDeposit} />}
            </div>
          </div>

          {/* Transfer Hook Information Panel */}
          {hookEnabledPools.length > 0 && (
            <div className="mt-6">
              <div className="card bg-base-100 shadow-lg border border-primary/20">
                <div className="card-body">
                  <h3 className="card-title text-primary">💰 Dynamic Fee Loko Pools</h3>
                  <div className="text-sm text-base-content/80 space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>Fees scale from 0.1% to 3.0% based on trading velocity</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>Automatic fee collection with SOL → WSOL conversion</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-success rounded-full"></div>
                      <span>Token-2022 with transfer hook extensions</span>
                    </div>
                  </div>

                  {/* Active Pools with Hooks */}
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Active Loko Pools:</h4>
                    <div className="space-y-1">
                      {hookEnabledPools.map((pool, index) => (
                        <div key={pool.config.toString()} className="flex items-center justify-between bg-base-200 p-2 rounded">
                          <span className="font-mono text-sm">
                            💰 {pool.tokenXSymbol} / 🟡 {pool.tokenYSymbol}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="badge badge-primary badge-xs">Dynamic</span>
                            {pool.supportsTransferFees && <span className="badge badge-secondary badge-xs">💰</span>}
                            <span className="text-xs text-base-content/70">0.1-3.0%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Network Info */}
          <div className="mt-6 text-center">
            <div className="flex items-center justify-center space-x-2 text-sm text-base-content/70">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>Connected to Solana Devnet</span>
            </div>
            <div className="text-xs text-base-content/50 mt-1">
              LokoSwap AMM • Dynamic Fee  • Token-2022
            </div>
          </div>

          {/* Create Pool CTA */}
          {totalPools === 0 && !loading && (
            <div className="mt-6 text-center">
              <div className="card bg-base-100 shadow-lg">
                <div className="card-body">
                  <h3 className="card-title justify-center">🚀 Get Started</h3>
                  <p className="text-base-content/80 mb-4">
                    Create your first Loko pool with dynamic fees to start trading!
                  </p>
                  <button 
                    className="btn btn-primary"
                    onClick={() => setCreatePoolModalOpen(true)}
                  >
                    💰 Create a Loko Pool
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </MainLayout>

      {/* Modals */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setSettingsModalOpen(false)}
      />

      <CreatePoolModal
        isOpen={isCreatePoolModalOpen}
        onClose={() => setCreatePoolModalOpen(false)}
        onPoolCreated={handlePoolCreated}
      />
    </>
  );
}

export default function LokoSwap() {
  return (
    <PoolProvider>
      <UIProvider>
        <LokoSwapContent />
      </UIProvider>
    </PoolProvider>
  );
}