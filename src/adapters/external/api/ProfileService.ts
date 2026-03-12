import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Allergen,
  KitchenTool,
  UserProfile,
} from "../../../core/domain/profile.types";
import { apiClient } from "./apiClient";

function decodeJwtPayload(token: string): any {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join(""),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

let cachedUserId: string | null = null;
let cachedHouseholdId: string | null = null;

async function getCurrentUser(): Promise<{
  userId: string;
  householdId: string;
  name: string;
  email: string;
} | null> {
  try {
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return null;

    const payload = decodeJwtPayload(token);
    if (!payload?.sub) return null;

    const username = payload.sub;

    // Find user by username
    const usersRes = await apiClient.get("/users");
    const me = usersRes.data.find(
      (u: any) => u.name?.toLowerCase() === username.toLowerCase(),
    );

    if (!me) return null;

    cachedUserId = me.id;
    cachedHouseholdId = me.houseHold_id ?? null;

    return {
      userId: me.id,
      householdId: me.houseHold_id ?? "",
      name: me.name ?? username,
      email: me.email ?? "",
    };
  } catch (e) {
    console.error("Error getting current user:", e);
    return null;
  }
}

const ALLERGEN_EMOJIS: Record<string, string> = {
  GLUTEN: "🌾",
  LACTOSA: "🥛",
  FRUTOS_SECOS: "🥜",
  HUEVO: "🥚",
  MARISCO: "🦐",
  PESCADO: "🐟",
  SOJA: "🫘",
  CACAHUETE: "🥜",
  APIO: "🥬",
  MOSTAZA: "🟡",
  SESAMO: "🫘",
  ALTRAMUZ: "🌿",
  MOLUSCOS: "🐚",
  SULFITOS: "🍷",
};

const APPLIANCE_TO_TOOL: Record<string, KitchenTool> = {
  HORNO: KitchenTool.HORNO,
  MICROONDAS: KitchenTool.MICROONDAS,
  AIR_FRYER: KitchenTool.AIR_FRYER,
  VITROCERAMICA: KitchenTool.VITROCERAMICA,
  ROBOT_COCINA: KitchenTool.ROBOT_COCINA,
  BATIDORA: KitchenTool.BATIDORA,
  SARTEN: KitchenTool.SARTEN,
};

// ─── Backend allergen name → frontend Allergen enum mapping ──────────────────
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
   * Fetch full profile from the API
   */
  get: async (): Promise<UserProfile> => {
    const empty: UserProfile = {
      id: "",
      name: "",
      email: "",
      kitchenTools: [],
      householdMembers: [],
      allergens: [],
      customAllergens: [],
    };

    try {
      const user = await getCurrentUser();
      if (!user) return empty;

      const profile: UserProfile = {
        id: user.userId,
        name: user.name,
        email: user.email,
        kitchenTools: [],
        householdMembers: [],
        allergens: [],
        customAllergens: [],
      };

      // Fetch household members & appliances
      if (user.householdId) {
        try {
          const membersRes = await apiClient.get(
            `/households/${user.householdId}/members`,
          );
          profile.householdMembers = membersRes.data.map((m: any) => ({
            id: m.id,
            name: m.name,
          }));
        } catch (e) {
          console.warn("Error fetching household members:", e);
        }

        try {
          const appliancesRes = await apiClient.get(
            `/households/${user.householdId}/appliances`,
          );
          profile.kitchenTools = appliancesRes.data
            .map((a: any) => APPLIANCE_TO_TOOL[a.appliance])
            .filter(Boolean);
        } catch (e) {
          console.warn("Error fetching appliances:", e);
        }
      }

      // Fetch user allergens
      try {
        const allergensRes = await apiClient.get(
          `/users/${user.userId}/allergens`,
        );
        const backendAllergens: BackendAllergen[] = allergensRes.data;

        for (const ba of backendAllergens) {
          const enumVal = ALLERGEN_NAME_TO_ENUM[ba.name?.toUpperCase()];
          if (enumVal) {
            profile.allergens.push(enumVal);
          } else {
            profile.customAllergens.push(ba.name);
          }
        }
      } catch (e) {
        console.warn("Error fetching user allergens:", e);
      }

      return profile;
    } catch (e) {
      console.error("Error fetching profile:", e);
      return empty;
    }
  },

  /**
   * Get all available allergens from the backend (for the full list)
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
      // Check if already present
      const appliancesRes = await apiClient.get(
        `/households/${user.householdId}/appliances`,
      );
      const existing = appliancesRes.data.find(
        (a: any) => a.appliance === applianceKey,
      );

      if (existing) {
        // Remove
        await apiClient.delete(`/households/appliances/${existing.id}`);
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
      // Get user allergens
      const myAllergensRes = await apiClient.get(
        `/users/${user.userId}/allergens`,
      );
      const myAllergens: BackendAllergen[] = myAllergensRes.data;
      const exists = myAllergens.find(
        (a) => a.name?.toUpperCase() === allergenName.toUpperCase(),
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
   * Add a custom allergen (creates in backend then adds to user)
   */
  addCustomAllergen: async (allergenName: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user) return;

    try {
      // Check if allergen already exists in the system
      const allRes = await apiClient.get("/allergens");
      let allergen = allRes.data.find(
        (a: any) => a.name?.toLowerCase() === allergenName.toLowerCase(),
      );

      if (!allergen) {
        // Create the allergen
        const created = await apiClient.post("/allergens", {
          name: allergenName,
        });
        allergen = created.data;
      }

      // Add to user
      await apiClient.post(`/users/${user.userId}/allergens/${allergen.id}`);
    } catch (e) {
      console.error("Error adding custom allergen:", e);
    }
  },

  /**
   * Remove custom allergen from user
   */
  toggleCustomAllergen: async (allergenName: string): Promise<void> => {
    // Same as toggleAllergen since custom allergens are stored the same way
    await profileService.toggleAllergen(allergenName);
  },

  /**
   * Get household ID for the current user
   */
  getHouseholdId: async (): Promise<string | null> => {
    const user = await getCurrentUser();
    return user?.householdId ?? null;
  },

  /**
   * Get user ID for the current user
   */
  getUserId: async (): Promise<string | null> => {
    const user = await getCurrentUser();
    return user?.userId ?? null;
  },

  /**
   * Not used in current API - members are managed via household endpoints
   */
  addMember: async (_name: string): Promise<void> => {
    // The backend doesn't support creating users by name directly.
    // Members are invited via token. This is a placeholder.
    console.warn("addMember: Use household invite flow instead");
  },

  /**
   * Remove a member from the household
   */
  removeMember: async (memberId: string): Promise<void> => {
    const user = await getCurrentUser();
    if (!user?.householdId) return;

    try {
      await apiClient.delete(
        `/households/${user.householdId}/members/${memberId}?ownerId=${user.userId}`,
      );
    } catch (e) {
      console.error("Error removing member:", e);
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
