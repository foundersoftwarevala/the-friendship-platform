import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const unlockTrophy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: {
    trophySlug: string;
    trophyName: string;
    achievementSlug: string;
    achievementName: string;
    xpReward?: number;
  }) => data)
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("unlock_trophy", {
      _trophy_slug: data.trophySlug,
      _trophy_name: data.trophyName,
      _achievement_slug: data.achievementSlug,
      _achievement_name: data.achievementName,
      _xp_reward: data.xpReward ?? 100,
    });

    if (error) throw new Error(error.message);
    return result as {
      newly_unlocked: boolean;
      xp_awarded: number;
      total_xp: number;
      level_number: number;
      level_name: string;
      rank_number: number;
      rank_name: string;
      trophy_slug: string;
      achievement_slug: string;
    };
  });