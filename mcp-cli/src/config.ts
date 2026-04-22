import Conf from 'conf';

interface CliConfig {
  serverUrl?: string;
  token?: string;
  projectId?: string;
  author?: string;
}

export const config = new Conf<CliConfig>({
  projectName: 'mcp-cli',
});

export function getServerUrl(): string {
  return config.get('serverUrl') || 'http://localhost:3000';
}

export function setServerUrl(url: string): void {
  config.set('serverUrl', url);
}

export function getToken(): string | undefined {
  return config.get('token');
}

export function setToken(token: string): void {
  config.set('token', token);
}

export function getProjectId(): string | undefined {
  return config.get('projectId');
}

export function setProjectId(projectId: string): void {
  config.set('projectId', projectId);
}

export function getAuthor(): string | undefined {
  return config.get('author');
}

export function setAuthor(author: string): void {
  config.set('author', author);
}

export function clearConfig(): void {
  config.clear();
}

export function isConfigured(): boolean {
  return !!(getToken() && getProjectId() && getAuthor());
}
