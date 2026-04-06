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

function normalizeIdentity(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

function toLocalPart(value: string): string {
  return value.split("@")[0];
}

function getIdentityCandidates(decoded: any): string[] {
  const raw = [
    decoded?.sub,
    decoded?.email,
    decoded?.preferred_username,
    decoded?.username,
    decoded?.name,
    decoded?.userId,
    decoded?.id,
  ];

  const normalized = raw
    .map((v) => normalizeIdentity(v))
    .filter((v): v is string => Boolean(v));

  return Array.from(new Set(normalized));
}

function getMemberIdentityCandidates(member: any): string[] {
  const raw = [
    member?.id,
    member?.email,
    member?.username,
    member?.userName,
    member?.name,
    member?.user?.id,
    member?.user?.email,
    member?.user?.username,
    member?.user?.name,
  ];

  return raw
    .map((v) => normalizeIdentity(v))
    .filter((v): v is string => Boolean(v));
}

function findCurrentMember(members: any[], decoded: any): any | null {
  const tokenCandidates = getIdentityCandidates(decoded);
  if (tokenCandidates.length === 0) return null;

  const exact = members.find((member: any) => {
    const memberCandidates = getMemberIdentityCandidates(member);
    return tokenCandidates.some((tokenValue) => memberCandidates.includes(tokenValue));
  });
  if (exact) return exact;

  const relaxedTokenValues = tokenCandidates.map(toLocalPart);
  const relaxed = members.find((member: any) => {
    const memberCandidates = getMemberIdentityCandidates(member).map(toLocalPart);
    return relaxedTokenValues.some((tokenValue) => memberCandidates.includes(tokenValue));
  });

  return relaxed ?? null;
}

/**
 * Sources all information from /households/me as requested.
 * Consolidated source of truth for user profile, household members, and appliances.
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
    const token = await AsyncStorage.getItem("userToken");
    if (!token) return null;

    const decoded = decodeJwtPayload(token);
    if (!decoded) return null;

    // Use /households/me as the primary source
    const res = await apiClient.get("/households/me");
    const hData = res.data;

    if (!hData || !hData.members) return null;

    const me = findCurrentMember(hData.members, decoded);
    if (!me) {
      console.error("❌ Could not map JWT to a household member");
      return null;
    }

    return {
      userId: me.id,
      householdId: hData.id,
      name: me.name || "",
      email: me.email || "",
      allergens: me.allergens || [],
      householdData: hData,
    };
  } catch (e: any) {
    console.error("❌ Error fetching /households/me:", e?.message);
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
   * Fetch full profile from the API using consolidated /households/me endpoint
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
