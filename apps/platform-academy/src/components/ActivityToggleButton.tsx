import { CheckCircle2 } from "lucide-react";

type ActivityToggleButtonProps = {
  completed: boolean;
  saving: boolean;
  onClick: () => void;
  actionLabel: string;
  completedLabel: string;
};

export function ActivityToggleButton({ completed, saving, onClick, actionLabel, completedLabel }: ActivityToggleButtonProps) {
  return (
    <button className={completed ? "activity-toggle completed" : "activity-toggle"} disabled={completed || saving} onClick={onClick} type="button">
      {completed ? (
        <>
          <CheckCircle2 aria-hidden="true" />
          {completedLabel}
        </>
      ) : saving ? (
        "Saving..."
      ) : (
        actionLabel
      )}
    </button>
  );
}
