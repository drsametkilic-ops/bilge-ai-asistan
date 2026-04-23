import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(err: Error) {
    return { hasError: true, message: err.message || "Beklenmeyen hata" };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("ErrorBoundary:", err, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#f8fafc",
            color: "#0f172a",
          }}
        >
          <h1 style={{ fontSize: 18, marginBottom: 8 }}>Bir hata oluştu</h1>
          <pre
            style={{
              maxWidth: 480,
              wordBreak: "break-word",
              fontSize: 12,
              background: "#fff",
              border: "1px solid #e2e8f0",
              padding: 12,
              borderRadius: 8,
            }}
          >
            {this.state.message}
          </pre>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, message: "" })}
            style={{
              marginTop: 16,
              padding: "8px 16px",
              cursor: "pointer",
            }}
          >
            Tekrar dene
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
