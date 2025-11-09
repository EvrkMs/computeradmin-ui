import React from 'react';

const AppShell = ({ header, banner, sidebar, children }) => (
  <div className="min-h-screen bg-gray-50 dark:bg-slate-950 dark:text-slate-100 transition-colors">
    {header}
    <div className="container mx-auto px-4 py-8 space-y-6">
      {banner}
      <div className="flex gap-6">
        {sidebar}
        <main className="flex-1">{children}</main>
      </div>
    </div>
  </div>
);

export default AppShell;
