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
  ChevronRight,
  CircleHelp,
  ClipboardCheck,
  Clock3,
  CloudRain,
  Compass,
  Eye,
  FileText,
  Fingerprint,
  FlaskConical,
  GitBranch,
  Leaf,
  LoaderCircle,
  MapPin,
  Plus,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Waves,
  Wind,
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
import { sampleReports, scenarios } from "@/lib/fixtures";
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
import { newField, createFollowupDraft, fieldQuestions, fieldSchema, downloadFile, type FieldEvidence } from "@/lib/field";

const KEY = "streamcheck-workspace-v1";
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
function displayTime(value: string) {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
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

type Weather = {
  interval: number;
  city: string;
  temperature: number;
  rain: number;
  wind: number;
  time: string;
  fetchedAt: string;
  source: string;
};
function Conditions() {
  const [weather, setWeather] = useState<Weather | null>(null),
    [busy, setBusy] = useState(true),
    [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      const r = await fetch("/api/conditions", {
        signal: AbortSignal.timeout(12000),
      });
      if (!r.ok) throw new Error();
      setWeather(await r.json());
    } catch {
      setError(
        "Current conditions unavailable. No values have been estimated.",
      );
    } finally {
      setBusy(false);
    }
  }, []);
  useEffect(() => {
    // Start the external weather subscription once the browser mounts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
    const timer = setInterval(refresh, 300000);
    return () => clearInterval(timer);
  }, [refresh]);
  return (
    <section className="panel conditions">
      <div className="panel-title">
        <div>
          <span className="eyebrow">REGIONAL CONTEXT</span>
          <h3>Coimbra, Portugal</h3>
        </div>
        <button
          className="icon-btn"
          aria-label="Refresh current weather"
          onClick={refresh}
          disabled={busy}
        >
          <RefreshCw size={17} className={busy ? "spin" : ""} />
        </button>
      </div>
      <div className="weather-reading">
        <CloudRain size={36} />
        <strong>{weather ? `${Math.round(weather.temperature)}°` : "—"}</strong>
        <span>
          Air temperature
          <br />
          <small>Modeled current conditions</small>
        </span>
      </div>
      <div className="weather-pair">
        <span>
          <CloudRain size={16} /> {weather ? `${weather.rain} mm` : "—"}{" "}
          <small>
            precipitation / {weather ? weather.interval / 60 : "—"} min
          </small>
        </span>
        <span>
          <Wind size={16} /> {weather ? `${weather.wind} km/h` : "—"}{" "}
          <small>wind</small>
        </span>
      </div>
      {error ? (
        <p className="notice error">{error}</p>
      ) : (
        <p className="micro-copy">
          {weather
            ? `Source time: ${weather.time.replace("T", " ")} UTC · Refreshes every 5 min`
            : "Connecting to Open-Meteo…"}
        </p>
      )}
      <div className="source-line">
        <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">
          Open-Meteo · CC BY 4.0 <ArrowUpRight size={12} />
        </a>
        <span>Weather ≠ water quality</span>
      </div>
    </section>
  );
}

export default function StreamCheck() {
  const [field, setField] = useState<FieldEvidence>(newField);
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [captureBusy, setCaptureBusy] = useState(false);
  const draftEpoch = useRef(0);
  const [draftRevision, setDraftRevision] = useState(0);
  const [online, setOnline] = useState(true);
  const [tab, setTab] = useState("overview"),
    [records, setRecords] = useState<Report[]>(sampleReports),
    [loaded, setLoaded] = useState(false),
    [storageError, setStorageError] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(null),
    [reviewNote, setReviewNote] = useState(""),
    [filter, setFilter] = useState("all");
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
        if (typeof d.when === "string" && d.when.length <= 30) {
          setDraft(restored); setField(restoredField); setWhen(d.when);
        }
      }
    } catch { toast.error("A saved draft could not be restored. Existing confirmed reports are unaffected."); }
    setDraftLoaded(true);
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (!Array.isArray(parsed) || parsed.length > 500) throw new Error();
        setRecords(parsed.map((r) => reportSchema.parse(r) as Report));
      }
    } catch {
      setStorageError(
        "Saved records could not be read. Sample records are shown; the saved data has not been overwritten.",
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
      if (e.key !== KEY || !e.newValue) return;
      try {
        const parsed = JSON.parse(e.newValue);
        if (Array.isArray(parsed) && parsed.length <= 500)
          setRecords(parsed.map((r) => reportSchema.parse(r) as Report));
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
  const loadScenario = (index: number) => {
    draftEpoch.current += 1;
    setDraftRevision(draftEpoch.current);
    setBusy(false);
    setCaptureBusy(false);
    setField(newField());
    setDraft({ ...scenarios[index].input });
    setWhen(localTime(new Date(scenarios[index].input.observedAt)));
    setStage(0);
    setAssessment(null);
    setSnapshot(null);
    setConfirm(false);
    setFormError("");
    go("observe");
    toast("Synthetic scenario loaded", {
      description:
        "Every saved record from this example stays labeled synthetic.",
    });
  };
  async function analyze() {
    if (busy) return;
    const epoch = draftEpoch.current;
    if (captureBusy) { setFormError("Wait for the image operation to finish before continuing."); return; }
    setFormError("");
    let observedAt = "";
    try {
      observedAt = new Date(when).toISOString();
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
        result = await r.json();
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
      const report = {
        ...createReport(snapshot, assessment),
        field: structuredClone(field),
      };
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
  const list =
    filter === "all" ? records : records.filter((r) => r.status === filter);
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
            THE FIELD WORKSPACE
            <br />
            EVIDENCE IN FOCUS
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
              <Compass size={16} /> Overview
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
          </TabsList>
          <span className="track-label">
            ONEAQUAHEALTH CHALLENGE <span>TRACK 03</span>
          </span>
        </div>
        <main id="workspace-content" className="main">
          {storageError && (
            <p className="notice error" role="alert">
              {storageError}
            </p>
          )}
          <TabsContent value="overview" className="view-enter">
            <div className="overview-heading">
              <p className="eyebrow">
                YOUR FIELD WORKSPACE / ONEAQUAHEALTH
              </p>
              <span className="overview-state"><span className="live-dot" /> Citizen science, with care.</span>
            </div>
            <section className="hero">
              <div className="hero-image" />
              <div className="hero-shade" />
              <div className="hero-content">
                <Tag tone="glass">
                  <Waves size={14} /> A CLOSER LOOK AT OUR WATER
                </Tag>
                <h1>
                  A closer look.
                  <br />
                  <em>A clearer record.</em>
                </h1>
                <p>
                  Observe what is visible. Keep what is uncertain.
                  <br />
                  Build evidence a human can review.
                </p>
                <div className="hero-actions">
                  <button className="btn mint" onClick={reset}>
                    Make an observation <ArrowUpRight size={18} />
                  </button>
                  <button className="hero-link" onClick={() => loadScenario(0)}>
                    Explore a sample <ArrowRight size={16} />
                  </button>
                </div>
              </div>
              <aside className="hero-workflow" aria-label="Observation workspace shortcuts">
                <div className="hero-workflow-heading">
                  <span className="workflow-emblem"><Fingerprint size={24} /></span>
                  <div><p>EVIDENCE, CONNECTED</p><span>Your observation workspace</span></div>
                </div>
                <button className="hero-workflow-row" onClick={reset}>
                  <span className="workflow-index">01</span>
                  <span><strong>Observe</strong><small>Capture the scene and your field note</small></span>
                  <ArrowUpRight size={17} />
                </button>
                <button className="hero-workflow-row" onClick={() => go("review")}>
                  <span className="workflow-index">02</span>
                  <span><strong>Review</strong><small>Inspect sources. Record your judgment.</small></span>
                  <ArrowUpRight size={17} />
                </button>
                <button className="hero-workflow-row" onClick={() => go("atlas")}>
                  <span className="workflow-index">03</span>
                  <span><strong>Connect</strong><small>Explore streams and their evidence stories</small></span>
                  <ArrowUpRight size={17} />
                </button>
                <div className="hero-workflow-footer"><span>{records.length} local records</span><span>{awaiting} awaiting review</span></div>
              </aside>
              <span className="image-caption">
                Illustrative artwork · not a monitored location
              </span>
            </section>
            <div className="metrics">
              <Metric
                icon={<FileText />}
                value={records.length}
                label="Observations in this browser"
                detail={`${records.filter((r) => r.original.synthetic).length} synthetic examples included`}
              />
              <Metric
                icon={<CircleHelp />}
                value={records.reduce(
                  (n, r) => n + r.assessment.issues.length,
                  0,
                )}
                label="Questions made visible"
                detail="Uncertainty preserved in reports"
              />
              <Metric
                icon={<ClipboardCheck />}
                value={awaiting}
                label="Awaiting a human review"
                detail="Your next opportunity to contribute"
              />
              <Metric
                icon={<Fingerprint />}
                value={`${records.length ? 100 : 0}%`}
                label="Original notes retained"
                detail="Retention, not an accuracy score"
              />
            </div>
            <div className="content-grid">
              <div>
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">THE FIELD NOTEBOOK</p>
                    <h2>Small details. A bigger picture.</h2>
                  </div>
                  <button className="plain-btn" onClick={() => go("review")}>
                    View all <ArrowRight size={16} />
                  </button>
                </div>
                <div className="observation-list">
                  {records.slice(0, 3).map((r, i) => (
                    <button
                      className="observation-row"
                      key={r.id}
                      onClick={() => openReport(r.id)}
                      style={{ animationDelay: `${i * 75}ms` }}
                    >
                      <span className={`site-icon site-${i % 3}`}>
                        <Waves size={24} />
                      </span>
                      <div className="observation-info">
                        <div className="row-title">
                          <h3>{r.original.site}</h3>
                          {r.original.synthetic && <Tag>Sample</Tag>}
                        </div>
                        <p>{r.original.note}</p>
                        <span className="row-meta">
                          <MapPin size={12} />{" "}
                          {r.original.appearance === "unsure"
                            ? "Appearance uncertain"
                            : `${r.original.appearance} appearance`}
                          <span>·</span>
                          {new Date(r.original.observedAt).toLocaleDateString(
                            "en-GB",
                            { day: "numeric", month: "short", timeZone: "UTC" },
                          )}
                        </span>
                      </div>
                      <div className="row-end">
                        <Tag tone={r.status === "reviewed" ? "green" : "amber"}>
                          {labels[r.status]}
                        </Tag>
                        <ChevronRight size={18} />
                      </div>
                    </button>
                  ))}
                </div>
                <div className="journey-strip">
                  <span className="journey-icon">
                    <GitBranch size={21} />
                  </span>
                  <div>
                    <h3>Nothing lost between observation and action.</h3>
                    <p>
                      Original words → clarification → your confirmation → human
                      review.
                    </p>
                  </div>
                  <button
                    className="icon-btn"
                    onClick={() => go("lab")}
                    aria-label="Explore the evidence process"
                  >
                    <ArrowUpRight />
                  </button>
                </div>
              </div>
              <aside className="right-column">
                <Conditions />
                <section className="field-tip">
                  <span className="tip-icon">
                    <Eye size={20} />
                  </span>
                  <div>
                    <p className="eyebrow">A BETTER FIELD NOTE</p>
                    <h3>“I don’t know” is useful data.</h3>
                    <p>
                      Clear water does not establish safety. Brown water does
                      not establish a cause. Record the observation; keep the
                      question open.
                    </p>
                    <button className="plain-btn" onClick={() => go("lab")}>
                      Explore the method <ArrowRight size={15} />
                    </button>
                  </div>
                </section>
              </aside>
            </div>
            <section className="one-health">
              <div>
                <span className="eyebrow">ONE HEALTH, ONE CONNECTED WORLD</span>
                <h2>
                  A healthier conversation
                  <br />
                  between people and nature.
                </h2>
              </div>
              <p>
                Better observations can support community monitoring and
                professional investigation. AquaLens connects the evidence
                people collect with the questions researchers need to ask.
              </p>
              <div className="health-links">
                <span>
                  <Leaf size={17} /> Ecosystems
                </span>
                <span>
                  <Waves size={17} /> Wildlife habitats
                </span>
                <span>
                  <ShieldCheck size={17} /> Communities
                </span>
              </div>
            </section>
          </TabsContent>

          <TabsContent value="observe" className="view-enter">
            <Heading
              eyebrow="THE FIELD NOTEBOOK"
              title="Start with what you noticed."
              description="Your words are the evidence. We’ll help make the questions clearer."
              action={
                <Tag tone={draft.synthetic ? "amber" : "green"}>
                  {draft.synthetic
                    ? "Synthetic example"
                    : "Your own observation"}
                </Tag>
              }
            />
            {stage === 0 && (
              <FieldStudio
                key={draftRevision}
                value={field}
                onChange={updateField}
                aiReady={aiReady && online}
                onBusy={updateCaptureBusy}
                onSynthetic={() => { if (draftEpoch.current === draftRevision) setDraft((d) => ({ ...d, synthetic: true })); }}
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
                {stage === 0 && (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      void analyze();
                    }}
                  >
                    <div className="panel-title">
                      <h2>A moment by the stream</h2>
                      <Compass size={23} />
                    </div>
                    <p className="subtext">
                      Observe from a safe, accessible place. Describe only what
                      you noticed.
                    </p>
                    <div className="form-grid">
                      <label>
                        Stream or landmark
                        <input
                          required
                          maxLength={160}
                          value={draft.site}
                          onChange={(e) =>
                            setDraft({ ...draft, site: e.target.value })
                          }
                          placeholder="e.g. The footbridge at Brookside"
                        />
                      </label>
                      <label>
                        Observation time
                        <input
                          required
                          type="datetime-local"
                          value={when}
                          max={localTime()}
                          onChange={(e) => setWhen(e.target.value)}
                        />
                        <small>Your device’s local time zone</small>
                      </label>
                    </div>
                    <label className="field">
                      What did you directly observe?
                      <textarea
                        required
                        maxLength={4000}
                        rows={5}
                        value={draft.note}
                        onChange={(e) =>
                          setDraft({ ...draft, note: e.target.value })
                        }
                        placeholder="The water looked brown beside the footbridge. I saw leaves collecting near the bank. I don’t know what caused the color."
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
                    <FieldDetails key={draftRevision} value={field} onChange={updateField} />
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
                      <div className="field data-choice">
                        <label className="check-label">
                          <Checkbox
                            checked={draft.synthetic}
                            onCheckedChange={(v) =>
                              setDraft({ ...draft, synthetic: v === true })
                            }
                          />{" "}
                          This is a synthetic / practice observation
                        </label>
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
                        {snapshot.appearance} appearance · citizen reported
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
                    <QualityScore
                      report={{ original: snapshot, assessment, field }}
                    />
                    <label className="check-label confirm-check">
                      <Checkbox
                        checked={confirm}
                        onCheckedChange={(v) => setConfirm(v === true)}
                      />{" "}
                      I confirm this record reflects my observation. Unverified
                      claims and uncertainty remain visible for review.
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
                <section className="panel sample-panel">
                  <p className="eyebrow">TRY IT FIRST</p>
                  <h3>Explore a field scenario</h3>
                  {scenarios.map((s, i) => (
                    <button key={s.title} onClick={() => loadScenario(i)}>
                      <span>
                        {s.title}
                        <small>{s.description}</small>
                      </span>
                      <ArrowUpRight size={17} />
                    </button>
                  ))}
                  <p className="micro-copy">
                    Authored synthetic examples, never live observations.
                  </p>
                </section>
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
              <h2>Observation records</h2>
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
                      {r.original.synthetic ? "Synthetic" : "Citizen report"}
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

          <TabsContent value="lab" className="view-enter">
            <EvidenceLab records={records} onOpen={openReport} />
          </TabsContent>
          <TabsContent value="atlas" className="view-enter">
            <StreamAtlas
              reports={records}
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
                  {active.original.synthetic
                    ? "Synthetic example"
                    : "Citizen report"}
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
                    <dt>Observed</dt>
                    <dd>{displayTime(active.original.observedAt)}</dd>
                  </div>
                  <div>
                    <dt>Appearance</dt>
                    <dd>{active.original.appearance} · citizen reported</dd>
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
function Metric({
  icon,
  value,
  label,
  detail,
}: {
  icon: ReactNode;
  value: string | number;
  label: string;
  detail: string;
}) {
  return (
    <div className="metric">
      <span className="metric-icon">{icon}</span>
      <div>
        <strong>{value}</strong>
        <h3>{label}</h3>
        <p>{detail}</p>
      </div>
    </div>
  );
}
