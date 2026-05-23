// Extracted from GruuvyPay design screenshots
// Dark theme first — this is a dark-mode fintech app

export const palette = {
  // Brand blues — primary action color from screenshots
  blue: {
    50:  '#EEF3FF',
    100: '#D9E4FF',
    200: '#B3C9FF',
    300: '#7DA4FF',
    400: '#4A7AFF',
    500: '#1B4FD8',  // primary — main CTA buttons, active states
    600: '#1640B8',
    700: '#1033A0',
    800: '#0D2880',
    900: '#091D60',
  },

  // Teal accent — used in PIN dots, logo mark teal elements
  teal: {
    300: '#4DD9D0',
    400: '#26C6BB',
    500: '#1AADA3',  // PIN dot color from screenshot
    600: '#158F87',
  },

  // Neutrals — backgrounds, cards, borders
  dark: {
    50:  '#F8F8F8',
    100: '#E8E8E8',
    200: '#C8C8C8',
    300: '#A0A0A0',
    400: '#707070',
    500: '#484848',
    600: '#303030',
    700: '#232323',  // card backgrounds
    800: '#161616',  // slightly elevated surfaces
    900: '#0D0D0D',  // main background
    950: '#080808',
  },

  // Semantic
  success: {
    light: '#D1FAE5',
    DEFAULT: '#10B981',
    dark: '#065F46',
  },
  warning: {
    light: '#FEF3C7',
    DEFAULT: '#F59E0B',
    dark: '#92400E',
  },
  error: {
    light: '#FEE2E2',
    DEFAULT: '#EF4444',
    dark: '#991B1B',
  },
  info: {
    light: '#DBEAFE',
    DEFAULT: '#3B82F6',
    dark: '#1E3A8A',
  },

  white: '#ffffff',
  black: '#000000',
  transparent: 'transparent',
} as const;

// ─── Theme tokens — what components actually use ──────────────────────

export const darkTheme = {
  // Backgrounds
  bg: {
     primary:   palette.dark[900],    // '#0D0D0D' — main screen bg
    secondary: palette.dark[800],    // '#161616' — elevated cards
    card:      palette.dark[700],    // '#232323' — quick action cards
    input:     '#1A1A1A',            // input fields
    overlay:   'rgba(0,0,0,0.7)',    // modal backdrops
  },

  // Text
  text: {
    primary:   palette.white,
    secondary: palette.dark[200],    // '#C8C8C8' — subtitles, placeholders
    muted:     palette.dark[300],    // '#A0A0A0' — timestamps, labels
    inverse:   palette.dark[900],
    link:      palette.blue[400],
  },

  // Brand
  brand: {
    primary:   '#dbd861',    // '#1B4FD8'
    light:     palette.blue[400],
    dark:      palette.blue[700],
    accent:    "#C8FF57",    // '#1AADA3'
  },

  // Borders
  border: {
    DEFAULT: 'rgba(255,255,255,0.08)',
    focus:   palette.blue[500],
    error:   palette.error.DEFAULT,
    success: palette.success.DEFAULT,
  },

  // Status
  status: {
    success: palette.success.DEFAULT,
    warning: palette.warning.DEFAULT,
    error:   palette.error.DEFAULT,
    info:    palette.info.DEFAULT,
  },

  // Tab bar
  tabBar: {
    bg:       palette.dark[900],
    active:   palette.white,
    inactive: palette.dark[400],
  },
} as const;

export const lightTheme = {
  bg: {
    primary:   '#F5F7FA',
    secondary: palette.white,
    card:      palette.white,
    input:     '#F0F2F5',
    overlay:   'rgba(0,0,0,0.5)',
  },
  text: {
     primary:   '#b8b63a',
    secondary: palette.dark[500],
    muted:     palette.dark[400],
    inverse:   palette.white,
    link:      palette.blue[500],
  },
  brand: {
     primary:   '#dbd861',
    light:     palette.blue[400],
    dark:      palette.blue[700],
    accent:    "#C8FF57",
  },
  border: {
    DEFAULT: 'rgba(0,0,0,0.08)',
    focus:   palette.blue[500],
    error:   palette.error.DEFAULT,
    success: palette.success.DEFAULT,
  },
  status: {
    success: palette.success.DEFAULT,
    warning: palette.warning.DEFAULT,
    error:   palette.error.DEFAULT,
    info:    palette.info.DEFAULT,
  },
  tabBar: {
    bg:       palette.white,
    active:   palette.blue[500],
    inactive: palette.dark[300],
  },
} as const;

export type Theme = {
  bg: {
    primary: string;
    secondary: string;
    card: string;
    input: string;
    overlay: string;
  };

  text: {
    primary: string;
    secondary: string;
    muted: string;
    inverse: string;
    link: string;
  };

  brand: {
    primary: string;
    light: string;
    dark: string;
    accent: string;
  };

  border: {
    DEFAULT: string;
    focus: string;
    error: string;
    success: string;
  };

  status: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  tabBar: {
    bg: string;
    active: string;
    inactive: string;
  };
};
export type ColorScheme = 'dark' | 'light';