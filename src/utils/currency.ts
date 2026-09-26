export const formatRiel = (price: number): string => {
  const val = price < 1000 ? price * 4100 : price;
  return `${Math.round(val).toLocaleString()} ៛`;
};

export const toRielNumber = (price: number): number => {
  return price < 1000 ? Math.round(price * 4100) : price;
};
