export type ThemeId = 'testgrid-dark';

export interface ThemeOption {
  id: ThemeId;
  name: string;
  description: string;
  isDark: boolean;
  headerBg: string;
  headerIconBg: string;
  activeBtnBg: string;
  heroBadgeText: string;
  heroBadgeBg: string;
  heroBadgeBorder: string;
  cardBg: string;
  cardBorder: string;
  accentRing: string;
  accentText: string;
  bgCanvas: string;
  bgGlowGradient: string;
  buttonGradient: string;
  calendarSelectedBg: string;
}

export const TESTGRID_THEME: ThemeOption = {
  id: 'testgrid-dark',
  name: 'TestGrid Slate',
  description: 'Refined dark slate theme styled after TestGrid CoTester',
  isDark: true,
  headerBg: 'bg-[#0B0F17]/90 border-slate-800/80',
  headerIconBg: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
  activeBtnBg: 'bg-indigo-600 text-white font-semibold shadow-xs',
  heroBadgeText: 'text-indigo-400',
  heroBadgeBg: 'bg-indigo-500/10',
  heroBadgeBorder: 'border-indigo-500/20',
  cardBg: 'bg-[#111827]',
  cardBorder: 'border-slate-800',
  accentRing: 'focus:ring-indigo-500/40',
  accentText: 'text-indigo-400',
  bgCanvas: 'bg-[#0B0F17]',
  bgGlowGradient: 'from-indigo-600/10 via-blue-600/5 to-transparent',
  buttonGradient: 'bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-xs',
  calendarSelectedBg: 'bg-indigo-600 text-white font-bold shadow-xs',
};

export const THEME_OPTIONS: Record<string, ThemeOption> = {
  'testgrid-dark': TESTGRID_THEME,
  'cyber-teal': TESTGRID_THEME,
  'rose-magenta': TESTGRID_THEME,
  'royal-purple': TESTGRID_THEME,
  'spectrum-light': TESTGRID_THEME,
};
