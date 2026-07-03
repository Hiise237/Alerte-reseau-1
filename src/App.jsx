import React, { useState, useEffect, useCallback } from "react";
import { supabase, supabaseInitError } from "./supabaseClient";

const FONT_LINK_ID = "alerte-reseau-fonts";

const PALETTE = {
  bg: "#10151B",
  surface: "#1A2129",
  surface2: "#212B35",
  line: "#2E3944",
  textPrimary: "#EDEFF2",
  textMuted: "#8993A1",
  water: "#2F8FE0",
  waterDim: "#1C3A54",
  power: "#F2B134",
  powerDim: "#4A3B18",
  urgent: "#E14F3D",
  urgentDim: "#4A2019",
  success: "#4CAF6D",
  successDim: "#1E3626",
};

const URGENCES = [
  { id: "faible", label: "Faible", color: PALETTE.textMuted },
  { id: "moyenne", label: "Moyenne", color: PALETTE.power },
  { id: "urgente", label: "Urgente", color: PALETTE.urgent },
];

const STATUTS = ["Signalé", "En cours", "Résolu"];

function useGoogleFonts() {
  useEffect(() => {
    if (document.getElementById(FONT_LINK_ID)) return;
    const link = document.createElement("link");
    link.id = FONT_LINK_ID;
    link.rel = "stylesheet";
    link.href =
      "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=IBM+Plex+Mono:wght@500;600&family=Inter:wght@400;500;600&display=swap";
    document.head.appendChild(link);
  }, []);
}

function ticketNumber(n) {
  return "N°" + String(n).padStart(4, "0");
}

function timeAgo(iso) {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `il y a ${hrs} h`;
  const days = Math.floor(hrs / 24);
  return `il y a ${days} j`;
}

function StatusStamp({ status }) {
  const colorMap = {
    "Signalé": PALETTE.urgent,
    "En cours": PALETTE.power,
    "Résolu": PALETTE.success,
  };
  const color = colorMap[status] || PALETTE.textMuted;
  return (
    <div
      style={{
        display: "inline-block",
        border: `2px solid ${color}`,
        color,
        fontFamily: "'IBM Plex Mono', monospace",
        fontSize: "11px",
        fontWeight: 600,
        letterSpacing: "0.12em",
        padding: "3px 8px",
        borderRadius: "3px",
        transform: "rotate(-3deg)",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {status}
    </div>
  );
}

function TicketRow({ report, onAdvance }) {
  const typeColor = report.type === "eau" ? PALETTE.water : PALETTE.power;
  const typeLabel = report.type === "eau" ? "EAU" : "ÉLECTRICITÉ";
  const urgence = URGENCES.find((u) => u.id === report.urgence) || URGENCES[0];
  const nextStatus = STATUTS[(STATUTS.indexOf(report.status) + 1) % STATUTS.length];

  return (
    <div
      style={{
        background: PALETTE.surface,
        border: `1px solid ${PALETTE.line}`,
        borderRadius: "8px",
        position: "relative",
        overflow: "hidden",
      }}
      className="flex flex-col sm:flex-row"
    >
      <div
        style={{
          background: typeColor,
          width: "6px",
          minHeight: "100%",
        }}
        className="hidden sm:block"
      />
      <div className="flex-1 p-4 flex flex-col sm:flex-row sm:items-center gap-4">
        <div style={{ minWidth: "92px" }}>
          <div
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              color: PALETTE.textMuted,
              fontSize: "12px",
              letterSpacing: "0.05em",
            }}
          >
            {ticketNumber(report.id)}
          </div>
          <div
            style={{
              color: typeColor,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              fontWeight: 600,
              letterSpacing: "0.08em",
              marginTop: "2px",
            }}
          >
            {typeLabel}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div
            style={{ color: PALETTE.textPrimary, fontWeight: 500 }}
            className="text-sm truncate"
          >
            {report.lieu}
          </div>
          <div style={{ color: PALETTE.textMuted }} className="text-sm mt-0.5">
            {report.description}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span
              style={{
                color: urgence.color,
                fontSize: "11px",
                fontFamily: "'IBM Plex Mono', monospace",
                letterSpacing: "0.05em",
              }}
            >
              ● Urgence {urgence.label}
            </span>
            <span style={{ color: PALETTE.textMuted, fontSize: "11px" }}>
              {timeAgo(report.created_at)}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:flex-col sm:items-end">
          <StatusStamp status={report.status} />
          {report.status !== "Résolu" && (
            <button
              onClick={() => onAdvance(report.id)}
              style={{
                background: "transparent",
                border: `1px solid ${PALETTE.line}`,
                color: PALETTE.textMuted,
                fontSize: "11px",
                padding: "4px 10px",
                borderRadius: "5px",
                cursor: "pointer",
                fontFamily: "Inter, sans-serif",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = typeColor)}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = PALETTE.line)}
            >
              → {nextStatus}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AlerteReseau() {
  useGoogleFonts();

  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [storageError, setStorageError] = useState(false);

  const [type, setType] = useState("eau");
  const [lieu, setLieu] = useState("");
  const [description, setDescription] = useState("");
  const [urgence, setUrgence] = useState("moyenne");
  const [submitting, setSubmitting] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);

  const [filterType, setFilterType] = useState("tous");
  const [filterStatus, setFilterStatus] = useState("tous");

  const loadReports = useCallback(async () => {
    if (!supabase) {
      setLoading(false);
      setStorageError(true);
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setReports(data || []);
      setStorageError(false);
    } catch (err) {
      setReports([]);
      setStorageError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) return;
    loadReports();
    let channel;
    try {
      channel = supabase
        .channel("reports-changes")
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "reports" },
          () => loadReports()
        )
        .subscribe();
    } catch (err) {
      console.error("Erreur realtime:", err);
    }
    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, [loadReports]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!lieu.trim() || !description.trim()) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from("reports").insert({
        type,
        lieu: lieu.trim(),
        description: description.trim(),
        urgence,
        status: "Signalé",
      });
      if (error) throw error;
      await loadReports();
      setStorageError(false);
    } catch (err) {
      setStorageError(true);
    }
    setLieu("");
    setDescription("");
    setUrgence("moyenne");
    setSubmitting(false);
    setJustSubmitted(true);
    setTimeout(() => setJustSubmitted(false), 2500);
  };

  const handleAdvance = async (id) => {
    const report = reports.find((r) => r.id === id);
    if (!report) return;
    const idx = STATUTS.indexOf(report.status);
    const nextStatus = STATUTS[(idx + 1) % STATUTS.length];
    try {
      const { error } = await supabase
        .from("reports")
        .update({ status: nextStatus })
        .eq("id", id);
      if (error) throw error;
      await loadReports();
    } catch (err) {
      setStorageError(true);
    }
  };

  const counts = {
    "Signalé": reports.filter((r) => r.status === "Signalé").length,
    "En cours": reports.filter((r) => r.status === "En cours").length,
    "Résolu": reports.filter((r) => r.status === "Résolu").length,
  };

  const filtered = reports.filter((r) => {
    if (filterType !== "tous" && r.type !== filterType) return false;
    if (filterStatus !== "tous" && r.status !== filterStatus) return false;
    return true;
  });

  return (
    <div
      style={{
        background: PALETTE.bg,
        color: PALETTE.textPrimary,
        fontFamily: "Inter, sans-serif",
        minHeight: "100vh",
      }}
      className="w-full"
    >
      <div className="max-w-2xl mx-auto px-4 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <div
            style={{
              color: PALETTE.textMuted,
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: "11px",
              letterSpacing: "0.15em",
            }}
            className="mb-2 uppercase"
          >
            Yaoundé · Réseau eau & électricité
          </div>
          <h1
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "32px",
              lineHeight: 1.1,
            }}
          >
            Alerte Réseau
          </h1>
          <p style={{ color: PALETTE.textMuted }} className="text-sm mt-2">
            Signalez une fuite, une coupure ou une panne. Suivez le traitement
            en temps réel, comme un bordereau de signalement.
          </p>
          {supabaseInitError && (
            <div
              style={{
                background: PALETTE.urgentDim,
                border: `1px solid ${PALETTE.urgent}`,
                color: PALETTE.urgent,
                borderRadius: "8px",
                padding: "12px",
                fontSize: "12px",
                marginTop: "12px",
              }}
            >
              Erreur de connexion à la base de données :{" "}
              {String(supabaseInitError.message || supabaseInitError)}
            </div>
          )}
        </div>

        {/* Stats bar */}
        <div
          style={{
            background: PALETTE.surface,
            border: `1px solid ${PALETTE.line}`,
            borderRadius: "10px",
          }}
          className="grid grid-cols-3 mb-8 overflow-hidden"
        >
          {[
            { label: "Signalé", color: PALETTE.urgent, value: counts["Signalé"] },
            { label: "En cours", color: PALETTE.power, value: counts["En cours"] },
            { label: "Résolu", color: PALETTE.success, value: counts["Résolu"] },
          ].map((s, i) => (
            <div
              key={s.label}
              className="p-4 text-center"
              style={{
                borderLeft: i > 0 ? `1px solid ${PALETTE.line}` : "none",
              }}
            >
              <div
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: "26px",
                  fontWeight: 600,
                  color: s.color,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  color: PALETTE.textMuted,
                  fontSize: "11px",
                  letterSpacing: "0.08em",
                }}
                className="uppercase mt-1"
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: PALETTE.surface,
            border: `1px solid ${PALETTE.line}`,
            borderRadius: "10px",
          }}
          className="p-5 mb-8"
        >
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontWeight: 700,
              fontSize: "16px",
            }}
            className="mb-4"
          >
            Nouveau signalement
          </div>

          <div className="flex gap-2 mb-4">
            {[
              { id: "eau", label: "Eau", color: PALETTE.water, dim: PALETTE.waterDim },
              { id: "electricite", label: "Électricité", color: PALETTE.power, dim: PALETTE.powerDim },
            ].map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setType(opt.id)}
                style={{
                  flex: 1,
                  padding: "10px",
                  borderRadius: "7px",
                  border: `1px solid ${type === opt.id ? opt.color : PALETTE.line}`,
                  background: type === opt.id ? opt.dim : "transparent",
                  color: type === opt.id ? opt.color : PALETTE.textMuted,
                  fontWeight: 600,
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <label
            style={{ color: PALETTE.textMuted, fontSize: "11px" }}
            className="uppercase block mb-1"
          >
            Lieu précis (quartier, immeuble, service)
          </label>
          <input
            value={lieu}
            onChange={(e) => setLieu(e.target.value)}
            placeholder="Ex : Toilettes des femmes, bloc B, Ngousso"
            style={{
              background: PALETTE.surface2,
              border: `1px solid ${PALETTE.line}`,
              color: PALETTE.textPrimary,
              borderRadius: "6px",
              padding: "9px 12px",
              fontSize: "14px",
              width: "100%",
            }}
            className="mb-4 outline-none"
          />

          <label
            style={{ color: PALETTE.textMuted, fontSize: "11px" }}
            className="uppercase block mb-1"
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Décrivez la panne : fuite, coupure, vanne bloquée..."
            rows={3}
            style={{
              background: PALETTE.surface2,
              border: `1px solid ${PALETTE.line}`,
              color: PALETTE.textPrimary,
              borderRadius: "6px",
              padding: "9px 12px",
              fontSize: "14px",
              width: "100%",
              resize: "vertical",
            }}
            className="mb-4 outline-none"
          />

          <label
            style={{ color: PALETTE.textMuted, fontSize: "11px" }}
            className="uppercase block mb-2"
          >
            Urgence
          </label>
          <div className="flex gap-2 mb-5">
            {URGENCES.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setUrgence(u.id)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "6px",
                  border: `1px solid ${urgence === u.id ? u.color : PALETTE.line}`,
                  background: "transparent",
                  color: urgence === u.id ? u.color : PALETTE.textMuted,
                  fontSize: "12px",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                {u.label}
              </button>
            ))}
          </div>

          <button
            type="submit"
            disabled={submitting || !lieu.trim() || !description.trim()}
            style={{
              width: "100%",
              padding: "11px",
              borderRadius: "7px",
              border: "none",
              background:
                !lieu.trim() || !description.trim() ? PALETTE.line : PALETTE.water,
              color: !lieu.trim() || !description.trim() ? PALETTE.textMuted : "#08131F",
              fontWeight: 600,
              fontSize: "14px",
              cursor: !lieu.trim() || !description.trim() ? "not-allowed" : "pointer",
            }}
          >
            {justSubmitted ? "✓ Signalement envoyé" : "Envoyer le signalement"}
          </button>
          {storageError && (
            <div style={{ color: PALETTE.urgent, fontSize: "12px" }} className="mt-2">
              Connexion à la base de données impossible. Vérifie ta connexion internet.
            </div>
          )}
        </form>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-4">
          {[
            { id: "tous", label: "Tous types" },
            { id: "eau", label: "Eau" },
            { id: "electricite", label: "Électricité" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id)}
              style={{
                padding: "5px 12px",
                borderRadius: "999px",
                border: `1px solid ${filterType === f.id ? PALETTE.textPrimary : PALETTE.line}`,
                background: filterType === f.id ? PALETTE.surface2 : "transparent",
                color: filterType === f.id ? PALETTE.textPrimary : PALETTE.textMuted,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {f.label}
            </button>
          ))}
          <div style={{ width: "1px", background: PALETTE.line }} className="mx-1" />
          {["tous", ...STATUTS].map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              style={{
                padding: "5px 12px",
                borderRadius: "999px",
                border: `1px solid ${filterStatus === s ? PALETTE.textPrimary : PALETTE.line}`,
                background: filterStatus === s ? PALETTE.surface2 : "transparent",
                color: filterStatus === s ? PALETTE.textPrimary : PALETTE.textMuted,
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              {s === "tous" ? "Tous statuts" : s}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex flex-col gap-3">
          {loading && (
            <div style={{ color: PALETTE.textMuted }} className="text-sm text-center py-8">
              Chargement des signalements…
            </div>
          )}
          {!loading && filtered.length === 0 && (
            <div
              style={{
                border: `1px dashed ${PALETTE.line}`,
                color: PALETTE.textMuted,
                borderRadius: "10px",
              }}
              className="text-sm text-center py-10"
            >
              Aucun signalement pour l'instant. Le premier ticket apparaîtra ici.
            </div>
          )}
          {!loading &&
            filtered.map((r) => (
              <TicketRow key={r.id} report={r} onAdvance={handleAdvance} />
            ))}
        </div>

        <div
          style={{ color: PALETTE.textMuted, fontSize: "11px" }}
          className="text-center mt-10"
        >
          Les signalements sont partagés en temps réel entre toutes les
          personnes qui utilisent cette application.
        </div>
      </div>
    </div>
  );
}
