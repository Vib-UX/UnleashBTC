/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#2B6CB0'
const tintColorDark = '#fff'

type ColorScheme = {
  text: string
  textSecondary: string
  background: string
  tint: string
  icon: string
  tabIconDefault: string
  tabIconSelected: string
  primary: string
}

export const Colors: { light: ColorScheme; dark: ColorScheme } = {
  light: {
    text: '#000000',
    textSecondary: '#4A5568',
    background: '#FFFFFF',
    tint: '#2B6CB0',
    icon: '#4A5568',
    tabIconDefault: '#718096',
    tabIconSelected: '#2B6CB0',
    primary: '#3182CE',
  },
  dark: {
    text: '#ECEDEE',
    textSecondary: '#9BA1A6',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    primary: '#0052FF',
  },
}
