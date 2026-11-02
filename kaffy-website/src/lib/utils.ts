// Small helpers shared by the pages.

/** Turns any YouTube link (watch, youtu.be, shorts, embed) or a bare ID into the video ID. */
export function youtubeId(input?: string): string | undefined {
  if (!input) return undefined;
  const m = input.match(/(?:youtu\.be\/|v=|shorts\/|embed\/|live\/)([\w-]{11})/);
  if (m) return m[1];
  return /^[\w-]{11}$/.test(input.trim()) ? input.trim() : undefined;
}

export function formatDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/&/g, 'and').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function breadcrumbs(site: URL, trail: [string, string][]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: trail.map(([name, path], i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name,
      item: new URL(path, site).toString(),
    })),
  };
}

/** Published entries, newest first. */
export function published<T extends { data: { draft?: boolean; date: Date } }>(items: T[]): T[] {
  return items.filter((i) => !i.data.draft).sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}
