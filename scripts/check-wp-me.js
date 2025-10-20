const AsyncStorage = require('@react-native-async-storage/async-storage').default;
const axios = require('axios');

const API_BASE = 'https://staging.bodhimedicine.com';

const api = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

data();

async function data() {
  const nonce = await AsyncStorage.getItem('wp_rest_nonce');
  api.interceptors.request.use(async (config) => {
    const nonceValue = await AsyncStorage.getItem('wp_rest_nonce');
    if (nonceValue) {
      config.headers = {
        ...(config.headers || {}),
        'X-WP-Nonce': nonceValue,
      };
    }
    return config;
  });

  try {
    const res = await api.get('/wp-json/wp/v2/users/me');
    console.log('me status:', res.status, res.data);
  } catch (err) {
    if (err.response) {
      console.log('me status:', err.response.status, err.response.data);
    } else {
      console.error(err);
    }
  }
}
