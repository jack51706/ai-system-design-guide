import React, {type ReactNode} from 'react';
import BrowserOnly from '@docusaurus/BrowserOnly';

// Renders a labelled scatter plot from a ```scatter JSON code block. recharts
// is client-only (it measures the DOM), so it loads inside BrowserOnly with an
// equal-height fallback to avoid layout shift. Used for qualitative tradeoff
// charts (e.g. accuracy vs throughput) that Mermaid flowcharts cannot express.

type Point = {x: number; y: number; label: string};
type ChartData = {
  xLabel?: string;
  yLabel?: string;
  xScale?: 'log' | 'linear';
  yDomain?: [number, number];
  note?: string;
  points: Point[];
};

const HEIGHT = 380;

function Inner({data}: {data: ChartData}): ReactNode {
  const {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    LabelList,
  } = require('recharts');
  return (
    <figure style={{margin: '1.5rem 0'}}>
      <div style={{width: '100%', height: HEIGHT}}>
        <ResponsiveContainer>
          <ScatterChart margin={{top: 24, right: 56, bottom: 48, left: 24}}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              type="number"
              dataKey="x"
              name={data.xLabel}
              scale={data.xScale ?? 'linear'}
              domain={['auto', 'auto']}
              tickCount={6}
              label={{
                value: data.xLabel,
                position: 'insideBottom',
                offset: -16,
              }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name={data.yLabel}
              domain={data.yDomain ?? ['auto', 'auto']}
              label={{value: data.yLabel, angle: -90, position: 'insideLeft'}}
            />
            <ZAxis range={[140, 141]} />
            <Tooltip cursor={{strokeDasharray: '3 3'}} />
            <Scatter data={data.points} fill="#7c3aed">
              <LabelList dataKey="label" position="top" />
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      {data.note ? (
        <figcaption
          style={{
            textAlign: 'center',
            fontSize: '0.85rem',
            opacity: 0.7,
            marginTop: '0.5rem',
          }}>
          {data.note}
        </figcaption>
      ) : null}
    </figure>
  );
}

export default function ScatterPlot({data}: {data: ChartData}): ReactNode {
  return (
    <BrowserOnly fallback={<div style={{height: HEIGHT}} />}>
      {() => <Inner data={data} />}
    </BrowserOnly>
  );
}
