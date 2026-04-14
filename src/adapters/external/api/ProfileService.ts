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
};

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
          .map((a: string) => APPLIANCE_TO_TOOL[a.toUpperCase()])
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
    if (!user?.householdId) return;

    const applianceKey = Object.entries(APPLIANCE_TO_TOOL).find(
      ([, v]) => v === tool,
    )?.[0];
    if (!applianceKey) return;

    try {
      // Check if already present in household data from the consolidated response
      const existing = user.householdData?.appliances?.includes(applianceKey);

      if (existing) {
        // Find existing record to get its ID (we might still need a secondary call for deletion if ID is required)
        // For simplicity, we fallback to a fetch if we don't have IDs for devices.
        const appliancesRes = await apiClient.get(`/households/${user.householdId}/appliances`);
        const item = appliancesRes.data.find((a: any) => a.appliance === applianceKey);
        if (item) {
          await apiClient.delete(`/households/appliances/${item.id}`);
        }
      } else {
        // Add
        await apiClient.post(
          `/households/${user.householdId}/appliances?appliance=${applianceKey}`,
        );
      }
    } catch (e) {
      console.error("Error toggling tool:", e);
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

      if (exists) {
        // Remove
        await apiClient.delete(`/users/${user.userId}/allergens/${exists.id}`);
      } else {
        // Find allergen ID from all allergens
        const allRes = await apiClient.get("/allergens");
        const allergen = allRes.data.find(
          (a: any) => a.name?.toUpperCase() === allergenName.toUpperCase(),
        );
        if (allergen) {
          await apiClient.post(
            `/users/${user.userId}/allergens/${allergen.id}`,
          );
        }
      }
    } catch (e) {
      console.error("Error toggling allergen:", e);
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

      await apiClient.post(`/users/${user.userId}/allergens/${allergen.id}`);
    } catch (e) {
      console.error("Error adding custom allergen:", e);
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
