export type AppLang = 'zh' | 'en';

/** Dictionary leaf value: a string, or a nested dictionary section */
export interface DictNode {
  [key: string]: string | DictNode;
}

/** Dictionary structure: kept in sync with the objects in zh.ts/en.ts */
export type Dictionary = {
  nav: DictNode;
  notifications: DictNode;
  login: DictNode;
  common: DictNode;
  dashboard: DictNode;
  retro: {
    list: DictNode;
    create: DictNode;
    detail: DictNode;
  };
  issues: DictNode;
  projects: DictNode;
  teams: DictNode;
  wiki: DictNode;
  search: DictNode;
  reports: DictNode;
  settings: DictNode;
};
