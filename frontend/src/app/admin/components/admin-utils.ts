export function normalizar(valor: string): string {
  return valor
    .trim()
    .toLocaleLowerCase('es')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

export function errorApi(error: unknown, alternativa: string): string {
  const mensaje = (error as { error?: { error?: unknown } } | null)?.error?.error;
  return typeof mensaje === 'string' ? mensaje : alternativa;
}
