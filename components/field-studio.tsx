"use client";
/* Browser-local Blob URLs must remain local; they cannot use the server image optimizer. */
/* eslint-disable @next/next/no-img-element */
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import {
  Camera,
  Video,
  Upload,
  ScanLine,
  Square,
  LocateFixed,
  Mic,
  X,
  Check,
  Eye,
  Layers,
  LoaderCircle,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  fieldQuestions,
  findingLabels,
  measurementWarnings,
  units,
  visualSchema,
  type FieldEvidence,
  type MediaEvidence,
} from "@/lib/field";
import {
  hashBlob,
  imageForAI,
  inspectImage,
  readMedia,
  saveMedia,
} from "@/lib/media-store";

type EvidenceImageProps = {
  media: MediaEvidence;
  className?: string;
  controls?: boolean;
};

export function EvidenceImage(props: EvidenceImageProps) {
  // Changing evidence must discard the previous preview, even if the next file
  // is missing from this browser's local store.
  return <LocalEvidenceImage key={props.media.id} {...props} />;
}

function LocalEvidenceImage({
  media,
  className = "",
  controls = true,
}: EvidenceImageProps) {
  const [url, setURL] = useState("");
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let disposed = false,
      local = "";
    readMedia(media.id)
      .then((blob) => {
        if (!disposed && blob) {
          local = URL.createObjectURL(blob);
          setURL(local);
        } else if (!disposed) setFailed(true);
      })
      .catch(() => { if (!disposed) setFailed(true); });
    return () => {
      disposed = true;
      if (local) URL.revokeObjectURL(local);
    };
  }, [media.id]);
  return url && !failed ? (
    media.kind === "video" ? (
      <video
        className={className}
        src={url}
        controls={controls}
        playsInline
        muted
        onError={() => setFailed(true)}
      />
    ) : (
      <img
        className={className}
        src={url}
        alt={`${media.origin === "illustration" ? "Synthetic illustration" : "Retained citizen photograph"}; unverified evidence`}
        onError={() => setFailed(true)}
      />
    )
  ) : (
    <div className="media-placeholder">
      {failed
        ? "Media is unavailable in this browser. The original digest is retained."
        : "Loading local evidence…"}
    </div>
  );
}

export function FieldStudio({
  value,
  onChange,
  aiReady,
  onSynthetic,
  onBusy,
}: {
  value: FieldEvidence;
  onChange: (value: FieldEvidence) => void;
  aiReady: boolean;
  onSynthetic: () => void;
  onBusy: (busy: boolean) => void;
}) {
  const video = useRef<HTMLVideoElement>(null),
    stream = useRef<MediaStream | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    timer = useRef<ReturnType<typeof setTimeout> | null>(null),
    latest = useRef(value),
    mounted = useRef(true),
    opening = useRef(false);
  useEffect(() => { latest.current = value; }, [value]);
  const [live, setLive] = useState(false),
    [starting, setStarting] = useState(false),
    [recording, setRecording] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [consent, setConsent] = useState(false),
    [ghost, setGhost] = useState(""),
    [opacity, setOpacity] = useState(35),
    [aiId, setAIId] = useState("");
  useEffect(() => { onBusy(busy || !!aiId || recording || starting); return () => onBusy(false); }, [busy, aiId, recording, starting, onBusy]);
  const stop = () => {
    if (recorder.current?.state === "recording") recorder.current.stop();
    stream.current?.getTracks().forEach((t) => t.stop());
    stream.current = null;
    setLive(false);
    if (timer.current) clearTimeout(timer.current);
  };
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stream.current?.getTracks().forEach((t) => t.stop());
      if (recorder.current?.state === "recording") recorder.current.stop();
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);
  useEffect(
    () => () => {
      if (ghost) URL.revokeObjectURL(ghost);
    },
    [ghost],
  );
  async function start() {
    if (opening.current || stream.current) return;
    opening.current = true;
    setStarting(true);
    setError("");
    let acquired: MediaStream | undefined;
    try {
      if (!navigator.mediaDevices?.getUserMedia)
        throw new Error(
          "Camera needs HTTPS and a supported browser. You can upload a photo instead.",
        );
      const s = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 1920 } },
        audio: false,
      });
      acquired = s;
      if (!mounted.current) {
        s.getTracks().forEach((t) => t.stop());
        return;
      }
      stream.current = s;
      setLive(true);
      if (video.current) {
        video.current.srcObject = s;
        await video.current.play();
      }
    } catch (e) {
      acquired?.getTracks().forEach((track) => track.stop());
      if (stream.current === acquired) stream.current = null;
      if (mounted.current) {
        setLive(false);
        setError(`Camera could not open. ${(e as Error).message}`);
      }
    } finally {
      opening.current = false;
      if (mounted.current) setStarting(false);
    }
  }
  async function retain(
    blob: Blob,
    origin: MediaEvidence["origin"],
    kind: "photo" | "video" = "photo",
    preview?: Blob,
  ) {
    setBusy(true);
    setError("");
    try {
      if (latest.current.media.length >= 4)
        throw new Error("Keep up to four evidence files per observation.");
      if (blob.size > 25 * 1024 * 1024)
        throw new Error(
          "File exceeds 25 MB. Use a shorter clip or smaller photo.",
        );
      const inspected = await inspectImage(preview || blob);
      const id = crypto.randomUUID();
      const sha256 = await hashBlob(blob);
      await saveMedia(id, blob);
      if (!mounted.current) return;
      const media: MediaEvidence = {
        id,
        kind,
        mime: blob.type,
        bytes: blob.size,
        sha256,
        createdAt: new Date().toISOString(),
        origin,
        ...inspected,
      };
      onChange({ ...latest.current, media: [...latest.current.media, media] });
      if (origin === "illustration") onSynthetic();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      if (mounted.current) setBusy(false);
    }
  }
  async function frame() {
    const v = video.current!;
    if (!v.videoWidth) throw new Error("Wait for the camera image to appear.");
    const c = document.createElement("canvas");
    c.width = v.videoWidth;
    c.height = v.videoHeight;
    c.getContext("2d")!.drawImage(v, 0, 0);
    return new Promise<Blob>((resolve, reject) =>
      c.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("Capture failed"))),
        "image/jpeg",
        0.92,
      ),
    );
  }
  async function capture() {
    try {
      await retain(await frame(), "camera");
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function record() {
    if (recording) {
      recorder.current?.stop();
      return;
    }
    try {
      if (!window.MediaRecorder || !stream.current)
        throw new Error(
          "Video recording is unavailable. Take a photo instead.",
        );
      const poster = await frame(),
        chunks: Blob[] = [];
      const rec = new MediaRecorder(stream.current);
      recorder.current = rec;
      rec.ondataavailable = (e) => {
        if (e.data.size) chunks.push(e.data);
      };
      rec.onerror = () => {
        setError("Video capture failed. Try a photo.");
        setRecording(false);
      };
      rec.onstop = () => {
        if (timer.current) clearTimeout(timer.current);
        if (!mounted.current) return;
        setRecording(false);
        void retain(
          new Blob(chunks, { type: rec.mimeType || "video/webm" }),
          "camera",
          "video",
          poster,
        );
      };
      rec.start(1000);
      setRecording(true);
      timer.current = setTimeout(() => {
        if (rec.state === "recording") rec.stop();
      }, 10000);
    } catch (e) {
      setError((e as Error).message);
    }
  }
  async function visual(media: MediaEvidence) {
    setAIId(media.id);
    setError("");
    try {
      const blob = await readMedia(media.id);
      if (!blob) throw new Error("Local image is unavailable.");
      const image = await imageForAI(blob);
      const r = await fetch("/api/visual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image, consent }),
        signal: AbortSignal.timeout(29000),
      });
      const raw: unknown = await r.json();
      if (!r.ok)
        throw new Error(
          z.object({ error: z.string() }).safeParse(raw).data?.error ||
            "Visual AI unavailable",
        );
      const result = visualSchema
        .extend({ model: z.string(), at: z.string().datetime() })
        .parse(raw);
      const parsed = visualSchema.parse({ findings: result.findings });
      if (!mounted.current) return;
      onChange({
        ...latest.current,
        media: latest.current.media.map((m) =>
          m.id === media.id
            ? {
                ...m,
                visual: { ...parsed, model: result.model, at: result.at },
              }
            : m,
        ),
      });
    } catch (e) {
      if (mounted.current) setError((e as Error).message);
    } finally {
      if (mounted.current) setAIId("");
    }
  }
  async function reference(file: File) {
    try {
      if (!file.type.startsWith("image/") || file.size > 15 * 1024 * 1024)
        throw new Error("Use an image below 15 MB.");
      const b = await createImageBitmap(file);
      b.close();
      setGhost(URL.createObjectURL(file));
    } catch (e) {
      setError((e as Error).message);
    }
  }
  return (
    <section className="field-studio" aria-label="Camera and evidence capture">
      <div className="studio-title">
        <span>
          <Camera size={18} /> FIELD OPTICS <b>01 / CAPTURE</b>
        </span>
        <span className="optics-status">
          {live ? "CAMERA ACTIVE" : "LOCAL CAPTURE"}
        </span>
      </div>
      <div className={`viewfinder ${aiId || busy ? "scanning" : ""}`}>
        <video
          ref={video}
          autoPlay
          playsInline
          muted
          className={live ? "camera-video" : "camera-video hidden-camera"}
        />
        {!live && (
          <div className="camera-idle">
            <div className="lens-rings">
              <Camera size={34} />
            </div>
            <h2>A closer look. A clearer record.</h2>
            <p>Capture the scene. Keep the uncertainty.</p>
            <button type="button" className="btn mint" onClick={start} disabled={starting}>
              {starting ? <LoaderCircle size={17} className="spin" /> : <Camera size={17} />}
              {starting ? "Opening camera…" : "Open live camera"}
            </button>
            <small>
              Camera stays on your device until you explicitly request AI.
            </small>
          </div>
        )}
        {live && ghost && (
          <img
            src={ghost}
            alt="Reference ghost overlay for manual alignment"
            className="ghost-frame"
            style={{ opacity: opacity / 100 }}
          />
        )}
        <div className="viewfinder-corners" />
        <span className="finder-label">
          {recording ? "● RECORDING · MAX 10 SEC" : "AQUALENS / EVIDENCE FIRST"}
        </span>
        {live && (
          <div className="camera-controls">
            <button
              type="button"
              className="btn glass"
              onClick={stop}
              disabled={busy}
            >
              Close camera
            </button>
            <button
              type="button"
              aria-label="Capture photo"
              className="shutter"
              onClick={capture}
              disabled={busy || recording || value.media.length >= 4}
            >
              <Camera />
            </button>
            <button
              type="button"
              className="btn glass"
              onClick={record}
              disabled={busy || value.media.length >= 4}
            >
              {recording ? <Square size={16} /> : <Video size={16} />}
              {recording ? "Stop" : "10s clip"}
            </button>
          </div>
        )}
      </div>
      <div className="capture-tools">
        <label className="btn secondary">
          <Upload size={16} /> Upload photo
          <input
            className="sr-only"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={busy || value.media.length >= 4}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void retain(f, "upload");
              e.target.value = "";
            }}
          />
        </label>
        <label className="btn secondary">
          <Layers size={16} /> Repeat-photo guide
          <input
            className="sr-only"
            type="file"
            accept="image/*"
            onChange={(e) => {
              if (e.target.files?.[0]) void reference(e.target.files[0]);
              e.target.value = "";
            }}
          />
        </label>
        <button
          type="button"
          className="plain-btn"
          disabled={busy || value.media.length >= 4}
          onClick={async () => {
            try {
              const r = await fetch("/images/stream-hero.png");
              if (!r.ok) throw new Error("Illustration unavailable offline");
              await retain(await r.blob(), "illustration");
            } catch (e) {
              setError((e as Error).message);
            }
          }}
        >
          Try illustrative image
        </button>
      </div>
      {ghost && (
        <div className="ghost-control">
          <label id="ghost-opacity">Reference opacity · {opacity}%</label>
          <Slider
            aria-labelledby="ghost-opacity"
            value={[opacity]}
            min={0}
            max={80}
            onValueChange={(v) => setOpacity(v[0])}
          />
          <button
            type="button"
            className="plain-btn"
            onClick={() => setGhost("")}
          >
            Remove guide
          </button>
          <small>
            Manual framing guide only; not image registration or a change
            measurement.
          </small>
        </div>
      )}
      <label className="consent-row">
        <Checkbox
          checked={consent}
          onCheckedChange={(v) => setConsent(v === true)}
          disabled={!aiReady}
        />
        Send selected photo to Gemini for candidate observations. Avoid faces or
        private information; free-tier inputs may be used to improve Google
        products.
      </label>
      {!aiReady && (
        <p className="micro-copy">
          Visual AI unavailable; capture and local image checks remain usable.
        </p>
      )}
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      {busy && (
        <p role="status">Saving original bytes and checking the frame…</p>
      )}
      <div className="media-grid">
        {value.media.map((m) => (
          <article className="media-card" key={m.id}>
            <EvidenceImage media={m} />
            <div className="media-card-body">
              <div className="button-row">
                <span className="tag">
                  {m.origin === "illustration"
                    ? "Synthetic illustration"
                    : `Citizen ${m.kind}`}
                </span>
                <button
                  type="button"
                  className="icon-btn"
                  aria-label="Remove media from draft"
                  disabled={!!aiId}
                  onClick={() =>
                    onChange({
                      ...value,
                      media: value.media.filter((x) => x.id !== m.id),
                    })
                  }
                >
                  <X size={15} />
                </button>
              </div>
              <p>
                {m.width} × {m.height} · {(m.bytes / 1024 / 1024).toFixed(1)} MB
              </p>
              <div className="quality-flags">
                {m.quality.warnings.length ? (
                  m.quality.warnings.map((w) => <span key={w}>{w}</span>)
                ) : (
                  <span className="good">
                    <Check size={12} /> No basic image warning
                  </span>
                )}
              </div>
              <small>
                Local heuristic · brightness {m.quality.brightness}/255 · edge
                detail {m.quality.edgeDetail}. Not calibrated for water scenes.
                {m.kind === "video" &&
                  " Video checks use the first frame only; AI video analysis is not provided."}
              </small>
              {m.kind === "photo" && (
                <button
                  type="button"
                  className="btn primary full"
                  disabled={!consent || !aiReady || !!aiId}
                  onClick={() => visual(m)}
                >
                  {aiId === m.id ? (
                    <LoaderCircle size={16} className="spin" />
                  ) : (
                    <ScanLine size={16} />
                  )}
                  {aiId === m.id
                    ? "Inspecting visual evidence…"
                    : "Ask visual AI"}
                </button>
              )}
              {m.visual && (
                <div className="visual-findings">
                  <b>AI CANDIDATES · REQUIRES VERIFICATION</b>
                  {m.visual.findings.length ? (
                    m.visual.findings.map((f) => (
                      <p key={f.kind}>
                        {findingLabels[f.kind]}
                        <small>
                          {f.region.replaceAll("_", " ")} · {f.confidence} model
                          confidence (uncalibrated)
                        </small>
                      </p>
                    ))
                  ) : (
                    <p>
                      No candidate matched the allowed categories. This does not
                      establish absence or safety.
                    </p>
                  )}
                  <small>
                    {m.visual.model} · {m.visual.at}
                  </small>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

export function FieldDetails({
  value,
  onChange,
}: {
  value: FieldEvidence;
  onChange: (v: FieldEvidence) => void;
}) {
  const latest = useRef({ value, onChange }),
    mounted = useRef(true);
  useEffect(() => { latest.current = { value, onChange }; }, [value, onChange]);
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);
  const [lat, setLat] = useState(
      value.coordinates ? String(value.coordinates.lat) : "",
    ),
    [lon, setLon] = useState(
      value.coordinates ? String(value.coordinates.lon) : "",
    ),
    [error, setError] = useState(""),
    [locating, setLocating] = useState(false);
  const [parameter, setParameter] = useState<keyof typeof units>("pH"),
    [reading, setReading] = useState(""),
    [instrument, setInstrument] = useState(""),
    [calibrated, setCalibrated] = useState(false);
  function locate() {
    setLocating(true);
    setError("");
    if (!navigator.geolocation) {
      setError("Location is unavailable. Enter coordinates manually.");
      setLocating(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => {
        if (!mounted.current) return;
        const c = {
          lat: p.coords.latitude,
          lon: p.coords.longitude,
          accuracy: p.coords.accuracy,
          method: "device" as const,
        };
        setLat(c.lat.toFixed(6));
        setLon(c.lon.toFixed(6));
        latest.current.onChange({ ...latest.current.value, coordinates: c });
        setLocating(false);
      },
      () => {
        if (!mounted.current) return;
        setError(
          "Location permission denied or unavailable. Manual coordinates are optional.",
        );
        setLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true },
    );
  }
  return (
    <div className="field-details">
      <details>
        <summary>
          <LocateFixed size={16} /> Locate this observation{" "}
          <span>
            {value.coordinates
              ? "Coordinates saved"
              : "Optional · no guessed location"}
          </span>
        </summary>
        <p className="micro-copy">
          Coordinates are retained locally and included in your exports. Map
          tiles are loaded from OpenFreeMap.
        </p>
        <div className="form-grid">
          <label>
            Latitude
            <input
              type="number"
              step="any"
              min={-90}
              max={90}
              value={lat}
              onChange={(e) => setLat(e.target.value)}
            />
          </label>
          <label>
            Longitude
            <input
              type="number"
              step="any"
              min={-180}
              max={180}
              value={lon}
              onChange={(e) => setLon(e.target.value)}
            />
          </label>
        </div>
        <div className="button-row">
          <button
            type="button"
            className="btn secondary"
            onClick={() => {
              if (
                !lat.trim() ||
                !lon.trim() ||
                !Number.isFinite(Number(lat)) ||
                !Number.isFinite(Number(lon)) ||
                Math.abs(Number(lat)) > 90 ||
                Math.abs(Number(lon)) > 180
              ) {
                setError("Enter latitude −90 to 90 and longitude −180 to 180.");
                return;
              }
              setError("");
              onChange({
                ...value,
                coordinates: {
                  lat: Number(lat),
                  lon: Number(lon),
                  method: "manual",
                },
              });
            }}
          >
            Save coordinates
          </button>
          <button
            type="button"
            className="plain-btn"
            onClick={locate}
            disabled={locating}
          >
            {locating ? "Locating…" : "Use device location"}
          </button>
          {value.coordinates && (
            <button
              type="button"
              className="plain-btn"
              onClick={() => {
                onChange({ ...value, coordinates: undefined });
                setLat("");
                setLon("");
              }}
            >
              Remove coordinates
            </button>
          )}
        </div>
      </details>
      <details>
        <summary>
          <Eye size={16} /> Instrument measurements{" "}
          <span>
            {value.measurements.length
              ? `${value.measurements.length} recorded`
              : "Optional · never inferred from images"}
          </span>
        </summary>
        <div className="form-grid">
          <div>
            <label id="measurement-parameter">Parameter</label>
            <Select
              value={parameter}
              onValueChange={(v) => setParameter(v as keyof typeof units)}
            >
              <SelectTrigger aria-labelledby="measurement-parameter">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(units).map((p) => (
                  <SelectItem value={p} key={p}>
                    {p}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <label>
            Measured value ({units[parameter]})
            <input
              type="number"
              step="any"
              value={reading}
              onChange={(e) => setReading(e.target.value)}
            />
          </label>
        </div>
        <label>
          Instrument / method
          <input
            maxLength={100}
            value={instrument}
            onChange={(e) => setInstrument(e.target.value)}
            placeholder="e.g. Handheld meter, instrument ID"
          />
        </label>
        <label className="consent-row">
          <Checkbox
            checked={calibrated}
            onCheckedChange={(v) => setCalibrated(v === true)}
          />
          I checked calibration for this measurement.
        </label>
        <button
          type="button"
          className="btn secondary"
          disabled={!reading.trim() || value.measurements.length >= 8}
          onClick={() => {
            const n = Number(reading);
            if (!Number.isFinite(n)) {
              setError("Enter a finite numeric reading.");
              return;
            }
            onChange({
              ...value,
              measurements: [
                ...value.measurements,
                {
                  parameter,
                  value: n,
                  unit: units[parameter],
                  instrument,
                  calibration: calibrated ? "checked" : "unknown",
                  method: "citizen_instrument",
                },
              ],
            });
            setReading("");
          }}
        >
          Retain measurement
        </button>
        <p className="micro-copy">
          Checks use broad input bounds and metadata, not water safety limits.
          Out-of-range values remain visible for review.
        </p>
        {value.measurements.map((m, i) => (
          <div className="measurement-row" key={i}>
            <b>
              {m.parameter}: {m.value} {m.unit}
            </b>
            <span>{m.instrument || "Instrument unknown"}</span>
            <button
              type="button"
              className="icon-btn"
              aria-label={`Remove ${m.parameter} reading`}
              onClick={() =>
                onChange({
                  ...value,
                  measurements: value.measurements.filter((_, j) => j !== i),
                })
              }
            >
              <X size={14} />
            </button>
            {measurementWarnings(m).map((w) => (
              <small key={w}>{w}</small>
            ))}
          </div>
        ))}
      </details>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function VisualFollowups({
  field,
  appearance,
  onChange,
}: {
  field: FieldEvidence;
  appearance: string;
  onChange: (v: FieldEvidence) => void;
}) {
  const questions = fieldQuestions(field, appearance);
  return questions.length ? (
    <div className="visual-followups">
      <h3>Follow the evidence</h3>
      <p>
        Answer in your own words. “I don’t know” is a valid response; each
        question stays in the receipt.
      </p>
      {questions.map((q) => (
        <label key={q}>
          {q}
          <textarea
            rows={2}
            maxLength={1000}
            value={field.followups.find((a) => a.question === q)?.answer || ""}
            onChange={(e) =>
              onChange({
                ...field,
                followups: [
                  ...field.followups.filter((a) => a.question !== q),
                  { question: q, answer: e.target.value },
                ],
              })
            }
          />
        </label>
      ))}
    </div>
  ) : null;
}

type SpeechInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  onresult:
    | ((e: {
        results: {
          [key: number]: { [key: number]: { transcript: string } };
          length: number;
        };
      }) => void)
    | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
};
export function VoiceNote({ onAdopt }: { onAdopt: (text: string) => void }) {
  const [supported, setSupported] = useState(false),
    [listening, setListening] = useState(false),
    [transcript, setTranscript] = useState(""),
    [error, setError] = useState("");
  const recognition = useRef<SpeechInstance | null>(null);
  useEffect(() => {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechInstance;
      webkitSpeechRecognition?: new () => SpeechInstance;
    };
    // Capability detection happens after SSR; this state reflects a browser API.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      recognition.current?.stop();
    };
  }, []);
  function start() {
    const w = window as unknown as {
      SpeechRecognition?: new () => SpeechInstance;
      webkitSpeechRecognition?: new () => SpeechInstance;
    };
    const Constructor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Constructor) return;
    setError("");
    const r = new Constructor();
    recognition.current = r;
    r.lang = "en-US";
    r.continuous = false;
    r.interimResults = false;
    r.onresult = (e) => setTranscript(e.results[0][0].transcript);
    r.onerror = () => {
      setError(
        "Speech recognition unavailable or permission denied. Type your note instead.",
      );
      setListening(false);
    };
    r.onend = () => setListening(false);
    try {
      r.start();
      setListening(true);
    } catch {
      setError("Microphone could not start.");
    }
  }
  return (
    <details className="voice-note">
      <summary>
        <Mic size={15} /> Dictate a field note
      </summary>
      <p className="micro-copy">
        Browser speech recognition may send audio to its provider. English
        transcription only; review before adding. Appearance, measurements and
        location still require your input.
      </p>
      <button
        type="button"
        className="btn secondary"
        disabled={!supported}
        onClick={() => (listening ? recognition.current?.stop() : start())}
      >
        {listening
          ? "Stop listening"
          : supported
            ? "Start microphone"
            : "Speech unavailable in this browser"}
      </button>
      {transcript && (
        <>
          <label>
            Review transcript
            <textarea
              value={transcript}
              maxLength={4000}
              onChange={(e) => setTranscript(e.target.value)}
            />
          </label>
          <button
            type="button"
            className="plain-btn"
            onClick={() => {
              onAdopt(transcript);
              setTranscript("");
            }}
          >
            Append transcript to my note
          </button>
        </>
      )}
      {error && <p role="alert">{error}</p>}
    </details>
  );
}
