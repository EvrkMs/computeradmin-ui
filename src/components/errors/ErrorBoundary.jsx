import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('Application crashed:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (typeof this.props.onReset === 'function') {
      this.props.onReset();
    }
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950 px-4">
        <Card className="w-full max-w-xl">
          <CardHeader className="space-y-2">
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              Упс! Что-то пошло не так
            </CardTitle>
            <CardDescription>
              Интерфейс столкнулся с ошибкой. Вы можете обновить страницу или попробовать снова.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.error?.message && (
              <pre className="text-sm bg-slate-900/5 dark:bg-slate-900/40 p-3 rounded border border-slate-200 dark:border-slate-800 overflow-auto">
                {this.state.error.message}
              </pre>
            )}
            <Button onClick={this.handleReset} className="w-full sm:w-auto">
              Попробовать снова
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
}

export default ErrorBoundary;
