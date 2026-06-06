export const formatBRL = (v: number | null | undefined): string => {
  if (v == null || !Number.isFinite(v)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
};

export const formatNumber = (v: number | null | undefined, frac = 0): string => {
  if (v == null || !Number.isFinite(v)) return '0';
  return new Intl.NumberFormat('pt-BR', { 
    minimumFractionDigits: frac,
    maximumFractionDigits: frac 
  }).format(v);
};

export const formatDateBR = (iso: string | null | undefined): string => {
  if (!iso) return '-';
  try {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(iso));
  } catch (e) {
    return '-';
  }
};
