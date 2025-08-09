'use client';

import React, { useState, useEffect, useRef } from 'react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Settings {
  slippageTolerance: number;
  transactionDeadline: number;
  autoRefresh: boolean;
  soundEnabled: boolean;
  theme: 'auto' | 'light' | 'dark';
}

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [settings, setSettings] = useState<Settings>({
    slippageTolerance: 0.5,
    transactionDeadline: 20,
    autoRefresh: true,
    soundEnabled: false,
    theme: 'auto'
  });

  const [customSlippage, setCustomSlippage] = useState('');
  const [isCustomSlippage, setIsCustomSlippage] = useState(false);

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('lokoswap-settings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        setSettings(parsed);
        
        // Check if slippage is a custom value
        const presetValues = [0.1, 0.5, 1.0];
        if (!presetValues.includes(parsed.slippageTolerance)) {
          setIsCustomSlippage(true);
          setCustomSlippage(parsed.slippageTolerance.toString());
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  }, []);

  // Handle modal open/close
  useEffect(() => {
    if (!dialogRef.current) return;
    
    if (isOpen) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [isOpen]);

  const saveSettings = (newSettings: Settings) => {
    setSettings(newSettings);
    localStorage.setItem('lokoswap-settings', JSON.stringify(newSettings));
  };

  const handleSlippageChange = (value: number) => {
    setIsCustomSlippage(false);
    setCustomSlippage('');
    saveSettings({ ...settings, slippageTolerance: value });
  };

  const handleCustomSlippageChange = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 0 && numValue <= 50) {
      setIsCustomSlippage(true);
      saveSettings({ ...settings, slippageTolerance: numValue });
    }
  };

  const handleDeadlineChange = (value: number) => {
    saveSettings({ ...settings, transactionDeadline: value });
  };

  const resetToDefaults = () => {
    const defaultSettings: Settings = {
      slippageTolerance: 0.5,
      transactionDeadline: 20,
      autoRefresh: true,
      soundEnabled: false,
      theme: 'auto'
    };
    setSettings(defaultSettings);
    setIsCustomSlippage(false);
    setCustomSlippage('');
    localStorage.setItem('lokoswap-settings', JSON.stringify(defaultSettings));
  };

  return (
    <dialog ref={dialogRef} className="modal" onClose={onClose}>
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-lg">Settings</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost"
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div className="space-y-6">
          {/* Slippage Tolerance */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Slippage Tolerance</span>
              <span className="label-text-alt text-xs">
                {settings.slippageTolerance}%
              </span>
            </label>
            
            <div className="grid grid-cols-3 gap-2 mb-2">
              {[0.1, 0.5, 1.0].map((value) => (
                <button
                  key={value}
                  className={`btn btn-sm ${
                    !isCustomSlippage && settings.slippageTolerance === value 
                      ? 'btn-primary' 
                      : 'btn-outline'
                  }`}
                  onClick={() => handleSlippageChange(value)}
                >
                  {value}%
                </button>
              ))}
            </div>
            
            <input
              type="number"
              placeholder="Custom"
              className={`input input-sm w-full ${
                isCustomSlippage ? 'input-primary' : 'input-bordered'
              }`}
              value={customSlippage}
              onChange={(e) => handleCustomSlippageChange(e.target.value)}
              min="0"
              max="50"
              step="0.1"
            />
          </div>

          {/* Transaction Deadline */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Transaction Deadline</span>
              <span className="label-text-alt text-xs">
                {settings.transactionDeadline} minutes
              </span>
            </label>
            
            <div className="grid grid-cols-3 gap-2">
              {[10, 20, 30].map((value) => (
                <button
                  key={value}
                  className={`btn btn-sm ${
                    settings.transactionDeadline === value 
                      ? 'btn-primary' 
                      : 'btn-outline'
                  }`}
                  onClick={() => handleDeadlineChange(value)}
                >
                  {value}m
                </button>
              ))}
            </div>
          </div>

          {/* Interface Settings */}
          <div>
            <label className="label">
              <span className="label-text font-medium">Interface</span>
            </label>
            
            <div className="space-y-3">
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Auto-refresh pools</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary"
                    checked={settings.autoRefresh}
                    onChange={(e) => saveSettings({ 
                      ...settings, 
                      autoRefresh: e.target.checked 
                    })}
                  />
                </label>
              </div>
              
              <div className="form-control">
                <label className="label cursor-pointer">
                  <span className="label-text">Sound notifications</span>
                  <input 
                    type="checkbox" 
                    className="toggle toggle-primary"
                    checked={settings.soundEnabled}
                    onChange={(e) => saveSettings({ 
                      ...settings, 
                      soundEnabled: e.target.checked 
                    })}
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="pt-4 border-t border-base-300">
            <button 
              className="btn btn-outline btn-sm w-full"
              onClick={resetToDefaults}
            >
              Reset to Defaults
            </button>
          </div>
        </div>

        <div className="modal-action">
          <button className="btn btn-primary" onClick={onClose}>
            Done
          </button>
        </div>
      </div>
      
      {/* Backdrop */}
      <form method="dialog" className="modal-backdrop">
        <button onClick={onClose}>close</button>
      </form>
    </dialog>
  );
}
