import axios, { AxiosInstance, AxiosError } from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api/v1';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      withCredentials: true, // Important for cookies
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('accessToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // If 401 and not already retrying, attempt token refresh
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          try {
            const response = await this.client.post('/auth/refresh');
            const { accessToken } = response.data.tokens;
            localStorage.setItem('accessToken', accessToken);

            // Retry original request
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, redirect to login
            localStorage.removeItem('accessToken');
            window.location.href = '/login';
            return Promise.reject(refreshError);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async signup(username: string, email: string, password: string) {
    const response = await this.client.post('/auth/signup', {
      username,
      email,
      password,
    });
    return response.data;
  }

  async login(username: string, password: string) {
    const response = await this.client.post('/auth/login', {
      username,
      password,
    });
    
    // Store tokens
    if (response.data.tokens) {
      localStorage.setItem('accessToken', response.data.tokens.accessToken);
    }
    
    return response.data;
  }

  async logout() {
    try {
      await this.client.post('/auth/logout');
    } finally {
      localStorage.removeItem('accessToken');
    }
  }

  async getCurrentUser() {
    const response = await this.client.get('/auth/me');
    return response.data.user;
  }

  // Secrets endpoints
  async createSecret(name: string, plaintext: string) {
    const response = await this.client.post('/secrets', { name, plaintext });
    return response.data;
  }

  async listSecrets(limit?: number, offset?: number) {
    const response = await this.client.get('/secrets', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getSecretMetadata(secretId: string) {
    const response = await this.client.get(`/secrets/${secretId}`);
    return response.data;
  }

  async revealSecret(secretId: string) {
    const response = await this.client.post(`/secrets/${secretId}/reveal`);
    return response.data;
  }

  async updateSecret(secretId: string, name?: string, plaintext?: string) {
    const response = await this.client.put(`/secrets/${secretId}`, {
      name,
      plaintext,
    });
    return response.data;
  }

  async deleteSecret(secretId: string) {
    const response = await this.client.delete(`/secrets/${secretId}`);
    return response.data;
  }

  async searchSecrets(query: string, limit?: number) {
    const response = await this.client.get('/secrets/search', {
      params: { q: query, limit },
    });
    return response.data;
  }

  // Users endpoints (admin only)
  async listUsers(limit?: number, offset?: number) {
    const response = await this.client.get('/users', {
      params: { limit, offset },
    });
    return response.data;
  }

  async getUser(userId: string) {
    const response = await this.client.get(`/users/${userId}`);
    return response.data;
  }

  async assignRole(userId: string, role: string) {
    const response = await this.client.post(`/users/${userId}/roles`, { role });
    return response.data;
  }

  async removeRole(userId: string, roleId: number) {
    const response = await this.client.delete(`/users/${userId}/roles/${roleId}`);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.client.delete(`/users/${userId}`);
    return response.data;
  }

  // Audit endpoints
  async listAuditLogs(filters?: any) {
    const response = await this.client.get('/audit', { params: filters });
    return response.data;
  }
}

export const apiClient = new ApiClient();