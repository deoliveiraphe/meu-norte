import { ReactNode } from 'react';
import { AppSidebar } from './AppSidebar';
import { MonthSelector } from './MonthSelector';

export function AppLayout({ children, showMonthSelector = true }: { children: ReactNode; showMonthSelector?: boolean }) {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto min-w-0">
        {showMonthSelector && (
          <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-sm border-b border-border px-4 lg:px-8 py-3 flex items-center justify-center">
            <MonthSelector />
          </div>
        )}
        <div className="p-4 lg:p-8 fade-in">
          {children}
        </div>
      </main>
    </div>
  );
}
