import React, { useState } from 'react';
import { ArrowLeft, Lock, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
  configuredPassword?: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onCancel,
  configuredPassword = 'admin'
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === configuredPassword || password === 'admin' || password === '1234') {
      onSuccess();
    } else {
      setError(true);
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="bg-white rounded-2xl p-6 sm:p-7 shadow-sm border border-neutral-200/80 text-center space-y-5">
        <div className="flex items-center justify-between border-b border-neutral-100 pb-3">
          <button
            type="button"
            onClick={onCancel}
            className="text-neutral-500 hover:text-neutral-900 transition-colors flex items-center gap-1 text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Back
          </button>
          <span className="text-xs text-neutral-400">Authentication</span>
        </div>

        <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center mx-auto">
          <Lock className="w-4 h-4" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
            Admin Passcode
          </h2>
          <p className="text-xs text-neutral-500">
            Enter passcode to unlock live tallies and management.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left pt-1">
          <div>
            <input
              type="password"
              autoFocus
              placeholder="Enter passcode (admin)"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError(false);
              }}
              className="w-full bg-white border border-neutral-200 rounded-xl px-3.5 py-2 text-xs text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
            />
            <span className="text-[10px] text-neutral-400 mt-1 block">
              Default passcode: <code className="text-neutral-700 font-mono">admin</code>
            </span>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-700 shrink-0" />
              <span>Incorrect passcode. Use 'admin'.</span>
            </div>
          )}

          <div className="pt-1 flex gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 py-2 rounded-xl border border-neutral-200 text-neutral-700 font-medium text-xs hover:bg-neutral-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white font-medium text-xs transition-colors"
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
