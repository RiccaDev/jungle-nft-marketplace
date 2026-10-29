import { socketIoHandler } from '../realtime/socket-io-server'
import { demoNftHandlers } from './demo-nft.handlers'
import { healthHandlers } from './health.handlers'
import { nftHandlers } from './nfts.handlers'

export const handlers = [...healthHandlers, ...nftHandlers, ...demoNftHandlers, socketIoHandler]
