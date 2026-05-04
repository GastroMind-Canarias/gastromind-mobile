import {
  Allergen,
  KitchenTool,
  UserProfile,
} from "../../../core/domain/profile.types";
import { apiClient } from "./apiClient";
import { favoriteService } from "./FavoriteService";

function pickText(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }
  return "";
}

/**
 * User identity comes from /users/me.
 * Household context comes from /households/me.
 */
async function getCurrentUser(): Promise<{
  userId: string;
  householdId: string;
  name: string;
  email: string;
  allergens?: any[];
  householdData?: any;
} | null> {
  try {
    const userRes = await apiClient.get("/users/me");
    const me = userRes.data;
    if (!me) {
      console.error("Error fetching /users/me: empty payload");
      return null;
    }

    let householdData: any = null;
    try {
      const householdRes = await apiClient.get("/households/me");
      householdData = householdRes.data;
    } catch (householdError: any) {
      console.error("Error fetching /households/me:", householdError?.message);
    }

    const userAllergens =
      me.allergens || me.userAllergens || me.allergyProfiles || [];

    favoriteService.syncMineOfflineCache();

    return {
      userId: pickText(me.id, me.userId, me.user_id),
      householdId: pickText(me.householdId, me.household_id, householdData?.id),
      name: pickText(me.name, me.username, me.userName),
      email: pickText(me.email),
      allergens: userAllergens,
      householdData,
    };
  } catch (e: any) {
    console.error("Error fetching /users/me:", e?.message);
    return null;
  }
}

const APPLIANCE_TO_TOOL: Record<string, KitchenTool> = {
  HORNO: KitchenTool.HORNO,
  MICROONDAS: KitchenTool.MICROONDAS,
  AIR_FRYER: KitchenTool.AIR_FRYER,
  VITROCERAMICA: KitchenTool.VITROCERAMICA,
  ROBOT_COCINA: KitchenTool.ROBOT_COCINA,
  BATIDORA: KitchenTool.BATIDORA,
  SARTEN: KitchenTool.SARTEN,
  SARTÉN: KitchenTool.SARTEN,
  OLLA_EXPRESS: KitchenTool.SARTEN,
};

const TOOL_TO_APPLIANCE: Record<KitchenTool, string> = Object.entries(
  APPLIANCE_TO_TOOL,
).reduce(
  (acc, [appliance, tool]) => {
    acc[tool] = appliance;
    return acc;
  },
  {} as Record<KitchenTool, string>,
);

const ALLERGEN_NAME_TO_ENUM: Record<string, Allergen> = {
  GLUTEN: Allergen.GLUTEN,
  LACTOSA: Allergen.LACTOSA,
  FRUTOS_SECOS: Allergen.FRUTOS_SECOS,
  HUEVO: Allergen.HUEVO,
  MARISCO: Allergen.MARISCO,
  PESCADO: Allergen.PESCADO,
  SOJA: Allergen.SOJA,
};

export interface BackendAllergen {
  id: string;
  name: string;
}

function unique(values: string[]): string[] {
  return [...new Set(values.filter((value) => value.trim().length > 0))];
}

function extractAllergenIds(allergens?: any[]): string[] {
  if (!Array.isArray(allergens)) return [];
  return unique(
    allergens
      .map((item) =>
        pickText(
          typeof item === "string" ? item : "",
          item?.id,
          item?.allergenId,
          item?.allergen_id,
        ),
      )
      .map((id) => id.trim()),
  );
}

type RequestMethod = "post" | "put" | "patch";

async function requestWithFallback(
  attempts: Array<{ method: RequestMethod; url: string; data: any }>,
): Promise<void> {
  let lastError: any = null;

  for (const attempt of attempts) {
    try {
      await apiClient.request({
        method: attempt.method,
        url: attempt.url,
        data: attempt.data,
      });
      return;
    } catch (error: any) {
      lastError = error;
      const status = error?.response?.status;
      if (status !== 403 && status !== 404 && status !== 405) {
        break;
      }
    }
  }

  throw lastError;
}

function logApiError(context: string, error: any): void {
  console.error(context, {
    status: error?.response?.status,
    url: error?.config?.url,
    method: error?.config?.method,
    data: error?.response?.data,
    message: error?.message,
  });
}

async function updateMyAllergensBatch(allergenIds: string[]): Promise<void> {
  const ids = unique(allergenIds);
  const endpoint = "/users/me/allergens";
  console.log("[ProfileDebug][UpdateAllergensBatch][Request]", {
    endpoint,
    allergenIdsCount: ids.length,
    allergenIds: ids,
  });

  await apiClient.put(endpoint, {
    allergenIds: ids,
  });

  console.log("[ProfileDebug][UpdateAllergensBatch][Success]", {
    endpoint,
    allergenIdsCount: ids.length,
  });
}

async function updateMyAppliancesBatch(applianceTypes: string[]): Promise<void> {
  const types = unique(
    applianceTypes.map((item) => {
      const normalized = item.toUpperCase();
      return normalized === "SARTEN" || normalized === "SARTÉN"
        ? "OLLA_EXPRESS"
        : normalized;
    }),
  );
  const payload = { appliances: types };
  const attempts: Array<{ method: RequestMethod; url: string; data: any }> = [
    { method: "post", url: "/households/me/appliances/batch", data: payload },
    { method: "put", url: "/households/me/appliances/batch", data: payload },
    { method: "patch", url: "/households/me/appliances/batch", data: payload },
  ];

  await requestWithFallback(attempts);
}

// ═══════════════════════════════════════════════════════════════════════════════
export const profileService = {
  /**
   * Fetch full profile from /users/me + /households/me
   */
  get: async (): Promise<UserProfile> => {
    const empty: UserProfile = {
      id: "",
      householdId: "",
      name: "",
      email: "",
      kitchenTools: [],
      householdMembers: [],
      allergens: [],
      customAllergens: [],
    };

    try {
      const data = await getCurrentUser();
      if (!data) return empty;

      const profile: UserProfile = {
        id: data.userId,
        householdId: data.householdId,
        name: data.name,
        email: data.email,
        kitchenTools: [],
        householdMembers: [],
        allergens: [],
        customAllergens: [],
      };

      // Extract household members
      if (data.householdData?.members) {
        profile.householdMembers = data.householdData.members.map((m: any) => ({
          id: m.id,
          name: m.name,
        }));
      }

      // Extract household appliances
      if (data.householdData?.appliances) {
        profile.kitchenTools = data.householdData.appliances
          .map((a: any) =>
            APPLIANCE_TO_TOOL[
              pickText(
                typeof a === "string" ? a : "",
                a?.appliance,
                a?.name,
                a?.type,
              ).toUpperCase()
            ],
          )
          .filter(Boolean);
      }

      // User allergens (found within the member object)
      const backendAllergens: BackendAllergen[] = data.allergens || [];
      for (const ba of backendAllergens) {
        const enumVal = ALLERGEN_NAME_TO_ENUM[ba.name?.toUpperCase()];
        if (enumVal) {
          profile.allergens.push(enumVal);
        } else {
          profile.customAllergens.push(ba.name);
        }
      }

      return profile;
    } catch (e) {
      console.error("Error fetching consolidated profile:", e);
      return empty;
    }
  },

  /**
   * Get all available allergens from the backend
   */
  getAllAllergens: async (): Promise<BackendAllergen[]> => {
    try {
      const res = await apiClient.get("/allergens");
      return res.data;
    } catch (e) {
      console.error("Error fetching all allergens:", e);
      return [];
    }
  },

  /**
   * Toggle an appliance on the household
   */
  toggleTool: async (tool: KitchenTool): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) return;

    const applianceKey = TOOL_TO_APPLIANCE[tool];
    if (!applianceKey) return;

    try {
      const currentAppliances = unique(
        (user.householdData?.appliances || [])
          .map((appliance: any) =>
            pickText(
              typeof appliance === "string" ? appliance : "",
              appliance?.appliance,
              appliance?.name,
              appliance?.type,
            ).toUpperCase(),
          )
          .filter(Boolean),
      );

      const updatedAppliances = currentAppliances.includes(applianceKey)
        ? currentAppliances.filter((item) => item !== applianceKey)
        : [...currentAppliances, applianceKey];

      await updateMyAppliancesBatch(updatedAppliances);
    } catch (e) {
      logApiError("Error toggling tool", e);
    }
  },

  /**
   * Toggle an allergen on the user
   */
  toggleAllergen: async (allergenName: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      const exists = user.allergens?.find(
        (a: any) => a.name?.toUpperCase() === allergenName.toUpperCase(),
      );

      const existingIds = extractAllergenIds(user.allergens);
      let allergenId = pickText(exists?.id, exists?.allergenId, exists?.allergen_id);

      if (!allergenId) {
        const allRes = await apiClient.get("/allergens");
        const allergen = allRes.data.find(
          (a: any) => a.name?.toUpperCase() === allergenName.toUpperCase(),
        );
        allergenId = pickText(allergen?.id, allergen?.allergenId, allergen?.allergen_id);
      }

      if (!allergenId) return;

      const updatedIds = existingIds.includes(allergenId)
        ? existingIds.filter((id) => id !== allergenId)
        : [...existingIds, allergenId];

      await updateMyAllergensBatch(updatedIds);
    } catch (e) {
      logApiError("Error toggling allergen", e);
    }
  },

  /**
   * Update user allergens in batch
   */
  updateAllergensBatch: async (allergenIds: string[]): Promise<void> => {
    try {
      await updateMyAllergensBatch(allergenIds);
    } catch (e) {
      logApiError("Error updating allergens batch", e);
      throw e;
    }
  },

  /**
   * Update household appliances in batch
   */
  updateAppliancesBatch: async (applianceTypes: string[]): Promise<void> => {
    try {
      await updateMyAppliancesBatch(applianceTypes);
    } catch (e) {
      logApiError("Error updating appliances batch", e);
      throw e;
    }
  },

  /**
   * Add a custom allergen
   */
  addCustomAllergen: async (allergenName: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      const allRes = await apiClient.get("/allergens");
      let allergen = allRes.data.find(
        (a: any) => a.name?.toLowerCase() === allergenName.toLowerCase(),
      );

      if (!allergen) {
        const created = await apiClient.post("/allergens", {
          name: allergenName,
        });
        allergen = created.data;
      }

      const existingIds = extractAllergenIds(user.allergens);
      const allergenId = pickText(allergen?.id, allergen?.allergenId, allergen?.allergen_id);
      if (!allergenId) return;

      await updateMyAllergensBatch([...existingIds, allergenId]);
    } catch (e) {
      logApiError("Error adding custom allergen", e);
    }
  },

  /**
   * Remove custom allergen from user
   */
  toggleCustomAllergen: async (allergenName: string): Promise<void> => {
    await profileService.toggleAllergen(allergenName);
  },

  getHouseholdId: async (): Promise<string | null> => {
    const user = await getCurrentUser();
    return user?.householdId ?? null;
  },

  getUserId: async (): Promise<string | null> => {
    const user = await getCurrentUser();
    return user?.userId ?? null;
  },

  addMember: async (_name: string): Promise<void> => {
    console.warn("addMember: Use household invite flow instead");
  },

  /**
   * Remove a member from the household
   */
  removeMember: async (memberId: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      await apiClient.delete(`/households/me/members/${memberId}`);
    } catch (e) {
      console.error("Error removing member:", e);
      throw e;
    }
  },

  /**
   * Update the user name
   */
  updateName: async (name: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      await apiClient.patch(
        `/users/${user.userId}/profile?name=${encodeURIComponent(name)}`,
      );
    } catch (e) {
      console.error("Error updating name:", e);
    }
  },
};
