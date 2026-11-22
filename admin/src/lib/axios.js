import axios from "axios";

const baseURL = import.meta.env.VITE_API_URL;
if (!baseURL) throw new Error("Missing VITE_API_URL");

const axiosInstance = axios.create({
  baseURL: baseURL.replace(/\/$/, ""),
  withCredentials: true,
  timeout: 20_000,
});

export default axiosInstance;
