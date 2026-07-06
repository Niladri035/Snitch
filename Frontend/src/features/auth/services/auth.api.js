import api from '../../../services/api.js';

const authApi = api;   // same instance, routes prefixed with /auth below

export async function register(email, contact, password, fullname, isSeller) {
  const response = await authApi.post('/auth/register', {
    email, contact, password, fullname, isSeller,
  });
  return response.data;
}

export async function login(email, password) {
  const response = await authApi.post('/auth/login', { email, password });
  return response.data;
}

export async function logout() {
  const response = await authApi.post('/auth/logout');
  return response.data;
}

export default authApi;