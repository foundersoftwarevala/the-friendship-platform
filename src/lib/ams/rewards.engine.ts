import { createServerFn } from "@tanstack/react-start";
import { amsUserClient, throwDb } from "./server-client";

export interface RewardPayload {
  xp?: number;
  coins?: number;
  tokens?: number;
  awardIds?: string[];
  reason?: string;
  actor?: string;
}
export interface LedgerEntry extends Required<Omit<RewardPayload, "awardIds">> {
  id: string;
  at: string;
  awardIds: string[];
}
export interface WalletState {
  xp: number;
  coins: number;
  tokens: number;
  unlockedAwardIds: Set<string>;
  ledger: LedgerEntry[];
}

const grantFn = createServerFn({ method: "POST" })
  .inputValidator((d: RewardPayload) => d)
  .handler(async ({ data }) => {
    const { sb } = await amsUserClient();
    const { data: result, error } = await sb.rpc("ams_grant_reward", {
      p_xp: Math.max(0, data.xp ?? 0),
      p_coins: Math.max(0, data.coins ?? 0),
      p_tokens: Math.max(0, data.tokens ?? 0),
      p_award_ids: data.awardIds ?? [],
      p_reason: data.reason ?? "manual",
    });
    throwDb(error);
    return result as unknown as LedgerEntry;
  });

const walletFn = createServerFn({ method: "GET" }).handler(async () => {
  const { sb, user } = await amsUserClient();
  const [xp, wallets, awards, ledger] = await Promise.all([
    sb.from("user_xp").select("total_xp").eq("user_id", user.id).maybeSingle(),
    sb.from("reward_wallets").select("kind,balance").eq("user_id", user.id),
    sb.from("user_awards").select("award_id").eq("user_id", user.id),
    sb
      .from("ams_award_ledger")
      .select("id,created_at,asset_slug,reason")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const balances = Object.fromEntries(
    (wallets.data ?? []).map((r: any) => [r.kind, Number(r.balance)]),
  );
  return {
    xp: Number(xp.data?.total_xp ?? 0),
    coins: balances.coins ?? 0,
    tokens: balances.tokens ?? 0,
    unlockedAwardIds: (awards.data ?? []).map((r: any) => r.award_id),
    ledger: ledger.data ?? [],
  };
});

export const grant = (payload: RewardPayload) => grantFn({ data: payload });
export async function getWallet(): Promise<WalletState> {
  const r = await walletFn();
  return {
    ...r,
    unlockedAwardIds: new Set(r.unlockedAwardIds),
    ledger: r.ledger as unknown as LedgerEntry[],
  };
}
export function subscribe() {
  return () => {};
}
export function resetWallet() {
  throw new Error("Persistent reward balances cannot be reset from the browser");
}
