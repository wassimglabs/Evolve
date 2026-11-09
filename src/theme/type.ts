import { fonts } from './fonts';

/** Type scale (spec section 1). Colors are applied by the caller from tokens. */
export const type = {
  /** Screen title: 32 / 600 / Space Grotesk, letterSpacing -0.5 */
  screenTitle: {
    fontSize: 32,
    fontFamily: fonts.grotesk,
    letterSpacing: -0.5,
  },
} as const;
