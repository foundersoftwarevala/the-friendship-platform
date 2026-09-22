import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { amsUserClient, throwDb } from "./server-client";
import type {
  Award,
  AwardFilters,
  AwardRewards,
  AwardStatus,
  AwardType,
  AwardCategory,
  Department,
  PageResult,
  Rarity,
} from "./types";

type AwardRow = Record<string, any>;
const now = () => new Date().toISOString();
const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
const input = (d: unknown) => z.any().parse(d);

function mapAward(r: AwardRow): Award {
  return {
    id: r.id,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    type: r.type,
    category: r.category ?? "global",
    rarity: r.rarity ?? "common",
    department: r.department ?? undefined,
    priority: r.priority ?? 0,
    status: r.status ?? "draft",
    visibility: r.visibility ?? "public",
    media: r.media ?? {},
    unlockConditions: r.unlock_conditions ?? [],
    eligibilityRules: r.eligibility_rules ?? [],
    supportedModules: r.supported_modules ?? [],
    supportedRoles: r.supported_roles ?? [],
    rewards: {
      xp: 0,
      coins: 0,
      rankImpact: 0,
      levelImpact: 0,
      monetaryValue: 0,
      ...(r.rewards ?? {}),
    },
    versions: r.versions ?? [],
    audit: r.audit ?? [],
    usage: { earnedCount: Number(r.user_awards?.[0]?.count ?? 0) },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

async function actorName() {
  const { user } = await amsUserClient();
  return user.email ?? user.id;
}

const listAwardsFn = createServerFn({ method: "GET" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const { sb } = await amsUserClient();
    const f = (data ?? {}) as AwardFilters;
    let q: any = sb
      .from("awards")
      .select("*, user_awards(count)", { count: "exact" })
      .order("priority", { ascending: false })
      .order("created_at", { ascending: false });
    if (f.search)
      q = q.or(
        `name.ilike.%${f.search.replace(/[%_,]/g, "")}%,description.ilike.%${f.search.replace(/[%_,]/g, "")}%`,
      );
    for (const key of ["category", "type", "rarity", "status", "visibility", "department"] as const)
      if (f[key]) q = q.eq(key, f[key]);
    if (f.module) q = q.contains("supported_modules", [f.module]);
    if (f.role) q = q.contains("supported_roles", [f.role]);
    if (f.from) q = q.gte("created_at", f.from);
    if (f.to) q = q.lte("created_at", f.to);
    const { data: rows, error, count } = await q;
    throwDb(error);
    const mapped = (rows ?? [])
      .map(mapAward)
      .filter((a: Award) => !f.minXp || a.rewards.xp >= f.minXp);
    return {
      rows: mapped,
      total: f.minXp ? mapped.length : (count ?? mapped.length),
    } as PageResult<Award>;
  });

const getAwardFn = createServerFn({ method: "GET" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const { sb } = await amsUserClient();
    const { data: row, error } = await sb
      .from("awards")
      .select("*, user_awards(count)")
      .eq("id", String(data))
      .maybeSingle();
    throwDb(error);
    return row ? mapAward(row) : null;
  });

export interface AwardDraft {
  name: string;
  description?: string;
  type: AwardType;
  category: AwardCategory;
  rarity: Rarity;
  department?: Department;
  priority?: number;
  visibility?: Award["visibility"];
  rewards?: Partial<AwardRewards>;
  media?: Award["media"];
  supportedModules?: string[];
  supportedRoles?: string[];
  unlockConditions?: Award["unlockConditions"];
}

function toRow(d: Partial<Award> & AwardDraft) {
  return {
    name: d.name.trim(),
    description: d.description ?? "",
    type: d.type,
    category: d.category,
    rarity: d.rarity,
    department: d.department ?? null,
    priority: d.priority ?? 0,
    visibility: d.visibility ?? "public",
    media: d.media ?? {},
    unlock_conditions: d.unlockConditions ?? [],
    eligibility_rules: d.eligibilityRules ?? [],
    supported_modules: d.supportedModules ?? [],
    supported_roles: d.supportedRoles ?? [],
    rewards: { xp: 0, coins: 0, rankImpact: 0, levelImpact: 0, monetaryValue: 0, ...d.rewards },
  };
}

const createAwardFn = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const d = data as AwardDraft;
    if (!d.name?.trim()) throw new Error("Award name is required");
    const { sb, user } = await amsUserClient();
    const stamp = now();
    const slug = `${slugify(d.name) || "award"}-${crypto.randomUUID().slice(0, 8)}`;
    const payload = {
      ...toRow(d),
      slug,
      status: "draft",
      created_by: user.id,
      versions: [{ version: 1, createdAt: stamp, createdBy: user.email ?? user.id }],
      audit: [
        { id: crypto.randomUUID(), at: stamp, actor: user.email ?? user.id, action: "created" },
      ],
    };
    const { data: row, error } = await sb.from("awards").insert(payload).select().single();
    throwDb(error);
    return mapAward(row);
  });

const updateAwardFn = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const {
      id,
      patch,
      action = "updated",
    } = data as { id: string; patch: Partial<Award>; action?: string };
    const { sb } = await amsUserClient();
    const { data: existing, error: readError } = await sb
      .from("awards")
      .select("*")
      .eq("id", id)
      .single();
    throwDb(readError);
    const actor = await actorName();
    const stamp = now();
    const row: any = {
      updated_at: stamp,
      audit: [{ id: crypto.randomUUID(), at: stamp, actor, action }, ...(existing.audit ?? [])],
    };
    if (patch.name !== undefined) row.name = patch.name.trim();
    for (const key of [
      "description",
      "type",
      "category",
      "rarity",
      "department",
      "priority",
      "status",
      "visibility",
      "media",
      "rewards",
    ] as const)
      if (patch[key] !== undefined) row[key] = patch[key];
    if (patch.unlockConditions !== undefined) row.unlock_conditions = patch.unlockConditions;
    if (patch.eligibilityRules !== undefined) row.eligibility_rules = patch.eligibilityRules;
    if (patch.supportedModules !== undefined) row.supported_modules = patch.supportedModules;
    if (patch.supportedRoles !== undefined) row.supported_roles = patch.supportedRoles;
    const { data: saved, error } = await sb
      .from("awards")
      .update(row)
      .eq("id", id)
      .select()
      .single();
    throwDb(error);
    return mapAward(saved);
  });

const deleteAwardFn = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const { sb } = await amsUserClient();
    const { error, count } = await sb
      .from("awards")
      .delete({ count: "exact" })
      .eq("id", String(data));
    throwDb(error);
    return count ?? 0;
  });

const bulkFn = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const { ids, status, remove } = data as {
      ids: string[];
      status?: AwardStatus;
      remove?: boolean;
    };
    const { sb, user } = await amsUserClient();
    if (!ids.length) return 0;
    if (remove) {
      const { error, count } = await sb.from("awards").delete({ count: "exact" }).in("id", ids);
      throwDb(error);
      return count ?? 0;
    }
    const { data: rows, error: re } = await sb.from("awards").select("id,audit").in("id", ids);
    throwDb(re);
    let n = 0;
    for (const r of rows ?? []) {
      const stamp = now();
      const audit = [
        {
          id: crypto.randomUUID(),
          at: stamp,
          actor: user.email ?? user.id,
          action: `bulk:${status}`,
        },
        ...(r.audit ?? []),
      ];
      const { error } = await sb
        .from("awards")
        .update({ status, audit, updated_at: stamp })
        .eq("id", r.id);
      throwDb(error);
      n++;
    }
    return n;
  });

export const listAwards = (filters: AwardFilters = {}): Promise<PageResult<Award>> =>
  listAwardsFn({ data: filters }) as Promise<PageResult<Award>>;
export const getAward = (id: string): Promise<Award | null> =>
  getAwardFn({ data: id }) as Promise<Award | null>;
export const createAward = (draft: AwardDraft): Promise<Award> =>
  createAwardFn({ data: draft }) as Promise<Award>;
export const updateAward = (id: string, patch: Partial<Award>): Promise<Award> =>
  updateAwardFn({ data: { id, patch } }) as Promise<Award>;
const setStatus = (id: string, status: AwardStatus, action: string) =>
  updateAwardFn({ data: { id, patch: { status }, action } });
export const archiveAward = (id: string) => setStatus(id, "archived", "archived");
export const restoreAward = (id: string) => setStatus(id, "draft", "restored");
export const approveAward = (id: string) => setStatus(id, "approved", "approved");
export const rejectAward = (id: string) => setStatus(id, "rejected", "rejected");
export const publishAward = (id: string) => setStatus(id, "published", "published");
export const unpublishAward = (id: string) => setStatus(id, "unpublished", "unpublished");
export const disableAward = (id: string) => setStatus(id, "disabled", "disabled");
export const enableAward = (id: string) => setStatus(id, "draft", "enabled");
export const deleteAward = (id: string) => deleteAwardFn({ data: id }).then(() => undefined);
export async function cloneAward(id: string): Promise<Award> {
  const src = await getAward(id);
  if (!src) throw new Error("Award not found");
  return createAward({ ...src, name: `${src.name} (Copy)` });
}
export async function bulkUpdate(ids: string[], patch: Partial<Award>) {
  let n = 0;
  for (const id of ids) {
    await updateAward(id, patch);
    n++;
  }
  return n;
}
export const bulkDelete = (ids: string[]) => bulkFn({ data: { ids, remove: true } });
export const bulkSetStatus = (ids: string[], status: AwardStatus) =>
  bulkFn({ data: { ids, status } });
