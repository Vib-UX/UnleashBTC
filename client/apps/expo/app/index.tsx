import HomeScreen from 'app/features/home/screen'
import { Stack } from 'expo-router'
import Providers from '../providers/starknet-providers'

export default function Screen() {
  return (
    <>
      <Stack.Screen
        options={{
          title: 'Home',
        }}
      />

      <Providers>
        <HomeScreen />
      </Providers>
    </>
  )
}
