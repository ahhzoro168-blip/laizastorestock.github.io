export const COLOR_STYLES: Record<string, { bg: string; border: string; text: string }> = {
  Black: { bg: 'bg-black', border: 'border-slate-600', text: 'text-slate-200' },
  White: { bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-900' },
  'ខ្មៅ': { bg: 'bg-black', border: 'border-slate-600', text: 'text-slate-200' },
  'ខៅ': { bg: 'bg-black', border: 'border-slate-600', text: 'text-slate-200' },
  'ស': { bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-900' },
  Navy: { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-blue-200' },
  Beige: { bg: 'bg-[#d8c3a5]', border: 'border-amber-400', text: 'text-amber-950' }
};

export const getColorStyle = (colorName: string): { bg: string; border: string; text: string } => {
  if (!colorName) return { bg: 'bg-slate-700', border: 'border-slate-600', text: 'text-white' };
  const normalized = colorName.trim().toLowerCase();

  if (COLOR_STYLES[colorName]) return COLOR_STYLES[colorName];

  if (normalized === 'black' || normalized === 'ខ្មៅ' || normalized === 'ខៅ') {
    return { bg: 'bg-black', border: 'border-slate-600', text: 'text-white' };
  }
  if (normalized === 'white' || normalized === 'ស') {
    return { bg: 'bg-white', border: 'border-slate-300', text: 'text-slate-900' };
  }
  if (normalized === 'navy' || normalized === 'blue' || normalized === 'ខៀវ') {
    return { bg: 'bg-blue-600', border: 'border-blue-400', text: 'text-white' };
  }
  if (normalized === 'beige' || normalized === 'cream' || normalized === 'បន៍') {
    return { bg: 'bg-[#d8c3a5]', border: 'border-amber-400', text: 'text-amber-950' };
  }
  if (normalized === 'brown' || normalized === 'ត្នោត') {
    return { bg: 'bg-amber-800', border: 'border-amber-600', text: 'text-white' };
  }
  if (normalized === 'red' || normalized === 'ក្រហម') {
    return { bg: 'bg-rose-600', border: 'border-rose-400', text: 'text-white' };
  }
  if (normalized === 'green' || normalized === 'បៃតង') {
    return { bg: 'bg-emerald-600', border: 'border-emerald-400', text: 'text-white' };
  }
  if (normalized === 'grey' || normalized === 'gray' || normalized === 'ប្រផេះ') {
    return { bg: 'bg-slate-500', border: 'border-slate-400', text: 'text-white' };
  }
  if (normalized === 'pink' || normalized === 'ផ្កាឈូក') {
    return { bg: 'bg-pink-500', border: 'border-pink-300', text: 'text-white' };
  }
  if (normalized === 'yellow' || normalized === 'gold' || normalized === 'លឿង') {
    return { bg: 'bg-amber-400', border: 'border-amber-300', text: 'text-slate-950' };
  }

  return { bg: 'bg-[#635BFF]', border: 'border-indigo-400', text: 'text-white' };
};
