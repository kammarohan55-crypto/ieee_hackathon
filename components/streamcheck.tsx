"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCheck,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  Compass,
  Eye,
  Fingerprint,
  FlaskConical,
  Leaf,
  LoaderCircle,
  MapPin,
  Plus,
  Search,
  Backpack,
  ChartNoAxesCombined,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import {
  assess,
  appearanceValues,
  createReport,
  decideIssue,
  exportReport,
  reportSchema,
  reviewReport,
  validObservationTime,
  inputSchema,
  type Assessment,
  type Issue,
  type ObservationInput,
  type Report,
} from "@/lib/assessment";
import { MissionControl } from "./mission-control";
import { EvidenceInsights } from "./evidence-insights";
import { ReferenceGallery, ReferenceCredit } from "./reference-gallery";
import { displayEvidenceTime, type ReferencePhoto } from "@/lib/references";
import { hashBlob, inspectImage, addMediaBatch } from "@/lib/media-store";
import { CaptureGuide, FieldGuide, OneHealthNotes, OneHealthSummary } from "./field-guide";
import { CollectionTools } from "./collection-tools";
import { WORKSPACE_KEY as KEY, LEGACY_ARCHIVE_KEY, MAX_REPORTS, realRecords, parseWorkspace, searchReports, mergeRecords } from "@/lib/workspace";
import { EvidenceLab } from "./evidence-lab";
import {
  FieldStudio,
  FieldDetails,
  VoiceNote,
  VisualFollowups,
} from "./field-studio";
import {
  EvidenceReceipt,
  QualityScore,
  StreamAtlas,
} from "./evidence-workbench";
import { newField, createReferenceDraft, assertReferenceRecord, createFollowupDraft, fieldQuestions, fieldSchema, downloadFile, type FieldEvidence } from "@/lib/field";

const empty: ObservationInput = {
  site: "",
  observedAt: "",
  note: "",
  appearance: "unsure",
  synthetic: false,
};
const labels = {
  awaiting_review: "Awaiting review",
  needs_information: "More information",
  reviewed: "Reviewed",
};
const displayTime = displayEvidenceTime;
function localTime(value = new Date()) {
  return new Date(value.getTime() - value.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
}
function Tag({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: string;
}) {
  return <span className={`tag ${tone}`}>{children}</span>;
}
function Heading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="subtext">{description}</p>
      </div>
      {action}
    </div>
  );
}
function download(report: Report) {
  downloadFile(exportReport(report), `aqualens-${report.id}.json`);
  toast.success("Evidence download requested");
}

export default function StreamCheck() {
  const [field, setField] = useState<FieldEvidence>(newField);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);
  const [referenceLoading, setReferenceLoading] = useState("");
  const draftEpoch = useRef(0);
  const [draftRevision, setDraftRevision] = useState(0);
  const [online, setOnline] = useState(true);
  const [tab, setTab] = useState("overview"),
    [records, setRecords] = useState<Report[]>([]),
    [loaded, setLoaded] = useState(false),
    [storageError, setStorageError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [reviewNote, setReviewNote] = useState(""),
    [filter, setFilter] = useState("all"),
    [search, setSearch] = useState("");
  const [draft, setDraft] = useState<ObservationInput>(empty),
    [when, setWhen] = useState(""),
    [stage, setStage] = useState(0),
    [assessment, setAssessment] = useState<Assessment | null>(null),
    [snapshot, setSnapshot] = useState<ObservationInput | null>(null),
    [answer, setAnswer] = useState(""),
    [confirm, setConfirm] = useState(false),
    [busy, setBusy] = useState(false),
    [formError, setFormError] = useState("");
  const [aiReady, setAIReady] = useState(false),
    [useAI, setUseAI] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null),
    stateRef = useRef({ records, tab });
  const updateField = useCallback((next: FieldEvidence) => {
    if (draftEpoch.current === draftRevision) setField(next);
  }, [draftRevision]);
  const updateCaptureBusy = useCallback((next: boolean) => {
    if (draftEpoch.current === draftRevision) setCaptureBusy(next);
  }, [draftRevision]);
  useEffect(() => { stateRef.current = { records, tab }; }, [records, tab]);
  useEffect(() => {
    const connected = () => setOnline(navigator.onLine);
    connected();
    window.addEventListener("online", connected);
    window.addEventListener("offline", connected);
    if ("serviceWorker" in navigator && !import.meta.env.DEV)
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    return () => {
      window.removeEventListener("online", connected);
      window.removeEventListener("offline", connected);
    };
  }, []);
  useEffect(() => {
    // Browser-local storage is unavailable during server rendering.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setWhen(localTime());
    try {
      const savedDraft = localStorage.getItem("aqualens-draft-v1");
      if (savedDraft) {
        const d = JSON.parse(savedDraft);
        const restored = inputSchema.parse(d.draft);
        const restoredField = fieldSchema.parse(d.field);
        assertReferenceRecord({ original: restored, field: restoredField });
        if (typeof d.when === "string" && d.when.length <= 30) {
          if (!restored.synthetic && restoredField.coordinates?.method !== "synthetic" && !restoredField.media.some((media) => media.origin === "illustration")) {
            setDraft(restored); setField(restoredField); setWhen(d.when);
          }
        }
      }
    } catch { toast.error("A saved draft could not be restored. Existing confirmed reports are unaffected."); }
    setDraftLoaded(true);
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = parseWorkspace(JSON.parse(saved));
        const genuine = realRecords(parsed);
        if (genuine.length !== parsed.length && !localStorage.getItem(LEGACY_ARCHIVE_KEY))
          localStorage.setItem(LEGACY_ARCHIVE_KEY, saved);
        setRecords(genuine);
      }
    } catch {
      setStorageError(
        "Saved records could not be read. Your saved data has not been overwritten. Download the recovery file before trying a restore.",
      );
    }
    setLoaded(true);
    fetch("/api/assess")
      .then((r) => r.json())
      .then((d) =>
        setAIReady(
          !!d && typeof d === "object" && "liveAI" in d && d.liveAI === true,
        ),
      )
      .catch(() => {});
    const sync = (e: StorageEvent) => {
      if (e.key !== KEY) return;
      try {
        setRecords(e.newValue ? realRecords(parseWorkspace(JSON.parse(e.newValue))) : []);
      } catch {
        setStorageError("An update from another tab could not be read.");
      }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);
  useEffect(() => {
    if (!draftLoaded) return;
    try { localStorage.setItem("aqualens-draft-v1", JSON.stringify({ draft, field, when })); }
    catch { toast.error("Draft storage is unavailable. Keep this tab open until you export the confirmed report."); }
  }, [draftLoaded, draft, field, when]);
  useEffect(() => {
    if (!loaded || storageError) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(records));
    } catch {
      // Surface persistence failures without discarding the in-memory records.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setStorageError(
        "Browser storage is full or unavailable. Export your records before leaving.",
      );
    }
  }, [records, loaded, storageError]);
  useEffect(() => {
    const doc = document as Document & {
      modelContext?: {
        registerTool: (
          tool: unknown,
          options: { signal: AbortSignal },
        ) => void | Promise<void>;
      };
    };
    if (!doc.modelContext?.registerTool) return;
    const controller = new AbortController();
    const register = (tool: unknown) => {
      try {
        Promise.resolve(
          doc.modelContext!.registerTool(tool, { signal: controller.signal }),
        ).catch(() => {});
      } catch {}
    };
    register({
      name: "read_streamcheck_workspace",
      description:
        "Read the current browser-local report counts and visible workspace section. Does not export private notes.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: true, untrustedContentHint: false },
      execute: () => {
        const s = stateRef.current;
        return {
          section: s.tab,
          total: s.records.length,
          synthetic: s.records.filter((r) => r.original.synthetic).length,
          awaitingReview: s.records.filter(
            (r) => r.status === "awaiting_review",
          ).length,
        };
      },
    });
    register({
      name: "start_stream_observation",
      description:
        "Open the observation form without submitting, changing, or confirming a report.",
      inputSchema: {
        type: "object",
        properties: {},
        additionalProperties: false,
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      execute: async (input: unknown) => {
        if (!input || typeof input !== "object" || Object.keys(input).length)
          throw new Error("Expected an empty object");
        setTab("observe");
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
        );
        return { section: "observe", submitted: false };
      },
    });
    return () => controller.abort();
  }, []);
  const active = records.find((r) => r.id === selectedId),
    pending = assessment?.issues.find((i) => i.decision === "pending"),
    awaiting = records.filter((r) => r.status === "awaiting_review").length,
    reviewed = records.filter((r) => r.status === "reviewed").length;
  const go = (value: string) => {
    setTab(value);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const reset = () => {
    draftEpoch.current += 1;
    setDraftRevision(draftEpoch.current);
    setBusy(false);
    setCaptureBusy(false);
    setReferenceLoading("");
    setField(newField());
    setDraft(empty);
    setWhen(localTime());
    setStage(0);
    setAssessment(null);
    setSnapshot(null);
    setConfirm(false);
    setFormError("");
    go("observe");
  };
  async function reviewReference(photo: ReferencePhoto) {
    if (referenceLoading) return;
    reset();
    const epoch = draftEpoch.current;
    const reference = createReferenceDraft(photo);
    setDraft(reference.draft);
    setField(reference.field);
    setWhen(photo.capturedDate);
    setUseAI(false);
    setReferenceLoading(photo.id);
    try {
      const response = await fetch(photo.src, { signal: AbortSignal.timeout(15000) });
      if (!response.ok) throw new Error("The reference photo could not be loaded. Reconnect and try again.");
      const blob = await response.blob();
      if (await hashBlob(blob) !== photo.sha256) throw new Error("The photo did not match its source digest. No image was retained.");
      const info = await inspectImage(blob);
      if (epoch !== draftEpoch.current) return;
      const media = { id: crypto.randomUUID(), kind: "photo" as const, mime: blob.type, bytes: blob.size,
        sha256: photo.sha256, createdAt: new Date().toISOString(), origin: "public_reference" as const,
        filename: `${photo.id}.jpg`, ...info };
      await addMediaBatch([{ id: media.id, blob }]);
      if (epoch !== draftEpoch.current) return;
      setField({ ...reference.field, media: [media] });
    } catch (error) {
      if (epoch === draftEpoch.current) {
        setField(newField()); setDraft(empty); setWhen(localTime());
        setFormError(error instanceof Error ? error.message : "The photo could not be retained. Try again from the Field kit.");
      }
    } finally { if (epoch === draftEpoch.current) setReferenceLoading(""); }
  }
  async function analyze() {
    if (busy) return;
    const epoch = draftEpoch.current;
    if (captureBusy || referenceLoading) { setFormError("Wait for the image operation to finish before continuing."); return; }
    setFormError("");
    let observedAt = "";
    try {
      observedAt = field.reference?.capturedDate ?? new Date(when).toISOString();
    } catch {
      setFormError("Choose the actual date and time of the observation.");
      return;
    }
    const input = {
      ...draft,
      observedAt,
      synthetic:
        draft.synthetic || field.media.some((m) => m.origin === "illustration"),
    };
    if (
      !input.site.trim() ||
      !input.note.trim() ||
      !validObservationTime(observedAt)
    ) {
      setFormError(
        "Add a location, a note, and a valid observation time that is not in the future.",
      );
      return;
    }
    setBusy(true);
    try {
      let result: Assessment;
      if (useAI && aiReady) {
        const r = await fetch("/api/assess", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ observation: input, useAI: true }),
          signal: AbortSignal.timeout(22000),
        });
        if (!r.ok) throw new Error();
        result = reportSchema.shape.assessment.parse(await r.json());
      } else result = assess(input);
      if (epoch !== draftEpoch.current) return;
      setSnapshot(structuredClone(input));
      setAssessment(result);
      setStage(result.issues.length ? 1 : 2);
      setConfirm(false);
      setAnswer("");
    } catch {
      if (epoch !== draftEpoch.current) return;
      const result = assess(input);
      setSnapshot(structuredClone(input));
      setAssessment({
        ...result,
        notice: "Connection unavailable. Local rule-based checks were used.",
      });
      setStage(result.issues.length ? 1 : 2);
    } finally {
      if (epoch === draftEpoch.current) {
        setBusy(false);
        sectionRef.current?.focus();
      }
    }
  }
  function decision(value: Issue["decision"]) {
    if (!assessment || !pending) return;
    try {
      const next = decideIssue(assessment, pending.id, value, answer);
      setAssessment(next);
      setAnswer("");
      if (!next.issues.some((i) => i.decision === "pending")) setStage(2);
      setFormError("");
    } catch (e) {
      setFormError((e as Error).message);
    }
  }
  function submit() {
    if (!snapshot || !assessment || !confirm) return;
    try {
      const unanswered = fieldQuestions(field, snapshot.appearance).some(
        (q) => !field.followups.find((a) => a.question === q)?.answer.trim(),
      );
      if (unanswered)
        throw new Error(
          "Answer each evidence follow-up, including when you are unsure.",
        );
      if (records.length >= MAX_REPORTS) throw new Error("Workspace limit reached. Export your field pack before collecting more records.");
      const report = reportSchema.parse({
        ...createReport(snapshot, assessment),
        field: structuredClone(field),
      });
      assertReferenceRecord(report);
      if (!realRecords([report]).length) throw new Error("Only real observations can be saved. Start a fresh field note.");
      setRecords((prev) => [report, ...prev]);
      setSelectedId(report.id);
      setStage(0);
      setDraft(empty);
      setField(newField());
      setWhen(localTime());
      setAssessment(null);
      setSnapshot(null);
      setConfirm(false);
      setReviewNote("");
      go("review");
      toast.success("Observation saved with its evidence trail");
    } catch (e) {
      setFormError((e as Error).message);
    }
  }
  function review(status: "reviewed" | "needs_information") {
    if (!active) return;
    try {
      const next = reviewReport(active, status, reviewNote);
      setRecords((prev) => prev.map((r) => (r.id === next.id ? next : r)));
      setReviewNote("");
      toast.success(
        status === "reviewed"
          ? "Review recorded"
          : "Information request recorded locally",
      );
    } catch (e) {
      toast.error((e as Error).message);
    }
  }
  const openReport = useCallback((id: string) => {
    setSelectedId(id);
    setReviewNote("");
  }, []);
  const list = searchReports(records, search, filter);
  function importRecords(incoming: Report[]) {
    if (storageError) throw new Error("Resolve the workspace storage error before importing.");
    const stored = localStorage.getItem(KEY);
    const current = stored ? realRecords(parseWorkspace(JSON.parse(stored))) : stateRef.current.records;
    const next = mergeRecords(current, incoming).records;
    localStorage.setItem(KEY, JSON.stringify(next));
    setRecords(next);
  }
  return (
    <div className="app-shell">
      <a href="#workspace-content" className="skip-link">
        Skip to workspace
      </a>
      <Toaster position="bottom-right" />
      <header className="topbar">
        <button
          className="brand"
          onClick={() => go("overview")}
          aria-label="AquaLens overview"
        >
          <span className="brand-mark">
            <Waves size={24} />
          </span>
          <span className="brand-wordmark">Aqua<span>Lens</span></span>
          <span className="brand-caption">
            RIVER EVIDENCE
            <br />
            HUMAN JUDGMENT
          </span>
        </button>
        <div className="header-right">
          <span className="workspace-label">
            <span className="live-dot" />{" "}
            {online ? "Local workspace" : "Offline · local rules"}
          </span>
          <button className="btn primary small" onClick={reset} aria-label="New observation">
            <Plus size={17} />
            <span className="header-action-label">New observation</span>
            <span className="header-action-compact">Observe</span>
          </button>
        </div>
      </header>
      <Tabs value={tab} onValueChange={go}>
        <div className="navline">
          <TabsList className="main-nav" variant="line">
            <TabsTrigger value="overview">
              <Compass size={16} /> Mission control
            </TabsTrigger>
            <TabsTrigger value="observe">
              <Leaf size={16} /> Field notebook
            </TabsTrigger>
            <TabsTrigger value="review">
              <ClipboardCheck size={16} /> Review desk{" "}
              <span className="nav-count">{awaiting}</span>
            </TabsTrigger>
            <TabsTrigger value="lab">
              <FlaskConical size={16} /> Evidence lab
            </TabsTrigger>
            <TabsTrigger value="atlas">
              <Waves size={16} /> River observatory
            </TabsTrigger>
            <TabsTrigger value="insights"><ChartNoAxesCombined size={16} /> Insights</TabsTrigger>
            <TabsTrigger value="kit"><Backpack size={16} /> Field kit</TabsTrigger>
          </TabsList>
          <span className="track-label">
            ONEAQUAHEALTH CHALLENGE <span>TRACK 03</span>
          </span>
        </div>
        <main id="workspace-content" className="main">
          {storageError && (
            <div className="notice error" role="alert"><p>{storageError}</p><button className="plain-btn" onClick={() => {
              const saved = localStorage.getItem(KEY);
              if (saved) downloadFile(saved, "aqualens-workspace-recovery.json");
              else toast.error("No saved workspace file is available.");
            }}>Download saved data for recovery</button></div>
          )}
          <TabsContent value="overview" className="view-enter">
            <MissionControl records={records} aiReady={aiReady} online={online} onStart={reset}
              onReviewReference={(photo) => void reviewReference(photo)} onOpen={openReport}
              onUpdate={(next) => { setRecords((previous) => previous.map((record) => record.id === next.id ? next : record)); toast.success("Visual note saved. Review reopened."); }}
              onInsights={() => go("insights")} onKit={() => go("kit")} />
          </TabsContent>
          <TabsContent value="insights" className="view-enter">
            <EvidenceInsights records={records} onOpen={openReport} onStart={() => go("kit")} />
          </TabsContent>

          <TabsContent value="observe" className="view-enter">
            <Heading
              eyebrow="THE FIELD NOTEBOOK"
              title={field.reference ? "Read the photograph. Keep the source." : "Start with what you noticed."}
              description="Your words are the evidence. We’ll help make the questions clearer."
              action={
                <Tag tone="green">{field.reference ? "Historical photo review" : "Your own observation"}</Tag>
              }
            />
            {field.reference && <ReferenceCredit reference={field.reference} />}
            {referenceLoading && <p className="notice" role="status">Preparing the source image and its digest…</p>}
            {stage === 0 && !referenceLoading && (
              <FieldStudio
                key={draftRevision}
                value={field}
                onChange={updateField}
                aiReady={aiReady && online}
                onBusy={updateCaptureBusy}
              />
            )}
            <div className="stepper" aria-label="Observation progress">
              {["Observe", "Clarify", "Confirm"].map((s, i) => (
                <div
                  className={
                    i === stage
                      ? "step active"
                      : i < stage
                        ? "step done"
                        : "step"
                  }
                  key={s}
                >
                  <span>
                    {i < stage ? (
                      <Check size={16} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  {s}
                  {i < 2 && <div className="step-line" />}
                </div>
              ))}
            </div>
            <div className="capture-grid">
              <section className="panel capture" ref={sectionRef} tabIndex={-1}>
                {stage === 0 && !referenceLoading && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void analyze();
                    }}
                  >
                    <div className="panel-title">
                      <h2>{field.reference ? "What is visible in this frame?" : "A moment by the stream"}</h2>
                      <Compass size={23} />
                    </div>
                    <p className="subtext">
                      {field.reference ? "Describe only what the photograph shows. Keep causes, measurements and current conditions unknown." : "Observe from a safe, accessible place. Describe only what you noticed."}
                    </p>
                    <div className="form-grid">
                      <label>
                        Stream or landmark
                        <input
                          required
                          maxLength={160}
                          readOnly={!!field.reference}
                          value={draft.site}
                          onChange={(e) =>
                            setDraft({ ...draft, site: e.target.value })
                          }
                          placeholder="e.g. The footbridge at Brookside"
                        />
                      </label>
                      <label>
                        {field.reference ? "Photograph source date" : "Observation time"}
                        <input
                          required
                          type={field.reference ? "date" : "datetime-local"}
                          readOnly={!!field.reference}
                          value={when}
                          max={field.reference ? undefined : localTime()}
                          onChange={(e) => setWhen(e.target.value)}
                        />
                        <small>{field.reference ? "Date supplied by the source. Exact time is not asserted." : "Your device’s local time zone"}</small>
                      </label>
                    </div>
                    <label className="field">
                      {field.reference ? "What can you see in this historical photograph?" : "What did you directly observe?"}
                      <textarea
                        required
                        maxLength={4000}
                        rows={5}
                        value={draft.note}
                        onChange={(e) =>
                          setDraft({ ...draft, note: e.target.value })
                        }
                        placeholder={field.reference ? "Describe visible details in your own words. What is obscured or uncertain?" : "The water looked brown beside the footbridge. I saw leaves collecting near the bank. I don’t know what caused the color."}
                      />
                      <span className="field-hint">
                        Details, uncertainty, and context are all useful.{" "}
                        <span>{draft.note.length}/4000</span>
                      </span>
                    </label>
                    <VoiceNote
                      key={draftRevision}
                      onAdopt={(text) =>
                        draftEpoch.current === draftRevision && setDraft((d) => ({
                          ...d,
                          note: `${d.note}${d.note ? "\n" : ""}${text}`.slice(
                            0,
                            4000,
                          ),
                        }))
                      }
                    />
                    {!field.reference && <><FieldDetails key={draftRevision} value={field} onChange={updateField} /><OneHealthNotes value={field} onChange={updateField} /></>}
                    {field.followupOf && <p className="micro-copy">Follow-up to record {field.followupOf}. Record a fresh observation; previous readings and coordinates have not been copied.</p>}
                    <div className="form-grid">
                      <div className="field">
                        <label id="appearance-label">Water appearance</label>
                        <Select
                          value={draft.appearance}
                          onValueChange={(v) =>
                            setDraft({
                              ...draft,
                              appearance: v as ObservationInput["appearance"],
                            })
                          }
                        >
                          <SelectTrigger
                            aria-labelledby="appearance-label"
                            className="field-select"
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {appearanceValues.map((v) => (
                              <SelectItem key={v} value={v}>
                                {v === "unsure"
                                  ? "Not observed / unsure"
                                  : v.charAt(0).toUpperCase() + v.slice(1)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <small>
                          A reported appearance, not a quality rating
                        </small>
                      </div>

                    </div>
                    <div className="ai-option">
                      <div className="ai-option-top">
                        <Sparkles size={20} />
                        <div>
                          <strong>
                            {aiReady
                              ? "Gemini clarification is configured"
                              : "Guided checks are ready"}
                          </strong>
                          <p>
                            {aiReady
                              ? "Optional AI support, always with your confirmation."
                              : "Runs locally. Live Gemini is waiting for a server-side key."}
                          </p>
                        </div>
                        <Tag tone={aiReady ? "green" : "neutral"}>
                          {aiReady ? "Configured" : "Rules mode"}
                        </Tag>
                      </div>
                      {aiReady && (
                        <label className="check-label">
                          <Checkbox
                            checked={useAI}
                            onCheckedChange={(v) => setUseAI(v === true)}
                          />{" "}
                          Send this observation to Gemini for additional
                          clarification. Avoid personal data; Google’s free tier
                          may use inputs to improve its products.
                        </label>
                      )}
                    </div>
                    {formError && (
                      <p className="notice error" role="alert">
                        {formError}
                      </p>
                    )}
                    <button
                      className="btn primary full"
                      disabled={busy}
                      type="submit"
                    >
                      {busy ? (
                        <LoaderCircle className="spin" size={18} />
                      ) : (
                        <Sparkles size={18} />
                      )}{" "}
                      {busy
                        ? "Checking the evidence…"
                        : "Find the questions worth asking"}
                      <ArrowRight size={17} />
                    </button>
                  </form>
                )}
                {stage === 1 && assessment && pending && (
                  <div className="clarification view-enter" key={pending.id}>
                    <div className="panel-title">
                      <Tag tone="amber">
                        <CircleHelp size={14} /> A QUESTION, NOT A VERDICT
                      </Tag>
                      <span className="micro-copy">
                        {assessment.issues.filter(
                          (i) => i.decision !== "pending",
                        ).length + 1}{" "}
                        of {assessment.issues.length}
                      </span>
                    </div>
                    <h2>{pending.title}</h2>
                    <p>{pending.detail}</p>
                    <blockquote>
                      <span>
                        FROM YOUR ORIGINAL {pending.field.toUpperCase()}
                      </span>
                      {pending.quote || "No value supplied"}
                    </blockquote>
                    <label>
                      {pending.question}
                      <textarea
                        maxLength={2000}
                        rows={3}
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="Add what you know. Leave what you don’t."
                      />
                    </label>
                    <p className="field-hint">
                      Your answer is appended. Your original note stays intact.
                    </p>
                    {formError && (
                      <p className="notice error" role="alert">
                        {formError}
                      </p>
                    )}
                    <div className="button-row">
                      <button
                        className="btn primary"
                        disabled={!answer.trim()}
                        onClick={() => decision("answered")}
                      >
                        <Check size={17} /> Confirm clarification
                      </button>
                      <button
                        className="btn secondary"
                        onClick={() => decision("uncertain")}
                      >
                        Keep as uncertain
                      </button>
                    </div>
                    <button
                      className="plain-btn subdued"
                      onClick={() => decision("dismissed")}
                    >
                      This question doesn’t apply
                    </button>
                    <p className="source-note">{assessment.notice}</p>
                  </div>
                )}
                {stage === 2 && snapshot && assessment && (
                  <div className="confirmation view-enter">
                    <span className="completion-icon">
                      <CheckCheck size={28} />
                    </span>
                    <h2>Your observation. Your confirmation.</h2>
                    <p className="subtext">
                      Check the record before it enters the review desk.
                    </p>
                    <div className="confirmation-summary">
                      <span>
                        <MapPin size={16} />
                        {snapshot.site}
                      </span>
                      <span>
                        <Clock3 size={16} />
                        {displayTime(snapshot.observedAt)}
                      </span>
                      <span>
                        <Eye size={16} />
                        {snapshot.appearance} appearance · {field.reference ? "photo reviewer selected" : "citizen reported"}
                      </span>
                    </div>
                    <blockquote>
                      <span>ORIGINAL NOTE · RETAINED EXACTLY</span>
                      {snapshot.note}
                    </blockquote>
                    <div className="clarification-receipts">
                      {assessment.issues.map((i) => (
                        <div key={i.id}>
                          <span className="receipt-marker">
                            <Check size={14} />
                          </span>
                          <div>
                            <strong>{i.title}</strong>
                            <p>
                              {i.answer ||
                                (i.decision === "uncertain"
                                  ? "Uncertainty explicitly retained"
                                  : "Citizen marked this question as not applicable")}
                            </p>
                            <small>
                              {i.decision} · {i.source} suggestion
                            </small>
                          </div>
                        </div>
                      ))}
                    </div>
                    {!assessment.issues.length && (
                      <p className="notice success">
                        No text clarification was flagged. This does not establish
                        accuracy or environmental safety.
                      </p>
                    )}
                    <VisualFollowups
                      field={field}
                      appearance={snapshot.appearance}
                      onChange={(v) => {
                        setField(v);
                        setConfirm(false);
                      }}
                    />
                    <OneHealthSummary field={field} />
                    <QualityScore
                      report={{ original: snapshot, assessment, field }}
                    />
                    <label className="check-label confirm-check">
                      <Checkbox
                        checked={confirm}
                        onCheckedChange={(v) => setConfirm(v === true)}
                      />{" "}
                      {field.reference ? "I confirm this is my review of the credited historical photo, not a new field observation. Uncertainty remains visible." : "I confirm this record reflects my observation. Unverified claims and uncertainty remain visible for review."}
                    </label>
                    {formError && (
                      <p className="notice error" role="alert">
                        {formError}
                      </p>
                    )}
                    <button
                      className="btn primary full"
                      disabled={!confirm}
                      onClick={submit}
                    >
                      Save observation for review <ArrowRight size={18} />
                    </button>
                    <button
                      className="plain-btn subdued"
                      onClick={() => {
                        setStage(0);
                        setConfirm(false);
                      }}
                    >
                      Return to original draft
                    </button>
                  </div>
                )}
              </section>
              <aside className="capture-aside">
                <section className="dark-card">
                  <Fingerprint size={32} />
                  <h3>Evidence has a memory.</h3>
                  <p>
                    We keep your original note, every clarification, and each
                    review decision together.
                  </p>
                  <div className="vertical-steps">
                    <span>
                      <b>01</b> Your original observation
                    </span>
                    <span>
                      <b>02</b> A question with a reason
                    </span>
                    <span>
                      <b>03</b> Your explicit confirmation
                    </span>
                    <span>
                      <b>04</b> An inspectable review trail
                    </span>
                  </div>
                </section>
                <CaptureGuide compact />
              </aside>
            </div>
          </TabsContent>

          <TabsContent value="review" className="view-enter">
            <Heading
              eyebrow="THE HUMAN REVIEW DESK"
              title="Follow the evidence."
              description="Read the original. Inspect the uncertainty. Record your judgment."
              action={
                <Tag>
                  <ShieldCheck size={14} /> Demo reviewer · no separate account
                </Tag>
              }
            />
            <div className="review-summary">
              <div>
                <strong>{awaiting}</strong>
                <span>Awaiting review</span>
              </div>
              <div>
                <strong>{reviewed}</strong>
                <span>Reviews recorded</span>
              </div>
              <div>
                <Fingerprint />
                <span>
                  Original evidence
                  <br />
                  <b>always retained</b>
                </span>
              </div>
            </div>
            <div className="section-heading">
              <h2>Observation records <span className="result-count">{list.length}</span></h2>
              <label className="record-search"><Search size={17} /><input type="search" aria-label="Search observations" placeholder="Search sites, notes or record IDs" value={search} onChange={(event) => setSearch(event.target.value)} /></label>
              <Select value={filter} onValueChange={setFilter}>
                <SelectTrigger
                  className="filter-select"
                  aria-label="Filter reports"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All records</SelectItem>
                  <SelectItem value="awaiting_review">
                    Awaiting review
                  </SelectItem>
                  <SelectItem value="needs_information">
                    More information
                  </SelectItem>
                  <SelectItem value="reviewed">Reviewed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="review-grid">
              {list.map((r) => (
                <button
                  key={r.id}
                  className="panel review-card"
                  onClick={() => openReport(r.id)}
                >
                  <div className="panel-title">
                    <span className="site-icon">
                      <Waves size={22} />
                    </span>
                    <Tag tone={r.status === "reviewed" ? "green" : "amber"}>
                      {labels[r.status]}
                    </Tag>
                  </div>
                  <h3>{r.original.site}</h3>
                  <p className="review-excerpt">{r.original.note}</p>
                  <div className="review-card-meta">
                    <span>
                      {r.assessment.issues.length} clarification
                      {r.assessment.issues.length !== 1 ? "s" : ""}
                    </span>
                    <Tag>
                      {r.field?.reference ? "Historical photo review" : "Citizen report"}
                    </Tag>
                  </div>
                  <div className="review-card-bottom">
                    <span>
                      {new Date(r.original.observedAt).toLocaleDateString(
                        "en-GB",
                        { timeZone: "UTC" },
                      )}
                    </span>
                    <span>
                      Inspect evidence <ArrowUpRight size={16} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
            {!list.length && (
              <div className="empty-state">
                <ClipboardCheck size={38} />
                <h3>No records in this view</h3>
                <p>Choose another filter or record an observation.</p>
              </div>
            )}
            <p className="privacy-note">
              Records stay in this browser. A review is a workflow decision, not
              scientific validation. Information requests are recorded locally;
              no messages are sent.
            </p>
          </TabsContent>

          <TabsContent value="kit" className="view-enter">
            <ReferenceGallery onReview={(photo) => void reviewReference(photo)} loading={referenceLoading} />
            <FieldGuide onStart={reset} />
            <CollectionTools records={records} onImport={importRecords} disabled={!loaded || !!storageError} />
          </TabsContent>
          <TabsContent value="lab" className="view-enter">
            <EvidenceLab records={records} onOpen={openReport} />
          </TabsContent>
          <TabsContent value="atlas" className="view-enter">
            {records.some((r) => r.field?.reference) && <p className="notice">Historical photo reviews are available in the Review desk and Evidence lab. The river observatory contains field observations only.</p>}
            <StreamAtlas
              reports={records.filter((r) => !r.field?.reference)}
              onOpen={openReport}
              onMission={(source) => {
                reset();
                const followup = createFollowupDraft(source);
                setDraft(followup.draft);
                setField(followup.field);
              }}
            />
          </TabsContent>
        </main>
      </Tabs>
      <footer className="footer">
        <span>
          <Waves size={17} /> AquaLens <span className="footer-divider">/</span>{" "}
          Care for the water. Care for the evidence.
        </span>
        <span>Independent OneAquaHealth hackathon prototype · Track 03</span>
      </footer>
      <Sheet
        open={!!active}
        onOpenChange={(open) => {
          if (!open) setSelectedId(null);
        }}
      >
        <SheetContent className="evidence-sheet">
          <SheetHeader>
            <p className="eyebrow">OBSERVATION / EVIDENCE RECORD</p>
            <SheetTitle>{active?.original.site}</SheetTitle>
            <SheetDescription>
              Original evidence and every decision, together.
            </SheetDescription>
          </SheetHeader>
          {active && (
            <div className="sheet-body">
              <div className="button-row">
                <Tag tone={active.status === "reviewed" ? "green" : "amber"}>
                  {labels[active.status]}
                </Tag>
                <Tag>
                  {active.field?.reference ? "Historical photo review" : "Citizen report"}
                </Tag>
                <button
                  className="plain-btn export-btn"
                  onClick={() => download(active)}
                >
                  <ArrowDownToLine size={15} /> Export JSON
                </button>
              </div>
              <section className="evidence-section">
                <div className="section-label">
                  <span>01</span>
                  <h3>What was observed</h3>
                  <Tag>Original · unedited</Tag>
                </div>
                <blockquote>{active.original.note}</blockquote>
                <dl className="evidence-fields">
                  <div>
                    <dt>Location</dt>
                    <dd>{active.original.site}</dd>
                  </div>
                  <div>
                    <dt>{active.field?.reference ? "Source date" : "Observed"}</dt>
                    <dd>{displayTime(active.original.observedAt)}</dd>
                  </div>
                  <div>
                    <dt>Appearance</dt>
                    <dd>{active.original.appearance} · {active.field?.reference ? "photo reviewer selected" : "citizen reported"}</dd>
                  </div>
                </dl>
              </section>
              <EvidenceReceipt
                report={active}
                onUpdate={(next) =>
                  setRecords((prev) =>
                    prev.map((r) => (r.id === next.id ? next : r)),
                  )
                }
              />
              <section className="evidence-section">
                <div className="section-label">
                  <span>02</span>
                  <h3>Questions & clarifications</h3>
                </div>
                <p className="source-note">{active.assessment.notice}</p>
                {active.assessment.issues.map((i) => (
                  <div className="evidence-issue" key={i.id}>
                    <div>
                      <strong>{i.title}</strong>
                      <Tag tone="amber">{i.decision}</Tag>
                    </div>
                    <p>{i.detail}</p>
                    <blockquote>{i.quote}</blockquote>
                    {i.answer && (
                      <div className="citizen-answer">
                        <span>CITIZEN CLARIFICATION · UNVERIFIED</span>
                        <p>{i.answer}</p>
                      </div>
                    )}
                    {!i.answer && (
                      <p className="micro-copy">
                        No additional factual evidence supplied.
                      </p>
                    )}
                  </div>
                ))}
                {!active.assessment.issues.length && (
                  <p className="subtext">
                    No clarification was flagged by the checks used. That does
                    not verify the observation.
                  </p>
                )}
              </section>
              <section className="evidence-section">
                <div className="section-label">
                  <span>03</span>
                  <h3>The human decision</h3>
                </div>
                <p className="micro-copy">
                  Demo reviewer role. A review records judgment; it does not
                  certify environmental conditions.
                </p>
                <label>
                  Review note
                  <textarea
                    rows={3}
                    maxLength={2000}
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="Record what you checked and what remains unknown."
                  />
                </label>
                <div className="button-row">
                  <button
                    className="btn primary"
                    disabled={!reviewNote.trim()}
                    onClick={() => review("reviewed")}
                  >
                    <ClipboardCheck size={17} /> Record review
                  </button>
                  <button
                    className="btn secondary"
                    disabled={!reviewNote.trim()}
                    onClick={() => review("needs_information")}
                  >
                    Request more detail
                  </button>
                </div>
              </section>
              <section className="evidence-section">
                <div className="section-label">
                  <span>04</span>
                  <h3>Evidence trail</h3>
                </div>
                <div className="audit-trail">
                  {active.history.map((event, i) => (
                    <div key={`${event.at}-${i}`}>
                      <span className="audit-point" />
                      <div>
                        <strong>{event.action.replaceAll("_", " ")}</strong>
                        <p>{event.detail}</p>
                        <small>{displayTime(event.at)}</small>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="micro-copy">
                  Browser-local history; exportable, but not tamper-proof.
                </p>
              </section>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
