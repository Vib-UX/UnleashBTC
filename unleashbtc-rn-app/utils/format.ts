export function formatStarknetAddress(addr: string | null | undefined): string | null {
  if (!addr) return null
  let s = addr.toLowerCase()
  if (!s.startsWith('0x')) s = '0x' + s
  const body = s.slice(2)
  const padded = body.padStart(64, '0')
  return '0x' + padded
}

export function txExplorerUrl(txHash: string): string {
  const base = process.env.NEXT_PUBLIC_EXPLORER_TX_BASE || 'https://sepolia.voyager.online/tx'
  const clean = base.endsWith('/') ? base.slice(0, -1) : base
  return `${clean}/${txHash}`
}

export function addressExplorerUrl(address: string): string {
  const base = process.env.NEXT_PUBLIC_EXPLORER_ADDR_BASE || 'https://sepolia.voyager.online/contract'
  const clean = base.endsWith('/') ? base.slice(0, -1) : base
  return `${clean}/${address}`
}
