import React, { useState, useMemo } from 'react';
import { Position, Candidate, VoteRecord, ElectionConfig } from './types';
import { 
  BarChart3, 
  Users, 
  RotateCcw, 
  Download, 
  Search, 
  Check, 
  ArrowLeft, 
  Plus, 
  Edit3, 
  X, 
  Save, 
  Trash2,
  Globe,
  Lock,
  Layers,
  Settings
} from 'lucide-react';
import { 
  resetElectionVotes, 
  updateElectionStatus, 
  seedSampleVotes, 
  savePosition, 
  deletePosition,
  saveCandidate, 
  deleteCandidate,
  updateVoteRecord,
  deleteVoteRecord,
  saveElectionConfig,
  restoreDefaultPositions,
  restoreDefaultConfig 
} from './electionService';

interface AdminDashboardProps {
  positions: Position[];
  votes: VoteRecord[];
  config: ElectionConfig;
  onBackToVoting: () => void;
  onLogout?: () => void;
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
  onBackToVoting,
  onLogout
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'counts' | 'ballots' | 'positions' | 'branding'>('counts');
  const [isResetting, setIsResetting] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  // Editable Branding & Web Config state
  const [editingConfig, setEditingConfig] = useState<ElectionConfig>({ ...config });
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Position editing / adding modal
  const [editingPosition, setEditingPosition] = useState<Position | null>(null);
  const [isAddingPosition, setIsAddingPosition] = useState(false);
  const [isSavingPosition, setIsSavingPosition] = useState(false);

  // Candidate editing / adding modal
  const [editingCandidateData, setEditingCandidateData] = useState<{
    positionId: string;
    positionTitle: string;
    candidate: Candidate;
    isNew?: boolean;
  } | null>(null);
  const [isSavingCandidate, setIsSavingCandidate] = useState(false);

  // Ballot editing modal
  const [editingBallot, setEditingBallot] = useState<VoteRecord | null>(null);
  const [isSavingBallot, setIsSavingBallot] = useState(false);

  // Sync incoming config props into local state when config changes
  React.useEffect(() => {
    setEditingConfig({ ...config });
  }, [config]);

  // Compute tallies
  const tallies = useMemo(() => {
    const counts: { [positionId: string]: { [candidateId: string]: number } } = {};
    const totals: { [positionId: string]: number } = {};

    positions.forEach(pos => {
      counts[pos.id] = {};
      totals[pos.id] = 0;
      pos.candidates?.forEach(c => {
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

  // Save Web Name & Branding
  const handleSaveConfigSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSavingConfig(true);
      await saveElectionConfig(editingConfig);
      setActionNotice('Web name and election settings saved to Firebase!');
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error saving settings: ' + err.message);
    } finally {
      setIsSavingConfig(false);
    }
  };

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

  // Position CRUD
  const handleSavePositionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPosition) return;
    try {
      setIsSavingPosition(true);
      await savePosition(editingPosition);
      setActionNotice(`Position "${editingPosition.title}" saved to Firebase!`);
      setEditingPosition(null);
      setIsAddingPosition(false);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error saving position: ' + err.message);
    } finally {
      setIsSavingPosition(false);
    }
  };

  const handleDeletePositionClick = async (positionId: string, positionTitle: string) => {
    if (!confirm(`Are you sure you want to delete "${positionTitle}"? This cannot be undone.`)) {
      return;
    }
    try {
      await deletePosition(positionId);
      setActionNotice(`Deleted position "${positionTitle}".`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error deleting position: ' + err.message);
    }
  };

  // Candidate CRUD
  const handleSaveCandidateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCandidateData) return;
    try {
      setIsSavingCandidate(true);
      await saveCandidate(editingCandidateData.positionId, editingCandidateData.candidate);
      setActionNotice(`Participant "${editingCandidateData.candidate.name}" saved to Firebase!`);
      setEditingCandidateData(null);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error saving participant: ' + err.message);
    } finally {
      setIsSavingCandidate(false);
    }
  };

  const handleDeleteCandidateClick = async (positionId: string, candidateId: string, candidateName: string) => {
    if (!confirm(`Remove participant "${candidateName}" from this position?`)) {
      return;
    }
    try {
      await deleteCandidate(positionId, candidateId);
      setActionNotice(`Removed "${candidateName}".`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error removing candidate: ' + err.message);
    }
  };

  // Ballot CRUD
  const handleSaveBallotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBallot || !editingBallot.id) return;
    try {
      setIsSavingBallot(true);
      await updateVoteRecord(editingBallot.id, {
        voterName: editingBallot.voterName,
        adNo: editingBallot.adNo,
        voterId: editingBallot.adNo
      });
      setActionNotice('Voter details updated in Firebase!');
      setEditingBallot(null);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error updating ballot: ' + err.message);
    } finally {
      setIsSavingBallot(false);
    }
  };

  const handleDeleteBallotClick = async (voteId: string, voterName: string) => {
    if (!confirm(`Delete ballot cast by "${voterName}"?`)) {
      return;
    }
    try {
      await deleteVoteRecord(voteId);
      setActionNotice(`Ballot for "${voterName}" deleted.`);
      setTimeout(() => setActionNotice(null), 3500);
    } catch (err: any) {
      alert('Error deleting ballot: ' + err.message);
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
            <div className="flex items-center gap-2">
              <h1 className="text-base font-semibold text-neutral-900">
                Admin Dashboard
              </h1>
              <span className="text-[11px] font-mono text-neutral-500 bg-neutral-100 px-2 py-0.5 rounded">
                {config.appName || 'CivicVote'}
              </span>
            </div>
            <p className="text-xs text-neutral-500">
              Live Firestore synchronization & full management
            </p>
          </div>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex flex-wrap items-center gap-1 bg-neutral-100 p-1 rounded-xl text-xs font-medium text-neutral-600">
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
            Ballots ({votes.length})
          </button>
          <button
            onClick={() => setActiveTab('positions')}
            className={`px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === 'positions'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'hover:text-neutral-900'
            }`}
          >
            Positions & Candidates
          </button>
          <button
            onClick={() => setActiveTab('branding')}
            className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
              activeTab === 'branding'
                ? 'bg-white text-neutral-900 shadow-xs'
                : 'hover:text-neutral-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Web Name & Settings</span>
          </button>
          {onLogout && (
            <button
              onClick={onLogout}
              className="px-2.5 py-1.5 rounded-lg text-xs font-medium text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/60 transition-colors"
              title="Sign out of Admin Dashboard"
            >
              Log Out
            </button>
          )}
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
            <span className="text-xs font-medium text-neutral-700">Live Vote Share</span>
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
              const cand1 = pos.candidates?.[0];
              const cand2 = pos.candidates?.[1];
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

                  {/* Comparison Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-neutral-600">
                      <span>{cand1?.name || 'Cand 1'}: {cand1Votes} ({cand1Pct}%)</span>
                      <span>{cand2?.name || 'Cand 2'}: {cand2Votes} ({cand2Pct}%)</span>
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

                  {/* Participant Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    {pos.candidates?.map((cand) => {
                      const cVotes = tallies.counts[pos.id]?.[cand.id] || 0;
                      const cPct = posTotal > 0 ? ((cVotes / posTotal) * 100).toFixed(1) : '0.0';
                      return (
                        <div key={cand.id} className="p-3 rounded-xl border border-neutral-200 bg-neutral-50/50 flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={cand.avatarUrl}
                              alt={cand.name}
                              className="w-8 h-8 rounded-lg object-cover border border-neutral-200"
                            />
                            <div>
                              <span className="text-xs font-medium text-neutral-900 block">{cand.name}</span>
                              <span className="text-[10px] text-neutral-500">{cand.department}</span>
                            </div>
                          </div>
                          <div className="text-right font-mono">
                            <span className="text-sm font-semibold text-neutral-900 block">{cVotes}</span>
                            <span className="text-[10px] text-neutral-500">{cPct}%</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: ALL BALLOTS (WITH EDIT & DELETE BALLOT)                            */}
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
                    <th className="py-2.5 px-3.5 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {filteredVotes.length === 0 ? (
                    <tr>
                      <td colSpan={6 + positions.length} className="text-center py-8 text-neutral-400 text-xs">
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
                        <td className="py-2.5 px-3.5 text-right whitespace-nowrap">
                          <button
                            onClick={() => setEditingBallot({ ...v })}
                            className="text-neutral-500 hover:text-neutral-900 p-1 mr-1"
                            title="Edit Voter Details"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          {v.id && (
                            <button
                              onClick={() => handleDeleteBallotClick(v.id!, v.voterName)}
                              className="text-neutral-400 hover:text-rose-600 p-1"
                              title="Delete Ballot"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
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
      {/* TAB 3: POSITIONS & PARTICIPANTS (FULL CRUD)                               */}
      {/* ========================================================================= */}
      {activeTab === 'positions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-neutral-500">
              Add, edit, or remove election positions and participants.
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setEditingPosition({
                    id: 'pos_' + Date.now(),
                    order: positions.length + 1,
                    title: 'New Executive Position',
                    subtitle: `Position ${positions.length + 1}`,
                    description: 'Role responsibilities description',
                    candidates: []
                  });
                  setIsAddingPosition(true);
                }}
                className="px-2.5 py-1 text-xs font-medium rounded-lg bg-neutral-900 text-white hover:bg-neutral-800 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Add Position
              </button>
              <button
                onClick={handleRestoreDefaults}
                className="text-xs text-neutral-500 hover:text-neutral-900 underline"
              >
                Reset to Defaults
              </button>
            </div>
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
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setEditingPosition({ ...position });
                        setIsAddingPosition(false);
                      }}
                      className="text-xs font-medium text-neutral-700 hover:text-neutral-900 border border-neutral-200 px-2.5 py-1 rounded-lg"
                    >
                      Edit Title
                    </button>
                    {positions.length > 1 && (
                      <button
                        onClick={() => handleDeletePositionClick(position.id, position.title)}
                        className="text-xs font-medium text-rose-500 hover:text-rose-700 border border-neutral-200 px-2 py-1 rounded-lg"
                        title="Delete Position"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {position.candidates?.map((candidate) => (
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
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => setEditingCandidateData({
                              positionId: position.id,
                              positionTitle: position.title,
                              candidate: { ...candidate },
                              isNew: false
                            })}
                            className="text-xs font-medium text-neutral-600 hover:text-neutral-900 border border-neutral-200 bg-white px-2 py-0.5 rounded-md"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeleteCandidateClick(position.id, candidate.id, candidate.name)}
                            className="text-neutral-400 hover:text-rose-600 p-1"
                            title="Delete Participant"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-neutral-600 italic">
                        "{candidate.tagline}"
                      </p>
                    </div>
                  ))}

                  {/* Add Candidate Card */}
                  <button
                    type="button"
                    onClick={() => {
                      const newId = 'cand_' + Date.now();
                      setEditingCandidateData({
                        positionId: position.id,
                        positionTitle: position.title,
                        candidate: {
                          id: newId,
                          name: 'New Candidate',
                          department: 'Department, Year',
                          tagline: 'Platform tagline',
                          bio: 'Candidate biography',
                          avatarUrl: PRESET_AVATARS[0],
                          agenda: ['Key campaign agenda point']
                        },
                        isNew: true
                      });
                    }}
                    className="p-3.5 rounded-xl border border-dashed border-neutral-300 hover:border-neutral-900 text-neutral-600 hover:text-neutral-900 flex items-center justify-center gap-1.5 text-xs font-medium transition-colors"
                  >
                    <Plus className="w-4 h-4" /> Add Participant
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: WEB NAME & ELECTION SETTINGS (EDITABLE IN FIRESTORE)               */}
      {/* ========================================================================= */}
      {activeTab === 'branding' && (
        <div className="space-y-4">
          <form onSubmit={handleSaveConfigSubmit} className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="border-b border-neutral-100 pb-3">
              <h2 className="text-sm font-semibold text-neutral-900 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-neutral-600" />
                Website Name & Election Branding
              </h2>
              <p className="text-xs text-neutral-500">
                All settings are stored in Firebase Firestore and immediately update the live portal.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Website / Portal Name <span className="text-neutral-400 font-normal">(shown in top logo)</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingConfig.appName}
                  onChange={e => setEditingConfig({ ...editingConfig, appName: e.target.value })}
                  placeholder="e.g. CivicVote or St. Xavier's Elections"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900 font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Election Main Title
                </label>
                <input
                  type="text"
                  required
                  value={editingConfig.electionTitle}
                  onChange={e => setEditingConfig({ ...editingConfig, electionTitle: e.target.value })}
                  placeholder="e.g. Annual Student Council Election"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Organization / University Name
                </label>
                <input
                  type="text"
                  value={editingConfig.organizationName}
                  onChange={e => setEditingConfig({ ...editingConfig, organizationName: e.target.value })}
                  placeholder="e.g. University Student Union"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Academic Year / Session
                </label>
                <input
                  type="text"
                  value={editingConfig.academicYear}
                  onChange={e => setEditingConfig({ ...editingConfig, academicYear: e.target.value })}
                  placeholder="e.g. 2026 - 2027"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1">
                Announcement Message (Optional banner for voters)
              </label>
              <input
                type="text"
                value={editingConfig.announcement || ''}
                onChange={e => setEditingConfig({ ...editingConfig, announcement: e.target.value })}
                placeholder="e.g. Voting closes today at 5:00 PM!"
                className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Admin Username (Access Dashboard)
                </label>
                <input
                  type="text"
                  required
                  value={editingConfig.adminUsername ?? ''}
                  onChange={e => setEditingConfig({ ...editingConfig, adminUsername: e.target.value })}
                  placeholder="Enter admin username"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Admin Password
                </label>
                <input
                  type="password"
                  required
                  value={editingConfig.adminPassword ?? ''}
                  onChange={e => setEditingConfig({ ...editingConfig, adminPassword: e.target.value })}
                  placeholder="Enter admin password"
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-between items-center border-t border-neutral-100">
              <span className="text-[11px] text-neutral-400">
                Saved in collection <code className="text-neutral-700">election_config</code>
              </span>
              <button
                type="submit"
                disabled={isSavingConfig}
                className="px-4 py-2 rounded-xl bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800 transition-colors flex items-center gap-1.5"
              >
                {isSavingConfig ? <RotateCcw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save Web Name & Settings</span>
              </button>
            </div>
          </form>

          {/* Controls & Danger Zone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white border border-neutral-200/80 rounded-2xl p-5 shadow-xs space-y-3">
              <h3 className="text-xs font-semibold text-neutral-900">Election Status</h3>
              <p className="text-xs text-neutral-500">
                Lock or unlock ballot submissions in real-time.
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
              <h3 className="text-xs font-semibold text-neutral-900">Reset & Wipe</h3>
              <p className="text-xs text-neutral-500">
                Delete all {votes.length} votes from Firestore to start a fresh poll.
              </p>

              <div className="pt-1">
                {!showResetConfirm ? (
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="w-full py-2 rounded-lg border border-neutral-200 text-xs font-medium text-neutral-700 hover:bg-neutral-50 transition-colors"
                  >
                    Reset All Votes ({votes.length})
                  </button>
                ) : (
                  <div className="space-y-2">
                    <p className="text-xs text-neutral-700">Wipe all {votes.length} ballots in Firestore?</p>
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT POSITION                                                      */}
      {/* ========================================================================= */}
      {editingPosition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/20 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-md w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h3 className="text-sm font-semibold text-neutral-900">
                {isAddingPosition ? 'Add New Position' : 'Edit Position'}
              </h3>
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
                  {isSavingPosition ? 'Saving...' : 'Save Position'}
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
                {editingCandidateData.isNew ? 'Add Participant' : `Edit ${editingCandidateData.candidate.name}`}
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
                          agenda: [...cur, 'Platform pledge']
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
                  {isSavingCandidate ? 'Saving...' : 'Save Participant'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: EDIT BALLOT                                                        */}
      {/* ========================================================================= */}
      {editingBallot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-900/20 backdrop-blur-xs">
          <div className="bg-white border border-neutral-200 rounded-2xl max-w-sm w-full p-5 shadow-lg space-y-4">
            <div className="flex items-center justify-between border-b border-neutral-100 pb-2.5">
              <h3 className="text-sm font-semibold text-neutral-900">
                Edit Voter Information
              </h3>
              <button
                onClick={() => setEditingBallot(null)}
                className="text-neutral-400 hover:text-neutral-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveBallotSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editingBallot.voterName}
                  onChange={e => setEditingBallot({ ...editingBallot, voterName: e.target.value })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 mb-1">
                  Admission Number (Ad No)
                </label>
                <input
                  type="text"
                  required
                  value={editingBallot.adNo}
                  onChange={e => setEditingBallot({ ...editingBallot, adNo: e.target.value })}
                  className="w-full bg-white border border-neutral-200 rounded-xl px-3 py-2 text-xs text-neutral-900 font-mono focus:outline-none focus:border-neutral-900"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2 border-t border-neutral-100">
                <button
                  type="button"
                  onClick={() => setEditingBallot(null)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-neutral-600 hover:text-neutral-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBallot}
                  className="px-4 py-1.5 rounded-lg bg-neutral-900 text-white text-xs font-medium hover:bg-neutral-800"
                >
                  {isSavingBallot ? 'Saving...' : 'Save in Firebase'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
