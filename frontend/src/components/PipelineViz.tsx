/**
 * components/PipelineViz.tsx
 * Compilation pipeline visual stages strip
 */
import type { PipelineStage } from '../types';

interface Props {
  stages: PipelineStage[];
}

export function PipelineViz({ stages }: Props) {
  const statusLabel: Record<string, string> = {
    pending: 'PENDING',
    running: 'RUNNING…',
    done:    'PASSED',
    failed:  'FAILED',
    skipped: 'SKIPPED',
  };

  return (
    <div className="pipeline-stages">
      {stages.map((s) => (
        <div key={s.id} className={`stage ${s.status}`}>
          <div className="stage-icon">{s.icon}</div>
          <div className="stage-label">{s.label}</div>
          <div className="stage-status">{statusLabel[s.status]}</div>
        </div>
      ))}
    </div>
  );
}
