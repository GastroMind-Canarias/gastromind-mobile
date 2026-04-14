// types.ts
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Recipe } from '../../../core/domain/recipe.types';

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

export type AuthNavigationProp = NativeStackNavigationProp<AuthStackParamList>;

export type AppStackParamList = {
  Tabs: undefined;
  RecipeDetail: { recipe: Recipe };
  AIChat: undefined;
};

export type AppNavigationProp = NativeStackNavigationProp<AppStackParamList>;
