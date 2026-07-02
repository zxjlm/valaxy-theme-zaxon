export function markdownPathForRoute(path: string): string {
  const cleanPath = path.split(/[?#]/, 1)[0] || '/'

  if (cleanPath.endsWith('/'))
    return `${cleanPath.slice(0, -1)}.md`

  return `${cleanPath}.md`
}
