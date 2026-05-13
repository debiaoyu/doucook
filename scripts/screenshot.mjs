import puppeteer from 'puppeteer'
import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const screenshotDir = path.resolve(__dirname, '..', 'screenshots')
fs.mkdirSync(screenshotDir, { recursive: true })

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001'

async function takeScreenshot(page, name, opts = {}) {
  const filePath = path.join(screenshotDir, `${name}.png`)
  await page.screenshot({ path: filePath, fullPage: opts.fullPage ?? false })
  console.log(`  ✓ ${name}.png`)
  return filePath
}

async function waitForApp(page, url, retries = 30) {
  for (let i = 0; i < retries; i++) {
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 10000 })
      await page.waitForSelector('#root', { timeout: 5000 })
      return
    } catch {
      console.log(`  Waiting for app... (${i + 1}/${retries})`)
      await sleep(2000)
    }
  }
  throw new Error('App failed to start')
}

async function main() {
  console.log(`Connecting to ${FRONTEND_URL}`)
  console.log('Launching browser...')
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 },
  })

  try {
    const page = await browser.newPage()
    await page.setViewport({ width: 1440, height: 900 })

    // 1. Home page (recipe list)
    console.log('\n1. Capturing homepage (recipe list)...')
    await waitForApp(page, FRONTEND_URL)
    await sleep(3000)
    await takeScreenshot(page, '01-homepage')

    // 2. Recipe detail page
    console.log('\n2. Capturing recipe detail...')
    await page.goto(`${FRONTEND_URL}/recipes/36`, { waitUntil: 'domcontentloaded' })
    await sleep(3000)
    await takeScreenshot(page, '02-recipe-detail', { fullPage: true })

    // 3. Open import modal
    console.log('\n3. Capturing import modal...')
    await page.goto(`${FRONTEND_URL}/import`, { waitUntil: 'domcontentloaded' })
    await sleep(2000)
    const currentUrl = page.url()
    if (currentUrl === FRONTEND_URL + '/' || currentUrl === FRONTEND_URL) {
      console.log('  Import is modal-based, clicking to open...')
      await page.goto(FRONTEND_URL, { waitUntil: 'domcontentloaded' })
      await sleep(2000)
      const selectors = [
        '.anticon-plus',
        'button:has(.anticon-plus)',
        '[class*="ant-btn-primary"]',
      ]
      for (const sel of selectors) {
        try {
          const el = await page.$(sel)
          if (el) {
            await el.click()
            await sleep(1500)
            break
          }
        } catch {}
      }
    } else {
      await sleep(1000)
    }
    await takeScreenshot(page, '03-import')

    // 4. Recipe detail with AI tab
    console.log('\n4. Capturing recipe detail with AI tab...')
    await page.goto(`${FRONTEND_URL}/recipes/36`, { waitUntil: 'domcontentloaded' })
    await sleep(2500)
    try {
      const tabs = await page.$$('[class*="ant-tabs-tab"]')
      for (const tab of tabs) {
        const text = await tab.evaluate(el => el.textContent)
        if (text && (text.includes('AI') || text.includes('智能'))) {
          await tab.click()
          await sleep(1500)
          break
        }
      }
    } catch {}
    await takeScreenshot(page, '04-recipe-ai', { fullPage: true })

    // 5. Search view
    console.log('\n5. Capturing search view...')
    await page.goto(`${FRONTEND_URL}/?search=毛血旺`, { waitUntil: 'domcontentloaded' })
    await sleep(3000)
    await takeScreenshot(page, '05-search')

    console.log('\n✅ All screenshots captured!')
  } finally {
    await browser.close()
  }
}

main().catch(err => {
  console.error('Screenshot script failed:', err)
  process.exit(1)
})