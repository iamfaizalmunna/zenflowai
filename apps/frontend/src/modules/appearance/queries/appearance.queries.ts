import { gql } from '@apollo/client';

export const APPEARANCE_FIELDS = gql`
  fragment AppearanceFields on Appearance {
    colorMode
    accentHex
    shade
    finish
    fontFamily
    fontSize
    density
    ticketView
    ticketSort
    soundsMuted
    logoDataUrl
  }
`;

export const MY_APPEARANCE = gql`
  ${APPEARANCE_FIELDS}
  query MyAppearance {
    myAppearance { ...AppearanceFields }
  }
`;

export const SAVE_APPEARANCE = gql`
  ${APPEARANCE_FIELDS}
  mutation SaveAppearance($input: AppearanceInput!) {
    saveAppearance(input: $input) { ...AppearanceFields }
  }
`;
