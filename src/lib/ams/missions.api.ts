import { createServerFn } from "@tanstack/react-start";
import { amsUserClient, throwDb } from "./server-client";
import type {
  Mission,
  MissionRule,
  MissionStatus,
  MissionType,
  QuestChain,
  QuestMode,
  QuestStage,
} from "./missions.types";

export interface MissionDraft {
  name: string;
  description?: string;
  type: MissionType;
  department?: Mission["department"];
  hidden?: boolean;
  rules?: MissionRule[];
  rewards?: Partial<Mission["rewards"]>;
  activation?: Partial<Mission["activation"]>;
  status?: MissionStatus;
}
export interface QuestDraft {
  name: string;
  description?: string;
  mode: QuestMode;
  season?: string;
  department?: QuestChain["department"];
  stages?: Omit<QuestStage, "id" | "status">[];
  finaleRewards?: Partial<QuestChain["finaleRewards"]>;
}
const input = (d: unknown) => d as any;
const dbStatus = (s: MissionStatus) =>
  s === "draft" || s === "archived" ? s : s === "active" ? "active" : "inactive";
const uiStatus = (s: string, meta: any): MissionStatus =>
  meta?.amsStatus ??
  (s === "active" ? "active" : s === "draft" ? "draft" : s === "archived" ? "archived" : "paused");
const cadence = (t: MissionType) =>
  t === "yearly" || t === "department" || t === "hidden" || t === "community" ? "seasonal" : t;
const rewards = (r: any) => ({
  xp: Number(r?.xp ?? 0),
  coins: Number(r?.coins ?? 0),
  tokens: Number(r?.tokens ?? 0),
  awardIds: r?.awardIds ?? [],
});

function mapMission(r: any): Mission {
  const c = r.conditions ?? {};
  const p = r.user_mission_progress?.[0];
  const target = Number(c.rules?.[0]?.target ?? 1);
  return {
    id: r.id,
    slug: c.slug ?? r.id,
    name: r.name,
    description: r.description ?? "",
    type: c.type ?? r.cadence,
    status: uiStatus(r.status, c),
    department: c.department,
    hidden: !!c.hidden,
    rules: c.rules ?? [],
    rewards: rewards({ ...r.rewards, xp: r.xp_reward }),
    activation: {
      repeatable: !!c.repeatable,
      startsAt: r.starts_at ?? undefined,
      endsAt: r.ends_at ?? undefined,
      cooldownHours: c.cooldownHours,
    },
    progress: { current: Number(p?.progress ?? 0), target },
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    completedAt: p?.completed_at ?? undefined,
  };
}
function mapQuest(r: any): QuestChain {
  const meta = r.stepsMeta ?? r.steps_meta ?? {};
  return {
    id: r.id,
    slug: meta.slug ?? r.id,
    name: r.name,
    description: r.description ?? "",
    mode: meta.mode ?? "story",
    season: meta.season,
    department: meta.department,
    stages: Array.isArray(r.steps) ? r.steps : [],
    finaleRewards: rewards({ ...r.rewards, xp: r.xp_reward }),
    status: uiStatus(r.status, meta),
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

const listMissionsFn = createServerFn({ method: "GET" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const { sb, user } = await amsUserClient();
    let q: any = sb
      .from("missions")
      .select("*,user_mission_progress!left(progress,completed_at,period_key)")
      .order("created_at", { ascending: false });
    const { data: rows, error } = await q;
    throwDb(error);
    let out = (rows ?? []).map(mapMission);
    const f = data ?? {};
    if (f.type) out = out.filter((m: Mission) => m.type === f.type);
    if (f.status) out = out.filter((m: Mission) => m.status === f.status);
    if (f.search) {
      const s = f.search.toLowerCase();
      out = out.filter((m: Mission) => `${m.name} ${m.description}`.toLowerCase().includes(s));
    }
    return out;
  });
const createMissionFn = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data: d }) => {
    const { sb, user } = await amsUserClient();
    const rr = rewards(d.rewards);
    const conditions = {
      slug: d.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-"),
      type: d.type,
      department: d.department,
      hidden: d.hidden,
      rules: d.rules ?? [],
      repeatable: d.activation?.repeatable,
      cooldownHours: d.activation?.cooldownHours,
      amsStatus: d.status ?? "draft",
    };
    const { data: r, error } = await sb
      .from("missions")
      .insert({
        name: d.name.trim(),
        description: d.description ?? null,
        cadence: cadence(d.type),
        conditions,
        rewards: rr,
        xp_reward: rr.xp,
        starts_at: d.activation?.startsAt ?? null,
        ends_at: d.activation?.endsAt ?? null,
        status: dbStatus(d.status ?? "draft"),
        created_by: user.id,
      })
      .select()
      .single();
    throwDb(error);
    return mapMission(r);
  });
const missionActionFn = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const { sb, user } = await amsUserClient();
    const { data: m, error } = await sb.from("missions").select("*").eq("id", data.id).single();
    throwDb(error);
    if (data.remove) {
      const x = await sb.from("missions").delete().eq("id", data.id);
      throwDb(x.error);
      return null;
    }
    if (data.status) {
      const conditions = { ...(m.conditions ?? {}), amsStatus: data.status };
      const x = await sb
        .from("missions")
        .update({ status: dbStatus(data.status), conditions })
        .eq("id", data.id)
        .select()
        .single();
      throwDb(x.error);
      return mapMission(x.data);
    }
    const target = Number(m.conditions?.rules?.[0]?.target ?? 1);
    const { data: p } = await sb
      .from("user_mission_progress")
      .select("*")
      .eq("user_id", user.id)
      .eq("mission_id", m.id)
      .eq("period_key", "current")
      .maybeSingle();
    const current = data.complete
      ? target
      : Math.min(target, Number(p?.progress ?? 0) + (data.delta ?? 1));
    const completed = current >= target ? new Date().toISOString() : null;
    const x = await sb.from("user_mission_progress").upsert(
      {
        user_id: user.id,
        mission_id: m.id,
        period_key: "current",
        progress: current,
        completed_at: completed,
      },
      { onConflict: "user_id,mission_id,period_key" },
    );
    throwDb(x.error);
    if (completed && !p?.completed_at) {
      const rr = rewards({ ...m.rewards, xp: m.xp_reward });
      const g = await sb.rpc("ams_grant_reward", {
        p_xp: rr.xp,
        p_coins: rr.coins,
        p_tokens: rr.tokens,
        p_award_ids: rr.awardIds,
        p_reason: `mission:${m.id}:current`,
      });
      throwDb(g.error);
    }
    return mapMission({
      ...m,
      user_mission_progress: [{ progress: current, completed_at: completed }],
    });
  });

const listQuestsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { sb } = await amsUserClient();
  const { data, error } = await sb
    .from("quests")
    .select("*")
    .order("created_at", { ascending: false });
  throwDb(error);
  return (data ?? []).map(mapQuest);
});
const createQuestFn = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data: d }) => {
    const { sb, user } = await amsUserClient();
    const rr = rewards(d.finaleRewards);
    const meta = {
      slug: d.name
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, "-"),
      mode: d.mode,
      season: d.season,
      department: d.department,
      amsStatus: "draft",
    };
    const stages = (d.stages ?? []).map((s: any, i: number) => ({
      ...s,
      id: crypto.randomUUID(),
      order: s.order ?? i + 1,
      status: i === 0 ? "available" : "locked",
    }));
    const { data: r, error } = await sb
      .from("quests")
      .insert({
        name: d.name.trim(),
        description: d.description ?? null,
        steps: stages,
        rewards: rr,
        xp_reward: rr.xp,
        status: "draft",
        created_by: user.id,
        steps_meta: meta,
      })
      .select()
      .single();
    throwDb(error);
    return mapQuest(r);
  });
const questActionFn = createServerFn({ method: "POST" })
  .inputValidator(input)
  .handler(async ({ data }) => {
    const { sb } = await amsUserClient();
    const { data: q, error } = await sb.from("quests").select("*").eq("id", data.questId).single();
    throwDb(error);
    if (data.removeQuest) {
      const x = await sb.from("quests").delete().eq("id", data.questId);
      throwDb(x.error);
      return null;
    }
    let stages = [...(q.steps ?? [])];
    if (data.removeStage) stages = stages.filter((s: any) => s.id !== data.stageId);
    if (data.stage) {
      const i = stages.findIndex((s: any) => s.id === data.stage.id);
      const stage = {
        id: data.stage.id ?? crypto.randomUUID(),
        order: data.stage.order ?? stages.length + 1,
        title: data.stage.title,
        description: data.stage.description ?? "",
        missionIds: data.stage.missionIds ?? [],
        dependsOn: data.stage.dependsOn ?? [],
        rewards: rewards(data.stage.rewards),
        status: data.stage.status ?? (stages.length ? "locked" : "available"),
      };
      if (i >= 0) stages[i] = { ...stages[i], ...stage };
      else stages.push(stage);
      stages.sort((a: any, b: any) => a.order - b.order);
    }
    if (data.completeStage) {
      stages = stages.map((s: any) => (s.id === data.stageId ? { ...s, status: "completed" } : s));
      const done = stages.find((s: any) => s.id === data.stageId);
      const complete = new Set(
        stages.filter((s: any) => s.status === "completed").map((s: any) => s.id),
      );
      stages = stages.map((s: any) =>
        s.status === "locked" && s.dependsOn.every((id: string) => complete.has(id))
          ? { ...s, status: "available" }
          : s,
      );
      if (done) {
        const rr = rewards(done.rewards);
        const g = await sb.rpc("ams_grant_reward", {
          p_xp: rr.xp,
          p_coins: rr.coins,
          p_tokens: rr.tokens,
          p_award_ids: rr.awardIds,
          p_reason: `quest:${q.id}:stage:${done.id}`,
        });
        throwDb(g.error);
      }
      if (stages.length && stages.every((s: any) => s.status === "completed")) {
        const rr = rewards({ ...q.rewards, xp: q.xp_reward });
        const g = await sb.rpc("ams_grant_reward", {
          p_xp: rr.xp,
          p_coins: rr.coins,
          p_tokens: rr.tokens,
          p_award_ids: rr.awardIds,
          p_reason: `quest:${q.id}:finale`,
        });
        throwDb(g.error);
      }
    }
    const allDone = stages.length > 0 && stages.every((s: any) => s.status === "completed");
    const x = await sb
      .from("quests")
      .update({
        steps: stages,
        status: allDone ? "inactive" : q.status,
        steps_meta: {
          ...(q.steps_meta ?? {}),
          amsStatus: allDone ? "completed" : (q.steps_meta?.amsStatus ?? "draft"),
        },
      })
      .eq("id", q.id)
      .select()
      .single();
    throwDb(x.error);
    return mapQuest(x.data);
  });

export const listMissions = (filters: any = {}) => listMissionsFn({ data: filters });
export const getMission = async (id: string) => (await listMissions()).find((m) => m.id === id);
export const createMission = (d: MissionDraft) => createMissionFn({ data: d });
export const updateMission = (id: string, patch: Partial<Mission>) =>
  missionActionFn({ data: { id, status: patch.status } });
export const deleteMission = (id: string) =>
  missionActionFn({ data: { id, remove: true } }).then(() => undefined);
export const setMissionStatus = (id: string, status: MissionStatus) =>
  missionActionFn({ data: { id, status } });
export const progressMission = (id: string, delta = 1) => missionActionFn({ data: { id, delta } });
export const completeMission = (id: string) => missionActionFn({ data: { id, complete: true } });
export const listQuests = () => listQuestsFn();
export const getQuest = async (id: string) => (await listQuests()).find((q) => q.id === id);
export const createQuest = (d: QuestDraft) => createQuestFn({ data: d });
export const updateQuest = (id: string, patch: Partial<QuestChain>) =>
  questActionFn({ data: { questId: id, patch } });
export const deleteQuest = (id: string) =>
  questActionFn({ data: { questId: id, removeQuest: true } }).then(() => undefined);
export const upsertStage = (
  questId: string,
  stage: Partial<QuestStage> & { id?: string; title: string },
) => questActionFn({ data: { questId, stage } });
export const removeStage = (questId: string, stageId: string) =>
  questActionFn({ data: { questId, stageId, removeStage: true } });
export const completeStage = (questId: string, stageId: string) =>
  questActionFn({ data: { questId, stageId, completeStage: true } });
export function subscribeMissions() {
  return () => {};
}
export const missionsSnapshot = () => [] as Mission[];
export const missionsServerSnapshot = () => [] as Mission[];
