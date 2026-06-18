import { useEffect } from 'react';
import { SITE_URL, SITE_NAME } from '../../constants/marketingSeo';

function upsertMeta(attr, key, content, isProperty = false) {
  if (!content) return;
  const selector = isProperty ? `meta[property="${key}"]` : `meta[name="${key}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('meta');
    if (isProperty) el.setAttribute('property', key);
    else el.setAttribute('name', key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel, href) {
  if (!href) return;
  let el = document.querySelector(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

function upsertJsonLd(id, data) {
  const existing = document.getElementById(id);
  if (existing) existing.remove();
  if (!data) return;
  const script = document.createElement('script');
  script.id = id;
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(data);
  document.head.appendChild(script);
}

export default function MarketingSEO({ title, description, path = '/', keywords, jsonLd, noindex = false }) {
  const canonical = `${SITE_URL}${path === '/' ? '' : path}`;

  useEffect(() => {
    document.title = title;
    upsertMeta('name', 'description', description);
    upsertMeta('name', 'keywords', keywords);
    upsertMeta('name', 'robots', noindex ? 'noindex, nofollow' : 'index, follow');
    upsertMeta('name', 'author', SITE_NAME);
    upsertMeta('property', 'og:title', title, true);
    upsertMeta('property', 'og:description', description, true);
    upsertMeta('property', 'og:url', canonical, true);
    upsertMeta('property', 'og:type', 'website', true);
    upsertMeta('property', 'og:site_name', SITE_NAME, true);
    upsertMeta('property', 'og:locale', 'en_IN', true);
    upsertMeta('name', 'twitter:card', 'summary_large_image');
    upsertMeta('name', 'twitter:title', title);
    upsertMeta('name', 'twitter:description', description);
    upsertLink('canonical', canonical);
    upsertJsonLd('marketing-jsonld', jsonLd);
  }, [title, description, path, keywords, canonical, jsonLd, noindex]);

  return null;
}
