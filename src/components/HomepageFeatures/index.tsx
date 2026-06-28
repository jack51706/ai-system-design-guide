import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import Translate from '@docusaurus/Translate';
import styles from './styles.module.css';

type FeatureItem = {
  title: ReactNode;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: (
      <Translate id="homepage.feature.interview.title">
        Interview-Ready Depth
      </Translate>
    ),
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <Translate id="homepage.feature.interview.description">
        Staff-level questions, answer frameworks, and whiteboard exercises
        covering RAG design, agent debugging, multi-tenant isolation, and cost
        and latency tradeoffs.
      </Translate>
    ),
  },
  {
    title: (
      <Translate id="homepage.feature.patterns.title">
        Production Patterns
      </Translate>
    ),
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <Translate id="homepage.feature.patterns.description">
        Real architectures for RAG pipelines, agentic systems, MCP and A2A,
        evaluation, and reliability, each with concrete tradeoffs and the
        failure modes that show up in production.
      </Translate>
    ),
  },
  {
    title: (
      <Translate id="homepage.feature.living.title">
        A Living Reference
      </Translate>
    ),
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <Translate id="homepage.feature.living.description">
        Continuously updated as new models, protocols, and patterns ship, so
        the guidance reflects what production teams actually use today.
      </Translate>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
