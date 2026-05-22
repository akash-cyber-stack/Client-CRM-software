export default function AudioPlayer({ url }) {
  if (!url) return <span className="text-subtle text-sm">No recording</span>;
  return (
    <audio controls className="h-8 max-w-xs" preload="none">
      <source src={url} type="audio/mpeg" />
      <source src={url} type="audio/wav" />
      Your browser does not support audio.
    </audio>
  );
}
