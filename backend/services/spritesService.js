const API_BASE = 'https://api.sprites.dev/v1';

class SpritesService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.headers = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    };
  }

  async listSprites({ prefix, maxResults = 50, continuationToken } = {}) {
    const params = new URLSearchParams();
    if (prefix) params.append('prefix', prefix);
    if (maxResults) params.append('max_results', maxResults.toString());
    if (continuationToken) params.append('continuation_token', continuationToken);

    const url = `${API_BASE}/sprites${params.toString() ? '?' + params.toString() : ''}`;
    const res = await fetch(url, { headers: this.headers });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `List sprites failed: ${res.status}`);
    }

    return res.json();
  }

  async getSprite(name) {
    const res = await fetch(`${API_BASE}/sprites/${name}`, { headers: this.headers });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Get sprite failed: ${res.status}`);
    }

    return res.json();
  }

  async createSprite(name) {
    const res = await fetch(`${API_BASE}/sprites`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify({ name })
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Create sprite failed: ${res.status}`);
    }

    return res.json();
  }

  async deleteSprite(name) {
    const res = await fetch(`${API_BASE}/sprites/${name}`, {
      method: 'DELETE',
      headers: this.headers
    });

    if (!res.ok && res.status !== 204) {
      const error = await res.json().catch(() => ({}));
      throw new Error(error.message || `Delete sprite failed: ${res.status}`);
    }

    return true;
  }

  mapToSandbox(sprite) {
    return {
      id: sprite.id,
      name: sprite.name,
      status: sprite.status,
      ip: sprite.url ? sprite.url.replace('https://', '').replace('http://', '').split('/')[0] : null,
      url: sprite.url,
      organization: sprite.organization || sprite.org_slug,
      createdAt: sprite.created_at,
      updatedAt: sprite.updated_at
    };
  }
}

module.exports = SpritesService;
