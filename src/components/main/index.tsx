import { Page } from 'components/reusable/page';
import {Card} from 'components/reusable/card';
import { ReactP5Wrapper } from 'react-p5-wrapper';
import { sketch } from './sketch/sketch';
import { useCallback, useState } from 'react';

function useEventTrigger(): [number, () => void] {
  const [trigger, setTrigger] = useState<number>(0);
  const onTrigger = useCallback(() => setTrigger(n=>n+1), [setTrigger]);
  return [trigger, onTrigger];
}

export function Main() {
  const [resetTrigger, triggerReset] = useEventTrigger();
  const [analysisTrigger, triggerAnalysis] = useEventTrigger();

  const [paused, setPaused] = useState<boolean>(false);

  return <Page>
    <Card>
      <div className="w-full">
        <div className="flex flex-row items-center justify-center mb-2">
          <h1 className="text-4xl font-bold text-center">Campus Flow</h1>
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 mx-2 rounded" onClick={triggerReset}>
            Reset
          </button>
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 mx-2 rounded" onClick={()=>setPaused(p => !p)}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 mx-2 rounded text-sm" onClick={triggerAnalysis}>
            Run travel time<br/> Analysis
          </button>
        </div>
        <div className='w-full mx-auto max-w-100'>
          <ReactP5Wrapper sketch={sketch} resetCounter={resetTrigger} paused={paused} doAnalysisCounter={analysisTrigger} />
        </div>
      </div>
    </Card>
  </Page>
}