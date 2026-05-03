import {
  Connection,
  PublicKey,
  Transaction,
  VersionedTransaction,
  type AccountInfo,
  type ParsedTransactionWithMeta,
  type TokenAccountsFilter,
} from "@solana/web3.js";

export class SolanaRpcClient {
  constructor(private readonly connection: Connection) {}

  async getLatestBlockhash() {
    return await this.connection.getLatestBlockhash("confirmed");
  }

  async simulateTransaction(txBase64: string, opts: { sigVerify?: boolean } = {}) {
    const buf = Buffer.from(txBase64, "base64");
    const vtx = VersionedTransaction.deserialize(buf);
    const sim = await this.connection.simulateTransaction(vtx, {
      sigVerify: opts.sigVerify ?? true,
      commitment: "confirmed",
    });
    return sim.value;
  }

  async sendRawTransaction(txBase64: string) {
    const buf = Buffer.from(txBase64, "base64");
    const vtx = VersionedTransaction.deserialize(buf);
    const sig = await this.connection.sendRawTransaction(vtx.serialize(), {
      skipPreflight: false,
      maxRetries: 2,
    });
    return sig;
  }

  async getSlot() {
    return await this.connection.getSlot("confirmed");
  }

  async getSignatureStatuses(signatures: string[]) {
    return await this.connection.getSignatureStatuses(signatures, {
      searchTransactionHistory: true,
    });
  }

  async getTransaction(signature: string): Promise<ParsedTransactionWithMeta | null> {
    return await this.connection.getParsedTransaction(signature, {
      maxSupportedTransactionVersion: 0,
      commitment: "confirmed",
    });
  }

  async getTokenAccountsByOwner(owner: string, filter?: TokenAccountsFilter) {
    const res = await this.connection.getParsedTokenAccountsByOwner(
      new PublicKey(owner),
      filter ?? { programId: new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA") },
    );
    return res.value;
  }

  async getAccountInfo(pubkey: string): Promise<AccountInfo<Buffer> | null> {
    return await this.connection.getAccountInfo(new PublicKey(pubkey));
  }

  getConnection() {
    return this.connection;
  }
}

export { Transaction, VersionedTransaction, PublicKey };
