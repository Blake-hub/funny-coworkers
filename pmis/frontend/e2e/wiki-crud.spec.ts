import { test, expect, type Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

type ElementCounts = Record<string, number>;

const createdPageIds: number[] = [];

const ADMIN_EMAIL = 'admin@pmis.com';
const ADMIN_PASSWORD = 'password';

const TEST_USER_ID = 1;
const BACKEND_API_BASE = 'http://localhost:8080/api';
const BACKEND_ORIGIN = 'http://localhost:8080';

/**
 * Correctly joins a backend-returned image/media URL to an absolute URL
 * that can be fetched from the browser context (port 3000).
 *
 * Upload endpoint /wiki/images/upload returns URLs in various formats:
 *   Case A: /api/wiki/images/uuid.png  → already includes /api prefix (DO NOT double!)
 *   Case B: /wiki/images/uuid.png     → no /api prefix
 *   Case C: http://host:8080/api/...  → absolute URL, leave alone
 *   Case D: data:... blob:...         → inline, leave alone
 */
const joinBackendMediaUrl = (url: string): string => {
  if (!url) return '';
  const trimmed = url.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(trimmed) || trimmed.startsWith('//')) {
    return trimmed;
  }
  if (trimmed.startsWith('/api/')) {
    return `${BACKEND_ORIGIN}${trimmed}`;
  }
  if (trimmed.startsWith('/')) {
    // Case B: /wiki/images/... or /uploads/... (no /api prefix yet) → prepend /api via BACKEND_API_BASE
    return `${BACKEND_API_BASE}${trimmed}`;
  }
  return `${BACKEND_API_BASE}/${trimmed}`;
};

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
    console.log(`[goToNewDocument] SSR redirect detected: url=${curUrl}, trying client-side...`);
    await syncTokenFromLocalStorageToCookie(page);
    await clientSideNav(page, '/wiki/new-document');
    curUrl = page.url();
  }
  if (!curUrl.includes('/wiki/new-document')) {
    const html = await page.content();
    const token = await page.evaluate(() => localStorage.getItem('pmis-token') || 'NO-TOKEN');
    console.log(`[goToNewDocument] WARN: unexpected url=${curUrl} token=${token.slice(0, 25)}... html snippet: ${html.slice(0, 500)}`);
    throw new Error(`goToNewDocument: expected /wiki/new-document but got ${curUrl}`);
  }
  const titleInput = page.locator('input[placeholder="Enter document title..."]');
  try {
    await titleInput.waitFor({ state: 'visible', timeout: 20000 });
  } catch (e) {
    const allInputs = await page.locator('input').all();
    const bodyHtml = await page.evaluate(() => document.body ? document.body.innerHTML.slice(0, 3000) : 'NO-BODY');
    const pageTitle = await page.title();
    const urlFinal = page.url();
    const cookieList = await page.context().cookies();
    const token = await page.evaluate(() => localStorage.getItem('pmis-token') || 'NO-TOKEN');
    console.log(`[goToNewDocument] DEBUG: url=${urlFinal}`);
    console.log(`[goToNewDocument] DEBUG: pageTitle=${pageTitle}`);
    console.log(`[goToNewDocument] DEBUG: localStorage token=${token.slice(0, 30)}...`);
    console.log(`[goToNewDocument] DEBUG: cookies count=${cookieList.length}: ${cookieList.map((c: any) => c.name + '=' + (c.value || '').slice(0, 10)).join(', ')}`);
    console.log(`[goToNewDocument] DEBUG: found ${allInputs.length} inputs on page`);
    for (let i = 0; i < allInputs.length; i++) {
      try {
        const ph = await allInputs[i].getAttribute('placeholder');
        const tp = await allInputs[i].getAttribute('type');
        console.log(`  input[${i}] type=${tp} placeholder=${ph}`);
      } catch { /* noop */ }
    }
    const allVisibleText = await page.locator('body').innerText().catch((err: any) => `INNER-TEXT-ERROR: ${err}`);
    console.log(`[goToNewDocument] DEBUG: visible text snippet: ${String(allVisibleText).slice(0, 1000)}`);
    console.log(`[goToNewDocument] DEBUG: body.innerHTML snippet: ${bodyHtml}`);
    throw e;
  }
  const editor = page.locator('.tiptap-editor .ProseMirror, .tiptap .ProseMirror, [contenteditable="true"]');
  await editor.first().waitFor({ state: 'visible', timeout: 25000 });
  await page.waitForTimeout(500);
};

const seedEditorHtml = async (page: Page, html: string): Promise<void> => {
  await page.evaluate((htmlContent) => {
    const editor =
      (document.querySelector('.tiptap-editor .ProseMirror') as HTMLElement | null) ||
      (document.querySelector('.tiptap .ProseMirror') as HTMLElement | null) ||
      (document.querySelector('[contenteditable="true"]') as HTMLElement | null);
    if (!editor) throw new Error('Editor container not found for seeding');
    editor.focus();
    const selection = window.getSelection();
    if (!selection) throw new Error('No selection object');
    selection.removeAllRanges();
    const range = document.createRange();
    range.selectNodeContents(editor);
    if (editor.firstChild) {
      range.setStartAfter(editor.firstChild);
    }
    selection.addRange(range);

    const dt = new DataTransfer();
    dt.setData('text/html', htmlContent);
    dt.setData('text/plain', htmlContent.replace(/<[^>]+>/g, ' '));
    const pasteEvent = new ClipboardEvent('paste', {
      bubbles: true,
      cancelable: true,
      clipboardData: dt,
    });
    const cancelled = !editor.dispatchEvent(pasteEvent);
    if (cancelled) return;
    document.execCommand('insertHTML', false, htmlContent);
  }, html);
  await page.waitForTimeout(1500);
};

const saveDraftFromNewDocument = async (page: Page): Promise<{ pageId: number }> => {
  const saveBtn = page.locator('button:has-text("Save Draft")');
  await saveBtn.waitFor({ state: 'visible', timeout: 15000 });
  await saveBtn.click();
  await page.waitForTimeout(4000);
  const currentUrl = page.url();
  expect(currentUrl).toContain('/wiki/');
  expect(currentUrl).toContain('/edit');
  const urlParts = currentUrl.split('/');
  const pageId = parseInt(urlParts[urlParts.length - 2], 10);
  expect(pageId).toBeGreaterThan(0);
  createdPageIds.push(pageId);
  return { pageId };
};

const createPageViaUI = async (
  page: Page,
  opts: { title: string; contentHtml: string; publish?: boolean }
): Promise<{ pageId: number }> => {
  await goToNewDocument(page);
  await page.fill('input[placeholder="Enter document title..."]', opts.title);
  await seedEditorHtml(page, opts.contentHtml);
  const { pageId } = await saveDraftFromNewDocument(page);
  if (opts.publish) {
    await publishFromEditPage(page);
  }
  return { pageId };
};

const publishFromEditPage = async (page: Page): Promise<void> => {
  const publishBtn = page.locator('button:has-text("Publish")');
  await publishBtn.waitFor({ state: 'visible', timeout: 15000 });
  await publishBtn.click();
  await page.waitForTimeout(4000);
  expect(page.url()).toContain('/wiki/');
  expect(page.url()).not.toContain('/edit');
};

const uploadSampleImage = async (page: Page): Promise<{ url: string; filename: string }> => {
  const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
  const buffer = fs.readFileSync(fixturePath);
  const base64 = buffer.toString('base64');
  const token = await readPageAuthToken(page);

  const result = await page.evaluate(
    async ({ base64, userId, token, apiBase }) => {
      const byteCharacters = atob(base64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      const file = new File([blob], 'sample.png', { type: 'image/png' });
      const form = new FormData();
      form.append('file', file);
      form.append('userId', String(userId));
      try {
        const resp = await fetch(`${apiBase}/wiki/images/upload`, {
          method: 'POST',
          body: form,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          credentials: 'include',
        });
        const text = await resp.text();
        return { status: resp.status, text };
      } catch (e: any) {
        return { status: -1, text: String(e?.message ?? e) };
      }
    },
    { base64, userId: TEST_USER_ID, token, apiBase: BACKEND_API_BASE }
  );

  if (result.status < 200 || result.status >= 300) {
    throw new Error(`upload failed ${result.status}: ${result.text.slice(0, 500)}`);
  }
  const json = JSON.parse(result.text);
  const url: string = json.url ?? json.data?.url;
  const filename: string = json.filename ?? json.data?.filename ?? url.split('/').pop();
  expect(url).toBeTruthy();
  return { url, filename };
};

const fetchPageViaBrowser = async (page: Page, id: number): Promise<{ status: number; data: any }> => {
  const token = await readPageAuthToken(page);
  return page.evaluate(
    async ({ pid, token, apiBase }) => {
      try {
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        headers['Content-Type'] = 'application/json';
        const r = await fetch(`${apiBase}/wiki/pages/${pid}`, { headers, credentials: 'include' });
        const text = await r.text();
        let data: any = null;
        try { data = JSON.parse(text); } catch { /* noop */ }
        return { status: r.status, data };
      } catch (e: any) {
        return { status: 0, data: { error: String(e?.message ?? e) } };
      }
    },
    { pid: id, token, apiBase: BACKEND_API_BASE }
  );
};

const deletePageViaBrowser = async (page: Page, id: number): Promise<number> => {
  const token = await readPageAuthToken(page);
  return page.evaluate(
    async ({ pid, token, apiBase }) => {
      try {
        const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
        const r = await fetch(`${apiBase}/wiki/pages/${pid}`, {
          method: 'DELETE',
          headers,
          credentials: 'include',
        });
        return r.status;
      } catch { return -1; }
    },
    { pid: id, token, apiBase: BACKEND_API_BASE }
  );
};

const navigateToWikiList = async (page: Page): Promise<void> => {
  await syncTokenFromLocalStorageToCookie(page);
  await page.goto('/wiki', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  let curUrl = page.url();
  if (!curUrl.includes('/wiki')) {
    console.log(`[navigateToWikiList] SSR redirect detected: url=${curUrl}, trying client-side navigation...`);
    await syncTokenFromLocalStorageToCookie(page);
    await clientSideNav(page, '/wiki');
    curUrl = page.url();
  }
  if (!curUrl.includes('/wiki')) {
    console.log(`[navigateToWikiList] WARN: still at unexpected url=${curUrl}`);
  }
  try {
    await page.getByRole('heading', { name: /Wiki/, level: 1 }).waitFor({ state: 'visible', timeout: 25000 });
  } catch (e) {
    const url = page.url();
    const storage = await page.evaluate(() => ({
      token: localStorage.getItem('pmis-token'),
    }));
    const cookieList = await page.context().cookies();
    console.log(`DEBUG wiki-list url=${url} localStorageToken=${storage.token?.slice(0, 20)}... cookies=${cookieList.map((c:any)=>c.name+'='+(c.value||'').slice(0,10)).join(',')}`);
    throw e;
  }
  await page.waitForTimeout(1000);
};

const waitForWikiRowByTitle = async (page: Page, title: string): Promise<any> => {
  await page.getByRole('heading', { name: /Wiki/, level: 1 }).waitFor({ state: 'visible', timeout: 10000 });
  await page.waitForTimeout(800);
  const listContainer = page.locator('div.divide-y').first();
  try {
    await listContainer.waitFor({ state: 'visible', timeout: 20000 });
  } catch (e) {
    const html = await page.content();
    console.log(`DEBUG listContainer missing, content: ${html.slice(0, 2500)}`);
    throw e;
  }
  const row = listContainer
    .locator('> div')
    .filter({ has: page.locator('h3').filter({ hasText: title.slice(0, 20) }) })
    .first();
  await row.waitFor({ state: 'visible', timeout: 20000 });
  return row;
};

const clickViewFromRow = async (page: Page, row: any): Promise<void> => {
  const viewBtn = row.getByTitle('View');
  await viewBtn.waitFor({ state: 'visible', timeout: 10000 });
  const startUrl = page.url();
  const href = await viewBtn.evaluate((el: any) => {
    const a = el.closest('a');
    return a ? a.getAttribute('href') : el.getAttribute('href');
  }).catch(() => null);
  await viewBtn.click();
  const t0 = Date.now();
  let navigated = false;
  while (Date.now() - t0 < 10000) {
    const u = page.url();
    if (u !== startUrl && /\/wiki\/\d+$/.test(u)) { navigated = true; break; }
    await page.waitForTimeout(150);
  }
  if (!navigated && href) {
    console.log(`[clickViewFromRow] click didn't navigate, fallback to page.goto(${href})`);
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  await page.waitForTimeout(500);
};

const clickEditFromRow = async (page: Page, row: any): Promise<void> => {
  const editBtn = row.getByTitle('Edit');
  await editBtn.waitFor({ state: 'visible', timeout: 10000 });
  const startUrl = page.url();
  const href = await editBtn.evaluate((el: any) => {
    const a = el.closest('a');
    return a ? a.getAttribute('href') : el.getAttribute('href');
  }).catch(() => null);
  await editBtn.click();
  const t0 = Date.now();
  let navigated = false;
  while (Date.now() - t0 < 10000) {
    const u = page.url();
    if (u !== startUrl && u.includes('/edit')) { navigated = true; break; }
    await page.waitForTimeout(150);
  }
  if (!navigated && href) {
    console.log(`[clickEditFromRow] click didn't navigate, fallback to page.goto(${href})`);
    await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
  }
  await page.waitForTimeout(500);
};

const countDescendantTags = async (
  page: Page,
  containerSelector: string,
  tags: string[]
): Promise<ElementCounts> => {
  return page.evaluate(
    ({ containerSelector, tags }) => {
      const container = document.querySelector(containerSelector) as HTMLElement | null;
      if (!container) throw new Error('Container not found: ' + containerSelector);
      const counts: ElementCounts = {};
      for (const tag of tags) {
        counts[tag.toLowerCase()] = container.querySelectorAll(tag).length;
      }
      return counts;
    },
    { containerSelector, tags }
  );
};

const visualPause = async (page: Page, defaultMs = 12000, label?: string) => {
  const envRaw = process.env.VISUAL_PAUSE_MS;
  const envMs = envRaw !== undefined && envRaw !== '' ? parseInt(envRaw, 10) : NaN;
  const ms = Number.isFinite(envMs) && envMs >= 0 ? envMs : defaultMs;
  if (ms <= 0) return;
  if (label) console.log(`[VISUAL PAUSE ${ms}ms] ${label} — look at the browser!`);
  await page.waitForTimeout(ms);
};

const assertImagesLoadedOk = async (
  page: Page,
  containerSelector: string,
  opts: {
    label: string;
    expectAtLeast?: number;
    expectExact?: { width?: number; height?: number };
    timeoutMs?: number;
  }
) => {
  const { label, expectAtLeast = 1, expectExact, timeoutMs = 15000 } = opts;
  const deadline = Date.now() + timeoutMs;
  let info: Array<{ src: string; complete: boolean; nw: number; nh: number }> = [];
  let lastCount = -1;
  while (Date.now() < deadline) {
    info = await page.evaluate((sel) => {
      const container = document.querySelector(sel) as HTMLElement | null;
      if (!container) return [];
      const imgs = Array.from(container.querySelectorAll('img'));
      return imgs.map((imgEl) => {
        const ie = imgEl as HTMLImageElement;
        return {
          src: ie.currentSrc || ie.src || '(empty src)',
          complete: !!ie.complete,
          nw: Number(ie.naturalWidth) || 0,
          nh: Number(ie.naturalHeight) || 0,
        };
      });
    }, containerSelector);
    const allLoaded =
      info.length >= expectAtLeast &&
      info.every((i) => i.complete && i.nw > 0 && i.nh > 0);
    if (allLoaded && info.length !== lastCount) {
      lastCount = info.length;
      break;
    }
    await page.waitForTimeout(500);
  }

  console.log(`[IMG-CHECK ${label}] found=${info.length} images:`);
  info.forEach((i, idx) => {
    const shortSrc = i.src.length > 90 ? i.src.slice(0, 90) + '...' : i.src;
    console.log(
      `  img[${idx}] complete=${i.complete} natural=${i.nw}x${i.nh} src=${shortSrc}`
    );
  });

  expect(info.length).toBeGreaterThanOrEqual(expectAtLeast);
  const broken = info.filter((i) => !i.complete || i.nw === 0 || i.nh === 0);
  expect(broken.map((b) => `${b.src} (complete=${b.complete} ${b.nw}x${b.nh})`)).toEqual([]);
  if (expectExact?.width) {
    expect(info.map((i) => i.nw)).toEqual(
      expect.arrayContaining([expectExact.width])
    );
  }
  if (expectExact?.height) {
    expect(info.map((i) => i.nh)).toEqual(
      expect.arrayContaining([expectExact.height])
    );
  }
  console.log(`[IMG-CHECK ${label}] ALL IMAGES LOADED SUCCESSFULLY ✓`);
};

test.afterAll(async ({ browser }) => {
  const ctx = await browser.newContext();
  const cleanupPage = await ctx.newPage();
  await login(cleanupPage);
  for (const id of createdPageIds) {
    try {
      const resp = await deletePageViaBrowser(cleanupPage, id);
      console.log(`cleanup page ${id}: ${resp}`);
    } catch (e) {
      // noop
    }
  }
  await cleanupPage.close();
  await ctx.close();
});

test.describe('Wiki Document CRUD + Element Preservation', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.clearCookies();
    page.on('dialog', (d) => d.accept());
    await login(page);
  });

  test('TC-1 Create new document and save as draft', async ({ page }) => {
    test.setTimeout(180000);
    await goToNewDocument(page);

    const uniqueTitle = `E2E Draft Doc - ${Date.now()}`;
    await page.fill('input[placeholder="Enter document title..."]', uniqueTitle);

    const html = `
      <h1>Intro</h1>
      <p>Hello World paragraph one. This has enough content to verify the document stores correctly.</p>
      <h2>Details</h2>
      <p>Some more content in the details section.</p>
    `;
    await seedEditorHtml(page, html);

    const { pageId } = await saveDraftFromNewDocument(page);
    console.log(`TC-1 saved page id: ${pageId}`);

    const checkResp = await fetchPageViaBrowser(page, pageId);
    expect(checkResp.status).toBe(200);
    expect(checkResp.data.id).toBe(pageId);
    expect(checkResp.data.title).toBe(uniqueTitle);

    await navigateToWikiList(page);
    const row = await waitForWikiRowByTitle(page, uniqueTitle);
    await expect(row.locator('span.bg-yellow-100.text-yellow-800').first()).toHaveText('Draft');
  });

  test('TC-2 Edit existing document and persist changes', async ({ page }) => {
    test.setTimeout(180000);

    const originalTitle = `E2E Edit Target - ${Date.now()}`;
    const { pageId } = await createPageViaUI(page, {
      title: originalTitle,
      contentHtml: '<h1>Original</h1><p>original content</p>',
    });

    await page.goto(`/wiki/${pageId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const titleInput = page.locator('input[placeholder="Enter document title..."]');
    await titleInput.waitFor({ state: 'attached', timeout: 25000 });
    await expect(titleInput).toBeVisible({ timeout: 15000 });
    await titleInput.click();
    await titleInput.fill(`${originalTitle} **UPDATED**`);
    await page.waitForTimeout(500);

    const appendMarker = `<p id="edited-marker">edited content marker - ${Date.now()}</p>`;
    await page.evaluate((markerHtml) => {
      const editor =
        (document.querySelector('.tiptap-editor .ProseMirror') as HTMLElement | null) ||
        (document.querySelector('[contenteditable="true"]') as HTMLElement | null);
      if (!editor) throw new Error('Editor not found');
      editor.focus();
      const dt = new DataTransfer();
      dt.setData('text/html', markerHtml);
      dt.setData('text/plain', markerHtml);
      editor.dispatchEvent(new ClipboardEvent('paste', {
        bubbles: true,
        cancelable: true,
        clipboardData: dt,
      }));
    }, appendMarker);
    await page.waitForTimeout(1200);

    const saveBtn = page.locator('button:has-text("Save Draft")');
    await saveBtn.click();
    await page.waitForTimeout(3500);

    const reloaded = await fetchPageViaBrowser(page, pageId);
    expect(reloaded.status).toBe(200);
    expect(reloaded.data.title).toContain('UPDATED');
    expect(reloaded.data.contentHtml).toContain('edited content marker');
  });

  test('TC-3 Publish document and view', async ({ page }) => {
    test.setTimeout(180000);

    const title = `E2E Publish Target - ${Date.now()}`;
    const contentHtml =
      '<h1>Published Chapter</h1><p>Some published body text with content.</p><h2>Sub Section</h2><p>More content here also.</p>';
    const { pageId } = await createPageViaUI(page, { title, contentHtml });

    await page.goto(`/wiki/${pageId}/edit`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1000);
    const publishBtn = page.locator('button:has-text("Publish")');
    await publishBtn.waitFor({ state: 'visible', timeout: 25000 });

    await publishFromEditPage(page);

    const viewTitle = page.locator('h1').filter({ hasText: title.slice(0, 20) });
    await expect(viewTitle.first()).toBeVisible({ timeout: 15000 });

    const wikiContent = page.locator('.wiki-content').first();
    await expect(wikiContent).toContainText('Published Chapter', { timeout: 10000 });
    await expect(wikiContent).toContainText('Sub Section');
    await expect(wikiContent.locator('span.bg-yellow-100.text-yellow-800')).toHaveCount(0);

    const editBtn = page.locator('button:has-text("Edit")');
    await editBtn.click();
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 25000 });
    expect(page.url()).toContain(`/wiki/${pageId}/edit`);
  });

  test('TC-4 Upload image in document and persist (regression for missing images)', async ({ page }) => {
    test.setTimeout(180000);

    const { url: imageUrl, filename } = await uploadSampleImage(page);
    console.log(`TC-4 uploaded image: url=${imageUrl} filename=${filename}`);
    expect(imageUrl).toContain('/api/wiki/images/');

    await goToNewDocument(page);
    await page.fill('input[placeholder="Enter document title..."]', `E2E Image Doc - ${Date.now()}`);

    const html = `<h1>Image Chapter</h1><p>Intro paragraph with text.</p><p><img src="${joinBackendMediaUrl(imageUrl)}" alt="sample image"></p><p>Final paragraph after image.</p>`;
    await seedEditorHtml(page, html);

    const { pageId } = await saveDraftFromNewDocument(page);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2500);

    const imgLocator = page.locator('.tiptap-editor .ProseMirror img, .tiptap .ProseMirror img');
    const imgCountAfterReload = await imgLocator.count();
    console.log(`TC-4 images in editor after reload: ${imgCountAfterReload}`);
    if (imgCountAfterReload === 0) {
      const editorHtml = await page.evaluate(() => {
        const el = document.querySelector('.tiptap-editor .ProseMirror, .tiptap .ProseMirror') as HTMLElement | null;
        return el ? el.innerHTML.slice(0, 1500) : null;
      });
      console.log('TC-4 editor HTML after reload:', editorHtml);
    }
    expect(imgCountAfterReload).toBeGreaterThanOrEqual(1);

    const srcAttr = await imgLocator.first().getAttribute('src');
    expect(srcAttr).toContain(filename);

    await page.goto(`/wiki/${pageId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const viewImg = page.locator('.wiki-content img');
    const viewImgCount = await viewImg.count();
    console.log(`TC-4 images in view page: ${viewImgCount}`);
    expect(viewImgCount).toBeGreaterThanOrEqual(1);
    const viewSrc = await viewImg.first().getAttribute('src');
    expect(viewSrc).toContain(filename);
  });

  test('TC-5 Delete document from list page', async ({ page }) => {
    test.setTimeout(180000);

    const title = `E2E Delete Target - ${Date.now()}`;
    const { pageId } = await createPageViaUI(page, {
      title,
      contentHtml: '<p>to be deleted</p>',
    });

    const checkResp = await fetchPageViaBrowser(page, pageId);
    expect(checkResp.status).toBe(200);

    await navigateToWikiList(page);
    const row = await waitForWikiRowByTitle(page, title);

    const trashBtn = row.locator('button[title="Delete"]');
    if ((await trashBtn.count()) === 0) {
      await row.getByTitle('Delete').click();
    } else {
      await trashBtn.click();
    }
    await page.waitForTimeout(2500);

    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    const goneRow = page
      .locator('.bg-white.rounded-lg .divide-y > div')
      .filter({ hasText: title.slice(0, 20) });
    await expect(goneRow).toHaveCount(0, { timeout: 10000 });

    const deleted = await fetchPageViaBrowser(page, pageId);
    expect([404, 410, 500]).toContain(deleted.status);
  });

  test('TC-6 Element preservation: counts identical after save → view → edit reload', async ({ page }) => {
    test.setTimeout(200000);

    const { url: imageUrl } = await uploadSampleImage(page);

    const ALL_TAGS = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'blockquote', 'hr',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'pre', 'img', 'a',
      'strong', 'em', 'u', 's', 'mark', 'code',
    ];

    const TITLE = `E2E Elements - ${Date.now()}`;

    const CANONICAL_HTML = `
      <h1>H1 Heading One</h1>
      <h2>H2 Heading Two</h2>
      <h3>H3 Heading Three</h3>
      <h4>H4 Heading Four</h4>
      <h5>H5 Heading Five</h5>
      <h6>H6 Heading Six</h6>
      <p>Paragraph with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strike</s>, inline <code>code</code>, <mark>highlight</mark>, and a <a href="https://example.com">link</a>.</p>
      <blockquote>
        <p>Blockquote inner paragraph.</p>
      </blockquote>
      <ul>
        <li>Bullet 1</li>
        <li>Bullet 2</li>
        <li>Bullet 3</li>
      </ul>
      <ol>
        <li>Ordered 1</li>
        <li>Ordered 2</li>
        <li>Ordered 3</li>
      </ol>
      <hr>
      <table>
        <thead>
          <tr><th>A</th><th>B</th><th>C</th></tr>
        </thead>
        <tbody>
          <tr><td>R1C1</td><td>R1C2</td><td>R1C3</td></tr>
          <tr><td>R2C1</td><td>R2C2</td><td>R2C3</td></tr>
        </tbody>
      </table>
      <pre><code class="language-javascript">const hello = "world";</code></pre>
      <p><img src="${joinBackendMediaUrl(imageUrl)}" alt="fixture"></p>
      <p>Closing final paragraph.</p>
    `;

    await goToNewDocument(page);
    await page.fill('input[placeholder="Enter document title..."]', TITLE);
    await seedEditorHtml(page, CANONICAL_HTML);

    const { pageId } = await saveDraftFromNewDocument(page);
    const checkResp = await fetchPageViaBrowser(page, pageId);
    expect(checkResp.status).toBe(200);

    // STEP 2 — view page element counts (after save + render through view page)
    await page.goto(`/wiki/${pageId}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(1500);
    const wikiContent = page.locator('.wiki-content');
    await wikiContent.waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(1500);
    const viewCounts = await countDescendantTags(page, '.wiki-content', ALL_TAGS);
    console.log('TC-6 VIEW COUNTS:', JSON.stringify(viewCounts, null, 2));

    const structuralRequired = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'ul', 'ol', 'table', 'thead', 'tbody', 'pre', 'img', 'a', 'hr'];
    for (const t of structuralRequired) {
      expect(viewCounts[t]).toBeGreaterThan(0);
    }
    expect(viewCounts.li).toBe(6);
    expect(viewCounts.tr).toBe(3);
    expect(viewCounts.th).toBe(3);
    expect(viewCounts.td).toBe(6);
    expect(viewCounts.strong).toBe(1);
    expect(viewCounts.em).toBe(1);
    expect(viewCounts.u).toBe(1);
    expect(viewCounts.s).toBe(1);
    expect(viewCounts.mark).toBe(1);

    // STEP 3 — edit page element counts after reload (regression: elements must match)
    await page.goto(`/wiki/${pageId}/edit`, { waitUntil: 'domcontentloaded' });
    const editEditor = page.locator('.tiptap-editor .ProseMirror, .tiptap .ProseMirror');
    await editEditor.first().waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(2500);
    const editCounts = await countDescendantTags(
      page,
      '.tiptap-editor .ProseMirror, .tiptap .ProseMirror',
      ALL_TAGS
    );
    console.log('TC-6 EDIT COUNTS:', JSON.stringify(editCounts, null, 2));

    for (const tag of ALL_TAGS) {
      expect(
        editCounts[tag],
        `Edit page ${tag.toUpperCase()} count did not match saved view page counts. ` +
          `view=${viewCounts[tag]} edit=${editCounts[tag]}`
      ).toBe(viewCounts[tag]);
    }
  });

  test('TC-7 All element types exact-match via wiki list navigation (no missing / no extra)', async ({ page }) => {
    test.setTimeout(240000);

    const { url: imageUrl } = await uploadSampleImage(page);

    const TAGS = [
      'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
      'p', 'blockquote', 'hr',
      'ul', 'ol', 'li',
      'table', 'thead', 'tbody', 'tr', 'th', 'td',
      'pre', 'code', 'img', 'a',
      'strong', 'em', 'u', 's', 'mark',
    ];

    const TITLE = `TC7 Elements - ${Date.now()}`;

    const HTML = `
      <h1>H1 Chapter Alpha</h1>
      <h2>H2 Section Bravo</h2>
      <h3>H3 Sub Charlie</h3>
      <h4>H4 Delta</h4>
      <h5>H5 Echo</h5>
      <h6>H6 Foxtrot</h6>
      <p>Paragraph with <strong>bold</strong>, <em>italic</em>, <u>underline</u>, <s>strike</s>, inline <code>code</code>, <mark>highlight</mark>, and a <a href="https://example.com">link</a>.</p>
      <blockquote>
        <p>Blockquote inner paragraph text.</p>
      </blockquote>
      <ul>
        <li>Bullet A</li>
        <li>Bullet B</li>
        <li>Bullet C</li>
      </ul>
      <ol>
        <li>Ordered 1</li>
        <li>Ordered 2</li>
        <li>Ordered 3</li>
      </ol>
      <hr>
      <table>
        <thead>
          <tr><th>ColX</th><th>ColY</th><th>ColZ</th></tr>
        </thead>
        <tbody>
          <tr><td>R1X</td><td>R1Y</td><td>R1Z</td></tr>
          <tr><td>R2X</td><td>R2Y</td><td>R2Z</td></tr>
        </tbody>
      </table>
      <pre><code class="language-javascript">const x = 1;</code></pre>
      <p><img src="${joinBackendMediaUrl(imageUrl)}" alt="tc7 image"></p>
      <p>Closing final paragraph end.</p>
    `;

    const EXPECTED_AT_LEAST: ElementCounts = {
      h1: 1, h2: 1, h3: 1, h4: 1, h5: 1, h6: 1,
      p: 4,
      blockquote: 1,
      hr: 1,
      ul: 1, ol: 1, li: 6,
      table: 1, tbody: 1, tr: 3, th: 3, td: 6,
      pre: 1, code: 2, img: 1, a: 1,
      strong: 1, em: 1, u: 1, s: 1, mark: 1,
    };

    const verifyCountsNoMissing = (label: string, actual: ElementCounts) => {
      const missing: string[] = [];
      for (const tag of TAGS) {
        const min = EXPECTED_AT_LEAST[tag] ?? 0;
        const got = actual[tag] ?? 0;
        if (min > 0 && got < min) missing.push(`${tag} min=${min} got=${got}`);
      }
      expect(missing).toEqual([]);
      console.log(`TC-7 [${label}] minimum-count check passed.`);
    };

    const assertCountsMatch = (a: ElementCounts, b: ElementCounts, labelA: string, labelB: string) => {
      const diffs: string[] = [];
      for (const tag of TAGS) {
        const va = a[tag] ?? 0;
        const vb = b[tag] ?? 0;
        if (va !== vb) diffs.push(`${tag} ${labelA}=${va} vs ${labelB}=${vb}`);
      }
      expect(diffs).toEqual([]);
      console.log(`TC-7 [${labelA} vs ${labelB}] exact-match OK.`);
    };

    const visualPause = async (page: Page, defaultMs = 12000, label?: string) => {
      const envRaw = process.env.VISUAL_PAUSE_MS;
      const envMs = envRaw !== undefined && envRaw !== '' ? parseInt(envRaw, 10) : NaN;
      const ms = Number.isFinite(envMs) && envMs >= 0 ? envMs : defaultMs;
      if (ms <= 0) return;
      if (label) console.log(`TC-7 [VISUAL PAUSE ${ms}ms] ${label} — look at the browser!`);
      await page.waitForTimeout(ms);
    };

    /**
     * Verifies EVERY <img> inside the given container has successfully loaded:
     *  - img.complete === true (browser finished fetching + decoding)
     *  - naturalWidth > 0 && naturalHeight > 0 (not a broken-icon placeholder,
     *    which typically reports 0x0)
     * Optionally asserts expected naturalWidth/naturalHeight for the fixture image.
     * Fails fast if any image is still loading after timeoutMs (suggests 404/CORS/CSP
     * or other network-level failure).
     */
    const assertImagesLoadedOk = async (
      page: Page,
      containerSelector: string,
      opts: {
        label: string;
        expectAtLeast?: number;
        expectExact?: { width?: number; height?: number };
        timeoutMs?: number;
      }
    ) => {
      const { label, expectAtLeast = 1, expectExact, timeoutMs = 15000 } = opts;
      const deadline = Date.now() + timeoutMs;
      let info: Array<{ src: string; complete: boolean; nw: number; nh: number }> = [];
      let lastCount = -1;
      while (Date.now() < deadline) {
        info = await page.evaluate((sel) => {
          const container = document.querySelector(sel) as HTMLElement | null;
          if (!container) return [];
          const imgs = Array.from(container.querySelectorAll('img'));
          return imgs.map((imgEl) => {
            const ie = imgEl as HTMLImageElement;
            return {
              src: ie.currentSrc || ie.src || '(empty src)',
              complete: !!ie.complete,
              nw: Number(ie.naturalWidth) || 0,
              nh: Number(ie.naturalHeight) || 0,
            };
          });
        }, containerSelector);
        const allLoaded =
          info.length >= expectAtLeast &&
          info.every((i) => i.complete && i.nw > 0 && i.nh > 0);
        if (allLoaded && info.length !== lastCount) {
          lastCount = info.length;
          break;
        }
        await page.waitForTimeout(500);
      }

      console.log(`TC-7 [IMG-CHECK ${label}] found=${info.length} images:`);
      info.forEach((i, idx) => {
        const shortSrc = i.src.length > 90 ? i.src.slice(0, 90) + '...' : i.src;
        console.log(
          `  img[${idx}] complete=${i.complete} natural=${i.nw}x${i.nh} src=${shortSrc}`
        );
      });

      expect(info.length).toBeGreaterThanOrEqual(expectAtLeast);
      const broken = info.filter((i) => !i.complete || i.nw === 0 || i.nh === 0);
      expect(broken.map((b) => `${b.src} (complete=${b.complete} ${b.nw}x${b.nh})`)).toEqual([]);
      if (expectExact?.width) {
        expect(info.map((i) => i.nw)).toEqual(
          expect.arrayContaining([expectExact.width])
        );
      }
      if (expectExact?.height) {
        expect(info.map((i) => i.nh)).toEqual(
          expect.arrayContaining([expectExact.height])
        );
      }
      console.log(`TC-7 [IMG-CHECK ${label}] ALL IMAGES LOADED SUCCESSFULLY ✓`);
    };

    const findUnexpectedTags = async (containerSelector: string): Promise<string[]> => {
      return page.evaluate((sel) => {
        const container = document.querySelector(sel) as HTMLElement | null;
        if (!container) return [];
        const allowed = new Set([
          'H1','H2','H3','H4','H5','H6',
          'P','BLOCKQUOTE','HR',
          'UL','OL','LI',
          'TABLE','THEAD','TBODY','TFOOT','TR','TH','TD',
          'COLGROUP','COL',
          'PRE','CODE','IMG','A',
          'STRONG','EM','U','S','MARK',
          'SPAN','BR','WBR','PICTURE','SOURCE','FIGURE','FIGCAPTION',
          // Editor-only widgets (Tiptap decorations / drag-handle SVGs)
          'SVG','G','PATH','RECT','POLYGON','LINE','CIRCLE','ELLIPSE','POLYLINE','DEFS','USE',
          'DIV','BUTTON',
        ]);
        const unexpected = new Set<string>();
        const walker = document.createTreeWalker(container, NodeFilter.SHOW_ELEMENT);
        let n: Node | null = walker.nextNode();
        while (n) {
          const el = n as Element;
          if (!allowed.has(el.tagName.toUpperCase())) {
            unexpected.add(el.tagName.toLowerCase());
          }
          n = walker.nextNode();
        }
        return Array.from(unexpected);
      }, containerSelector);
    };

    // ========== STEP 1 ========== Create document, insert all elements, save
    await goToNewDocument(page);
    await page.fill('input[placeholder="Enter document title..."]', TITLE);
    await seedEditorHtml(page, HTML);
    await visualPause(page, 30000, 'STEP 1a — After seed: all elements + 400x300 image visible in NEW DOCUMENT editor (check image src natural=400x300)');

    const { pageId } = await saveDraftFromNewDocument(page);
    await visualPause(page, 30000, 'STEP 1b — After save draft (redirected to /wiki/[id]/edit): image still visible, 400x300 loaded');
    const checkResp = await fetchPageViaBrowser(page, pageId);
    expect(checkResp.status).toBe(200);
    expect(checkResp.data.id).toBe(pageId);

    // ========== STEP 2 ========== Navigate via wiki list -> View, verify
    await navigateToWikiList(page);
    const rowView = await waitForWikiRowByTitle(page, TITLE);
    await clickViewFromRow(page, rowView);

    const wikiContent = page.locator('.wiki-content');
    await wikiContent.waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(2000);

    const viewCounts = await countDescendantTags(page, '.wiki-content', TAGS);
    console.log('TC-7 VIEW COUNTS:', JSON.stringify(viewCounts, null, 2));
    verifyCountsNoMissing('VIEW', viewCounts);
    expect(viewCounts.p ?? 0).toBeLessThanOrEqual(30);

    const viewUnexpected = await findUnexpectedTags('.wiki-content');
    expect(viewUnexpected).toEqual([]);

    await assertImagesLoadedOk(page, '.wiki-content', {
      label: 'VIEW',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });

    await visualPause(page, 30000, 'STEP 2 — VIEW mode (/wiki/[id]): look at .wiki-content for 400x300 image (compare src to your manual test)');

    // ========== STEP 3 ========== Navigate via wiki list -> Edit, verify
    await navigateToWikiList(page);
    const rowEdit = await waitForWikiRowByTitle(page, TITLE);
    await clickEditFromRow(page, rowEdit);

    const editEditor = page.locator('.tiptap-editor .ProseMirror, .tiptap .ProseMirror');
    await editEditor.first().waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(3000);

    const editCounts = await countDescendantTags(
      page,
      '.tiptap-editor .ProseMirror, .tiptap .ProseMirror',
      TAGS
    );
    console.log('TC-7 EDIT COUNTS:', JSON.stringify(editCounts, null, 2));
    verifyCountsNoMissing('EDIT', editCounts);
    expect(editCounts.p ?? 0).toBeLessThanOrEqual(30);

    const editUnexpected = await findUnexpectedTags(
      '.tiptap-editor .ProseMirror, .tiptap .ProseMirror'
    );
    expect(editUnexpected).toEqual([]);

    await assertImagesLoadedOk(page, '.tiptap-editor .ProseMirror, .tiptap .ProseMirror', {
      label: 'EDIT',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });

    await visualPause(page, 30000, 'STEP 3 — EDIT mode (/wiki/[id]/edit): look at ProseMirror for 400x300 image (compare src to your manual test)');

    // Cross-check: element counts between view & edit mode must match exactly (preservation check)
    assertCountsMatch(viewCounts, editCounts, 'VIEW', 'EDIT');
  });

  test('TC-8 Insert image via toolbar Upload button (real UI flow) + persist across save/reload', async ({ page }) => {
    test.setTimeout(600000);
    const TITLE = `TC-8 Toolbar Upload RealFlow - ${Date.now()}`;
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    expect(fs.existsSync(fixturePath)).toBe(true);

    await goToNewDocument(page);
    await page.fill('input[placeholder="Enter document title..."]', TITLE);
    const editor = page.locator('.tiptap-editor .ProseMirror, .tiptap .ProseMirror');
    await editor.first().click();

    console.log('TC-8: Clicking toolbar Insert Image button (title="Insert Image")...');
    const imageBtn = page
      .locator('.tiptap-editor button[title="Insert Image"], .with-toolbar button[title="Insert Image"]')
      .first();
    await expect(imageBtn).toBeVisible({ timeout: 15000 });

    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 20000 }),
      imageBtn.click(),
    ]);
    console.log('TC-8: filechooser captured, setting fixture sample.png...');
    await fileChooser.setFiles(fixturePath);

    await page.waitForTimeout(6000);

    const imgLoc = page.locator('.tiptap-editor .ProseMirror img, .tiptap .ProseMirror img');
    await expect(imgLoc.first()).toBeVisible({ timeout: 20000 });
    const countAfterInsert = await imgLoc.count();
    console.log(`TC-8: img count after toolbar upload = ${countAfterInsert}`);
    expect(countAfterInsert).toBeGreaterThanOrEqual(1);

    await assertImagesLoadedOk(page, '.tiptap-editor .ProseMirror, .tiptap .ProseMirror', {
      label: 'AFTER-TOOLBAR-UPLOAD-NEW-DOC',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });

    await visualPause(page, 25000, 'TC-8 STEP A: After toolbar Insert Image button upload, check image visible 400x300 in NEW doc editor');

    const { pageId } = await saveDraftFromNewDocument(page);

    await visualPause(page, 25000, 'TC-8 STEP B: After Save Draft → edit page, verify image still 400x300 persists in EDIT page');

    const editCount = await page.locator('.tiptap-editor .ProseMirror img, .tiptap .ProseMirror img').count();
    expect(editCount).toBeGreaterThanOrEqual(1);
    await assertImagesLoadedOk(page, '.tiptap-editor .ProseMirror, .tiptap .ProseMirror', {
      label: 'EDIT-AFTER-SAVE',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });

    await navigateToWikiList(page);
    const rowView = await waitForWikiRowByTitle(page, TITLE);
    await clickViewFromRow(page, rowView);
    const wikiContent = page.locator('.wiki-content');
    await wikiContent.waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(2500);

    await assertImagesLoadedOk(page, '.wiki-content', {
      label: 'VIEW',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });
    await visualPause(page, 25000, 'TC-8 STEP C: VIEW mode (.wiki-content) — verify 400x300 image after real toolbar upload');

    await navigateToWikiList(page);
    const rowEdit = await waitForWikiRowByTitle(page, TITLE);
    await clickEditFromRow(page, rowEdit);
    const editEditor = page.locator('.tiptap-editor .ProseMirror, .tiptap .ProseMirror');
    await editEditor.first().waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(3000);

    await assertImagesLoadedOk(page, '.tiptap-editor .ProseMirror, .tiptap .ProseMirror', {
      label: 'EDIT-REOPEN',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });
    await visualPause(page, 25000, 'TC-8 STEP D: Re-opened EDIT page via wiki list — verify 400x300 image preserved');

    createdPageIds.push(pageId);
  });

  test('TC-9 Copy-paste image from VIEW page → NEW editor → save/publish → re-edit → image persists (reproduces wiki id=53 bug)', async ({ page }) => {
    test.setTimeout(600000);
    const TITLE_A = `TC-9 PageA-ToolbarImg - ${Date.now()}`;
    const TITLE_B = `TC-9 PageB-CopyPastedImg - ${Date.now()}`;

    console.log('TC-9: ====== STEP 1: Create Page A with toolbar-inserted image (source page) ======');
    await goToNewDocument(page);
    await page.fill('input[placeholder="Enter document title..."]', TITLE_A);
    await page.waitForTimeout(1000);

    const insertImgBtn = page.locator('button[title="Insert Image"], button:has([data-testid="image-icon"])').first();
    await insertImgBtn.waitFor({ state: 'visible', timeout: 15000 });
    const [fileChooser] = await Promise.all([
      page.waitForEvent('filechooser', { timeout: 30000 }),
      insertImgBtn.click(),
    ]);
    const fixturePath = path.join(__dirname, 'fixtures', 'sample.png');
    await fileChooser.setFiles(fixturePath);
    await page.waitForTimeout(6000);

    const editorSel = '.tiptap-editor .ProseMirror, .tiptap .ProseMirror';
    const countAfterInsert = await page.evaluate((sel) => {
      return document.querySelectorAll(sel + ' img').length;
    }, editorSel);
    console.log(`TC-9 PageA: img count after toolbar upload = ${countAfterInsert}`);
    expect(countAfterInsert).toBeGreaterThanOrEqual(1);
    await assertImagesLoadedOk(page, editorSel, {
      label: 'TC-9 PageA after insert',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });
    await visualPause(page, 10000, 'TC-9 STEP 1: Page A editor — toolbar image inserted');

    console.log('TC-9: ====== STEP 2: Save Draft + Publish Page A ======');
    const { pageId: pageIdA } = await saveDraftFromNewDocument(page);
    await publishFromEditPage(page);
    console.log(`TC-9 PageA published with id=${pageIdA}`);

    console.log('TC-9: ====== STEP 3: Navigate via wiki list → VIEW Page A (images get absolute URLs via rewrite) ======');
    await navigateToWikiList(page);
    const rowA = await waitForWikiRowByTitle(page, TITLE_A);
    await clickViewFromRow(page, rowA);
    const wikiContentSel = '.wiki-content';
    const wikiContent = page.locator(wikiContentSel);
    await wikiContent.waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(3000);
    await assertImagesLoadedOk(page, wikiContentSel, {
      label: 'TC-9 PageA VIEW',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });
    await visualPause(page, 10000, 'TC-9 STEP 3: Page A VIEW mode — images rendered with absolute URLs');

    console.log('TC-9: ====== STEP 4: Copy HTML content from VIEW page (simulate user Ctrl+C) ======');
    const copiedHtml: string = await page.evaluate((sel) => {
      const container = document.querySelector(sel) as HTMLElement | null;
      if (!container) throw new Error('wiki-content not found for copy');
      const selection = window.getSelection();
      if (!selection) throw new Error('No selection');
      selection.removeAllRanges();
      const range = document.createRange();
      range.selectNodeContents(container);
      selection.addRange(range);
      const copiedHtml = container.innerHTML;
      selection.removeAllRanges();
      console.log('[TC-9 COPY] sample of copied HTML:', copiedHtml.slice(0, 300));
      const imgs = container.querySelectorAll('img');
      for (let i = 0; i < imgs.length; i++) {
        const img = imgs[i] as HTMLImageElement;
        console.log(`[TC-9 COPY] img[${i}] src=${img.src}`);
      }
      return copiedHtml;
    }, wikiContentSel);
    expect(copiedHtml.length).toBeGreaterThan(50);
    expect(copiedHtml).toMatch(/<img/i);

    console.log('TC-9: ====== STEP 5: Create NEW Page B and paste copied HTML into editor ======');
    await goToNewDocument(page);
    await page.fill('input[placeholder="Enter document title..."]', TITLE_B);
    await page.waitForTimeout(1500);
    await visualPause(page, 5000, 'TC-9 STEP 5: Page B NEW editor — about to paste');

    console.log('[TC-9 PASTE] Pasting copied HTML via seedEditorHtml (triggers paste handler with normalization)...');
    console.log('[TC-9 PASTE] copiedHtml img snippet:', copiedHtml.match(/<img[^>]*>/i)?.[0]?.slice(0, 150));
    await seedEditorHtml(page, copiedHtml);
    await page.waitForTimeout(3000);

    const countAfterPaste = await page.evaluate((sel) => {
      return document.querySelectorAll(sel + ' img').length;
    }, editorSel);
    console.log(`TC-9 PageB: img count after paste = ${countAfterPaste}`);
    expect(countAfterPaste).toBeGreaterThanOrEqual(1);
    await assertImagesLoadedOk(page, editorSel, {
      label: 'TC-9 PageB after paste',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });
    await visualPause(page, 15000, 'TC-9 STEP 5: Page B editor — paste done, verify image is 400x300');

    console.log('TC-9: ====== STEP 6: Save Draft + Publish Page B (this is where URLs get normalized to relative) ======');
    const { pageId: pageIdB } = await saveDraftFromNewDocument(page);
    await publishFromEditPage(page);
    console.log(`TC-9 PageB published with id=${pageIdB}`);
    await visualPause(page, 10000, 'TC-9 STEP 6: Page B published successfully');

    console.log('TC-9: ====== STEP 7: Navigate via wiki list → VIEW Page B, verify image still renders ======');
    await navigateToWikiList(page);
    const rowBView = await waitForWikiRowByTitle(page, TITLE_B);
    await clickViewFromRow(page, rowBView);
    const wikiContentB = page.locator('.wiki-content');
    await wikiContentB.waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(3000);
    await assertImagesLoadedOk(page, '.wiki-content', {
      label: 'TC-9 PageB VIEW',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });
    await visualPause(page, 15000, 'TC-9 STEP 7: Page B VIEW mode — verify image still 400x300');

    console.log('TC-9: ====== STEP 8: Navigate via wiki list → RE-EDIT Page B (THIS IS THE BUG SCENARIO: image should NOT disappear) ======');
    await navigateToWikiList(page);
    const rowBEdit = await waitForWikiRowByTitle(page, TITLE_B);
    await clickEditFromRow(page, rowBEdit);
    const reopenedEditor = page.locator('.tiptap-editor .ProseMirror, .tiptap .ProseMirror');
    await reopenedEditor.first().waitFor({ state: 'visible', timeout: 25000 });
    await page.waitForTimeout(4000);

    await assertImagesLoadedOk(page, '.tiptap-editor .ProseMirror, .tiptap .ProseMirror', {
      label: 'TC-9 PageB RE-EDIT (critical step - this was the bug!)',
      expectAtLeast: 1,
      expectExact: { width: 400, height: 300 },
    });

    const imgSrcAfterReedit = await page.evaluate((sel) => {
      const imgs = document.querySelectorAll(sel + ' img');
      return Array.from(imgs).map((i) => (i as HTMLImageElement).src);
    }, editorSel);
    console.log(`TC-9 PageB RE-EDIT: image src URLs after reopen:`, imgSrcAfterReedit);

    await visualPause(page, 25000, 'TC-9 STEP 8 FINAL: Page B RE-EDITED — verify image DID NOT disappear!');

    createdPageIds.push(pageIdA, pageIdB);
    console.log('TC-9 ALL STEPS PASSED ✓ Copy-pasted image survived save/publish/re-edit cycle');
  });
});
