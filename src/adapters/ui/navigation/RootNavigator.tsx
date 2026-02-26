import React, { useEffect, useState } from 'react';
import { setupInterceptors } from '../../external/api/authInterceptor';
import { AuthContext } from './AuthContext';
import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';

export const RootNavigator = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const authContext = {
    login: () => setIsLoggedIn(true),
    logout: () => setIsLoggedIn(false),
  };

  useEffect(() => {
    setupInterceptors(authContext.logout);
  }, []);

  return (
    <AuthContext.Provider value={authContext}>
      {isLoggedIn ? <MainNavigator /> : <AuthNavigator />}
    </AuthContext.Provider>
  );
};