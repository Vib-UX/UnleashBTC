import { Router, Request, Response } from 'express'

const router = Router()

router.get('/', (_req: Request, res: Response) => {
  res.json({
    status: 'Ready Wallet API running',
    version: '2.0.0',
    endpoints: {
      privyCreate: 'POST /privy/create-wallet',
      privyPublicKey: 'POST /privy/public-key',
      privyUserWallets: 'GET /privy/user-wallets?userId=…',
      privyDeploy: 'POST /privy/deploy-wallet',
      privyExecute: 'POST /privy/execute',
      privyCounter: 'GET /privy/counter?contract=…',
      privyIncreaseCounter: 'POST /privy/increase-counter',
    },
  })
})

export default router
