import React, { useState } from 'react';
import { ArrowLeft, Lock, User, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
  onCancel: () => void;
  configuredUsername?: string;
  configuredPassword?: string;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({
  onSuccess,
  onCancel,
  configuredUsername = 'adminhuda',
  configuredPassword = 'hudaahiaelection'
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const expectedUsername = configuredUsername || 'adminhuda';
  const expectedPassword = configuredPassword || 'hudaahiaelection';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      username.trim() === expectedUsername.trim() &&
      password === expectedPassword
    ) {
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
          <span className="text-xs text-neutral-400">Admin Sign In</span>
        </div>

        <div className="w-10 h-10 rounded-xl bg-neutral-100 text-neutral-900 flex items-center justify-center mx-auto">
          <Lock className="w-4 h-4" />
        </div>

        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-neutral-900 tracking-tight">
            Admin Authentication
          </h2>
          <p className="text-xs text-neutral-500">
            Enter administrator username and password to proceed.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5 text-left pt-1">
          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Admin Username
            </label>
            <div className="relative">
              <User className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                autoFocus
                required
                placeholder="adminhuda"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setError(false);
                }}
                className="w-full bg-white border border-neutral-200 rounded-xl pl-8 pr-3 py-2 text-xs text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-700 mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                placeholder="hudaahiaelection"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                className="w-full bg-white border border-neutral-200 rounded-xl pl-8 pr-3 py-2 text-xs text-neutral-900 font-mono placeholder-neutral-400 focus:outline-none focus:border-neutral-900"
              />
            </div>
          </div>

          {error && (
            <div className="p-2.5 rounded-xl bg-neutral-100 border border-neutral-300 text-neutral-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-neutral-700 shrink-0" />
              <span>Invalid username or password. Please try again.</span>
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
              Unlock Dashboard
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
