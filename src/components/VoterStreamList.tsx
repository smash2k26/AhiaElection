import React from 'react';
import { VoteRecord, Position } from '../types';
import { Flame, Snowflake, Check, User } from 'lucide-react';

interface VoterStreamListProps {
  votes: VoteRecord[];
  activePosition: Position;
}

export const VoterStreamList: React.FC<VoterStreamListProps> = ({
  votes,
  activePosition
}) => {
  const candA = activePosition.candidates[0];
  const candB = activePosition.candidates[1];

  // Default avatars if none exists
  const fallbackAvatars = [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=120&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=120&q=80',
  ];

  const recentVotes = votes.slice(0, 7);

  if (recentVotes.length === 0) {
    return (
      <div className="py-8 text-center text-xs text-slate-400">
        No ballots recorded yet. Be the first to cast a vote!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {recentVotes.map((vote, idx) => {
        const selection = vote.selections?.[activePosition.id];
        const isCandB = selection?.candidateId === candB?.id;
        const avatar = vote.avatarUrl || fallbackAvatars[idx % fallbackAvatars.length];

        return (
          <div
            key={vote.id || idx}
            className="flex items-center justify-between py-1.5 px-1 hover:bg-slate-50/80 rounded-xl transition-colors"
          >
            {/* Left: Avatar + Name */}
            <div className="flex items-center gap-3">
              <img
                src={avatar}
                alt={vote.voterName}
                className="w-9 h-9 rounded-full object-cover border border-slate-200"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div>
                <h4 className="text-xs font-bold text-slate-800 leading-tight">
                  {vote.voterName}
                </h4>
                <p className="text-[10px] text-slate-400 font-mono">
                  {vote.voterId} • {new Date(vote.submittedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>

            {/* Right: Colored vote indicator circle (Screen 1 style) */}
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-semibold text-slate-400 hidden sm:inline-block">
                {selection?.candidateName.split(' ')[0] || 'Voted'}
              </span>
              <div
                title={`Voted for ${selection?.candidateName || 'Candidate'}`}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-white shadow-xs transition-transform hover:scale-110 ${
                  isCandB
                    ? 'bg-[#00b87c]' // Green Flame / Check
                    : 'bg-[#ff4a6e]' // Pink Snowflake / Icon
                }`}
              >
                {isCandB ? (
                  <Flame className="w-3.5 h-3.5 fill-white text-white" />
                ) : (
                  <Snowflake className="w-3.5 h-3.5 text-white" />
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
