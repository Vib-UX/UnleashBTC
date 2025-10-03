import { useQuery } from '@tanstack/react-query'

type CounterData = {
  hex: string
  decimal: string
}

export function useCounter(
  contractAddress: string | null | undefined,
  userAddress: string | null | undefined,
  opts?: { intervalMs?: number }
) {
  const baseApi = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000').replace(/\/+$/, '')
  const intervalMs = opts?.intervalMs ?? 1000
  return useQuery<CounterData | null>({
    queryKey: ['counter', contractAddress, userAddress],
    queryFn: async () => {
      if (!contractAddress || !userAddress) return null
      const url = `${baseApi}/privy/counter?contract=${encodeURIComponent(contractAddress)}&user=${encodeURIComponent(userAddress)}`
      const resp = await fetch(url)
      const data = await resp.json().catch(() => ({}))
      if (!resp.ok) throw new Error(data?.error || 'Failed to fetch counter')
      return { hex: data.hex, decimal: data.decimal }
    },
    refetchInterval: intervalMs,
    enabled: !!contractAddress && !!userAddress,
  })
}
