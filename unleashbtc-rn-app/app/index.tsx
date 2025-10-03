import LoginScreen from '@/components/LoginScreen'
import StarknetScreen from '@/components/StarknetScreen'
import { usePrivy } from '@privy-io/expo'
import Constants from 'expo-constants'
import { SafeAreaView, Text, View } from 'react-native'

export default function Index() {
  const { user } = usePrivy()
  if ((Constants.expoConfig?.extra?.privyAppId as string).length !== 25) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text>You have not set a valid `privyAppId` in app.json</Text>
        </View>
      </SafeAreaView>
    )
  }
  if (
    !(Constants.expoConfig?.extra?.privyClientId as string).startsWith(
      'client-'
    )
  ) {
    return (
      <SafeAreaView>
        <View
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Text>You have not set a valid `privyClientId` in app.json</Text>
        </View>
      </SafeAreaView>
    )
  }
  return !user ? <LoginScreen /> : <StarknetScreen />
}
