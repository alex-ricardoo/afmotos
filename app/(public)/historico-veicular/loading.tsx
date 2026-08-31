import React from 'react';

export default function HistoricoVeicularLoading() {
  return (
    <div className="min-h-screen bg-[#060709] py-16 px-4 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="h-8 w-48 bg-zinc-900 rounded-full mx-auto" />
        <div className="h-14 w-3/4 bg-zinc-900 rounded-2xl mx-auto" />
        <div className="h-6 w-1/2 bg-zinc-900 rounded-xl mx-auto" />
        <div className="h-44 max-w-md bg-zinc-900 rounded-3xl mx-auto" />
      </div>
    </div>
  );
}
