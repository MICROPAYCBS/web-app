'use client';

/**
 * Copyright since 2026 Mifos Initiative
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { ErrorPanel } from '@/components/composites/error-panel';

export interface ErrorBoundaryProps {
  children: ReactNode;
  title?: string;
  description?: string;
  resetKeys?: unknown[];
  className?: string;
}

interface ErrorBoundaryState {
  error: Error | null;
  componentStack: string | null;
}

/**
 * Catches render errors in client components so surrounding chrome (sidebar, header) stays usable.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = {
    error: null,
    componentStack: null
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    this.setState({ componentStack: info.componentStack ?? null });
    if (process.env.NODE_ENV !== 'production') {
      console.error('[ErrorBoundary]', error, info.componentStack);
    }
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (this.state.error && prevProps.resetKeys !== this.props.resetKeys) {
      this.reset();
    }
  }

  reset = () => {
    this.setState({ error: null, componentStack: null });
  };

  render() {
    const { error, componentStack } = this.state;

    if (error) {
      return (
        <ErrorPanel
          error={error}
          componentStack={componentStack ?? undefined}
          title={this.props.title}
          description={this.props.description}
          onReset={this.reset}
          variant="inline"
          className={this.props.className}
        />
      );
    }

    return this.props.children;
  }
}
