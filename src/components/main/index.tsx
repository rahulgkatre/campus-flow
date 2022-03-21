import { Page } from 'components/reusable/page';
import {Card} from 'components/reusable/card';
import { ReactP5Wrapper } from 'react-p5-wrapper';
import { sketch } from './sketch/sketch';
import { useCallback, useState } from 'react';


export function Main() {
  const [sketchResetter, setSketchResetter] = useState<number>(0);
  const resetSketch = useCallback(() => setSketchResetter(n=>n+1), [setSketchResetter]);

  return <Page>
    <Card>
      <div className="w-full">
        <div className="flex flex-row items-center justify-center mb-2">
          <h1 className="text-4xl font-bold text-center">Campus Flow</h1>
          <button className="bg-yellow-500 hover:bg-yellow-700 text-white font-bold py-1 px-3 mx-2 rounded" onClick={resetSketch}>
            Reset
          </button>
        </div>
        <div className='w-min mx-auto'>
          <ReactP5Wrapper sketch={sketch} resetCounter={sketchResetter} />
        </div>
      </div>
    </Card>
  </Page>
}