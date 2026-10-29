import { socketIoHandler } from '../realtime/socket-io-server'
import { demoNftHandlers } from './demo-nft.handlers'
import { healthHandlers } from './health.handlers'

export const handlers = [...healthHandlers, ...demoNftHandlers, socketIoHandler]
