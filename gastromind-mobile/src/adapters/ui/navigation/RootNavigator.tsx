import React, { useState } from 'react';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { AuthContext } from './AuthContext'; // <--- Importa desde el nuevo archivo

export const RootNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const authContext = {
    login: () => setIsLoggedIn(true),
    logout: () => setIsLoggedIn(false),
  };

  return (
    <AuthContext.Provider value={authContext}>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </AuthContext.Provider>
  );
};