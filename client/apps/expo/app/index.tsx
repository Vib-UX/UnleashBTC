import { Stack } from 'expo-router'
import { AppleSignInScreen } from './WalletScreen'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Home',
        }}
      />
      <AppleSignInScreen />
    </>
  )
}
