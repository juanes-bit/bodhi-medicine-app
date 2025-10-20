const palette = {
  white: '#FFFFFF',
  textPrimary: '#3F3F3F',
  textSecondary: '#707070',
  primary: '#B46691',
  accent: '#6489BF',
  accentLight: '#C3D2E6',
  muted: '#F3F3F3',
};

const fontFamilies = {
  regular: 'Montserrat_400Regular',
  medium: 'Montserrat_500Medium',
  semiBold: 'Montserrat_600SemiBold',
  bold: 'Montserrat_700Bold',
};

const makeFont = (color, size, family) => ({
  color,
  ...(size ? { fontSize: size } : {}),
  fontFamily: family,
});

export const Fonts = {
  orangeColor14Bold: makeFont(palette.accentLight, 14.0, fontFamilies.bold),

  blackRegular: makeFont(palette.textPrimary, undefined, fontFamilies.regular),
  black15Regular: makeFont(palette.textPrimary, 15.0, fontFamilies.regular),
  black17Regular: makeFont(palette.textPrimary, 17.0, fontFamilies.regular),
  black19Regular: makeFont(palette.textPrimary, 19.0, fontFamilies.regular),
  black20Regular: makeFont(palette.textPrimary, 20.0, fontFamilies.regular),

  black15Bold: makeFont(palette.textPrimary, 15.0, fontFamilies.bold),
  black17Bold: makeFont(palette.textPrimary, 17.0, fontFamilies.bold),
  black19Bold: makeFont(palette.textPrimary, 19.0, fontFamilies.bold),
  black20Bold: makeFont(palette.textPrimary, 20.0, fontFamilies.bold),
  black25Bold: makeFont(palette.textPrimary, 25.0, fontFamilies.bold),

  white15Regular: makeFont(palette.white, 15.0, fontFamilies.regular),
  white60Regular: makeFont(palette.white, 60.0, fontFamilies.regular),
  white15Bold: makeFont(palette.white, 15.0, fontFamilies.bold),
  white16Bold: makeFont(palette.white, 16.0, fontFamilies.bold),
  white19Bold: makeFont(palette.white, 19.0, fontFamilies.bold),
  white25Bold: makeFont(palette.white, 25.0, fontFamilies.bold),

  gray14Regular: makeFont(palette.textSecondary, 14.0, fontFamilies.regular),
  gray15Regular: makeFont(palette.textSecondary, 15.0, fontFamilies.regular),
  gray16Regular: makeFont(palette.textSecondary, 16.0, fontFamilies.regular),
  gray17Regular: makeFont(palette.textSecondary, 17.0, fontFamilies.regular),
  gray19Regular: makeFont(palette.textSecondary, 19.0, fontFamilies.regular),

  gray15Bold: makeFont(palette.textSecondary, 15.0, fontFamilies.bold),
  gray17Bold: makeFont(palette.textSecondary, 17.0, fontFamilies.bold),
  gray18Bold: makeFont(palette.textSecondary, 18.0, fontFamilies.bold),

  primaryColor23Bold: makeFont(palette.primary, 23.0, fontFamilies.bold),
  primaryColor25Bold: makeFont(palette.primary, 25.0, fontFamilies.bold),
  primaryColor28Bold: makeFont(palette.primary, 28.0, fontFamilies.bold),
  primaryColor16Regular: makeFont(palette.primary, 16.0, fontFamilies.regular),
  primaryColor15Regular: makeFont(palette.primary, 15.0, fontFamilies.regular),

  indigoColor16Bold: makeFont(palette.accent, 16.0, fontFamilies.bold),
  indigoColor18Bold: makeFont(palette.accent, 18.0, fontFamilies.bold),

  redColor20Bold: makeFont('#F4473A', 20.0, fontFamilies.bold),

  lightGrayColor15Bold: makeFont(palette.textSecondary, 15.0, fontFamilies.bold),
  lightGrayColor17Bold: makeFont(palette.textSecondary, 17.0, fontFamilies.bold),
  lightGrayColor21Bold: makeFont(palette.accentLight, 21.0, fontFamilies.bold),
};

export const Colors = {
  primaryColor: palette.primary,
  primaryLight: palette.accentLight,
  secondaryColor: palette.accent,
  accentColor: palette.accent,
  blackColor: palette.textPrimary,
  whiteColor: palette.white,
  grayColor: palette.textSecondary,
  mutedColor: palette.muted,
  orangeColor: palette.primary,
  textPrimary: palette.textPrimary,
  textSecondary: palette.textSecondary,
};

export const Sizes = {
  fixPadding: 10.0,
};

export const CommonStyles = {
  shadow: {
    shadowColor: Colors.blackColor,
    shadowOffset: { x: 1, y: 1 },
    shadowOpacity: 0.15,
  },
};
