import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error("Erreur capturée par ErrorBoundary:", error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div
          style={{
            background: "#10151B",
            color: "#EDEFF2",
            minHeight: "100vh",
            padding: "24px",
            fontFamily: "monospace",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          <h1 style={{ color: "#E14F3D", fontSize: "18px", marginBottom: "12px" }}>
            Erreur au chargement de l'application
          </h1>
          <p style={{ marginBottom: "8px" }}>
            <strong>Message :</strong> {String(this.state.error.message || this.state.error)}
          </p>
          <pre
            style={{
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
              background: "#1A2129",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "11px",
              color: "#8993A1",
            }}
          >
            {String(this.state.error.stack || "")}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
