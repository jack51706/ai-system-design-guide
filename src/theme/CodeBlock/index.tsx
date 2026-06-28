import React, {type ReactNode} from 'react';
import CodeBlock from '@theme-original/CodeBlock';
import type CodeBlockType from '@theme/CodeBlock';
import type {WrapperProps} from '@docusaurus/types';
import Mermaid from '@site/src/components/Mermaid';

// Swizzle wrapper: ```mermaid fenced blocks become a React <Mermaid> diagram;
// every other code block falls through to the original CodeBlock untouched.

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

function isMermaid(className?: string): boolean {
  return (
    typeof className === 'string' &&
    className.split(' ').includes('language-mermaid')
  );
}

export default function CodeBlockWrapper(props: Props): ReactNode {
  const {className} = props as {className?: string};
  if (isMermaid(className)) {
    const code = toText((props as {children?: unknown}).children).replace(
      /\n$/,
      '',
    );
    return <Mermaid code={code} />;
  }
  return <CodeBlock {...props} />;
}
