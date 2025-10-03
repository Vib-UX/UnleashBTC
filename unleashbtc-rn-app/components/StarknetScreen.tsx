import PrivyUI from '@/components/login/PrivyUI'
import { useCounter } from '@/hooks/useCounter'
import { API_URL, CONTRACT_ADDRESS } from '@/utils/config'
import {
  addressExplorerUrl,
  formatStarknetAddress,
  txExplorerUrl,
} from '@/utils/format'
import { STORAGE_KEYS } from '@/utils/storage'
import { usePrivy } from '@privy-io/expo'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useEffect, useState } from 'react'
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Toast from 'react-native-toast-message'

export default function StarknetScreen() {
  const { isReady: ready, user, getAccessToken, logout } = usePrivy() as any
  const [creating, setCreating] = useState(false)
  const [deploying, setDeploying] = useState(false)
  const [increasing, setIncreasing] = useState(false)

  const [walletId, setWalletId] = useState<string | null>(null)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)
  const [publicKey, setPublicKey] = useState<string | null>(null)
  const [txHash, setTxHash] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [deployed, setDeployed] = useState<boolean>(false)
  const [wallets, setWallets] = useState<Array<{
    id: string
    address: string
    publicKey?: string
  }> | null>(null)

  const hasWallet = !!(walletId || walletAddress || publicKey)
  // Use your machine's IP address instead of localhost for mobile development
  const baseApi = API_URL.replace(/\/+$/, '') // Replace with your machine's IP address
  const defaultCounterAddress = CONTRACT_ADDRESS
  const [counterAddress] = useState<string>(defaultCounterAddress)
  const userAddressForCounter = formatStarknetAddress(walletAddress)
  const { data: counterData } = useCounter(
    counterAddress || null,
    userAddressForCounter || null,
    { intervalMs: 1000 }
  )

  // Sync local state with AsyncStorage for the current Privy user
  useEffect(() => {
    const syncStorage = async () => {
      try {
        if (!user?.id) return
        const storedUser = await AsyncStorage.getItem(STORAGE_KEYS.userId)
        if (storedUser && storedUser !== user.id) {
          // Different user logged in → clear previous user's wallet state
          await AsyncStorage.multiRemove([
            STORAGE_KEYS.walletId,
            STORAGE_KEYS.walletAddress,
            STORAGE_KEYS.publicKey,
            STORAGE_KEYS.deployedWalletId,
          ])
          setWalletId(null)
          setWalletAddress(null)
          setPublicKey(null)
          setTxHash(null)
          setWallets(null)
          setError(null)
          setDeployed(false)
        }
        // Record current user id
        await AsyncStorage.setItem(STORAGE_KEYS.userId, user.id)
        // Load cached wallet for this user (if any)
        const [lsId, lsAddr, lsPk] = await AsyncStorage.multiGet([
          STORAGE_KEYS.walletId,
          STORAGE_KEYS.walletAddress,
          STORAGE_KEYS.publicKey,
        ])
        if (lsId[1]) setWalletId(lsId[1])
        if (lsAddr[1]) setWalletAddress(lsAddr[1])
        if (lsPk[1]) setPublicKey(lsPk[1])
      } catch (error) {
        console.error('Error syncing storage:', error)
      }
    }
    syncStorage()
  }, [user?.id])

  // Persist to AsyncStorage when values change
  useEffect(() => {
    const saveWalletId = async () => {
      try {
        if (walletId)
          await AsyncStorage.setItem(STORAGE_KEYS.walletId, walletId)
      } catch (error) {
        console.error('Error saving wallet ID:', error)
      }
    }
    saveWalletId()
  }, [walletId])

  useEffect(() => {
    const saveWalletAddress = async () => {
      try {
        if (walletAddress)
          await AsyncStorage.setItem(STORAGE_KEYS.walletAddress, walletAddress)
      } catch (error) {
        console.error('Error saving wallet address:', error)
      }
    }
    saveWalletAddress()
  }, [walletAddress])

  useEffect(() => {
    const savePublicKey = async () => {
      try {
        if (publicKey)
          await AsyncStorage.setItem(STORAGE_KEYS.publicKey, publicKey)
      } catch (error) {
        console.error('Error saving public key:', error)
      }
    }
    savePublicKey()
  }, [publicKey])

  // Reflect deployed flag when walletId changes
  useEffect(() => {
    const checkDeployedStatus = async () => {
      try {
        const lsDeployed = await AsyncStorage.getItem(
          STORAGE_KEYS.deployedWalletId
        )
        setDeployed(!!(walletId && lsDeployed && lsDeployed === walletId))
      } catch (error) {
        console.error('Error checking deployed status:', error)
        setDeployed(false)
      }
    }
    checkDeployedStatus()
  }, [walletId])

  // Ensure we store the current user id in AsyncStorage when authenticated
  useEffect(() => {
    const saveUserId = async () => {
      try {
        if (user?.id) {
          await AsyncStorage.setItem(STORAGE_KEYS.userId, user.id)
        }
      } catch (error) {
        console.error('Error saving user ID:', error)
      }
    }
    saveUserId()
  }, [, user?.id])

  const fetchWallets = async () => {
    try {
      if (!user?.id) return
      // If values already exist (from AsyncStorage or previous fetch), don't overwrite them on refresh
      if (walletId || walletAddress || publicKey) return
      setError(null)
      // fetch wallets from backend
      const url = `${baseApi}/privy/user-wallets?userId=${encodeURIComponent(
        user.id
      )}&t=${Date.now()}`
      console.log('Fetching wallets from:', url)
      const resp = await fetch(url).catch((error) => {
        console.error('Fetch error:', error)
        throw new Error(`Network error: ${error.message}`)
      })
      console.log('Response status:', resp.status)
      const data = await resp.json().catch((e) => {
        console.error('Error parsing response:', e)
        throw new Error(`Invalid JSON response: ${e.message}`)
      })
      if (!resp.ok) throw new Error(data?.error || 'Failed to fetch wallets')
      const list = Array.isArray(data.wallets) ? data.wallets : []
      setWallets(list)
      if (list.length > 0) {
        const w = list.find((v: any) => v?.publicKey) || list[0]
        if (w.id) setWalletId(w.id)
        if (w.address) setWalletAddress(formatStarknetAddress(w.address))
        if (w.publicKey) setPublicKey(w.publicKey)
        // If public key is missing, fetch full wallet details
        if (!w.publicKey && w.id) {
          try {
            const resp2 = await fetch(`${baseApi}/privy/public-key`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ walletId: w.id }),
            })
            const data2 = await resp2.json().catch(() => ({}))
            if (resp2.ok) {
              const pk =
                data2.public_key ||
                data2.wallet?.public_key ||
                data2.wallet?.publicKey
              const addr = data2.wallet?.address || w.address
              if (pk) setPublicKey(pk)
              if (addr) setWalletAddress(formatStarknetAddress(addr))
            }
          } catch {}
        }
      } // If no wallets, keep whatever is in AsyncStorage/state
    } catch (e: any) {
      setError(e.message || 'Failed to fetch wallets')
    } finally {
      // done fetching
    }
  }

  useEffect(() => {
    fetchWallets()
  }, [ready, user?.id])

  const createWallet = async () => {
    try {
      setError(null)
      setTxHash(null)
      setCreating(true)
      const resp = await fetch(`${baseApi}/privy/create-wallet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerId: user?.id, chainType: 'starknet' }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.error || 'Create wallet failed')
      const w = data.wallet || {}
      setWalletId(w.id || null)
      setWalletAddress(formatStarknetAddress(w.address) || null)
      setPublicKey(w.public_key || w.publicKey || null)
    } catch (e: any) {
      setError(e.message || 'Create wallet failed')
    } finally {
      setCreating(false)
    }
  }

  const deployWallet = async () => {
    try {
      setError(null)
      setTxHash(null)
      setDeploying(true)
      const id = walletId
      if (!id) {
        setError('No walletId found. Create a wallet first.')
        setDeploying(false)
        return
      }
      let userJwt: string | undefined
      try {
        userJwt =
          typeof getAccessToken === 'function'
            ? await getAccessToken()
            : undefined
      } catch {}
      if (!userJwt) {
        setError(
          'Unable to retrieve user session. Please re-login and try again.'
        )
        setDeploying(false)
        return
      }
      const resp = await fetch(`${baseApi}/privy/deploy-wallet`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify({ walletId: id }),
      })
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.error || 'Deploy failed')
      const deployedAddress: string | null =
        formatStarknetAddress(data.address) || null
      const tx = data.transactionHash || null
      setTxHash(tx)
      if (deployedAddress) setWalletAddress(deployedAddress)
      if (data.publicKey) setPublicKey(data.publicKey)
      // Show toast with a link to the deployment transaction on Voyager (fallback to address link)
      try {
        if (tx) {
          const url = txExplorerUrl(tx)
          Toast.show({
            type: 'success',
            text1: 'Wallet deployed',
            text2: `View tx: ${tx.slice(0, 10)}…`,
            onPress: () => Linking.openURL(url),
            visibilityTime: 6000,
          })
        } else if (deployedAddress) {
          const url = addressExplorerUrl(deployedAddress)
          Toast.show({
            type: 'success',
            text1: 'Wallet deployed',
            text2: `${deployedAddress.slice(0, 10)}…`,
            onPress: () => Linking.openURL(url),
            visibilityTime: 6000,
          })
        }
      } catch {}
      try {
        await AsyncStorage.setItem(STORAGE_KEYS.deployedWalletId, id)
        setDeployed(true)
      } catch (error) {
        console.error('Error saving deployed wallet ID:', error)
      }
    } catch (e: any) {
      setError(e.message || 'Deploy failed')
    } finally {
      setDeploying(false)
    }
  }

  const increaseCounter = async () => {
    try {
      setError(null)
      setIncreasing(true)
      Toast.show({
        type: 'info',
        text1: 'Submitting transaction…',
      })

      const id = walletId
      if (!id) {
        const msg = 'No walletId found. Create or select a wallet first.'
        setError(msg)
        Toast.show({
          type: 'error',
          text1: msg,
          visibilityTime: 5000,
        })
        return
      }

      let userJwt: string | undefined
      try {
        userJwt =
          typeof getAccessToken === 'function'
            ? await getAccessToken()
            : undefined
      } catch {
        debugger
      }
      debugger
      if (!userJwt) {
        const msg =
          'Unable to retrieve user session. Please re-login and try again.'
        setError(msg)
        Toast.show({
          type: 'error',
          text1: msg,
          visibilityTime: 5000,
        })
        return
      }

      const resp = await fetch(`${baseApi}/privy/increase-counter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${userJwt}`,
        },
        body: JSON.stringify({
          walletId: id,
          contractAddress: counterAddress,
          wait: true,
        }),
      })

      console.log('resp', resp)
      const data = await resp.json().catch(() => ({}))
      console.log('resp', data)
      if (!resp.ok) throw new Error(data?.error || 'Increase counter failed')

      const txHash: string | undefined = data?.transactionHash
      if (txHash) {
        const url = txExplorerUrl(txHash)
        Toast.show({
          type: 'success',
          text1: 'Counter increased',
          text2: `View tx: ${txHash.slice(0, 10)}…`,
          onPress: () => Linking.openURL(url),
          visibilityTime: 6000,
        })
      } else {
        Toast.show({
          type: 'success',
          text1: 'Counter increased',
          visibilityTime: 4000,
        })
      }
    } catch (e: any) {
      const msg = e.message || 'Increase counter failed'
      setError(msg)
      Toast.show({
        type: 'error',
        text1: msg,
        visibilityTime: 5000,
      })
    } finally {
      setIncreasing(false)
    }
  }

  // Temporary debug utility to clear local wallet state
  const clearLocal = async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.walletId,
        STORAGE_KEYS.walletAddress,
        STORAGE_KEYS.publicKey,
        STORAGE_KEYS.deployedWalletId,
      ])
      setWalletId(null)
      setWalletAddress(null)
      setPublicKey(null)
      setTxHash(null)
      setWallets(null)
      setError(null)
      setDeployed(false)
    } catch (error) {
      console.error('Error clearing local storage:', error)
    }
  }

  // Logout handler: clear cached wallet state before logging out
  const handleLogout = async () => {
    try {
      clearLocal()
    } catch {}
    try {
      await logout()
    } catch {}
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: '#FFFFFF' }]}>
      <View style={styles.content}>
        {ready && (
          <View style={styles.header}>
            <View style={styles.userInfo}>
              <Text
                style={[styles.userText, { color: '#000000' }]}
                numberOfLines={1}
              >
                {user?.email?.address || user?.id}
              </Text>
              <TouchableOpacity
                onPress={handleLogout}
                style={[styles.button, styles.secondaryButton]}
              >
                <Text style={styles.buttonText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.mainContent}>
          {!ready ? (
            <View style={styles.card}>
              <Text style={[styles.title, { color: '#000000' }]}>
                Get Started
              </Text>
              <Text style={[styles.subtitle, { color: '#64748B' }]}>
                Login to continue.
              </Text>
              <PrivyUI />
            </View>
          ) : (
            <View style={styles.authenticatedContent}>
              <View style={styles.card}>
                <Text style={[styles.title, { color: '#000000' }]}>
                  Welcome
                </Text>
                <Text style={[styles.subtitle, { color: '#64748B' }]}>
                  {user?.email?.address || user?.id || 'Authenticated user'}
                </Text>
                <Text style={[styles.description, { color: '#64748B' }]}>
                  Use the buttons below to create and deploy a Starknet wallet
                  via the backend.
                </Text>
              </View>

              {/* Counter Section */}
              <View style={styles.counterSection}>
                <Text style={[styles.counterText, { color: '#2563EB' }]}>
                  {counterData?.decimal ?? '0'}
                </Text>
                <TouchableOpacity
                  onPress={increaseCounter}
                  style={[
                    styles.button,
                    styles.primaryButton,
                    (!walletId || !deployed || increasing) &&
                      styles.buttonDisabled,
                  ]}
                  disabled={!walletId || !deployed || increasing}
                >
                  <Text style={styles.buttonText}>
                    {increasing ? '...' : 'Increase'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.card}>
                <View style={styles.buttonGroup}>
                  <TouchableOpacity
                    onPress={createWallet}
                    style={[
                      styles.button,
                      styles.primaryButton,
                      (creating || hasWallet) && styles.buttonDisabled,
                    ]}
                    disabled={creating || hasWallet}
                  >
                    <Text style={styles.buttonText}>
                      {creating
                        ? 'Creating…'
                        : hasWallet
                        ? 'Wallet Exists'
                        : 'Create Wallet'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={deployWallet}
                    style={[
                      styles.button,
                      styles.secondaryButton,
                      (deploying || !walletId || deployed) &&
                        styles.buttonDisabled,
                    ]}
                    disabled={deploying || !walletId || deployed}
                  >
                    <Text style={styles.buttonText}>
                      {deploying
                        ? 'Deploying…'
                        : deployed
                        ? 'Deployed'
                        : 'Deploy Wallet'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={clearLocal}
                    style={[styles.button, styles.secondaryButton]}
                  >
                    <Text style={styles.buttonText}>Clear Local (Debug)</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.walletInfo}>
                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: '#000000' }]}>
                      Wallet ID:
                    </Text>
                    <Text style={[styles.value, { color: '#64748B' }]}>
                      {walletId || '-'}
                    </Text>
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: '#000000' }]}>
                      Address:
                    </Text>
                    {walletAddress ? (
                      <TouchableOpacity
                        onPress={() =>
                          Linking.openURL(
                            addressExplorerUrl(
                              formatStarknetAddress(walletAddress)!
                            )
                          )
                        }
                      >
                        <Text
                          style={[
                            styles.value,
                            styles.link,
                            { color: '#3B82F6' },
                          ]}
                        >
                          {formatStarknetAddress(walletAddress)}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={[styles.value, { color: '#64748B' }]}>
                        -
                      </Text>
                    )}
                  </View>

                  <View style={styles.infoRow}>
                    <Text style={[styles.label, { color: '#000000' }]}>
                      Public Key:
                    </Text>
                    <Text style={[styles.value, { color: '#64748B' }]}>
                      {publicKey || '-'}
                    </Text>
                  </View>
                </View>

                {error && (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                )}
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  header: {
    marginBottom: 16,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  userText: {
    fontSize: 14,
    marginRight: 12,
    flex: 1,
    textAlign: 'right',
  },
  mainContent: {
    maxWidth: 600,
    alignSelf: 'center',
    width: '100%',
  },
  authenticatedContent: {
    gap: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 3,
    elevation: 1,
    borderWidth: 1,
    borderColor: '#F0F4F8',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 4,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    textAlign: 'center',
  },
  counterSection: {
    alignItems: 'center',
    marginVertical: 24,
  },
  counterText: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  button: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#3B82F6',
  },
  secondaryButton: {
    backgroundColor: '#94A3B8',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  walletInfo: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  label: {
    fontWeight: '500',
    marginRight: 8,
    fontSize: 14,
  },
  value: {
    flex: 1,
    fontSize: 14,
  },
  link: {
    textDecorationLine: 'underline',
  },
  errorContainer: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE3E3',
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 14,
    fontWeight: '500',
  },
})
