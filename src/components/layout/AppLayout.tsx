import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { MonthSelector } from './MonthSelector';

export function AppLayout({ children, showMonthSelector = true }: { children: ReactNode; showMonthSelector?: boolean }) {
  return (
    <div className="flex min-h-screen w-full bg-background">
      <AppSidebar />
      <main className="flex-1 min-w-0">
        {showMonthSelector && (
          <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border px-4 lg:px-8 py-3 flex items-center justify-between">
            <div className="lg:hidden w-10" /> {/* spacer for mobile menu */}
            <MonthSelector />
            <div className="w-10" />
          </header>
        )}
        <div className="p-4 lg:p-8 fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
