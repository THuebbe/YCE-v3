// Design Token Types for YardCard Elite

// Color System
export interface ColorTokens {
  // Primary Colors
  primary: string;
  primaryDark: string;
  secondaryLight: string;
  secondaryPale: string;
  secondaryGray: string;

  // Accent Colors
  accentGreen: string;
  accentPink: string;
  accentYellow: string;
  accentBlue: string;

  // Functional Colors
  success: string;
  error: string;
  warning: string;
  info: string;

  // Background Colors
  backgroundWhite: string;
  backgroundLight: string;
  backgroundGray: string;
  backgroundDark: string;
  backgroundDarkSurface: string;

  // Neutral Scale
  neutral50: string;
  neutral100: string;
  neutral200: string;
  neutral300: string;
  neutral400: string;
  neutral500: string;
  neutral600: string;
  neutral700: string;
  neutral800: string;
  neutral900: string;
}

// Typography System
export interface TypographyTokens {
  fontFamily: {
    sans: string;
  };
  fontSize: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    bodyLarge: string;
    body: string;
    bodySmall: string;
    caption: string;
    button: string;
    label: string;
  };
  lineHeight: {
    h1: string;
    h2: string;
    h3: string;
    h4: string;
    h5: string;
    bodyLarge: string;
    body: string;
    bodySmall: string;
    caption: string;
    button: string;
    label: string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
}

// Spacing System
export interface SpacingTokens {
  micro: string;
  tight: string;
  small: string;
  default: string;
  medium: string;
  large: string;
  xl: string;
  '2xl': string;
}

// Border Radius
export interface RadiusTokens {
  sm: string;
  default: string;
  md: string;
  lg: string;
  xl: string;
}

// Component Heights
export interface HeightTokens {
  nav: string;
  navItem: string;
  button: string;
  buttonDesktop: string;
  input: string;
  tab: string;
  touchTarget: string;
}

// Shadow System
export interface ShadowTokens {
  small: string;
  default: string;
  medium: string;
  large: string;
  button: string;
  card: string;
  cardHover: string;
}

// Gradient System
export interface GradientTokens {
  primary: string;
  success: string;
  celebration: string;
}

// Transition System
export interface TransitionTokens {
  standard: string;
  entrance: string;
  exit: string;
}

// Complete Design System
export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  heights: HeightTokens;
  shadows: ShadowTokens;
  gradients: GradientTokens;
  transitions: TransitionTokens;
}

// Component Variant Types
export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'success' | 'error' | 'warning';
export type ButtonSize = 'sm' | 'default' | 'lg' | 'icon';

export type CardVariant = 'default' | 'elevated' | 'outlined' | 'ghost';
export type CardPadding = 'none' | 'sm' | 'default' | 'lg';
export type CardHover = 'none' | 'lift' | 'scale';

export type ContainerSize = 'sm' | 'default' | 'lg' | 'xl' | 'full';
export type ContainerSpacing = 'none' | 'tight' | 'default' | 'wide';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info' | 'default';

export type ModalSize = 'sm' | 'default' | 'lg' | 'xl' | 'full';

export type LabelSize = 'sm' | 'default' | 'lg';

// Breakpoint System
export interface BreakpointTokens {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

// Z-Index System
export interface ZIndexTokens {
  dropdown: number;
  sticky: number;
  fixed: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
}

// Animation System
export interface AnimationTokens {
  fadeIn: string;
  fadeOut: string;
  slideInRight: string;
  slideInLeft: string;
  slideInUp: string;
  slideInDown: string;
  scaleIn: string;
  scaleOut: string;
  bounce: string;
  pulse: string;
  spin: string;
}

// Complete theme interface
export interface Theme {
  tokens: DesignTokens;
  breakpoints: BreakpointTokens;
  zIndex: ZIndexTokens;
  animations: AnimationTokens;
}