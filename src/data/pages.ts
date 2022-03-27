import { Main } from "components/main";
import { Test } from "components/test";

type CapitalLetter = 'A'|'B'|'C'|'D'|'E'|'F'|'G'|'H'|'I'|'J'|'K'|'L'|'M'|'N'|'O'|'P'|'Q'|'R'|'S'|'T'|'U'|'V'|'W'|'X'|'Y'|'Z';
type CapitalizedString = `${CapitalLetter}${string}`;

export interface Page {
  aliases: readonly string[];
  title: CapitalizedString;
  showOnNavBar: boolean;
  isMainPage: boolean;
  component: ((...args: any[]) => JSX.Element);
}

export const pages: Page[] = [
  {
    aliases: ['', 'main', 'home', 'landing'],
    title: "Campus Flow",
    showOnNavBar: false,
    isMainPage: true,
    component: Main,
  },
  {
    aliases: ['test'],
    title: "Test",
    showOnNavBar: true,
    isMainPage: false,
    component: Test,
  },
];


export const defaultPage: Page = pages.find(page => page.isMainPage)!;