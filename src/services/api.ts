import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/authStore';
import { API_BASE_URL } from '@/utils/constants';

class ApiClient {
  private api: AxiosInstance;

  constructor() {
    this.api = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      withCredentials: true,
      timeout: 15000,
    });

    this.api.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = useAuthStore.getState().token;
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        if (__DEV__) {
          console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`, {
            hasToken: !!token,
            tokenPreview: token ? `${token.substring(0, 10)}...` : null,
          });
        }
        return config;
      },
      (error) => Promise.reject(error),
    );

    this.api.interceptors.response.use(
      (response) => {
        if (__DEV__) {
          console.log(`[API] ✓ ${response.status} ${response.config.url}`);
        }
        return response;
      },
      async (error: AxiosError) => {
        if (__DEV__) {
          const data = error.response?.data as any;
          console.log(`[API] ✗ ${error.response?.status} ${error.config?.url}`, {
            message: data?.message,
            required_permission: data?.required_permission,
            your_permissions: data?.your_permissions,
            error_type: data?.error,
          });
        }
        if (error.response?.status === 401) {
          await useAuthStore.getState().logout();
        }
        return Promise.reject(error);
      },
    );
  }

  get instance() {
    return this.api;
  }

  async unifiedLogin(email: string, password: string) {
    const response = await this.api.post('/unified-login', { email, password });
    if (__DEV__) {
      const data = response.data;
      console.log('[API] Login response:', {
        success: data.success,
        user_type: data.user_type,
        has_token: !!data.data?.access_token || !!data.data?.token,
        user_email: data.data?.user?.email || data.data?.seller?.email || data.data?.mechanic?.email || data.data?.investor?.email,
        user_roles: data.data?.user?.roles?.map((r: any) => r.name),
        user_permissions_count: data.data?.user?.roles?.reduce((acc: number, r: any) => acc + (r.permissions?.length || 0), 0),
      });
    }
    return response.data;
  }

  async adminLogin(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    if (__DEV__) {
      const data = response.data;
      console.log('[API] Admin login response:', {
        has_token: !!data.data?.access_token,
        user_email: data.data?.user?.email,
        user_roles: data.data?.user?.roles?.map((r: any) => r.name),
      });
    }
    return response.data;
  }

  async mechanicLogin(email: string, password: string) {
    const response = await this.api.post('/mechanic/login', { email, password });
    return response.data;
  }

  async sellerLogin(email: string, password: string) {
    const response = await this.api.post('/seller/login', { email, password });
    return response.data;
  }

  async investorLogin(email: string, password: string) {
    const response = await this.api.post('/investor/login', { email, password });
    return response.data;
  }

  async getMe() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async forgotPassword(email: string) {
    const response = await this.api.post('/auth/forgot-password', { email });
    return response.data;
  }

  // Add uuid alias for id when id is a UUID string
  private addUuidAlias(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.addUuidAlias(item));
    if (typeof obj.id === 'string' && obj.id.includes('-') && !obj.uuid) {
      obj.uuid = obj.id;
    }
    return obj;
  }

  private unwrap(body: any): any {
    // Unwrap Laravel's { success, data, meta? } pattern
    if (body && typeof body === 'object' && 'data' in body && 'success' in body) {
      const data = this.addUuidAlias(body.data);
      // Paginated response: keep { data, meta } structure
      if ('meta' in body) {
        return { data, meta: body.meta };
      }
      // Simple response: return inner data directly
      return data;
    }
    // Laravel paginated response without success wrapper (e.g. users)
    if (body && typeof body === 'object' && 'data' in body && 'current_page' in body) {
      return {
        data: this.addUuidAlias(body.data),
        meta: {
          current_page: body.current_page,
          last_page: body.last_page,
          per_page: body.per_page,
          total: body.total,
        },
      };
    }
    return this.addUuidAlias(body);
  }

  async get<T = any>(url: string, params?: Record<string, any>): Promise<T> {
    const cleaned = params ? this.cleanParams(params) : undefined;
    const response = await this.api.get<T>(url, { params: cleaned });
    return this.unwrap(response.data);
  }

  async post<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.post<T>(url, data);
    return this.unwrap(response.data);
  }

  async put<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.put<T>(url, data);
    return this.unwrap(response.data);
  }

  async patch<T = any>(url: string, data?: any): Promise<T> {
    const response = await this.api.patch<T>(url, data);
    return this.unwrap(response.data);
  }

  async delete<T = any>(url: string): Promise<T> {
    const response = await this.api.delete<T>(url);
    return this.unwrap(response.data);
  }

  async upload<T = any>(url: string, formData: FormData): Promise<T> {
    const response = await this.api.post<T>(url, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return this.unwrap(response.data);
  }

  private cleanParams(params: Record<string, any>): Record<string, any> {
    const cleaned: Record<string, any> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== '' && value !== undefined && value !== null) {
        cleaned[key] = value;
      }
    }
    return cleaned;
  }
}

export const apiClient = new ApiClient();
export default apiClient;
