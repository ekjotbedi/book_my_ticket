export default function Spinner({ label = "Loading..." }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-3">
      <span className="loading loading-spinner loading-lg text-primary"></span>
      <p className="opacity-60">{label}</p>
    </div>
  );
}