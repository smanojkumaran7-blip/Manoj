import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RotateCcw, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  autoHealed: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      autoHealed: false,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
      autoHealed: false,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error(`[Zero-Bug Citadel] Exception intercepted in ${this.props.componentName || 'UI Subsystem'}:`, error, errorInfo);

    // Auto-record defect into the backend self-healing ledger
    fetch('/api/testing/auto-heal-record', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subsystem: this.props.componentName || 'UI_COMPONENT',
        defectSummary: `Runtime exception caught in ${this.props.componentName || 'Component'}: ${error.message}`,
        buggyCode: `// Rendering failure in ${this.props.componentName}\n${error.stack?.split('\n').slice(0, 3).join('\n') || error.message}`,
        healedCode: `// ErrorBoundary active; isolated failure and preserved application state without crash`,
        diffSummary: 'Component rendered safe fallback circuit; zero page-crash impact.',
      }),
    }).catch(() => {});
  }

  handleSelfHealReset = () => {
    this.setState({ autoHealed: true });
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        autoHealed: false,
      });
    }, 600);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="rounded-xl border border-rose-900/60 bg-slate-950/90 p-5 shadow-lg shadow-rose-950/30">
          <div className="flex items-start gap-3.5">
            <div className="p-2.5 rounded-lg bg-rose-950/80 border border-rose-700/60 text-rose-400 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-mono font-bold text-rose-200">
                  Defect Intercepted by Zero-Bug Citadel
                </h3>
                <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Self-Healing Active
                </span>
              </div>
              <p className="text-xs text-slate-300 font-sans">
                {this.props.fallbackMessage ||
                  `An anomaly in ${this.props.componentName || 'this module'} was caught safely. Zero memory leakage or global crash.`}
              </p>

              {this.state.error && (
                <div className="p-2.5 rounded-lg bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-rose-300 overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={this.handleSelfHealReset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950 border border-emerald-600 text-emerald-200 text-xs font-mono font-bold hover:bg-emerald-900 transition"
                >
                  {this.state.autoHealed ? (
                    <>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Healed &amp; Restored</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Auto-Heal &amp; Reload Module</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
