export default function LoadingSpinner({ className = '' }) {
  return (
    <div className={`flex justify-center items-center py-12 ${className}`}>
      <div className="relative">
        <div className="animate-spin rounded-full h-11 w-11 border-2 border-default border-t-primary-500" />
        <div className="absolute inset-0 rounded-full animate-ping opacity-20 bg-primary-500" style={{ animationDuration: '1.5s' }} />
      </div>
    </div>
  );
}
