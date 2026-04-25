import { Component, type ErrorInfo, type ReactNode } from "react";

interface P {
  children: ReactNode;
  fallback: ReactNode;
}
interface S {
  err: Error | null;
  info: ErrorInfo | null;
}
export class ErrorBoundary extends Component<P, S> {
  state: S = { err: null, info: null };

  static getDerivedStateFromError(err: Error) {
    return { err, info: null } as S;
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error("ND app error", err, info);
    this.setState({ err, info });
  }

  render() {
    if (this.state.err) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}
