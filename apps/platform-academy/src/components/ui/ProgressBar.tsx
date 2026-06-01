export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="progress-track" role="progressbar" aria-label={`${value}% complete`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div style={{ width: `${value}%` }} />
    </div>
  );
}
