import { baseTypeDefs } from './base.schema';
import { authTypeDefs } from './auth.schema';
import { userTypeDefs } from './user.schema';
import { ticketTypeDefs } from './ticket.schema';
import { knowledgeTypeDefs } from './knowledge.schema';

export const typeDefs = [baseTypeDefs, authTypeDefs, userTypeDefs, ticketTypeDefs, knowledgeTypeDefs];
