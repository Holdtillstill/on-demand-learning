import { CheckCircle2, Copy, Terminal } from "lucide-react";
import { useState } from "react";

export function CommandBlock({ commands, title = "Commands" }: { commands: string[]; title?: string }) {
  const [copied, setCopied] = useState(false);
  const commandText = commands.length > 0 ? commands.join("\n") : "No command snippet is available for this item.";
  const copyCommands = async () => {
    if (!commands.length || !navigator.clipboard?.writeText) return;
    await navigator.clipboard.writeText(commandText);
    setCopied(true);
  };
  return (
    <div className="command-console">
      <div className="command-console-header">
        <div>
          <Terminal aria-hidden="true" />
          <span>{title}</span>
        </div>
        <button className={`copy-command-button${copied ? " copied" : ""}`} disabled={!commands.length} onClick={copyCommands} type="button">
          {copied ? <CheckCircle2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
          {copied ? `Copied ${title}` : `Copy ${title}`}
        </button>
      </div>
      <pre>
        <code>{commandText}</code>
      </pre>
    </div>
  );
}
