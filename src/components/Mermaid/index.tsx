import React, {useEffect, useRef, useState, type ReactNode} from 'react';
import {useColorMode} from '@docusaurus/theme-common';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Renders a Mermaid diagram inside React. Mermaid is imported lazily on the
// client only, and the SVG is stored in React state, so React fully owns the
// DOM (no manual replaceWith, no hydration mismatch). Re-renders when the code
// or the light/dark color mode changes.

let counter = 0;

function MermaidInner({code}: {code: string}): ReactNode {
  const {colorMode} = useColorMode();
  const [svg, setSvg] = useState('');
  const idRef = useRef('mermaid-svg-' + counter++);

  useEffect(() => {
    let active = true;
    void import('mermaid')
      .then(({default: mermaid}) => {
        mermaid.initialize({
          startOnLoad: false,
          theme: colorMode === 'dark' ? 'dark' : 'neutral',
          securityLevel: 'loose',
        });
        return mermaid.render(idRef.current, code);
      })
      .then((result) => {
        if (active && result) {
          setSvg(result.svg);
        }
      })
      .catch(() => {
        // Ignore parse errors; the diagram simply will not appear.
      });
    return () => {
      active = false;
    };
  }, [code, colorMode]);

  return (
    <div className="mermaid-figure" dangerouslySetInnerHTML={{__html: svg}} />
  );
}

export default function Mermaid({code}: {code: string}): ReactNode {
  return (
    <BrowserOnly fallback={<div className="mermaid-figure" />}>
      {() => <MermaidInner code={code} />}
    </BrowserOnly>
  );
}
