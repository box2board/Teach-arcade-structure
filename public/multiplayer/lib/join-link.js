export const joinPath = '/join';

export function studentJoinUrl(origin, code) {
  const url = new URL(joinPath, origin);
  if (code) url.searchParams.set('code', code);
  return url;
}
