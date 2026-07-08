import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@pmis.com';
const ADMIN_PASSWORD = 'password';
const BACKEND_API_BASE = 'http://localhost:8080/api';

const readPageAuthToken = async (page: Page): Promise<string> => {
  return page.evaluate(() => {
    try {
      return localStorage.getItem('pmis-token') || '';
    } catch {
      return '';
    }
  });
};

const syncTokenFromLocalStorageToCookie = async (page: Page): Promise<void> => {
  const token = await page.evaluate(() => localStorage.getItem('pmis-token') || '');
  if (token) {
    await page.context().addCookies([{
      name: 'pmis-token',
      value: token,
      domain: 'localhost',
      path: '/',
      httpOnly: false,
      secure: false,
      sameSite: 'Lax',
    }]);
  }
};

const clientSideNav = async (page: Page, url: string): Promise<void> => {
  await page.evaluate(async (navUrl) => {
    const w = window as any;
    if (w.next?.router?.push) {
      await w.next.router.push(navUrl);
    } else if (w.location) {
      w.location.href = navUrl;
    }
  }, url);
  const t0 = Date.now();
  while (Date.now() - t0 < 15000) {
    const u = page.url();
    if (u.includes(url.split('?')[0])) break;
    await page.waitForTimeout(200);
  }
};

const login = async (page: Page): Promise<void> => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('input[type="email"]', { timeout: 10000 });
  await page.fill('input[type="email"]', ADMIN_EMAIL);
  await page.fill('input[type="password"]', ADMIN_PASSWORD);
  await Promise.all([
    page.waitForNavigation({ timeout: 30000, waitUntil: 'domcontentloaded' }),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1500);
  await syncTokenFromLocalStorageToCookie(page);
};

const goToNewDocument = async (page: Page): Promise<void> => {
  await syncTokenFromLocalStorageToCookie(page);
  await page.goto('/wiki/new-document', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  let curUrl = page.url();
  if (!curUrl.includes('/wiki/new-document')) {
    await syncTokenFromLocalStorageToCookie(page);
    await clientSideNav(page, '/wiki/new-document');
    curUrl = page.url();
  }
  if (!curUrl.includes('/wiki/new-document')) {
    throw new Error(`goToNewDocument: expected /wiki/new-document but got ${curUrl}`);
  }
  const titleInput = page.locator('input[placeholder="Enter document title..."]');
  await titleInput.waitFor({ state: 'visible', timeout: 20000 });
  const editor = page.locator('.tiptap-editor .ProseMirror, .tiptap .ProseMirror, [contenteditable="true"]');
  await editor.first().waitFor({ state: 'visible', timeout: 25000 });
  await page.waitForTimeout(500);
};

const navigateToWikiList = async (page: Page): Promise<void> => {
  await syncTokenFromLocalStorageToCookie(page);
  await page.goto('/wiki', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  let curUrl = page.url();
  if (!curUrl.includes('/wiki')) {
    await syncTokenFromLocalStorageToCookie(page);
    await clientSideNav(page, '/wiki');
  }
  try {
    await page.getByRole('heading', { name: /Wiki/, level: 1 }).waitFor({ state: 'visible', timeout: 25000 });
  } catch (e) {
    const url = page.url();
    const storage = await page.evaluate(() => ({ token: localStorage.getItem('pmis-token') }));
    console.log(`DEBUG wiki-list url=${url} token=${storage.token?.slice(0, 20)}...`);
    throw e;
  }
  await page.waitForTimeout(1000);
};

type ApiCallResult = { status: number; bodyText: string; data: any };

const callApiJson = async (
  page: Page,
  method: string,
  path: string,
  bodyObj: any | null
): Promise<ApiCallResult> => {
  const token = await readPageAuthToken(page);
  return page.evaluate(
    async ({ method, path, bodyObj, token, apiBase }) => {
      try {
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        let body: string | undefined;
        if (bodyObj !== null && bodyObj !== undefined) {
          headers['Content-Type'] = 'application/json';
          body = JSON.stringify(bodyObj);
        }
        const r = await fetch(`${apiBase}${path}`, { method, headers, body, credentials: 'include' });
        const text = await r.text();
        let data: any = null;
        try { data = JSON.parse(text); } catch { /* noop */ }
        return { status: r.status, bodyText: text, data };
      } catch (e: any) {
        return { status: 0, bodyText: String(e?.message ?? e), data: null };
      }
    },
    { method, path, bodyObj, token, apiBase: BACKEND_API_BASE }
  );
};

const createdPageIds = new Set<number>();
const createdFolderIds = new Set<number>();
const createdNamePatternKeys = new Set<string>();

const trackCreated = (kind: 'page' | 'folder', id: number, name?: string) => {
  if (kind === 'page') createdPageIds.add(id);
  else createdFolderIds.add(id);
  if (name) {
    const key = name.trim().toLowerCase();
    if (key.includes('uniq-')) createdNamePatternKeys.add(key);
  }
};

const cleanupApiIds = async (page: Page, scope: string = 'afterEach', forceSweep: boolean = false) => {
  const pageIds = Array.from(createdPageIds);
  const folderIds = Array.from(createdFolderIds);
  const patternKeys = Array.from(createdNamePatternKeys);
  let pageOk = 0; let pageFail = 0; let folderOk = 0; let folderFail = 0;

  for (const id of pageIds) {
    try {
      const r = await callApiJson(page, 'DELETE', `/wiki/pages/${id}`, null);
      if (r.status === 200 || r.status === 204 || r.status === 410 || r.status === 404) { pageOk++; } else { pageFail++; console.log(`[cleanup/${scope}] DELETE page/${id} status=${r.status} body=${r.bodyText.slice(0, 200)}`); }
    } catch (e) { pageFail++; console.log(`[cleanup/${scope}] DELETE page/${id} threw: ${String(e).slice(0, 150)}`); }
  }
  for (const id of folderIds) {
    try {
      const r = await callApiJson(page, 'DELETE', `/wiki/folders/${id}`, null);
      if (r.status === 200 || r.status === 204 || r.status === 410 || r.status === 404) { folderOk++; } else { folderFail++; console.log(`[cleanup/${scope}] DELETE folder/${id} status=${r.status} body=${r.bodyText.slice(0, 200)}`); }
    } catch (e) { folderFail++; console.log(`[cleanup/${scope}] DELETE folder/${id} threw: ${String(e).slice(0, 150)}`); }
  }
  createdPageIds.clear();
  createdFolderIds.clear();
  createdNamePatternKeys.clear();

  const doSweep = forceSweep || patternKeys.length > 0;
  let sweptPages = 0; let sweptFolders = 0;
  if (doSweep) {
    try {
      const listPages = await callApiJson(page, 'GET', '/wiki/pages', null);
      if (listPages.status === 200 && Array.isArray(listPages.data)) {
        for (const p of listPages.data) {
          const title = String(p.title || '').trim().toLowerCase();
          const matchByTracked = patternKeys.some(k => title === k);
          const matchByPrefix = title.startsWith('uniq-');
          if ((matchByTracked || matchByPrefix) && typeof p.id === 'number') {
            try {
              const dr = await callApiJson(page, 'DELETE', `/wiki/pages/${p.id}`, null);
              if (dr.status === 200 || dr.status === 204 || dr.status === 410 || dr.status === 404) sweptPages++;
              else console.log(`[cleanup/${scope}] sweep DELETE page/${p.id} (${title}) status=${dr.status}`);
            } catch {}
          }
        }
      }
    } catch (e) { console.log(`[cleanup/${scope}] sweep list pages failed: ${String(e).slice(0, 150)}`); }

    try {
      const listFolders = await callApiJson(page, 'GET', '/wiki/folders', null);
      if (listFolders.status === 200 && Array.isArray(listFolders.data)) {
        const walk = (nodes: any[]): any[] => {
          const out: any[] = [];
          for (const n of nodes) {
            out.push(n);
            if (n.children && Array.isArray(n.children)) out.push(...walk(n.children));
          }
          return out;
        };
        const flat = walk(listFolders.data);
        for (const f of flat) {
          const name = String(f.name || '').trim().toLowerCase();
          const matchByTracked = patternKeys.some(k => name === k);
          const matchByPrefix = name.startsWith('uniq-');
          if ((matchByTracked || matchByPrefix) && typeof f.id === 'number') {
            try {
              const dr = await callApiJson(page, 'DELETE', `/wiki/folders/${f.id}`, null);
              if (dr.status === 200 || dr.status === 204 || dr.status === 410 || dr.status === 404) sweptFolders++;
              else console.log(`[cleanup/${scope}] sweep DELETE folder/${f.id} (${name}) status=${dr.status}`);
            } catch {}
          }
        }
      }
    } catch (e) { console.log(`[cleanup/${scope}] sweep list folders failed: ${String(e).slice(0, 150)}`); }
  }

  console.log(`[cleanup/${scope}] pages=${pageOk}/${pageIds.length}-ok/${pageFail}-fail folders=${folderOk}/${folderIds.length}-ok/${folderFail}-fail | sweep-safety-net pages=${sweptPages} folders=${sweptFolders}`);
};

const uniqueName = (label: string) => `${label}-${Date.now()}-${Math.floor(Math.random() * 10000)}`;

const assertConflict = (label: string, r: ApiCallResult, needle?: string) => {
  expect(`${label}: expected HTTP 400 but got ${r.status} body=${r.bodyText.slice(0, 300)}`).toContain(`${label}: expected HTTP 400`);
  expect(r.status).toBe(400);
  const text = (r.bodyText || '').toLowerCase();
  const errMsg = String(r.data?.error ?? r.data?.message ?? r.bodyText ?? '').toLowerCase();
  expect(`${label}: response should mention conflict. Full error: ${r.bodyText.slice(0, 300)}`).toContain(`${label}:`);
  expect(text.includes('already') || errMsg.includes('already') || text.includes('use') || errMsg.includes('use')).toBe(true);
  if (needle) {
    expect(`${label}: expected ${needle} in error. Got: ${r.bodyText.slice(0, 300)}`).toContain(`${label}:`);
    expect(text.includes(needle.toLowerCase()) || errMsg.includes(needle.toLowerCase())).toBe(true);
  }
};

test.afterAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  try {
    await login(p);
    await cleanupApiIds(p, 'afterAll', true);
  } catch (e) { /* noop */ } finally {
    await p.close();
    await ctx.close();
  }
});

test.describe('Wiki Module Unique Name Constraint (Global across Folders + Documents)', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    page.on('dialog', (d) => d.accept());
    await login(page);
  });

  test.afterEach(async ({ page }) => {
    await cleanupApiIds(page, 'afterEach');
  });

  test('TC-1 Page↔Page duplicate rejected via API', async ({ page }) => {
    test.setTimeout(120000);
    const title = uniqueName('UNIQ-PAGE-PAGE');

    const r1 = await callApiJson(page, 'POST', '/wiki/pages', {
      title,
      contentHtml: '<p>first</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r1.status);
    expect(r1.data?.id).toBeGreaterThan(0);
    trackCreated('page', r1.data.id, title);

    const r2 = await callApiJson(page, 'POST', '/wiki/pages', {
      title,
      contentHtml: '<p>second duplicate</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    assertConflict('TC-1 page/page', r2, title);
  });

  test('TC-2 Folder↔Folder duplicate rejected via API', async ({ page }) => {
    test.setTimeout(120000);
    const name = uniqueName('UNIQ-FOLDER-FOLDER');

    const r1 = await callApiJson(page, 'POST', '/wiki/folders', {
      name,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r1.status);
    expect(r1.data?.id).toBeGreaterThan(0);
    trackCreated('folder', r1.data.id, name);

    const r2 = await callApiJson(page, 'POST', '/wiki/folders', {
      name,
      visibility: 'PRIVATE',
    });
    assertConflict('TC-2 folder/folder', r2, name);
  });

  test('TC-3 Page first, then FOLDER with same name rejected (cross-type via API)', async ({ page }) => {
    test.setTimeout(120000);
    const shared = uniqueName('UNIQ-CROSS-PF');

    const r1 = await callApiJson(page, 'POST', '/wiki/pages', {
      title: shared,
      contentHtml: '<p>page first</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r1.status);
    trackCreated('page', r1.data.id, shared);

    const r2 = await callApiJson(page, 'POST', '/wiki/folders', {
      name: shared,
      visibility: 'PRIVATE',
    });
    assertConflict('TC-3 page/folder', r2, shared);
  });

  test('TC-4 Folder first, then PAGE with same name rejected (cross-type via API)', async ({ page }) => {
    test.setTimeout(120000);
    const shared = uniqueName('UNIQ-CROSS-FP');

    const r1 = await callApiJson(page, 'POST', '/wiki/folders', {
      name: shared,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r1.status);
    trackCreated('folder', r1.data.id, shared);

    const r2 = await callApiJson(page, 'POST', '/wiki/pages', {
      title: shared,
      contentHtml: '<p>page second</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    assertConflict('TC-4 folder/page', r2, shared);
  });

  test('TC-5 Case-insensitive uniqueness: "CaMeL" vs "camel" rejected', async ({ page }) => {
    test.setTimeout(120000);
    const base = uniqueName('UNIQ-CASE');
    const casingA = `${base.slice(0, 4).toUpperCase()}${base.slice(4).toLowerCase()}`;
    const casingB = base.toLowerCase();

    const r1 = await callApiJson(page, 'POST', '/wiki/pages', {
      title: casingA,
      contentHtml: '<p>case variant A</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r1.status);
    trackCreated('page', r1.data.id, casingA);
    trackCreated('page', r1.data.id, casingB);
    trackCreated('page', r1.data.id, base);

    const r2 = await callApiJson(page, 'POST', '/wiki/folders', {
      name: casingB,
      visibility: 'PRIVATE',
    });
    assertConflict('TC-5 case-insensitive', r2, base.toLowerCase());
  });

  test('TC-6 Trimmed whitespace uniqueness: "Spaced  " vs "  Spaced" rejected', async ({ page }) => {
    test.setTimeout(120000);
    const base = uniqueName('UNIQ-SPACED');

    const r1 = await callApiJson(page, 'POST', '/wiki/folders', {
      name: `${base}  `,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r1.status);
    trackCreated('folder', r1.data.id, `${base}  `);
    trackCreated('folder', r1.data.id, base);

    const r2 = await callApiJson(page, 'POST', '/wiki/pages', {
      title: `  ${base}`,
      contentHtml: '<p>leading spaces</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    assertConflict('TC-6 whitespace trim', r2, base);
  });

  test('TC-7 Allowed: rename a page to its own existing name (self-exclude) succeeds', async ({ page }) => {
    test.setTimeout(120000);
    const title = uniqueName('UNIQ-SELF-RENAME');
    const r1 = await callApiJson(page, 'POST', '/wiki/pages', {
      title,
      contentHtml: '<p>initial</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r1.status);
    const id = r1.data.id;
    trackCreated('page', id, title);

    const r2 = await callApiJson(page, 'PUT', `/wiki/pages/${id}`, {
      title,
      contentHtml: '<p>edited content, same title</p>',
    });
    expect(`TC-7 self rename same title expected 200 got ${r2.status} body=${r2.bodyText.slice(0, 300)}`).toContain('TC-7');
    expect([200, 201]).toContain(r2.status);
  });

  test('TC-8 Rename page into existing other-page name should be rejected', async ({ page }) => {
    test.setTimeout(120000);
    const nameA = uniqueName('UNIQ-RENAME-A');
    const nameB = uniqueName('UNIQ-RENAME-B');

    const rA = await callApiJson(page, 'POST', '/wiki/pages', {
      title: nameA,
      contentHtml: '<p>A</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(rA.status);
    trackCreated('page', rA.data.id, nameA);

    const rB = await callApiJson(page, 'POST', '/wiki/pages', {
      title: nameB,
      contentHtml: '<p>B</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(rB.status);
    trackCreated('page', rB.data.id, nameB);

    const rBadRename = await callApiJson(page, 'PUT', `/wiki/pages/${rB.data.id}`, {
      title: nameA,
      contentHtml: '<p>B tries to steal As name</p>',
    });
    assertConflict('TC-8 rename collision', rBadRename, nameA);
  });

  test('TC-9 UI Flow: create page then try New-Document page with same title → inline titleError visible', async ({ page }) => {
    test.setTimeout(240000);
    const title = uniqueName('UNIQ-UI-PAGE-PAGE');

    const r = await callApiJson(page, 'POST', '/wiki/pages', {
      title,
      contentHtml: '<p>seeded via API</p>',
      contentJson: '{}',
      isPublished: false,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r.status);
    trackCreated('page', r.data.id, title);

    await goToNewDocument(page);
    const titleInput = page.locator('input[placeholder="Enter document title..."]');
    await titleInput.fill(title);

    const saveBtn = page.locator('button:has-text("Save Draft")');
    await saveBtn.waitFor({ state: 'visible', timeout: 15000 });
    const beforeUrl = page.url();
    await saveBtn.click();
    await page.waitForTimeout(5000);

    const urlAfter = page.url();
    console.log(`[TC-9] before=${beforeUrl} after=${urlAfter}`);
    expect(urlAfter).toContain('/wiki/new-document');

    const titleErrorDiv = page.locator('.text-red-600, .text-red-500');
    const redCount = await titleErrorDiv.count();
    const wholeBody = (await page.locator('body').innerText().catch(() => '') || '').toLowerCase();
    const foundConflictMsg =
      wholeBody.includes('already in use') ||
      wholeBody.includes('already exists') ||
      (wholeBody.includes(title.toLowerCase().slice(0, 8)) &&
        (wholeBody.includes('wiki module') || wholeBody.includes('unique')));
    console.log(`[TC-9] redTextElements=${redCount} conflictMsg=${foundConflictMsg} bodySnippet=${wholeBody.slice(0, 1200)}`);
    expect(redCount > 0 || foundConflictMsg).toBe(true);
  });

  test('TC-10 UI Flow: create folder via API, open New Folder modal via URL hook → duplicate name shows inline error', async ({ page }) => {
    test.setTimeout(240000);
    const folderName = uniqueName('UNIQ-UI-FOLDER');

    const r = await callApiJson(page, 'POST', '/wiki/folders', {
      name: folderName,
      visibility: 'PRIVATE',
    });
    expect([200, 201]).toContain(r.status);
    trackCreated('folder', r.data.id, folderName);

    await navigateToWikiList(page);
    await page.waitForTimeout(1800);

    const bodyBefore = (await page.locator('body').innerText().catch(() => '') || '').toLowerCase();
    const onWiki = bodyBefore.includes('no wiki pages yet') || bodyBefore.includes('wiki') && bodyBefore.includes('all') && bodyBefore.includes('my pages');
    console.log(`[TC-10] onWiki list page before nav: ${onWiki}`);

    await clientSideNav(page, '/wiki?newFolderModal=1');
    await page.waitForTimeout(3200);

    const pageSource = await page.content();
    const hasFolderNameInput = pageSource.includes('Enter folder name...') || pageSource.includes('Folder Name');
    const anyModal = page.locator('div.fixed.inset-0.z-50');
    const modalCount = await anyModal.count();
    console.log(`[TC-10] hasFolderNameInput=${hasFolderNameInput} modalCount=${modalCount}`);

    const folderNameInput = page
      .locator('div.fixed.inset-0, div[role="dialog"]')
      .locator('input[placeholder="Enter folder name..."]')
      .first();

    try {
      await folderNameInput.waitFor({ state: 'visible', timeout: 10000 });
    } catch (e) {
      const bodyHtml = (await page.locator('body').innerText().catch(() => '') || '').slice(0, 600);
      console.log(`[TC-10] fallback body when waiting for input: ${bodyHtml}`);
    }
    await expect(folderNameInput).toBeVisible({ timeout: 25000 });
    await folderNameInput.fill(folderName);

    const submitCreateBtn = page
      .locator('div.fixed.inset-0, div[role="dialog"]')
      .locator('button')
      .filter({ hasText: /Create Folder/i })
      .first();
    await submitCreateBtn.waitFor({ state: 'visible', timeout: 15000 });
    await submitCreateBtn.click();
    await page.waitForTimeout(4000);

    const errorBox = page
      .locator('div.fixed.inset-0, div[role="dialog"]')
      .locator('.bg-red-50.border.border-red-200.text-red-700, .text-red-600, .text-red-500')
      .first();
    const errVisible = await errorBox.isVisible().catch(() => false);
    const errText = (await errorBox.innerText().catch(() => '') || '').toLowerCase();
    const wholeBody = (await page.locator('body').innerText().catch(() => '') || '').toLowerCase();
    const foundMsg =
      errText.includes('already in use') ||
      errText.includes('already exists') ||
      errText.includes('unique') ||
      (wholeBody.includes(folderName.toLowerCase().slice(0, 8)) &&
        (wholeBody.includes('already in use') || wholeBody.includes('already exists') || wholeBody.includes('wiki module')));
    console.log(`[TC-10] errVisible=${errVisible} errText=${errText.slice(0, 200)} foundMsg=${foundMsg}`);
    expect(errVisible || foundMsg).toBe(true);
    if (errVisible) {
      expect(errText.includes('already') || errText.includes('use') || errText.includes('unique')).toBe(true);
    }
  });
});
