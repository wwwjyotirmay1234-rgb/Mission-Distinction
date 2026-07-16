export default function MaintenancePage() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0d0f1a",
      padding: "24px",
      fontFamily: "system-ui, -apple-system, sans-serif",
    }}>
      <div style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "24px",
        maxWidth: "420px",
        width: "100%",
        textAlign: "center",
      }}>
        <div style={{
          width: "72px",
          height: "72px",
          borderRadius: "20px",
          background: "linear-gradient(135deg, #7c3aed, #a855f7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "32px",
          fontWeight: 900,
          color: "#fff",
          letterSpacing: "-1px",
          boxShadow: "0 0 40px rgba(124,58,237,0.4)",
        }}>
          MD
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <h1 style={{
            fontSize: "22px",
            fontWeight: 700,
            color: "#ede9fe",
            margin: 0,
          }}>
            Under Maintenance
          </h1>
          <p style={{
            fontSize: "15px",
            color: "#9ca3af",
            margin: 0,
            lineHeight: 1.6,
          }}>
            We're upgrading Mission Distinction's infrastructure to serve you better.
            We'll be back in a few minutes.
          </p>
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          padding: "12px 20px",
          borderRadius: "12px",
          background: "rgba(124,58,237,0.12)",
          border: "1px solid rgba(124,58,237,0.25)",
        }}>
          <span style={{ fontSize: "13px", color: "#a78bfa" }}>
            🔧 Database migration in progress
          </span>
        </div>

        <p style={{ fontSize: "12px", color: "#6b7280", margin: 0 }}>
          Your data is safe. This page will refresh automatically.
        </p>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}
