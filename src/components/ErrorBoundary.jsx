import { Component } from "react";

// Last-resort catch for render errors. React unmounts the whole tree on an
// uncaught render error, which showed as a blank white page with no way to
// recover. This renders a real error screen instead and keeps the error in
// the console for debugging.
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleResetData = () => {
    if (
      window.confirm(
        "This clears all bills and debts saved in this browser. Continue?",
      )
    ) {
      localStorage.removeItem("bills");
      localStorage.removeItem("debts");
      window.location.reload();
    }
  };

  render() {
    if (this.state.error) {
      return (
        <div className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="mb-4 font-display text-2xl font-bold text-[#1d1b16]">
            Something went wrong
          </p>
          <p className="mt-2 font-semibold text-[#6f6b61]">
            Bill Buddy hit an unexpected error. Reloading usually fixes it.
          </p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-2xl border-2 border-[#1d1b16]/10 bg-[#faf8f2] p-3 text-left text-xs text-[#6f6b61]">
            {this.state.error.message}
          </pre>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <button
              onClick={this.handleReload}
              className="cursor-pointer rounded-full border-2 border-[#1d1b16] bg-[#ff6b4a] px-4 py-2 font-extrabold text-white shadow-[3px_4px_0_#1d1b16] transition-[transform,box-shadow] hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/20 active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
            >
              Reload
            </button>
            <button
              onClick={this.handleResetData}
              className="cursor-pointer rounded-full border-2 border-[#1d1b16]/20 bg-white px-4 py-2 font-extrabold text-[#1d1b16] shadow-[3px_4px_0_rgba(29,27,22,0.12)] transition-[transform,box-shadow] hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[#ff6b4a]/20 active:translate-x-[2px] active:translate-y-[3px] active:shadow-none"
            >
              Clear saved data
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
