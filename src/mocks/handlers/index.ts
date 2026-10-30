import { socketIoHandler } from '../realtime/socket-io-server'
import { accountHandlers } from './account.handlers'
import { authHandlers } from './auth.handlers'
import { cartHandlers } from './cart.handlers'
import { favoriteHandlers } from './favorites.handlers'
import { healthHandlers } from './health.handlers'
import { mockControlHandlers } from './mock-control.handlers'
import { nftHandlers } from './nfts.handlers'
import { orderHandlers } from './orders.handlers'
import { walletHandlers } from './wallets.handlers'

export const handlers = [
  ...healthHandlers,
  ...authHandlers,
  ...accountHandlers,
  ...nftHandlers,
  ...cartHandlers,
  ...favoriteHandlers,
  ...walletHandlers,
  ...orderHandlers,
  ...mockControlHandlers,
  socketIoHandler,
]
