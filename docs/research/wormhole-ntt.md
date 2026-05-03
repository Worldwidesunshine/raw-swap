# Wormhole NTT research (Waves 10–13)

## Chain IDs (reference)

- Solana = 1  
- Ethereum = 2  
- BSC = 4  
- Polygon = 5  
- Avalanche = 6  
- Arbitrum = 23  
- Optimism = 24  
- Base = 30  

## Topology

- **Solana hub**: locking mode (canonical supply).
- **EVM spokes**: burning mode (mint/burn on transfer).

## CLI sketch

```bash
ntt init Mainnet
ntt add-chain Solana --latest --mode locking --token <RAWSWAP_MINT>
# ... register peers per chain ...
```

## `deployment.json`

Track rate limits, inbound/outbound caps, and manager addresses per chain. Regenerate after `ntt add-chain` / peer steps.

## Next steps

1. Install Wormhole NTT CLI in CI image.
2. Store deployment artifact under `contracts/solana/ntt/deployment.json` when that tree exists (not in this repo yet; only `contracts/evm/` is present today).
3. Add verification script comparing on-chain config to deployment.json.
