import React, { useState } from 'react';
import { Position, Candidate, ElectionConfig } from './types';
import { 
  Check, 
  ArrowRight, 
  ArrowLeft, 
  RotateCcw, 
  User, 
  Hash, 
  AlertCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface VotingBoothProps {
  positions: Position[];
  config: ElectionConfig;
  onVoteCast: (
    voterName: string, 
    adNo: string, 
    selections: { [positionId: string]: { candidateId: string; candidateName: string } }
  ) => Promise<{ success: boolean; hash: string }>;
  onGoToAdmin: () => void;
}

export const VotingBooth: React.FC<VotingBoothProps> = ({
  positions,
  config,
  onVoteCast,
  onGoToAdmin
}) => {
  // Step 1: Identification (Full Name & Ad No)
  // Step 2: Position 1 Vote
  // Step 3: Position 2 Vote
  // Step 4: Thank You Screen
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);

  // Voter inputs
  const [voterName, setVoterName] = useState('');
  const [adNo, setAdNo] = useState('');

  // Selected candidates: map positionId -> Candidate
  const [selections, setSelections] = useState<{ [positionId: string]: Candidate }>({});
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedBallot, setCompletedBallot] = useState<{
    voterName: string;
    adNo: string;
    receiptHash: string;
    selections: { [positionId: string]: Candidate };
  } | null>(null);

  const position1 = positions[0];
  const position2 = positions[1];

  // Step 1 -> Step 2 validation
  const handleProceedFromStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (config.status !== 'active') {
      setErrorMessage(`Voting is currently ${config.status.toUpperCase()}. Submissions are locked.`);
      return;
    }

    if (!voterName.trim()) {
      setErrorMessage('Please enter your Full Name.');
      return;
    }

    if (!adNo.trim()) {
      setErrorMessage('Please enter your Admission Number (Ad No).');
      return;
    }

    setCurrentStep(2);
  };

  // Select candidate handler
  const handleSelectCandidate = (positionId: string, candidate: Candidate) => {
    setErrorMessage(null);
    setSelections(prev => ({
      ...prev,
      [positionId]: candidate
    }));
  };

  // Step 2 -> Step 3 validation
  const handleProceedFromStep2 = () => {
    setErrorMessage(null);
    if (!position1 || !selections[position1.id]) {
      setErrorMessage(`Please select a candidate for ${position1?.title || 'Position 1'}.`);
      return;
    }
    setCurrentStep(3);
  };

  // Step 3 -> Step 4 (Final Submit)
  const handleSubmitVote = async () => {
    setErrorMessage(null);

    if (!position2 || !selections[position2.id]) {
      setErrorMessage(`Please select a candidate for ${position2?.title || 'Position 2'}.`);
      return;
    }

    const formattedSelections: { [positionId: string]: { candidateId: string; candidateName: string } } = {};
    Object.entries(selections).forEach(([posId, candidate]) => {
      formattedSelections[posId] = {
        candidateId: candidate.id,
        candidateName: candidate.name
      };
    });

    try {
      setIsSubmitting(true);
      const result = await onVoteCast(voterName.trim(), adNo.trim(), formattedSelections);
      
      if (result.success) {
        setCompletedBallot({
          voterName: voterName.trim(),
          adNo: adNo.trim(),
          receiptHash: result.hash,
          selections: { ...selections }
        });
        setCurrentStep(4);

        try {
          confetti({
            particleCount: 60,
            spread: 60,
            origin: { y: 0.6 }
          });
        } catch (_) {}
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Failed to record vote in Firebase. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoteAsAnotherStudent = () => {
    setVoterName('');
    setAdNo('');
    setSelections({});
    setCompletedBallot(null);
    setErrorMessage(null);
    setCurrentStep(1);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Minimal Step Indicator */}
      <div className="bg-white border border-neutral-200/80 rounded-2xl p-4 shadow-sm">
        <div className="flex items-center justify-between text-xs text-neutral-500 mb-2">
          <span className="font-medium text-neutral-900">
            {config.appName || 'CivicVote'} <span className="text-neutral-400 font-normal">• {config.electionTitle}</span>
          </span>
          <span>Step {currentStep} of 4</span>
        </div>

        {config.announcement && (
          <div className="mb-2.5 py-1 px-2.5 bg-neutral-50 border border-neutral-200 rounded-lg text-[11px] text-neutral-600">
            {config.announcement}
          </div>
        )}

        {/* Minimal Progress Line */}
        <div className="grid grid-cols-4 gap-1.5 pt-1">
          {[1, 2, 3, 4].map(step => (
            <div
              key={step}
              className={`h-1 rounded-full transition-all duration-300 ${
                currentStep >= step ? 'bg-neutral-900' : 'bg-neutral-100'
              }`}
            />
          ))}
        </div>

        <div className="flex justify-between items-center text-[11px] text-neutral-400 mt-2 px-0.5">
          <span className={currentStep === 1 ? 'font-medium text-neutral-900' : ''}>Voter Info</span>
          <span className={currentStep === 2 ? 'font-medium text-neutral-900' : ''}>
            {position1?.title ? position1.title.split(' ')[0] : 'Pos 1'}
          </span>
          <span className={currentStep === 3 ? 'font-medium text-neutral-900' : ''}>
            {position2?.title ? position2.title.split(' ')[0] : 'Pos 2'}
          </span>
          <span className={currentStep === 4 ? 'font-medium text-neutral-900' : ''}>Confirmation</span>
        </div>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-neutral-700 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 1: VOTER INPUTS                                                      */}
      {/* ========================================================================= */}
      {currentStep === 1 && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
              Voter Identification
            </h2>
            <p className="text-xs text-neutral-500">
              Please enter your full name and student admission number to begin voting.
            </p>
          </div>

          <form onSubmit={handleProceedFromStep1} className="space-y-4 pt-1">
            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Full Name
              </label>
              <div className="relative">
                <User className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  autoFocus
                  value={voterName}
                  onChange={(e) => {
                    setVoterName(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. Jordan Reed"
                  className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-neutral-900 placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-neutral-700 mb-1.5">
                Admission Number (Ad No)
              </label>
              <div className="relative">
                <Hash className="w-4 h-4 text-neutral-400 absolute left-3 top-3" />
                <input
                  type="text"
                  required
                  value={adNo}
                  onChange={(e) => {
                    setAdNo(e.target.value);
                    setErrorMessage(null);
                  }}
                  placeholder="e.g. AD-1042"
                  className="w-full bg-white border border-neutral-200 rounded-xl pl-9 pr-3.5 py-2.5 text-xs text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:border-neutral-900 transition-colors"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full py-2.5 px-4 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <span>Continue to {position1?.title || 'Position 1'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 2: POSITION 1 VOTING SCREEN                                          */}
      {/* ========================================================================= */}
      {currentStep === 2 && position1 && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">
                Position 1 of 2
              </span>
              <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
                {position1.title}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {position1.description}
              </p>
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              Voter: <strong className="text-neutral-800 font-normal">{voterName}</strong> ({adNo})
            </div>
          </div>

          {/* 2 Participants Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {position1.candidates.map((candidate) => {
              const isSelected = selections[position1.id]?.id === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(position1.id, candidate)}
                  className={`cursor-pointer rounded-xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-50/60 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={candidate.avatarUrl}
                          alt={candidate.name}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200"
                        />
                        <div>
                          <h3 className="font-semibold text-sm text-neutral-900">
                            {candidate.name}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            {candidate.department}
                          </p>
                        </div>
                      </div>

                      {/* Minimal selection radio indicator */}
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'border-neutral-900 bg-neutral-900 text-white' 
                          : 'border-neutral-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 italic bg-neutral-50/80 p-2 rounded-lg border border-neutral-100">
                      "{candidate.tagline}"
                    </p>

                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {candidate.bio}
                    </p>

                    {candidate.agenda && candidate.agenda.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-neutral-100 text-[11px] text-neutral-600">
                        {candidate.agenda.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-neutral-400">•</span>
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                        isSelected 
                          ? 'bg-neutral-900 text-white' 
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Candidate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-100">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="py-2 px-3 text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleProceedFromStep2}
              disabled={!selections[position1.id]}
              className={`py-2 px-4 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                selections[position1.id]
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              <span>Next: {position2?.title ? position2.title.split(' ')[0] : 'Position 2'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 3: POSITION 2 VOTING SCREEN                                          */}
      {/* ========================================================================= */}
      {currentStep === 3 && position2 && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-7 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-100 pb-4">
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 block mb-0.5">
                Position 2 of 2
              </span>
              <h2 className="text-xl font-semibold text-neutral-900 tracking-tight">
                {position2.title}
              </h2>
              <p className="text-xs text-neutral-500 mt-0.5">
                {position2.description}
              </p>
            </div>
            <div className="text-xs text-neutral-400 font-mono">
              Voter: <strong className="text-neutral-800 font-normal">{voterName}</strong> ({adNo})
            </div>
          </div>

          {/* 2 Participants Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {position2.candidates.map((candidate) => {
              const isSelected = selections[position2.id]?.id === candidate.id;
              return (
                <div
                  key={candidate.id}
                  onClick={() => handleSelectCandidate(position2.id, candidate)}
                  className={`cursor-pointer rounded-xl p-4 sm:p-5 border transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-neutral-900 bg-neutral-50/60 ring-1 ring-neutral-900'
                      : 'border-neutral-200 hover:border-neutral-300 bg-white'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={candidate.avatarUrl}
                          alt={candidate.name}
                          className="w-12 h-12 rounded-xl object-cover border border-neutral-200"
                        />
                        <div>
                          <h3 className="font-semibold text-sm text-neutral-900">
                            {candidate.name}
                          </h3>
                          <p className="text-xs text-neutral-500">
                            {candidate.department}
                          </p>
                        </div>
                      </div>

                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 transition-colors ${
                        isSelected 
                          ? 'border-neutral-900 bg-neutral-900 text-white' 
                          : 'border-neutral-300 bg-white'
                      }`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>

                    <p className="text-xs text-neutral-600 italic bg-neutral-50/80 p-2 rounded-lg border border-neutral-100">
                      "{candidate.tagline}"
                    </p>

                    <p className="text-xs text-neutral-500 line-clamp-2">
                      {candidate.bio}
                    </p>

                    {candidate.agenda && candidate.agenda.length > 0 && (
                      <div className="space-y-1 pt-2 border-t border-neutral-100 text-[11px] text-neutral-600">
                        {candidate.agenda.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-start gap-1.5">
                            <span className="text-neutral-400">•</span>
                            <span className="truncate">{item}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-neutral-100">
                    <button
                      type="button"
                      className={`w-full py-1.5 px-3 rounded-lg text-xs font-medium transition-colors ${
                        isSelected 
                          ? 'bg-neutral-900 text-white' 
                          : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200/80'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select Candidate'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Navigation Controls & Final Submission */}
          <div className="pt-2 flex items-center justify-between gap-3 border-t border-neutral-100">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setCurrentStep(2)}
              className="py-2 px-3 text-xs font-medium text-neutral-500 hover:text-neutral-900 flex items-center gap-1 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to {position1?.title ? position1.title.split(' ')[0] : 'Position 1'}</span>
            </button>

            <button
              type="button"
              disabled={isSubmitting || !selections[position2.id]}
              onClick={handleSubmitVote}
              className={`py-2 px-5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors ${
                isSubmitting
                  ? 'bg-neutral-100 text-neutral-400 cursor-wait'
                  : selections[position2.id]
                  ? 'bg-neutral-900 hover:bg-neutral-800 text-white'
                  : 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <RotateCcw className="w-3.5 h-3.5 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <span>Submit Ballot</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* STEP 4: THANK YOU SCREEN                                                  */}
      {/* ========================================================================= */}
      {currentStep === 4 && completedBallot && (
        <div className="bg-white border border-neutral-200/80 rounded-2xl p-6 sm:p-10 shadow-sm space-y-6 text-center">
          <div className="w-12 h-12 rounded-full bg-neutral-100 text-neutral-900 flex items-center justify-center mx-auto">
            <Check className="w-6 h-6 stroke-[2.5]" />
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-semibold text-neutral-900 tracking-tight">
              Thank You, {completedBallot.voterName}!
            </h2>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Your votes for both positions have been recorded in the database.
            </p>
          </div>

          {/* Minimal Digital Receipt */}
          <div className="max-w-md mx-auto bg-neutral-50 border border-neutral-200 rounded-xl p-4 text-left font-mono text-xs space-y-2.5">
            <div className="flex justify-between items-center border-b border-neutral-200 pb-2 text-[10px] text-neutral-500 uppercase tracking-wider">
              <span>Receipt Confirmation</span>
              <span className="text-neutral-900 font-semibold">STORED IN FIRESTORE</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-neutral-700 text-[11px]">
              <div>
                <span className="text-neutral-400 block text-[10px]">NAME</span>
                <span className="font-medium text-neutral-900">{completedBallot.voterName}</span>
              </div>
              <div>
                <span className="text-neutral-400 block text-[10px]">AD NO</span>
                <span className="font-medium text-neutral-900">{completedBallot.adNo}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-200 space-y-1.5 text-[11px]">
              <span className="text-neutral-400 block text-[10px]">VOTED CANDIDATES</span>
              {position1 && (
                <div className="flex justify-between text-neutral-700">
                  <span className="text-neutral-500">{position1.title}:</span>
                  <span className="font-medium text-neutral-900">
                    {completedBallot.selections[position1.id]?.name}
                  </span>
                </div>
              )}
              {position2 && (
                <div className="flex justify-between text-neutral-700">
                  <span className="text-neutral-500">{position2.title}:</span>
                  <span className="font-medium text-neutral-900">
                    {completedBallot.selections[position2.id]?.name}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-neutral-200 flex justify-between items-center text-[10px]">
              <span className="text-neutral-400">HASH</span>
              <span className="font-mono text-neutral-800 font-semibold">{completedBallot.receiptHash}</span>
            </div>
          </div>

          {/* Minimal actions */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
            <button
              onClick={handleVoteAsAnotherStudent}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-100 hover:bg-neutral-200/80 text-neutral-800 text-xs font-medium transition-colors"
            >
              Vote as Another Student
            </button>

            <button
              onClick={onGoToAdmin}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-medium transition-colors"
            >
              View Admin Tallies &rarr;
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
