// sessionStorage é opcional e pode conter valores antigos ou alterados manualmente.
export function lerRetorno(raw: string | null): { caminho: string; y: number } | null {
  try {
    const value: unknown = JSON.parse(raw ?? 'null');
    if (!value || typeof value !== 'object') return null;
    const { caminho, y } = value as Record<string, unknown>;
    return typeof caminho === 'string' && ['/', '/imoveis', '/imoveis/'].includes(caminho)
      && typeof y === 'number' && Number.isFinite(y) && y >= 0
      ? { caminho, y } : null;
  } catch { return null; }
}
