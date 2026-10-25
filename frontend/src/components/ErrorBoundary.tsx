import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Billza ErrorBoundary caught an unhandled error]:', error, errorInfo);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = '/';
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen w-full bg-[#0B1530] text-white flex flex-col items-center justify-center p-6 font-onest">
          <div className="w-full max-w-[480px] bg-[#111C38] border border-[#213056] rounded-[20px] p-8 shadow-2xl flex flex-col items-center text-center gap-5">
            <div className="w-[64px] h-[64px] rounded-full bg-[#FFF8F7]/10 border border-[#B42318]/30 flex items-center justify-center text-[#F97066]">
              <AlertTriangle size={32} />
            </div>

            <div className="flex flex-col gap-2">
              <h1 className="text-[24px] font-extrabold tracking-[-0.4px]">
                Something unexpected happened
              </h1>
              <p className="text-[14px] leading-[22px] text-[#8E9BBB]">
                The application encountered an unexpected state. Don&apos;t worry, your data and wallet
                remain secure.
              </p>
            </div>

            {this.state.error?.message && (
              <div className="w-full p-3 bg-[#0B1530] border border-[#213056] rounded-[10px] text-left">
                <span className="text-[11px] font-bold text-[#77839F] uppercase tracking-wider block mb-1">
                  Details
                </span>
                <p className="font-mono-redhat text-[12px] text-[#F97066] break-words">
                  {this.state.error.message}
                </p>
              </div>
            )}

            <div className="flex items-center gap-3 w-full pt-2">
              <button
                type="button"
                onClick={this.handleReload}
                className="flex-1 h-[44px] bg-[#4164D9] hover:bg-[#2F4FBF] text-white font-bold text-[14px] rounded-[10px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <RefreshCw size={16} />
                <span>Reload Billza</span>
              </button>

              <button
                type="button"
                onClick={this.handleReset}
                className="flex-1 h-[44px] bg-white/10 hover:bg-white/15 text-white font-bold text-[14px] rounded-[10px] flex items-center justify-center gap-2 transition-colors cursor-pointer"
              >
                <Home size={16} />
                <span>Return Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
