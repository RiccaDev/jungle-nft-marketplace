import { socketIoHandler } from '../realtime/socket-io-server'
import { healthHandlers } from './health.handlers'
import { mockControlHandlers } from './mock-control.handlers'
import { nftHandlers } from './nfts.handlers'

export const handlers = [...healthHandlers, ...nftHandlers, ...mockControlHandlers, socketIoHandler]
