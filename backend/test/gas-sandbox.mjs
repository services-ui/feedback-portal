/**
 * Loads backend/Code.gs into a Node VM with in-memory mocks of the Apps Script services it uses
 * (SpreadsheetApp, LockService, CacheService, PropertiesService, ContentService, Utilities).
 * Lets us exercise the real doPost() logic locally — no Google account required.
 */
import { readFileSync } from 'node:fs'
import { randomUUID } from 'node:crypto'
import vm from 'node:vm'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const here = path.dirname(fileURLToPath(import.meta.url))

function createSheet(name) {
  const rows = [] // rows[r][c], 0-based
  const sheet = {
    name,
    rows,
    hidden: new Set(),
    getName: () => name,
    setName(n) { this.name = n; return this },
    getLastRow: () => rows.length,
    getMaxRows: () => Math.max(1000, rows.length),
    getRange(row, col, numRows = 1, numCols = 1) {
      const range = {
        setValues(values) {
          values.forEach((v, i) => {
            const r = row - 1 + i
            while (rows.length <= r) rows.push([])
            v.forEach((cell, j) => { rows[r][col - 1 + j] = cell })
          })
          return range
        },
        getValues() {
          const out = []
          for (let i = 0; i < numRows; i++) {
            const r = rows[row - 1 + i] || []
            out.push(Array.from({ length: numCols }, (_, j) => r[col - 1 + j] ?? ''))
          }
          return out
        },
        createTextFinder(text) {
          let entire = false
          const finder = {
            matchEntireCell(v) { entire = v; return finder },
            findNext() {
              for (const r of range.getValues()) for (const c of r) {
                const s = String(c)
                if (entire ? s === text : s.includes(text)) return { found: true }
              }
              return null
            },
          }
          return finder
        },
      }
      for (const m of ['setFontWeight', 'setFontColor', 'setBackground', 'setVerticalAlignment', 'setWrap', 'setNumberFormat', 'setHorizontalAlignment'])
        range[m] = () => range
      return range
    },
    setRowHeight: () => sheet,
    setFrozenRows: () => sheet,
    setFrozenColumns: () => sheet,
    setColumnWidth: () => sheet,
    setConditionalFormatRules: () => sheet,
    hideColumns(c) { sheet.hidden.add(c); return sheet },
  }
  return sheet
}

export function createSandbox() {
  const sheets = []
  const spreadsheet = {
    getId: () => 'mock-spreadsheet',
    getUrl: () => 'https://docs.google.com/spreadsheets/d/mock-spreadsheet',
    setSpreadsheetTimeZone: () => {},
    getSheets: () => sheets,
    getSheetByName: (n) => sheets.find((s) => s.name === n) || null,
    insertSheet(n) { const s = createSheet(n); sheets.push(s); return s },
  }
  sheets.push(createSheet('Sheet1'))

  const props = new Map()
  const cache = new Map()
  const rule = () => {
    const b = new Proxy({}, { get: (_, k) => (k === 'build' ? () => ({}) : () => b) })
    return b
  }

  const context = {
    console: { log() {}, error: (...a) => { context.__errors.push(a) } },
    __errors: [],
    SpreadsheetApp: {
      getActiveSpreadsheet: () => spreadsheet,
      openById: () => spreadsheet,
      create: () => spreadsheet,
      flush: () => {},
      newConditionalFormatRule: rule,
    },
    LockService: { getScriptLock: () => ({ tryLock: () => true, waitLock: () => {}, releaseLock: () => {} }) },
    CacheService: { getScriptCache: () => ({ get: (k) => cache.get(k) ?? null, put: (k, v) => cache.set(k, v) }) },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (k) => props.get(k) ?? null, setProperty: (k, v) => props.set(k, v) }) },
    ContentService: {
      MimeType: { JSON: 'application/json' },
      createTextOutput: (s) => ({ setMimeType() { return this }, getContent: () => s }),
    },
    Utilities: { getUuid: () => randomUUID() },
  }
  vm.createContext(context)
  vm.runInContext(readFileSync(path.join(here, '..', 'Code.gs'), 'utf8'), context, { filename: 'Code.gs' })

  return {
    context,
    spreadsheet,
    feedbackRows: () => {
      const s = spreadsheet.getSheetByName('Feedback')
      return s ? s.rows : []
    },
    clearCache: () => cache.clear(),
    post: (body) => JSON.parse(context.doPost({ postData: { contents: typeof body === 'string' ? body : JSON.stringify(body) } }).getContent()),
    get: () => JSON.parse(context.doGet().getContent()),
  }
}
