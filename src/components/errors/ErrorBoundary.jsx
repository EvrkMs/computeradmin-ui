import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('ErrorBoundary caught:', error, info);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onRetry === 'function') {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="p-4 border rounded-md border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-200">
          <div className="font-medium mb-2">Произошла ошибка загрузки.</div>
          <div className="text-sm mb-3 break-words">
            {this.state.error?.message || 'Попробуйте обновить страницу.'}
          </div>
          <button
            type="button"
            onClick={this.handleRetry}
            className="px-3 py-2 rounded-md bg-red-600 text-white text-sm"
          >
            Повторить
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
