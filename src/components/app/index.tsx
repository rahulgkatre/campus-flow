import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import {AppHeader} from './header';
import {AppFooter} from './footer';

import { defaultPage, pages } from 'data/pages';

require('./hacks');

export function App() {
  return (
    <div className='h-full flex flex-col' id='app'>
      <Helmet>
        <title>CX4230 - Group 1 - Campus Flow</title>
      </Helmet>
      <AppHeader />
      <main className='flex-grow z-10'>
        <Routes>
          {pages.map(page => {
            const pathNames = page.aliases.map(path => '/'+path);
            return pathNames.map(path => <Route key={path} path={path} element={<page.component />} />);
          }).flat()}
          <Route path='/' element={<Navigate replace={true} to={`/${defaultPage.aliases[0]}`} />} />
        </Routes>
      </main>
      <AppFooter className="absolute bottom-0" />
    </div>
  );
}
