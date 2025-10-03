import axios from "axios";

const API_BASE = "https://staging.bodhimedicine.com/wp-json/bodhi/v1";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: { "Accept": "application/json" },
});

export default api;
