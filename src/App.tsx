/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Position, VoteRecord, ElectionConfig, DEFAULT_POSITIONS, DEFAULT_CONFIG } from './types';
import { 
  initializeElectionData, 
  subscribeToPositions, 
  subscribeToConfig, 
  subscribeToVotes, 
  submitBallot 
} from './electionService';
import { VotingBooth } from './VotingBooth';
import { AdminDashboard } from './AdminDashboard';
import { AdminLogin } from './AdminLogin';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [view, setView] = useState<'voting' | 'admin_login' | 'admin'>('voting');
  const [positions, setPositions] = useState<Position[]>(DEFAULT_POSITIONS);
  const [config, setConfig] = useState<ElectionConfig>(DEFAULT_CONFIG);
  const [votes, setVotes] = useState<VoteRecord[]>([]);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState<boolean>(() => {
    return sessionStorage.getItem('civicvote_admin_auth') === 'true';
  });
  const [isInitializing, setIsInitializing] = useState(true);

  // Initialize and attach Firestore real-time subscribers
  useEffect(() => {
    let unsubscribePositions: (() => void) | undefined;
    let unsubscribeConfig: (() => void) | undefined;
    let unsubscribeVotes: (() => void) | undefined;

    // Graceful timeout so user immediately sees the interface
    const safetyTimer = setTimeout(() => {
      setIsInitializing(false);
    }, 600);

    async function setup() {
      try {
        await initializeElectionData();
      } catch (e) {
        console.warn('Initial seed notice:', e);
      }

      unsubscribePositions = subscribeToPositions((pos) => {
        if (pos && pos.length > 0) {
          setPositions(pos);
        }
      });

      unsubscribeConfig = subscribeToConfig((cfg) => {
        if (cfg) {
          setConfig(cfg);
        }
      });

      unsubscribeVotes = subscribeToVotes((v) => {
        setVotes(v);
        setIsInitializing(false);
      }, (err) => {
        console.warn('Votes subscription notice:', err);
        setIsInitializing(false);
      });
    }

    setup();

    return () => {
      clearTimeout(safetyTimer);
      if (unsubscribePositions) unsubscribePositions();
      if (unsubscribeConfig) unsubscribeConfig();
      if (unsubscribeVotes) unsubscribeVotes();
    };
  }, []);

  const handleVoteSubmit = async (
    voterName: string,
    adNo: string,
    selections: { [positionId: string]: { candidateId: string; candidateName: string } }
  ) => {
    return await submitBallot(voterName, adNo, selections);
  };

  const handleAdminClick = () => {
    if (isAdminAuthenticated) {
      setView('admin');
    } else {
      setView('admin_login');
    }
  };

  const handleAdminLoginSuccess = () => {
    setIsAdminAuthenticated(true);
    sessionStorage.setItem('civicvote_admin_auth', 'true');
    setView('admin');
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-neutral-900 flex flex-col font-sans selection:bg-neutral-900 selection:text-white">
      {/* Minimal Top Header */}
      <header className="sticky top-0 z-40 border-b border-neutral-200/80 bg-white/90 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div 
            onClick={() => setView('voting')}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div className="w-6 h-6 rounded-md bg-neutral-900 flex items-center justify-center text-white text-[11px] font-bold tracking-tight">
              CV
            </div>
            <div className="flex items-baseline gap-2">
              <span className="font-semibold text-sm tracking-tight text-neutral-900">
                CivicVote
              </span>
              <span className="text-[11px] text-neutral-500 hidden sm:inline">
                Election Portal
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => setView('voting')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                view === 'voting'
                  ? 'bg-neutral-100 text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50'
              }`}
            >
              Voting Booth
            </button>

            <button
              onClick={handleAdminClick}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                view === 'admin' || view === 'admin_login'
                  ? 'bg-neutral-900 text-white'
                  : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
              }`}
            >
              <span>Admin</span>
              <span className={`px-1.5 py-0.2 rounded text-[10px] font-mono ${
                view === 'admin' || view === 'admin_login' ? 'bg-neutral-800 text-neutral-300' : 'bg-neutral-200/70 text-neutral-600'
              }`}>
                {votes.length}
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-6 md:py-10">
        {isInitializing && votes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <div className="w-5 h-5 border-2 border-neutral-900 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs text-neutral-500">Loading election session...</p>
          </div>
        ) : view === 'voting' ? (
          <VotingBooth
            positions={positions}
            config={config}
            onVoteCast={handleVoteSubmit}
            onGoToAdmin={handleAdminClick}
          />
        ) : view === 'admin_login' ? (
          <AdminLogin
            configuredPassword={config.adminPassword || 'admin'}
            onSuccess={handleAdminLoginSuccess}
            onCancel={() => setView('voting')}
          />
        ) : (
          <AdminDashboard
            positions={positions}
            votes={votes}
            config={config}
            onBackToVoting={() => setView('voting')}
          />
        )}
      </main>

      {/* Minimal Footer */}
      <footer className="border-t border-neutral-200/60 py-6 bg-white text-center text-xs text-neutral-400">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px]">
          <div className="flex items-center gap-1.5 text-neutral-500">
            <CheckCircle2 className="w-3.5 h-3.5 text-neutral-400" />
            <span>2 Positions • 2 Participants Each • Google Firebase Firestore</span>
          </div>
          <div className="text-neutral-400 font-mono">
            <span>Ballots: {votes.length}</span>
            <span className="mx-2">•</span>
            <span>Sync: Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
