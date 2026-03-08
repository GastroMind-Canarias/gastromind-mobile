import { KitchenTool, UserProfile, Allergen } from '../../../core/domain/profile.types';

let profile: UserProfile = {
    id: 'user-1',
    name: 'Chef David',
    email: 'david@gastromind.app',
    kitchenTools: [KitchenTool.HORNO, KitchenTool.SARTEN, KitchenTool.MICROONDAS],
    householdMembers: [
        { id: 'm1', name: 'David' },
        { id: 'm2', name: 'Laura' },
    ],
    allergens: [],
    customAllergens: [],
};

export const profileService = {
    get: (): UserProfile => ({ ...profile, kitchenTools: [...profile.kitchenTools], householdMembers: [...profile.householdMembers], allergens: [...profile.allergens], customAllergens: [...profile.customAllergens] }),

    toggleTool: (tool: KitchenTool): void => {
        const has = profile.kitchenTools.includes(tool);
        profile = {
            ...profile,
            kitchenTools: has
                ? profile.kitchenTools.filter(t => t !== tool)
                : [...profile.kitchenTools, tool],
        };
    },

    toggleAllergen: (allergen: Allergen): void => {
        const has = profile.allergens.includes(allergen);
        profile = {
            ...profile,
            allergens: has
                ? profile.allergens.filter(a => a !== allergen)
                : [...profile.allergens, allergen],
        };
    },

    toggleCustomAllergen: (allergen: string): void => {
        const has = profile.customAllergens.includes(allergen);
        profile = {
            ...profile,
            customAllergens: has
                ? profile.customAllergens.filter(a => a !== allergen)
                : [...profile.customAllergens, allergen],
        };
    },
    
    addCustomAllergen: (allergen: string): void => {
        if (!profile.customAllergens.includes(allergen)) {
            profile = {
                ...profile,
                customAllergens: [...profile.customAllergens, allergen],
            };
        }
    },

    addMember: (name: string): void => {
        profile = {
            ...profile,
            householdMembers: [
                ...profile.householdMembers,
                { id: Math.random().toString(36).substring(7), name },
            ],
        };
    },

    removeMember: (id: string): void => {
        profile = {
            ...profile,
            householdMembers: profile.householdMembers.filter(m => m.id !== id),
        };
    },

    updateName: (name: string): void => {
        profile = { ...profile, name };
    },
};
