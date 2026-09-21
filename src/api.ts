export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
  if (response.status === 204) return undefined as T;
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'Não foi possível concluir a ação.');
  return payload as T;
}

export const splitTags = (value: string) => value
  .split(',')
  .map((item) => item.trim())
  .filter(Boolean);

export const joinTags = (value: string[] | undefined) => (value ?? []).join(', ');

