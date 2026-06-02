import {
  BookMarked,
  CheckCircle2,
  Copy,
  Download,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Map,
  RefreshCcw,
  Search,
  Terminal,
  UserRound
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { api } from "../api";
import { restoreLocalLearnerId } from "../learnerIdentity";
import { STUDY_PLANS_RESTORED_EVENT, readInterviewStudyPlans, uniqueStrings, writeInterviewStudyPlans } from "../lib/interviewStudyPlans";
import { learnerBackupValidationError } from "../lib/learnerBackup";
import type { PlatformLearnerStateExport } from "../types";

type AppShellProps = {
  children: ReactNode;
  learnerId: string;
  onResetLearner: () => void;
  onRecoverLearner: (learnerId: string) => void;
};

const productNavItems = [
  {
    to: "/dashboard/home",
    label: "Home",
    icon: LayoutDashboard,
    match: (path: string) => path === "/" || path.startsWith("/dashboard") || path.startsWith("/courses") || path.startsWith("/lessons")
  },
  { to: "/roadmap", label: "Roadmap", icon: Map, match: (path: string) => path.startsWith("/roadmap") },
  { to: "/labs", label: "Labs", icon: Terminal, match: (path: string) => path.startsWith("/labs") },
  { to: "/interview-prep", label: "Interview", icon: GraduationCap, match: (path: string) => path.startsWith("/interview-prep") },
  { to: "/resources", label: "Resources", icon: BookMarked, match: (path: string) => path.startsWith("/resources") }
] as const;

export function AppShell({ children, learnerId, onResetLearner, onRecoverLearner }: AppShellProps) {
  const location = useLocation();
  const [isRecoveryOpen, setIsRecoveryOpen] = useState(false);
  const [recoveryInput, setRecoveryInput] = useState("");
  const [recoveryError, setRecoveryError] = useState("");
  const [recoveryStatus, setRecoveryStatus] = useState("");
  const [recoveryCopied, setRecoveryCopied] = useState(false);
  const recoveryButtonRef = useRef<HTMLButtonElement | null>(null);
  const recoveryDialogRef = useRef<HTMLElement | null>(null);
  const recoveryCloseRef = useRef<HTMLButtonElement | null>(null);

  const openRecovery = () => {
    setRecoveryInput("");
    setRecoveryError("");
    setRecoveryStatus("");
    setRecoveryCopied(false);
    setIsRecoveryOpen(true);
  };

  const closeRecovery = () => {
    setIsRecoveryOpen(false);
    setRecoveryError("");
    setRecoveryStatus("");
  };

  const copyRecoveryKey = async () => {
    try {
      await navigator.clipboard?.writeText(learnerId);
      setRecoveryCopied(true);
    } catch {
      setRecoveryError("Copy is blocked by this browser. Select and copy the key manually.");
    }
  };

  const downloadLearnerBackup = async () => {
    setRecoveryError("");
    setRecoveryStatus("");
    try {
      const state = await api.exportLearnerState(learnerId);
      const backupState: PlatformLearnerStateExport = {
        ...state,
        interview_study_plans: readInterviewStudyPlans()
      };
      const blob = new Blob([JSON.stringify(backupState, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `platform-academy-${learnerId}-state.json`;
      anchor.click();
      URL.revokeObjectURL(url);
      setRecoveryStatus("Exported profile backup.");
    } catch {
      setRecoveryError("Profile export failed. Check the API connection and try again.");
    }
  };

  const importLearnerBackup = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setRecoveryError("");
    setRecoveryStatus("");
    try {
      const parsed = JSON.parse(await file.text()) as unknown;
      const validationError = learnerBackupValidationError(parsed);
      if (validationError) {
        setRecoveryError(validationError);
        return;
      }
      const state = parsed as PlatformLearnerStateExport;
      const { interview_study_plans: importedStudyPlans, ...apiState } = state;
      const result = await api.importLearnerState(apiState, learnerId);
      const importedStudyPlanCount = importedStudyPlans?.length ?? 0;
      if (importedStudyPlans) {
        writeInterviewStudyPlans(
          importedStudyPlans.map((plan) => ({
            ...plan,
            name: plan.name.trim() || "Interview study plan",
            questionIds: uniqueStrings(plan.questionIds)
          }))
        );
        window.dispatchEvent(new Event(STUDY_PLANS_RESTORED_EVENT));
      }
      setRecoveryStatus(
        `Imported ${result.progress_imported} lessons, ${result.activity_imported} activity rows, ${result.lab_submissions_imported} lab workbooks, and ${importedStudyPlanCount} interview study ${importedStudyPlanCount === 1 ? "plan" : "plans"}.`
      );
      onRecoverLearner(learnerId);
    } catch {
      setRecoveryError("Profile import failed. Use an exported Platform Academy JSON backup.");
    }
  };

  const restoreRecoveryProfile = () => {
    const restoredLearnerId = restoreLocalLearnerId(recoveryInput);
    if (!restoredLearnerId) {
      setRecoveryError("Enter a valid guest recovery key.");
      return;
    }
    onRecoverLearner(restoredLearnerId);
    closeRecovery();
  };

  useEffect(() => {
    if (!isRecoveryOpen) return;
    const dialog = recoveryDialogRef.current;
    const closeButton = recoveryCloseRef.current;
    const previousActive = document.activeElement instanceof HTMLElement ? document.activeElement : null;

    closeButton?.focus();

    const focusableSelector = [
      "a[href]",
      "button:not([disabled])",
      "input:not([disabled])",
      "select:not([disabled])",
      "textarea:not([disabled])",
      "[tabindex]:not([tabindex='-1'])"
    ].join(",");

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeRecovery();
        return;
      }
      if (event.key !== "Tab" || !dialog) return;
      const focusable = Array.from(dialog.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => element.offsetParent !== null
      );
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      window.setTimeout(() => {
        if (previousActive && previousActive !== document.body && document.contains(previousActive)) previousActive.focus();
        else recoveryButtonRef.current?.focus();
      }, 0);
    };
  }, [isRecoveryOpen]);

  return (
    <div className="product-shell">
      <aside className="product-sidebar">
        <Link className="product-brand" to="/dashboard/home">
          <span>PA</span>
          <div>
            <strong>Platform Academy</strong>
            <small>AWS / Kubernetes / SRE</small>
          </div>
        </Link>
        <nav className="product-nav" aria-label="Platform Academy navigation">
          {productNavItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                to={item.to}
                key={item.to}
                className={({ isActive }) => (isActive || item.match(location.pathname) ? "active" : undefined)}
              >
                <Icon aria-hidden="true" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
        <div className="product-sidebar-note">
          <span>Privacy</span>
          <p>First-party pageview telemetry respects DNT and GPC. Learning inputs stay browser-local on the static host.</p>
          <a href="https://bozhi.dev/privacy.html">Privacy note</a>
        </div>
      </aside>
      <div className="product-frame">
        <header className="product-topline">
          <div className="learner-profile" aria-label="Active learner profile">
            <UserRound aria-hidden="true" />
            <div>
              <span className="learner-profile-label">Guest workspace</span>
              <strong>{learnerId}</strong>
              <span>Browser-local progress</span>
            </div>
            <div className="learner-profile-actions">
              <button
                aria-label="Open guest recovery key"
                className="learner-recovery-button"
                onClick={openRecovery}
                ref={recoveryButtonRef}
                title="Copy this guest recovery key or restore a saved guest workspace."
                type="button"
              >
                <Copy aria-hidden="true" />
                Recovery key
              </button>
              <button
                aria-label="Start a new local guest workspace"
                className="learner-reset-button"
                onClick={onResetLearner}
                title="Switch this browser to a fresh local progress profile. Existing backend progress remains stored under the old guest id."
                type="button"
              >
                <RefreshCcw aria-hidden="true" />
                New profile
              </button>
            </div>
          </div>
          <div className="topline-actions">
            <Link aria-label="Open lab queue" to="/labs">
              <Terminal aria-hidden="true" />
              <span>Lab queue</span>
            </Link>
            <Link aria-label="Open resource index" to="/resources">
              <Search aria-hidden="true" />
              <span>Resource index</span>
            </Link>
          </div>
        </header>
        <main>{children}</main>
      </div>
      {isRecoveryOpen && (
        <div className="profile-recovery-backdrop" onClick={closeRecovery}>
          <section
            aria-labelledby="profile-recovery-title"
            aria-modal="true"
            className="profile-recovery-dialog"
            onClick={(event) => event.stopPropagation()}
            ref={recoveryDialogRef}
            role="dialog"
          >
            <div className="recovery-dialog-header">
              <div>
                <p className="eyebrow">Guest recovery</p>
                <h2 id="profile-recovery-title">Save or restore progress</h2>
              </div>
              <button className="recovery-close-button" onClick={closeRecovery} ref={recoveryCloseRef} type="button">
                Close
              </button>
            </div>
            <p className="recovery-helper">Save this key outside the browser to recover progress after clearing browser data.</p>
            <div className="recovery-key-card">
              <span>Current recovery key</span>
              <strong>{learnerId}</strong>
              <button className={recoveryCopied ? "copy-command-button copied" : "copy-command-button"} onClick={copyRecoveryKey} type="button">
                {recoveryCopied ? <CheckCircle2 aria-hidden="true" /> : <Copy aria-hidden="true" />}
                {recoveryCopied ? "Copied key" : "Copy key"}
              </button>
            </div>
            <div className="recovery-backup-actions">
              <div>
                <span>Portable backup</span>
                <p>Export or import this guest profile's lesson progress, saved activity, lab workbooks, and interview study plans.</p>
              </div>
              <div>
                <button onClick={() => void downloadLearnerBackup()} type="button">
                  <Download aria-hidden="true" />
                  Export JSON
                </button>
                <label>
                  <FileText aria-hidden="true" />
                  Import JSON
                  <input accept="application/json" onChange={(event) => void importLearnerBackup(event)} type="file" />
                </label>
              </div>
            </div>
            <form
              className="recovery-form"
              onSubmit={(event) => {
                event.preventDefault();
                restoreRecoveryProfile();
              }}
            >
              <label htmlFor="guest-recovery-key">Restore saved key</label>
              <div>
                <input
                  id="guest-recovery-key"
                  onChange={(event) => {
                    setRecoveryInput(event.target.value);
                    setRecoveryError("");
                  }}
                  placeholder="guest-abc123def456"
                  value={recoveryInput}
                />
                <button type="submit">Restore profile</button>
              </div>
              {recoveryError && <p role="alert">{recoveryError}</p>}
              {recoveryStatus && (
                <p className="recovery-status" role="status">
                  {recoveryStatus}
                </p>
              )}
            </form>
          </section>
        </div>
      )}
    </div>
  );
}
