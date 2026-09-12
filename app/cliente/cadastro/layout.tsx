import React from 'react';

export default function CustomerCadastroLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#060913] via-[#090e1a] to-[#04070e] text-zinc-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden selection:bg-amber-400/30 selection:text-white">
      {/* Dynamic atmospheric ambient glow effects */}
      <div className="pointer-events-none absolute -top-32 -left-32 w-[420px] h-[420px] bg-amber-500/12 rounded-full blur-[120px]" />
      <div className="pointer-events-none absolute top-1/4 -right-40 w-[450px] h-[450px] bg-blue-600/10 rounded-full blur-[140px]" />
      <div className="pointer-events-none absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-emerald-500/10 rounded-full blur-[150px]" />

      {/* Modern micro-grid overlay with radial focal mask */}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,#3b82f608_1px,transparent_1px),linear-gradient(to_bottom,#3b82f608_1px,transparent_1px)] bg-[size:3.5rem_3.5rem] [mask-image:radial-gradient(ellipse_75%_65%_at_50%_50%,#000_60%,transparent_100%)]" />

      <div className="w-full relative z-10 py-8">{children}</div>
    </div>
  );
}

