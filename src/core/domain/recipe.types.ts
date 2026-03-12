export interface Recipe {
  id: string;
  title: string;
  instructions: string;
  servings: number;
  prep_time: number; // in minutos
  appliance_needed: string;
  difficulty: "Fácil" | "Media" | "Difícil" | string;
  description: string;
  calories: number;
  image_url: string;
  created_at: string;
}
