import { gql } from 'graphql-tag';

export const knowledgeTypeDefs = gql`
  enum ArticleVisibility {
    PUBLIC
    INTERNAL
  }

  type KnowledgeArticle {
    id: Int!
    title: String!
    body: String!
    visibility: ArticleVisibility!
    viewCount: Int!
    updatedAt: DateTime!
    category: Category
  }

  extend type Query {
    knowledgeArticles(search: String, internal: Boolean): [KnowledgeArticle!]!
    knowledgeArticle(id: Int!): KnowledgeArticle!
    relatedArticles(ticketId: Int!): [KnowledgeArticle!]!
    suggestReply(ticketId: Int!): String!
    articleSnippet(articleId: Int!): String!
  }
`;
