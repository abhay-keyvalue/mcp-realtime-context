import axios, { AxiosInstance } from 'axios';
import { getServerUrl, getToken } from './config';
import { Context, ContextCreate, Project } from '@mcp/shared-types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: getServerUrl(),
      timeout: 10000,
    });

    this.client.interceptors.request.use((config) => {
      const token = getToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  updateBaseURL(url: string) {
    this.client.defaults.baseURL = url;
  }

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const response = await this.client.post('/auth/login', { email, password });
    return response.data;
  }

  async register(email: string, password: string, name: string): Promise<{ token: string; user: any }> {
    const response = await this.client.post('/auth/register', { email, password, name });
    return response.data;
  }

  async getProjects(): Promise<Project[]> {
    const response = await this.client.get('/projects');
    return response.data;
  }

  async createProject(name: string, description?: string): Promise<Project> {
    const response = await this.client.post('/projects', { name, description });
    return response.data;
  }

  async createContext(data: ContextCreate): Promise<Context> {
    const response = await this.client.post('/context/update', data);
    return response.data;
  }

  async smartCreate(projectId: string, input: string, author: string): Promise<any> {
    const response = await this.client.post('/context/smart-create', {
      projectId,
      input,
      author,
    });
    return response.data;
  }

  async getContexts(filters?: any): Promise<Context[]> {
    const response = await this.client.get('/context', { params: filters });
    return response.data;
  }

  async getStats(projectId?: string): Promise<any> {
    const response = await this.client.get('/context/stats', {
      params: { projectId },
    });
    return response.data;
  }

  async healthCheck(): Promise<any> {
    const response = await this.client.get('/health');
    return response.data;
  }
}

export const api = new ApiClient();
