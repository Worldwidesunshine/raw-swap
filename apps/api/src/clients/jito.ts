import { request } from "undici";
import {
  JITO_TIP_ACCOUNTS,
  type BundleStatus,
  type InflightBundleStatus,
} from "@rawswap/shared";

const UPSTREAM_TIMEOUT_MS = 30_000;

type RedisLike = {
  get(key: string): Promise<string | null>;
  setex(key: string, seconds: number, value: string): Promise<void>;
};

export class JitoJsonRpcClient {
  constructor(
    private readonly baseUrl: string,
    private readonly redis?: RedisLike,
  ) {}

  private async rpc<T>(
    path: string,
    method: string,
    params: unknown[],
    query = "",
  ): Promise<{ result: T; headers: Record<string, string | string[] | undefined> }> {
    const url = `${this.baseUrl}${path}${query}`;
    const body = JSON.stringify({ jsonrpc: "2.0", id: 1, method, params });
    const res = await request(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body,
      headersTimeout: UPSTREAM_TIMEOUT_MS,
      bodyTimeout: UPSTREAM_TIMEOUT_MS,
    });
    const text = await res.body.text();
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`Jito HTTP ${res.statusCode}: ${text.slice(0, 500)}`);
    }
    let json: unknown;
    try {
      json = JSON.parse(text) as unknown;
    } catch {
      throw new Error(`Jito invalid JSON: ${text.slice(0, 200)}`);
    }
    if (typeof json !== "object" || json === null) {
      throw new Error("Jito empty response body");
    }
    const bodyJson = json as { result?: T; error?: { message?: string } };
    if (bodyJson.error) {
      throw new Error(bodyJson.error.message ?? "Jito JSON-RPC error");
    }
    if (bodyJson.result === undefined) {
      throw new Error("Jito missing result in JSON-RPC response");
    }
    return {
      result: bodyJson.result as T,
      headers: res.headers,
    };
  }

  async getTipAccounts(): Promise<string[]> {
    const knownAccounts = new Set(JITO_TIP_ACCOUNTS);
    const cacheKey = "jito:tipAccounts";
    if (this.redis) {
      const hit = await this.redis.get(cacheKey);
      if (hit) {
        try {
          const parsed = JSON.parse(hit) as unknown;
          if (Array.isArray(parsed) && parsed.every((x) => typeof x === "string" && x.length > 0)) {
            const accounts = parsed.filter((x): x is string => typeof x === "string");
            if (accounts.length > 0 && accounts.every((account) => knownAccounts.has(account))) {
              return accounts;
            }
          }
        } catch {
          /* invalid cache — fetch fresh */
        }
      }
    }
    const { result: accounts } = await this.rpc<string[]>("/api/v1/bundles", "getTipAccounts", []);
    if (!Array.isArray(accounts) || accounts.length === 0) {
      throw new Error("Jito returned no tip accounts");
    }
    if (!accounts.every((account) => knownAccounts.has(account))) {
      throw new Error("Jito returned an unexpected tip account set");
    }
    if (this.redis) {
      await this.redis.setex(cacheKey, 300, JSON.stringify(accounts));
    }
    return accounts;
  }

  async getRandomTipAccount(): Promise<string> {
    const acc = await this.getTipAccounts();
    return acc[Math.floor(Math.random() * acc.length)]!;
  }

  async sendTransaction(
    txBase64: string,
    opts: { bundleOnly?: boolean; encoding?: "base64" } = {},
  ): Promise<{ signature: string; bundleId: string | null }> {
    const q = opts.bundleOnly ? "?bundleOnly=true" : "";
    const { result: signature, headers } = await this.rpc<string>(
      `/api/v1/transactions`,
      "sendTransaction",
      [txBase64, { encoding: opts.encoding ?? "base64" }],
      q,
    );
    const bundleIdHeader = headers["x-bundle-id"];
    return {
      signature,
      bundleId: Array.isArray(bundleIdHeader) ? bundleIdHeader[0] ?? null : bundleIdHeader ?? null,
    };
  }

  async sendBundle(txsBase64: string[]): Promise<string> {
    const { result } = await this.rpc<string>(`/api/v1/bundles`, "sendBundle", [txsBase64]);
    return result;
  }

  async getBundleStatuses(ids: string[]): Promise<BundleStatus[]> {
    const { result } = await this.rpc<BundleStatus[]>(`/api/v1/bundles`, "getBundleStatuses", [ids]);
    return result;
  }

  async getInflightBundleStatuses(ids: string[]): Promise<InflightBundleStatus[]> {
    const { result } = await this.rpc<InflightBundleStatus[]>(
      `/api/v1/bundles`,
      "getInflightBundleStatuses",
      [ids],
    );
    return result;
  }
}
