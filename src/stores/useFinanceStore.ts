import { create } from 'zustand';

interface FinanceState {
  currentMonth: number;
  currentYear: number;
  nextMonth: () => void;
  prevMonth: () => void;
  getMonthLabel: () => string;
}

const monthNames = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

export const useFinanceStore = create<FinanceState>((set, get) => ({
  currentMonth: 0, // January
  currentYear: 2026,
  nextMonth: () => set((state) => {
    if (state.currentMonth === 11) {
      return { currentMonth: 0, currentYear: state.currentYear + 1 };
    }
    return { currentMonth: state.currentMonth + 1 };
  }),
  prevMonth: () => set((state) => {
    if (state.currentMonth === 0) {
      return { currentMonth: 11, currentYear: state.currentYear - 1 };
    }
    return { currentMonth: state.currentMonth - 1 };
  }),
  getMonthLabel: () => {
    const { currentMonth, currentYear } = get();
    return `${monthNames[currentMonth]} ${currentYear}`;
  },
}));
