import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useFinanceStore } from '@/stores/useFinanceStore';
import { Button } from '@/components/ui/button';

export function MonthSelector() {
  const { prevMonth, nextMonth, getMonthLabel } = useFinanceStore();

  return (
    <div className="flex items-center gap-3">
      <Button variant="outline" size="icon" className="w-8 h-8" onClick={prevMonth}>
        <ChevronLeft className="w-4 h-4" />
      </Button>
      <span className="text-sm font-semibold text-foreground min-w-[140px] text-center">
        {getMonthLabel()}
      </span>
      <Button variant="outline" size="icon" className="w-8 h-8" onClick={nextMonth}>
        <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
}
