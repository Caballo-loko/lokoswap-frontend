import React from 'react';
import { useUIContext } from '../contexts/UIContext';

interface CreatePoolProps {
  onPoolCreated: () => void;
}

export default function CreatePool({ onPoolCreated }: CreatePoolProps) {
  const { setCreatePoolModalOpen } = useUIContext();

  return (
    <div className="card bg-base-200 shadow-xl">
      <div className="card-body text-center">
        <h2 className="card-title justify-center">Create New Loko Pool</h2>
        <p className="text-base-content/80 mb-4">
          Create a new AMM Loko pool with Token-2022 transfer hooks and fee support
        </p>
        
        <div className="space-y-3 text-sm text-base-content/70">
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Token-2022 with transfer hook support</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Automatic dynamic fee collection</span>
          </div>
          <div className="flex items-center justify-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <span>Production-ready AMM functionality</span>
          </div>
        </div>

        <div className="card-actions justify-center mt-6">
          <button 
            className="btn btn-primary"
            onClick={() => setCreatePoolModalOpen(true)}
          >
            Create Loko Pool 
          </button>
        </div>
      </div>
    </div>
  );
}