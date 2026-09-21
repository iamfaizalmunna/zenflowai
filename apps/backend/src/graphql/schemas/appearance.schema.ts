import { gql } from 'graphql-tag';

export const appearanceTypeDefs = gql`
  enum UiColorMode {
    SYSTEM
    LIGHT
    DARK
  }

  enum UiFinish {
    MATTE
    GLOSSY
    GLASS
  }

  enum UiFontFamily {
    OUTFIT
    FRAUNCES
    SYSTEM
    SERIF
    MONO
  }

  enum UiFontSize {
    S
    M
    L
  }

  enum UiDensity {
    COMFORTABLE
    COMPACT
  }

  enum UiTicketView {
    LIST
    COMPACT
    CARD
    ICON
  }

  enum UiTicketSort {
    UPDATED
    CREATED
    SLA
    PRIORITY
  }

  type Appearance {
    colorMode: UiColorMode!
    accentHex: String!
    shade: Int!
    finish: UiFinish!
    fontFamily: UiFontFamily!
    fontSize: UiFontSize!
    density: UiDensity!
    ticketView: UiTicketView!
    ticketSort: UiTicketSort!
    soundsMuted: Boolean!
    logoDataUrl: String
  }

  input AppearanceInput {
    colorMode: UiColorMode
    accentHex: String
    shade: Int
    finish: UiFinish
    fontFamily: UiFontFamily
    fontSize: UiFontSize
    density: UiDensity
    ticketView: UiTicketView
    ticketSort: UiTicketSort
    soundsMuted: Boolean
    logoDataUrl: String
  }

  extend type Query {
    myAppearance: Appearance!
  }

  extend type Mutation {
    saveAppearance(input: AppearanceInput!): Appearance!
  }
`;
