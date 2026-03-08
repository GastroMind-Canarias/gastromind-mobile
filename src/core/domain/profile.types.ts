export enum KitchenTool {
    HORNO = 'HORNO',
    MICROONDAS = 'MICROONDAS',
    AIR_FRYER = 'AIR_FRYER',
    VITROCERAMICA = 'VITROCERAMICA',
    ROBOT_COCINA = 'ROBOT_COCINA',
    BATIDORA = 'BATIDORA',
    SARTEN = 'SARTEN',
}

export interface HouseholdMember {
    id: string;
    name: string;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    kitchenTools: KitchenTool[];
    householdMembers: HouseholdMember[];
}
