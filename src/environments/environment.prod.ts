export const environment = {
  production: true,
  apiUrl: 'https://piedra-azul-backend.onrender.com/api',
  keycloak: {
    url: 'http://localhost:8080',
    realm: 'piedra-azul',
    clientId: 'piedra-azul-frontend',
  },
  useMock: false,
  mockUsers: []
};
