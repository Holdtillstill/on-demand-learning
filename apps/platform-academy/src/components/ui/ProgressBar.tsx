import styles from "./ProgressBar.module.css";

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className={styles.track} role="progressbar" aria-label={`${value}% complete`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
      <div className={styles.fill} style={{ width: `${value}%` }} />
    </div>
  );
}
