import { useState, useEffect, useRef } from 'react';

import { PageLink } from './page-link';
import { defaultPage, pages } from 'data/pages';

export function NavBar() {
  const [ responsive, setResponsive ] = useState(false);
  const navBarRef = useRef(null);

  useEffect(() => {
    function documentClickHandler(event: MouseEvent) {
      if (responsive && navBarRef.current && event.target !== navBarRef.current) {
        setResponsive(false);
      }
    }
    document.addEventListener("click", documentClickHandler);
    return () => {
      document.removeEventListener("click", documentClickHandler);
    }
  }, [responsive]);

  return (
    <nav ref={navBarRef} className="flex items-center justify-between flex-wrap bg-yellow-500 p-3 z-50">
      <PageLink page={defaultPage} />
      <div className="block md:hidden">
        <button onClick={() => setResponsive(!responsive)} className="flex items-center z-50 px-3 py-2 border rounded text-white border-white hover:text-green-400 hover:border-green-400 outline-none">
          <svg className="fill-current h-3 w-3" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><title>Menu</title><path d="M0 3h20v2H0V3zm0 6h20v2H0V9zm0 6h20v2H0v-2z"/></svg>
        </button>
      </div>
      <div className={`w-full ${responsive ? "block z-50" : "hidden"} flex-grow md:flex md:items-center md:w-auto bg-yellow-500 absolute md:relative top-full md:top-0 -ml-3 md:ml-0 p-3 md:p-0 pt-0`}>
        <div className="text-sm flex justify-start flex-col md:flex-row md:flex-grow">
          {pages.filter(page => page.showOnNavBar).map(page => <PageLink key={page.title} page={page} />)}
        </div>
      </div>
    </nav>
  );
}
