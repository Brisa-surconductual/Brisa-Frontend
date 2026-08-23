import axios from 'axios';
import { BASE_URL } from './constans.jsx';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});