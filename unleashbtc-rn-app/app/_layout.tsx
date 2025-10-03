import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter'
import { PrivyProvider } from '@privy-io/expo'
import { PrivyElements } from '@privy-io/expo/ui'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import Constants from 'expo-constants'
import { useFonts } from 'expo-font'
import { Stack } from 'expo-router'

const queryClient = new QueryClient()
export default function RootLayout() {
  useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  })
  return (
    <QueryClientProvider client={queryClient}>
      <PrivyProvider
        appId={Constants.expoConfig?.extra?.privyAppId}
        clientId={Constants.expoConfig?.extra?.privyClientId}
      >
        <Stack>
          <Stack.Screen name="index" />
        </Stack>
        <PrivyElements />
      </PrivyProvider>
    </QueryClientProvider>
  )
}
