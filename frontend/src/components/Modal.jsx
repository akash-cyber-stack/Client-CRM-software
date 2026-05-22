export default function Modal({ open, onClose, title, children, size = 'md' }) {
  if (!open) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className={`rounded-2xl border border-default w-full ${sizes[size]} max-h-[90vh] overflow-y-auto animate-slide-up`}
        style={{ backgroundColor: 'var(--surface-elevated)', boxShadow: 'var(--shadow-card)' }}
      >
        <div className="flex items-center justify-between p-5 border-b border-default">
          <h3 className="text-lg font-semibold text-main">{title}</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-main text-xl transition-colors"
            style={{ backgroundColor: 'var(--surface-hover)' }}
          >
            ×
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
}
