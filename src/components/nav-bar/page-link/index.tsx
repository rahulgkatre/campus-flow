import type {Page} from 'data/pages';
import { NavLink } from 'react-router-dom';
import {ReactComponent as Logo} from 'assets/images/logo.svg';

function MainPageLink({page}: {page: Page}) {
  return <Logo className="fill-current" width="60" height="48" title={page.title} />;
}

const mainPageClassName = "flex items-center flex-shrink-0" as const;
const otherPageClassName = "block mt-4 mb-4 md:mb-0 md:inline-block md:mt-0 font-semibold text-xl" as const;
function getClassName(isMainPage: boolean) {
  return `text-white hover:text-green-400 transition-transform mr-auto md:mr-4 ${isMainPage ? mainPageClassName : otherPageClassName}`;
}

export function PageLink({page}: {page: Page}) {
  let children = page.isMainPage ? <MainPageLink page={page} /> : <>{page.title}</>;
  let className = getClassName(page.isMainPage);
  return <NavLink to={`/${page.aliases[0]}`} className={({ isActive }) => (isActive ? "transform scale-125 ml-2 md:ml-0" : className)}>
    {children}
  </NavLink>;
}