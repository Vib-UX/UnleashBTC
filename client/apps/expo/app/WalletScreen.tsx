import { SignInWithApple } from 'cavos-service-native'
import { StyleSheet, View } from 'react-native'

export const AppleSignInScreen = () => {
  const handleSuccess = (wallet) => {
    console.log('Login successful:', wallet)
    console.log('Wallet address:', wallet.address)
    console.log('Network:', wallet.network)
    console.log('User email:', wallet.email)

    // Navigate to main app or save wallet instance
    // wallet is a CavosWallet instance ready for transactions
  }

  const handleError = (error) => {
    console.error('Apple Sign In failed:', error)
    // Handle error (show alert, etc.)
  }

  return (
    <View style={styles.container}>
      <SignInWithApple
        appId="your-org-app-id"
        network="sepolia"
        finalRedirectUri="yourapp://callback"
        onSuccess={handleSuccess}
        onError={handleError}
        style={styles.button}
        textStyle={styles.buttonText}
      >
        Sign in with Apple
      </SignInWithApple>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  button: {
    height: 50,
    borderRadius: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
  },
})
