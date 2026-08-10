export const setAuthData = (token, user) => {
  localStorage.setItem('rgt_token', token);
  localStorage.setItem('rgt_user', JSON.stringify(user));
};

export const getAuthToken = () => {
  return localStorage.getItem('rgt_token');
};

export const getAuthUser = () => {
  const user = localStorage.getItem('rgt_user');
  return user ? JSON.parse(user) : null;
};

export const clearAuthData = () => {
  localStorage.removeItem('rgt_token');
  localStorage.removeItem('rgt_user');
};

export const isAuthenticated = () => {
  return !!getAuthToken();
};
