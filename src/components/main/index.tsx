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

function useToggle(default_state: boolean = false): [boolean, () => void] {
  const [toggleState, setToggleState] = useState<boolean>(default_state);
  const toggleFunc = useCallback(() => setToggleState(t=>!t), [setToggleState]);
  return [toggleState, toggleFunc];
}

export function Main() {
  const [resetTrigger, triggerReset] = useEventTrigger();
  const [analysisTrigger, triggerAnalysis] = useEventTrigger();

  const [paused, togglePaused] = useToggle();
  const [heatMap, toggleHeatMap] = useToggle();

  return <Page>
    <Card>
      <div className="w-full">
        <div className="flex flex-row items-center justify-center mb-2">
          <h1 className="text-4xl font-bold text-center">Campus Flow</h1>
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 mx-2 rounded" onClick={triggerReset}>
            Reset
          </button>
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 mx-2 rounded" onClick={togglePaused}>
            {paused ? 'Resume' : 'Pause'}
          </button>
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 mx-2 rounded text-sm" onClick={triggerAnalysis}>
            Run travel time<br/> Analysis
          </button>
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 mx-2 rounded" onClick={toggleHeatMap}>
            {heatMap ? 'Show map' : 'Show travel\nheatmap'}
          </button>
        </div>
        <div className='w-full mx-auto max-w-3xl'>
          <ReactP5Wrapper sketch={sketch} resetCounter={resetTrigger} paused={paused} doAnalysisCounter={analysisTrigger} renderHeatmap={heatMap} />
        </div>
      </div>
    </Card>
  </Page>
}