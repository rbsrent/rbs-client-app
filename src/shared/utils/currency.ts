export function formatRub(amount: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function rubToKopecks(rub: number): number {
  return Math.round(rub * 100);
}

export function kopecksToRub(kopecks: number): number {
  return kopecks / 100;
}
