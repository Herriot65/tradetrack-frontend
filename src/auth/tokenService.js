export const getAccessToken = () =>
  localStorage.getItem("access");

export const getRefreshToken = () =>
  localStorage.getItem("refresh");

export const setTokens = (access, refresh) => {
  localStorage.setItem("access", access);
  localStorage.setItem("refresh", refresh);
};

export const clearTokens = () => {
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
};