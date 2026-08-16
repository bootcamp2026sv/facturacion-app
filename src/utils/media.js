const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

export const resolverUrlMedia = (url) => {
  if (!url) return null;
  if (/^https?:\/\//i.test(url) || url.startsWith('blob:') || url.startsWith('data:')) return url;
  return `${API_ORIGIN}${url.startsWith('/') ? url : `/${url}`}`;
};
