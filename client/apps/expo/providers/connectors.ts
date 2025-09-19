import { constants } from 'starknet'
import { ArgentMobileConnector } from 'starknetkit/argentMobile'

export const ARGENT_WEBWALLET_URL =
  process.env.NEXT_PUBLIC_ARGENT_WEBWALLET_URL || 'https://sepolia-web.argent.xyz'

export const CHAIN_ID =
  process.env.NEXT_PUBLIC_CHAIN_ID === constants.NetworkName.SN_MAIN
    ? constants.NetworkName.SN_MAIN
    : constants.NetworkName.SN_SEPOLIA

export const availableConnectors = () => {
  return [
    // new InjectedConnector({ options: { id: 'argentX' } }),
    // new InjectedConnector({ options: { id: 'braavos' } }),
    // new ControllerConnector(),
    ArgentMobileConnector.init({
      options: {
        url: 'exp://192.168.1.1:8081', // Replace with your Expo development server URL
        dappName: 'Unleash BTC',
        chainId: CHAIN_ID,
      },
    }),
  ].filter((connector) => connector !== null)
}

export const connectors = availableConnectors()
