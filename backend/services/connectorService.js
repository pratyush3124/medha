const API_BASE = 'https://api.sprites.dev/v1';

class ConnectorService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.headers = {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    };
  }

  async startGitHubOAuth(scopes) {
    const scopeStr = Array.isArray(scopes) ? scopes.join(',') : scopes;
    const url = `${API_BASE}/oauth/github/authorize?scopes=${encodeURIComponent(scopeStr)}`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `GitHub authorize failed: ${res.status}`);
    }

    return res.json();
  }

  async listConnections() {
    const res = await fetch(`${API_BASE}/oauth/connections`, { headers: this.headers });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `List connections failed: ${res.status}`);
    }

    const data = await res.json();
    return data.connections || data;
  }

  async getConnection(connectionId) {
    const res = await fetch(`${API_BASE}/oauth/connections/${connectionId}`, {
      headers: this.headers,
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Get connection failed: ${res.status}`);
    }

    return res.json();
  }

  async updateAccessPolicy(connectionId, policy) {
    const res = await fetch(`${API_BASE}/oauth/connections/${connectionId}`, {
      method: 'PUT',
      headers: this.headers,
      body: JSON.stringify({ access_policy: policy }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Update access policy failed: ${res.status}`);
    }

    return res.json().catch(() => ({}));
  }

  async deleteConnection(connectionId) {
    const res = await fetch(`${API_BASE}/oauth/connections/${connectionId}`, {
      method: 'DELETE',
      headers: this.headers,
    });

    if (!res.ok && res.status !== 204) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Delete connection failed: ${res.status}`);
    }

    return true;
  }

  buildGatewayUrl(connectionId, path) {
    const cleanPath = path.replace(/^\/+/, '');
    return `${API_BASE}/gateway/github/${connectionId}/${cleanPath}`;
  }
}

module.exports = ConnectorService;
