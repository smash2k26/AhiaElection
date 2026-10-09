import React, { useState, useMemo } from 'react';
import { Position, Candidate, VoteRecord, ElectionConfig } from './types';
import { 
  BarChart3, 
  Users, 
  RotateCcw, 
  Download, 
  Search, 
  Check, 
  Sliders, 
  ArrowLeft, 
  Plus, 
  Edit3, 
  X, 
  Save, 
  Trash2 
} from 'lucide-react';
import { 
  resetElectionVotes, 
  updateElectionStatus, 
  seedSampleVotes, 
  savePosition, 
  saveCandidate, 
  restoreDefaultPositions 
} from './electionService';

interface AdminDashboardProps {
  positions: Position[];
  votes: VoteRecord[];
  config: ElectionConfig;
  onBackToVoting: () => void;
}

const PRESET_AVATARS = [
  'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80'
];

export const AdminDashboard: React.FC<AdminDashboardProps> = ({
  positions,
  votes,
  config,
  onBackToVoting
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'counts' | 'ballots' | 'positions' | 'settings'>('counts');
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Position editing modal
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isSavingPosition, setIsSavingPosition] = useState(false);

  // Candidate editing modal
  const [editingCandidateData, setEditingCandidateData] = useState<{
    positionId: string;
    positionTitle: string;
    candidate: Candidate;
  } | null>(null);
  const [isSavingCandidate, setIsSavingCandidate] = useState(false);

  // Compute tallies
  const tallies = useMemo(() => {
    const counts: { [positionId: string]: { [candidateId: string]: number } } = {};
    const totals: { [positionId: string]: number } = {};

    positions.forEach(pos => {
      counts[pos.id] = {};
      totals[pos.id] = 0;
      pos.candidates.forEach(c => {
        counts[pos.id][c.id] = 0;
      });
    });

    votes.forEach(v => {
      if (!v.selections) return;
      Object.entries(v.selections).forEach(([posId, sel]) => {
        if (counts[posId] && counts[posId][sel.candidateId] !== undefined) {
          counts[posId][sel.candidateId] += 1;
          totals[posId] += 1;
        }
      });
    });

    return { counts, totals };
  }, [positions, votes]);

  // Filtered ballots
  const filteredVotes = useMemo(() => {
    if (!searchTerm.trim()) return votes;
    const term = searchTerm.toLowerCase();
    return votes.filter(v => 
      (v.voterName && v.voterName.toLowerCase().includes(term)) ||
      (v.adNo && v.adNo.toLowerCase().includes(term)) ||
      (v.voterId && v.voterId.toLowerCase().includes(term)) ||
      (v.verificationHash && v.verificationHash.toLowerCase().includes(term))
    );
  }, [votes, searchTerm]);

  const handleStatusChange = async (newStatus: 'active' | 'paused' | 'closed') => {
    try {
      await updateElectionStatus(newStatus);
      setActionNotice(`Election status set to ${newStatus}.`);
      setTimeout(() => setActionNotice(null), 3000);
    } catch (err: any) {
      alert('Error updating status: ' + err.message);
    }
  };

  const handleResetVotes = async () => {
    try {
      setIsResetting(true);
      await resetElectionVotes();
      setShowResetConfirm(false);
      setActionNotice('All election votes have been reset.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error resetting election: ' + err.message);
    } finally {
      setIsResetting(false);
    }
  };

  const handleSeedVotes = async () => {
    try {
      setIsSeeding(true);
      await seedSampleVotes(positions, 6);
      setActionNotice('Added 6 demo ballots.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error seeding data: ' + err.message);
    } finally {
      setIsSeeding(false);
    }
  };

  const handleSavePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition) return;
    try {
      setIsSavingPosition(true);
      await savePosition(editingPosition);
      setActionNotice(`Updated ${editingPosition.title}.`);
      setEditingPosition(null);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error saving position: ' + err.message);
    } finally {
      setIsSavingPosition(false);
    }
  };

  const handleSaveCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidateData) return;
    try {
      setIsSavingCandidate(true);
      await saveCandidate(editingCandidateData.positionId, editingCandidateData.candidate);
      setActionNotice(`Updated ${editingCandidateData.candidate.name}.`);
      setEditingCandidateData(null);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error saving participant: ' + err.message);
    } finally {
      setIsSavingCandidate(false);
    }
  };

  const handleRestoreDefaults = async () => {
    if (!confirm('Restore default template positions and participants?')) {
      return;
    }
    try {
      await restoreDefaultPositions();
      setActionNotice('Restored original positions and candidates.');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error restoring defaults: ' + err.message);
    }
  };

  const handleExportCSV = () => {
    if (votes.length === 0) {
      alert('No votes available to export.');
      return;
    }

    const headers = ['Voter Name', 'Admission No (Ad No)', 'Date & Time', 'Receipt Code'];
    positions.forEach(p => headers.push(p.title));

    const rows = votes.map(v => {
      const row = [
        `"${v.voterName || 'Anonymous'}"`,
        `"${v.adNo || v.voterId || 'N/A'}"`,
        `"${new Date(v.submittedAt).toLocaleString()}"`,
        `"${v.verificationHash || ''}"`
      ];
      positions.forEach(p => {
        const sel = v.selections?.[p.id];
        row.push(`"${sel?.candidateName || 'N/A'}"`);
      });
      return row.join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `election_votes_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-white border border-neutral-200/80 p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2.5">
          <button
            onClick={onBackToVoting}
            className="p-1.5 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 transition-colors"
            title="Return to Voting Booth"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-base font-semibold text-neutral-900">
              Admin Dashboard
            </h1>
            <p className="text-xs text-neutral-500">
              Real-time Firestore tallies & controls
            </p>
          </div>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium text-neutral-600">
          <button
            onClick={() => setActiveTab('counts')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'counts'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'hover:text-neutral-900'
            }`}
          >
            Counts & Tallies
          </button>
          <button
            onClick={() => setActiveTab('ballots')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'ballots'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'hover:text-neutral-900'
            }`}
          >
            All Ballots ({votes.length})
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'positions'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'hover:text-neutral-900'
            }`}
          >
            Edit Participants
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'settings'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'hover:text-neutral-900'
            }`}
          >
            Controls
          </button>
        </div>
      </div>

      {actionNotice && (
        <div className="p-3 rounded-xl bg-neutral-900 text-white text-xs font-medium flex items-center gap-2 shadow-xs animate-fade-in">
          <Check className="w-3.5 h-3.5" />
          <span>{actionNotice}</span>
        </div>
      )}

      {/* Minimal Stats Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-neutral-500 block">Total Ballots</span>
          <span className="text-2xl font-semibold text-neutral-900 font-mono mt-0.5 block">
            {votes.length}
          </span>
        </div>

        <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-neutral-500 block">Positions</span>
          <span className="text-2xl font-semibold text-neutral-900 font-mono mt-0.5 block">
            {positions.length}
          </span>
        </div>

        <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-neutral-500 block">Participants</span>
          <span className="text-2xl font-semibold text-neutral-900 font-mono mt-0.5 block">
            {positions.reduce((acc, p) => acc + (p.candidates?.length || 0), 0)}
          </span>
        </div>

        <div className="bg-white border border-neutral-200/80 p-4 rounded-xl shadow-xs">
          <span className="text-[11px] text-neutral-500 block">Election Status</span>
          <span className="text-sm font-semibold capitalize text-neutral-900 mt-1 block">
            {config.status}
          </span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: COUNTS & TALLIES                                                   */}
      {/* ========================================================================= */}
      {activeTab === 'counts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-neutral-700">Official Results Breakdown</span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSeedVotes}
                disabled={isSeeding}
                className="px-2.5 py-1 text-xs font-medium rounded-lg border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors"
              >
                + Demo Ballots
              </button>
              <button
                onClick={handleExportCSV}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors"
              >
                Export CSV
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {positions.map((pos) => {
              const posTotal = tallies.totals[pos.id] || 0;
              const cand1 = pos.candidates[0];
              const cand2 = pos.candidates[1];
              const cand1Votes = (cand1 && tallies.counts[pos.id]?.[cand1.id]) || 0;
              const cand2Votes = (cand2 && tallies.counts[pos.id]?.[cand2.id]) || 0;

              const cand1Pct = posTotal > 0 ? ((cand1Votes / posTotal) * 100).toFixed(1) : '0.0';
              const cand2Pct = posTotal > 0 ? ((cand2Votes / posTotal) * 100).toFixed(1) : '0.0';

              return (
                <div
                  key={pos.id}
                  className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4"
                >
                  <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
                    <div>
                      <h3 className="font-semibold text-sm text-neutral-900">{pos.title}</h3>
                      <p className="text-xs text-neutral-500">{pos.subtitle}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold font-mono text-neutral-900">{posTotal}</span>
                      <span className="text-[11px] text-neutral-500 block">votes</span>
                    </div>
                  </div>

                  {/* Minimal Comparison Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-neutral-600">
                      <span>{cand1?.name}: {cand1Votes} ({cand1Pct}%)</span>
                      <span>{cand2?.name}: {cand2Votes} ({cand2Pct}%)</span>
                    </div>
                    <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden flex">
                      <div
                        style={{ width: `${cand1Pct}%` }}
                        className="h-full bg-neutral-900 transition-all duration-300"
                      />
                      <div
                        style={{ width: `${cand2Pct}%` }}
                        className="h-full bg-neutral-300 transition-all duration-300"
                      />
                    </div>
                  </div>

                  {/* 2 Participant Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {cand1 && (
                      <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={cand1.avatarUrl}
                            alt={cand1.name}
                            className="w-8 h-8 rounded-lg object-cover border border-neutral-200"
                          />
                          <div>
                            <span className="text-xs font-medium text-neutral-900 block">{cand1.name}</span>
                            <span className="text-[10px] text-neutral-500">{cand1.department}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-sm font-semibold text-neutral-900 block">{cand1Votes}</span>
                          <span className="text-[10px] text-neutral-500">{cand1Pct}%</span>
                        </div>
                      </div>
                    )}

                    {cand2 && (
                      <div className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={cand2.avatarUrl}
                            alt={cand2.name}
                            className="w-8 h-8 rounded-lg object-cover border border-neutral-200"
                          />
                          <div>
                            <span className="text-xs font-medium text-neutral-900 block">{cand2.name}</span>
                            <span className="text-[10px] text-neutral-500">{cand2.department}</span>
                          </div>
                        </div>
                        <div className="text-right font-mono">
                          <span className="text-sm font-semibold text-neutral-900 block">{cand2Votes}</span>
                          <span className="text-[10px] text-neutral-500">{cand2Pct}%</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL BALLOTS & AUDIT TABLE                                          */}
      {/* ========================================================================= */}
      {activeTab === 'ballots' && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-neutral-400" />
              <input
                type="text"
                placeholder="Search name, Ad No, or code..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-neutral-200 rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-50"
            >
              Export CSV
            </button>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 text-neutral-500 border-b border-neutral-200 text-[11px]">
                  <tr>
                    <th className="py-2.5 px-3.5 font-medium">#</th>
                    <th className="py-2.5 px-3.5 font-medium">Voter Name</th>
                    <th className="py-2.5 px-3.5 font-medium">Ad No</th>
                    {positions.map(p => (
                      <th key={p.id} className="py-2.5 px-3.5 font-medium">{p.title}</th>
                    ))}
                    <th className="py-2.5 px-3.5 font-medium">Receipt Code</th>
                    <th className="py-2.5 px-3.5 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredVotes.length === 0 ? (
                    <tr>
                      <td colSpan={5 + positions.length} className="text-center py-8 text-neutral-400 text-xs">
                        No ballots recorded yet.
                      </td>
                    </tr>
                  ) : (
                    filteredVotes.map((v, idx) => (
                      <tr key={v.id || idx} className="hover:bg-neutral-50/50">
                        <td className="py-2.5 px-3.5 text-neutral-400 font-mono">{idx + 1}</td>
                        <td className="py-2.5 px-3.5 font-medium text-neutral-900">{v.voterName || 'Anonymous'}</td>
                        <td className="py-2.5 px-3.5 font-mono text-neutral-700">{v.adNo || v.voterId || 'N/A'}</td>
                        {positions.map(p => {
                          const chosen = v.selections?.[p.id];
                          return (
                            <td key={p.id} className="py-2.5 px-3.5 text-neutral-600">
                              {chosen?.candidateName || '—'}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3.5 font-mono text-neutral-500 text-[11px]">{v.verificationHash}</td>
                        <td className="py-2.5 px-3.5 text-neutral-400 text-[11px] whitespace-nowrap">
                          {new Date(v.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: EDIT POSITIONS & PARTICIPANTS                                      */}
      {/* ========================================================================= */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Customize candidate names, manifestos, or positions.
            </span>
            <button
              onClick={handleRestoreDefaults}
              className="text-xs text-neutral-500 hover:text-neutral-900 underline"
            >
              Reset to Defaults
            </button>
          </div>

          <div className="space-y-4">
            {positions.map((position) => (
              <div
                key={position.id}
                className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4"
              >
                <div className="flex items-start justify-between border-b border-neutral-100 pb-3">
                  <div>
                    <h3 className="font-semibold text-sm text-neutral-900">{position.title}</h3>
                    <p className="text-xs text-neutral-500">{position.description}</p>
                  </div>
                  <button
                    onClick={() => setEditingPosition({ ...position })}
                    className="text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-lg"
                  >
                    Edit Title
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {position.candidates.map((candidate) => (
                    <div
                      key={candidate.id}
                      className="p-3.5 rounded-xl border border-neutral-200 bg-neutral-50/50 flex flex-col justify-between space-y-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={candidate.avatarUrl}
                            alt={candidate.name}
                            className="w-10 h-10 rounded-xl object-cover border border-neutral-200"
                          />
                          <div>
                            <h4 className="font-semibold text-xs text-neutral-900">{candidate.name}</h4>
                            <p className="text-[11px] text-neutral-500">{candidate.department}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingCandidateData({
                            positionId: position.id,
                            positionTitle: position.title,
                            candidate: { ...candidate }
                          })}
                          className="text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white px-2 py-0.5 rounded-md"
                        >
                          Edit
                        </button>
                      </div>

                      <p className="text-[11px] text-neutral-600 italic">
                        "{candidate.tagline}"
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: CONTROLS & SETTINGS                                                */}
      {/* ========================================================================= */}
      {activeTab === 'settings' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-neutral-900">Election Status</h3>
            <p className="text-xs text-neutral-500">
              Control whether voters can submit new ballots.
            </p>

            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {(['active', 'paused', 'closed'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => handleStatusChange(st)}
                  className={`py-2 text-xs font-medium rounded-lg capitalize border transition-colors ${
                    config.status === st
                      ? 'bg-neutral-900 text-white border-neutral-900'
                      : 'bg-neutral-50 border-neutral-200 text-neutral-600 hover:bg-neutral-100'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-neutral-900">Danger Zone</h3>
            <p className="text-xs text-neutral-500">
              Clear all {votes.length} submitted ballots in Firestore.
            </p>

            <div className="pt-1">
              {!showResetConfirm ? (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="w-full py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                >
                  Reset All Votes
                </button>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-neutral-700">Confirm wiping all {votes.length} votes?</p>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      disabled={isResetting}
                      onClick={handleResetVotes}
                      className="flex-1 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium"
                    >
                      {isResetting ? 'Wiping...' : 'Confirm Reset'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(false)}
                      className="py-1.5 px-3 rounded-lg border border-neutral-200 text-xs text-neutral-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT POSITION                                                      */}
      {/* ========================================================================= */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/20 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h3 className="text-sm font-semibold text-neutral-900">Edit Position</h3>
              <button
                onClick={() => setEditingPosition(null)}
                className="text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePositionSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Title
                </label>
                <input
                  type="text"
                  required
                  value={editingPosition.title}
                  onChange={e => setEditingPosition({ ...editingPosition, title: e.target.value })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Subtitle
                </label>
                <input
                  type="text"
                  value={editingPosition.subtitle}
                  onChange={e => setEditingPosition({ ...editingPosition, subtitle: e.target.value })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={editingPosition.description}
                  onChange={e => setEditingPosition({ ...editingPosition, description: e.target.value })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 resize-none"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPosition(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingPosition}
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800"
                >
                  {isSavingPosition ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT CANDIDATE                                                     */}
      {/* ========================================================================= */}
      {editingCandidateData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/20 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-lg w-full p-5 shadow-lg space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h3 className="text-sm font-semibold text-neutral-900">
                Edit Participant ({editingCandidateData.candidate.name})
              </h3>
              <button
                onClick={() => setEditingCandidateData(null)}
                className="text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCandidateSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    required
                    value={editingCandidateData.candidate.name}
                    onChange={e => setEditingCandidateData({
                      ...editingCandidateData,
                      candidate: { ...editingCandidateData.candidate, name: e.target.value }
                    })}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700 mb-1">
                    Department / Class
                  </label>
                  <input
                    type="text"
                    value={editingCandidateData.candidate.department}
                    onChange={e => setEditingCandidateData({
                      ...editingCandidateData,
                      candidate: { ...editingCandidateData.candidate, department: e.target.value }
                    })}
                    className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Tagline / Slogan
                </label>
                <input
                  type="text"
                  value={editingCandidateData.candidate.tagline}
                  onChange={e => setEditingCandidateData({
                    ...editingCandidateData,
                    candidate: { ...editingCandidateData.candidate, tagline: e.target.value }
                  })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Bio
                </label>
                <textarea
                  rows={2}
                  value={editingCandidateData.candidate.bio}
                  onChange={e => setEditingCandidateData({
                    ...editingCandidateData,
                    candidate: { ...editingCandidateData.candidate, bio: e.target.value }
                  })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 resize-none"
                />
              </div>

              {/* Photo URL & Presets */}
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Photo URL
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="url"
                    value={editingCandidateData.candidate.avatarUrl}
                    onChange={e => setEditingCandidateData({
                      ...editingCandidateData,
                      candidate: { ...editingCandidateData.candidate, avatarUrl: e.target.value }
                    })}
                    className="flex-1 bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-mono"
                  />
                  <img
                    src={editingCandidateData.candidate.avatarUrl}
                    alt="Preview"
                    className="w-8 h-8 rounded-lg object-cover border border-neutral-200 shrink-0"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = PRESET_AVATARS[0];
                    }}
                  />
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {PRESET_AVATARS.map((url, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setEditingCandidateData({
                        ...editingCandidateData,
                        candidate: { ...editingCandidateData.candidate, avatarUrl: url }
                      })}
                      className={`w-7 h-7 rounded-lg overflow-hidden border ${
                        editingCandidateData.candidate.avatarUrl === url
                          ? 'border-neutral-900 ring-1 ring-neutral-900'
                          : 'border-neutral-200 opacity-60 hover:opacity-100'
                      }`}
                    >
                      <img src={url} alt="preset" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Agendas */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-medium text-neutral-700">Platform Agendas</label>
                  <button
                    type="button"
                    onClick={() => {
                      const cur = editingCandidateData.candidate.agenda || [];
                      setEditingCandidateData({
                        ...editingCandidateData,
                        candidate: {
                          ...editingCandidateData.candidate,
                          agenda: [...cur, 'Key platform pledge']
                        }
                      });
                    }}
                    className="text-[11px] text-neutral-700 hover:text-neutral-900 font-medium"
                  >
                    + Add item
                  </button>
                </div>

                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {editingCandidateData.candidate.agenda?.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={item}
                        onChange={e => {
                          const updated = [...editingCandidateData.candidate.agenda];
                          updated[idx] = e.target.value;
                          setEditingCandidateData({
                            ...editingCandidateData,
                            candidate: { ...editingCandidateData.candidate, agenda: updated }
                          });
                        }}
                        className="flex-1 bg-white border border-neutral-200 rounded-lg px-2.5 py-1 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const updated = editingCandidateData.candidate.agenda.filter((_, i) => i !== idx);
                          setEditingCandidateData({
                            ...editingCandidateData,
                            candidate: { ...editingCandidateData.candidate, agenda: updated }
                          });
                        }}
                        className="text-neutral-400 hover:text-neutral-700 p-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingCandidateData(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingCandidate}
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800"
                >
                  {isSavingCandidate ? 'Saving...' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
