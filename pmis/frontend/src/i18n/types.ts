export type AppLang = 'zh' | 'en';

/** 字典叶子值：字符串，或嵌套的字典分区 */
export interface DictNode {
  [key: string]: string | DictNode;
}

/** 字典结构：与 zh.ts/en.ts 的对象保持一致 */
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
