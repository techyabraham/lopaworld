import Link from 'next/link';
import type { ReactNode } from 'react';

export type ContentNode = { type?: string; text?: string; format?: number; tag?: string; url?: string; fields?: { url?: string }; children?: ContentNode[] };

export function record(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

export function text(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value : null;
}

export function safeHref(value: unknown): string | null {
  const candidate = text(value);
  if (!candidate) return null;
  if (candidate.startsWith('/') && !candidate.startsWith('//')) return candidate;
  try {
    const url = new URL(candidate);
    return url.protocol === 'https:' ? url.toString() : null;
  } catch {
    return null;
  }
}

export function CMSImage({ value, alt, className }: { value: unknown; alt?: unknown; className?: string }) {
  const media = record(value);
  const url = text(media?.url);
  const description = text(alt) ?? text(media?.alt) ?? '';
  if (!url) return <div className="media-placeholder" aria-label="Approved image not yet supplied">Image pending</div>;
  return <img className={className ?? 'content-image'} src={url} alt={description} width={typeof media?.width === 'number' ? media.width : 1200} height={typeof media?.height === 'number' ? media.height : 1500} loading="lazy" />;
}

export function RichContent({ value }: { value: unknown }) {
  const root = record(record(value)?.root);
  const children = Array.isArray(root?.children) ? root.children as ContentNode[] : [];
  return <div className="rich-content">{children.map((node, index) => renderNode(node, `${node.type ?? 'node'}-${index}`))}</div>;
}

function renderNode(node: ContentNode, key: string): ReactNode {
  const children = (node.children ?? []).map((child, index) => renderNode(child, `${key}-${index}`));
  if (node.type === 'text') {
    let value: ReactNode = node.text ?? '';
    if ((node.format ?? 0) & 1) value = <strong>{value}</strong>;
    if ((node.format ?? 0) & 2) value = <em>{value}</em>;
    if ((node.format ?? 0) & 4) value = <s>{value}</s>;
    if ((node.format ?? 0) & 8) value = <u>{value}</u>;
    if ((node.format ?? 0) & 16) value = <code>{value}</code>;
    return <span key={key}>{value}</span>;
  }
  if (node.type === 'linebreak') return <br key={key} />;
  if (node.type === 'link' || node.type === 'autolink') {
    const href = safeHref(node.fields?.url ?? node.url);
    return href ? <Link key={key} href={href}>{children}</Link> : <span key={key}>{children}</span>;
  }
  if (node.type === 'list') return node.tag === 'ol' ? <ol key={key}>{children}</ol> : <ul key={key}>{children}</ul>;
  if (node.type === 'listitem') return <li key={key}>{children}</li>;
  if (node.type === 'heading') {
    if (node.tag === 'h2') return <h2 key={key}>{children}</h2>;
    if (node.tag === 'h3') return <h3 key={key}>{children}</h3>;
    return <h2 key={key}>{children}</h2>;
  }
  if (node.type === 'quote') return <blockquote key={key}>{children}</blockquote>;
  return <p key={key}>{children}</p>;
}
