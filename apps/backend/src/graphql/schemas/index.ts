import { baseTypeDefs } from './base.schema';
import { authTypeDefs } from './auth.schema';
import { userTypeDefs } from './user.schema';

// Phase 1: base + auth + user
// Phase 2+: add ticket, message, routing, sla schemas
export const typeDefs = [baseTypeDefs, authTypeDefs, userTypeDefs];
