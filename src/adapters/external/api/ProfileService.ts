import { KitchenTool, UserProfile } from '../../../core/domain/profile.types';

let profile: UserProfile = {
    id: 'user-1',
    name: 'Chef David',
    email: 'david@gastromind.app',
    kitchenTools: [KitchenTool.HORNO, KitchenTool.SARTEN, KitchenTool.MICROONDAS],
    householdMembers: [
        { id: 'm1', name: 'David' },
        { id: 'm2', name: 'Laura' },
    ],
};

export const profileService = {
    get: (): UserProfile => ({ ...profile, kitchenTools: [...profile.kitchenTools], householdMembers: [...profile.householdMembers] }),

    toggleTool: (tool: KitchenTool): void => {
        const has = profile.kitchenTools.includes(tool);
        profile = {
            ...profile,
            kitchenTools: has
                ? profile.kitchenTools.filter(t => t !== tool)
                : [...profile.kitchenTools, tool],
        };
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
