import { createClient } from '@connectrpc/connect'
import { Auth } from '../../gen/genius/auth/v1/auth_pb.ts'
import { transport } from '../config/transport.ts'

export const authClient = createClient(Auth, transport)
