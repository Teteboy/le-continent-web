import { type ReactNode, Component, type ErrorInfo } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorCount: number;
}

/**
 * Error Boundary component to catch and handle React errors gracefully
 * Prevents entire app from crashing
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Ignore certain known benign React errors that are transient
    const ignoreErrors = [
      'insertBefore',
      'removeChild',
      'appendChild',
    ];
    
    const isBenignError = ignoreErrors.some(msg => 
      error.message?.includes(msg)
    );
    
    // For benign React DOM errors, return empty state to allow recovery
    if (isBenignError) {
      console.warn('[ErrorBoundary] Ignoring benign React error:', error.message);
      return {};
    }
    
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Error info:', errorInfo);

    // Ignore certain known benign React errors that are transient
    const ignoreErrors = [
      'insertBefore',
      'removeChild',
      'appendChild',
      'Failed to execute',
      'Node',
    ];
    
    const isBenignError = ignoreErrors.some(msg => 
      error.message?.includes(msg) || error.name?.includes(msg)
    );
    
    // For benign React DOM errors, don't show error UI - just log and continue
    if (isBenignError) {
      console.warn('[ErrorBoundary] Ignoring benign React error:', error.message);
      return;
    }

    // Update error count
    this.setState((prev) => ({
      errorCount: prev.errorCount + 1,
    }));

    // You can also log to an error reporting service here
    // logErrorToService(error, errorInfo);
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle size={32} className="text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Quelque chose s'est mal passé
              </h1>

              <p className="text-gray-600 text-sm mb-4">
                Une erreur inattendue s'est produite. Veuillez réessayer ou nous contacter si le problème persiste.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="bg-gray-100 rounded-lg p-4 mb-6 text-left max-h-40 overflow-auto">
                  <p className="text-xs font-mono text-red-600 break-words">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={this.resetError}
                  className="flex-1 bg-[#8B0000] hover:bg-[#6B0000] text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                >
                  <RefreshCw size={16} /> Réessayer
                </Button>

                <Button
                  onClick={() => window.location.href = '/'}
                  variant="outline"
                  className="flex-1 border-[#8B0000]/30 text-[#8B0000] hover:bg-[#8B0000]/5 font-semibold rounded-lg"
                >
                  Accueil
                </Button>
              </div>

              {this.state.errorCount > 3 && (
                <p className="text-xs text-gray-400 mt-4">
                  Si le problème persiste, veuillez contacter le support.
                </p>
              )}
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
