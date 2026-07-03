declare module 'react-quill' {
  import * as React from 'react';
  export interface ReactQuillProps {
    value?: string;
    defaultValue?: string;
    onChange?: (content: string, delta?: unknown, source?: unknown, editor?: unknown) => void;
    onBlur?: (previousRange: unknown, source: unknown, editor: unknown) => void;
    onFocus?: (range: unknown, source: unknown, editor: unknown) => void;
    placeholder?: string;
    readOnly?: boolean;
    theme?: string;
    modules?: Record<string, unknown>;
    formats?: string[];
    className?: string;
    style?: React.CSSProperties;
    [key: string]: unknown;
  }
  const ReactQuill: React.ComponentType<ReactQuillProps>;
  export default ReactQuill;
}