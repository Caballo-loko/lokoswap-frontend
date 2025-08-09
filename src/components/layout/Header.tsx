'use client';

import React, { useState } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import Link from 'next/link';
import Image from 'next/image';

interface HeaderProps {
  onSettingsClick: () => void;
}

export default function Header({ onSettingsClick }: HeaderProps) {
  const [isNetworkDropdownOpen, setIsNetworkDropdownOpen] = useState(false);

  return (
    <header className="navbar bg-base-300 text-base-content border-b border-base-200 px-4 lg:px-6">
      {/* Logo Section */}
      <div className="navbar-start">
        <Link href="/" className="btn btn-ghost text-xl font-bold">
           <Image src="/image/loko-logo.png" alt="LokoSwap Logo" width={32} height={32} className="hidden lg:inline" />
          <span className="hidden sm:inline ml-2">LokoSwap</span>
        </Link>
        <div className="hidden lg:block ml-4">
          <p className="text-sm text-base-content/70">An AMM with Token 2022 Transfer-hook support andfee-extensions</p>
        </div>
      </div>

      {/* Center - Network Selector */}
      <div className="navbar-center hidden md:flex">
        <div className="dropdown">
          <div 
            tabIndex={0} 
            role="button" 
            className="btn btn-outline btn-sm"
            onClick={() => setIsNetworkDropdownOpen(!isNetworkDropdownOpen)}
          >
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-success rounded-full"></div>
              <span>Solana Devnet</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
          {isNetworkDropdownOpen && (
            <ul 
              tabIndex={0} 
              className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52 mt-2"
            >
              <li>
                <a className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-success rounded-full"></div>
                  <span>Solana Devnet</span>
                  <div className="badge badge-primary badge-sm">Active</div>
                </a>
              </li>
              <li className="disabled">
                <a className="flex items-center space-x-2 opacity-50">
                  <div className="w-2 h-2 bg-base-300 rounded-full"></div>
                  <span>Solana Mainnet</span>
                  <div className="badge badge-ghost badge-sm">Soon</div>
                </a>
              </li>
            </ul>
          )}
        </div>
      </div>

      {/* Right Section - Wallet & Settings */}
      <div className="navbar-end space-x-2">
        {/* Settings Button */}
        <button 
          className="btn btn-ghost btn-circle"
          onClick={onSettingsClick}
          title="Settings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" 
            />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </button>

        {/* Wallet Connect Button */}
        <div className="wallet-adapter-button-trigger">
          <WalletMultiButton />
        </div>
      </div>

      {/* Mobile Network Indicator */}
      <div className="md:hidden absolute top-16 left-4">
        <div className="flex items-center space-x-2 text-xs text-base-content/70">
          <div className="w-1.5 h-1.5 bg-success rounded-full"></div>
          <span>Solana Devnet</span>
        </div>
      </div>
    </header>
  );
}
