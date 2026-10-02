import { ShieldCheck } from "lucide-react";

/** Native disclosure keeps consent specific without repeating long provider copy. */
export function AIDataUse({ recipients, kind }: { recipients: string; kind: "photo" | "note" }) {
  return <details className="ai-data-use">
    <summary><ShieldCheck size={14} /> AI &amp; data use <span>Details</span></summary>
    <div><p>{kind === "photo" ? "Only the selected resized photo is sent for candidate visual observations. Original files, coordinates, instrument readings and video are not sent." : "Only the original note and selected appearance are sent for clarification. Coordinates, instrument readings and media are not sent."} Recipient: {recipients}. Avoid faces, personal or sensitive information.</p>
      {recipients.includes("Google Gemini") && <p>Google’s unpaid-service terms permit submitted content to be used to improve its products. Paid-service terms differ. Share only content you are permitted to send. <a href="https://ai.google.dev/gemini-api/terms" target="_blank" rel="noreferrer">Provider data-use terms ↗</a></p>}
      <p>AI findings are unverified suggestions. You choose what to retain; a human review remains necessary. You can leave AI off and use local checks.</p>
    </div>
  </details>;
}
