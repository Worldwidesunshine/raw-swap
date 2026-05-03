/** Total protocol take on swap input (basis points). */
export const PROTOCOL_FEE_BPS = 16;
/** Portion of input → fee vault / buyback → permanent RAWSWAP/SOL LP (bps). */
export const BUYBACK_FEE_BPS = 12;
/** Portion of input → treasury (bps). */
export const TREASURY_FEE_BPS = 4;

export const PROTOCOL_FEE_COMPONENT_SUM = BUYBACK_FEE_BPS + TREASURY_FEE_BPS;
