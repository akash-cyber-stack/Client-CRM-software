/**
 * Official CRM brand logo (GR monogram + CRM wordmark).
 */
const LOGO_SRC = '/logo.png';

export default function BrandLogo({
  size = 'md',
  className = '',
  showLabel = false,
  label = 'Sales Lead CRM',
  tagline = '',
}) {
  const dim =
    size === 'xs'
      ? 'brand-logo--xs'
      : size === 'sm'
        ? 'brand-logo--sm'
        : size === 'lg'
          ? 'brand-logo--lg'
          : size === 'xl'
            ? 'brand-logo--xl'
            : 'brand-logo--md';

  return (
    <div className={`brand-logo-wrap ${className}`.trim()}>
      <img
        src={LOGO_SRC}
        alt={label}
        className={`brand-logo-img ${dim}`}
        width={size === 'xl' ? 120 : size === 'lg' ? 96 : 72}
        height={size === 'xl' ? 120 : size === 'lg' ? 96 : 72}
        decoding="async"
      />
      {showLabel && (
        <div className="brand-logo-text min-w-0">
          <p className="brand-logo-name">{label}</p>
          {tagline ? <p className="brand-logo-tag">{tagline}</p> : null}
        </div>
      )}
    </div>
  );
}
