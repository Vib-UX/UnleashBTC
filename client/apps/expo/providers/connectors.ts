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
    ArgentMobileConnector.init({}),
  ].filter((connector) => connector !== null)
}

export const connectors = availableConnectors()
