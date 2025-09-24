'use client'

import { mainnet, sepolia } from '@starknet-react/chains'
import { publicProvider, StarknetConfig } from '@starknet-react/core'
import { connectors } from './connectors'
console.log('connectors', connectors)

export default function Providers({ children }: { children: React.ReactNode }) {
  const chains = [mainnet, sepolia]
  const providers = publicProvider()

  return (
    <StarknetConfig chains={chains} provider={providers} connectors={connectors}>
      {children}
    </StarknetConfig>
  )
}
