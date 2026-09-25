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
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-5xl mb-4">⚠️</p>
          <h1 className="text-2xl font-bold text-gray-900">
            Something went wrong
          </h1>
          <p className="text-gray-500 mt-2">
            Bill Buddy hit an unexpected error. Reloading usually fixes it.
          </p>
          <pre className="mt-4 text-left text-xs bg-gray-100 text-gray-600 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap">
            {this.state.error.message}
          </pre>
          <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={this.handleReload}
              className="px-4 py-2 rounded-lg bg-green-600 text-white font-semibold hover:bg-green-700 cursor-pointer"
            >
              Reload
            </button>
            <button
              onClick={this.handleResetData}
              className="px-4 py-2 rounded-lg bg-gray-100 text-gray-600 font-medium hover:bg-gray-200 cursor-pointer"
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
