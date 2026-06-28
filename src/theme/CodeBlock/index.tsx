import React, {type ReactNode} from 'react';
import CodeBlock from '@theme-original/CodeBlock';
import type CodeBlockType from '@theme/CodeBlock';
import type {WrapperProps} from '@docusaurus/types';
import Mermaid from '@site/src/components/Mermaid';
import ScatterPlot from '@site/src/components/ScatterPlot';

// Swizzle wrapper: ```mermaid becomes a React <Mermaid> diagram, ```scatter
// becomes a recharts <ScatterPlot> from JSON, and every other code block falls
// through to the original CodeBlock untouched.

type Props = WrapperProps<typeof CodeBlockType>;

function toText(node: unknown): string {
  if (typeof node === 'string') {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map(toText).join('');
  }
  if (node && typeof node === 'object' && 'props' in node) {
    return toText((node as {props?: {children?: unknown}}).props?.children);
  }
  return '';
}

function hasLang(className: string | undefined, lang: string): boolean {
  return (
    typeof className === 'string' &&
    className.split(' ').includes('language-' + lang)
  );
}

export default function CodeBlockWrapper(props: Props): ReactNode {
  const {className} = props as {className?: string};
  const children = (props as {children?: unknown}).children;

  if (hasLang(className, 'mermaid')) {
    return <Mermaid code={toText(children).replace(/\n$/, '')} />;
  }
  if (hasLang(className, 'scatter')) {
    try {
      return <ScatterPlot data={JSON.parse(toText(children))} />;
    } catch {
      return <CodeBlock {...props} />;
    }
  }
  return <CodeBlock {...props} />;
}
