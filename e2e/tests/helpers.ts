import { type Page, expect } from '@playwright/test'

const API_BASE = 'http://localhost:3000/api'
let userCounter = 0

export function uniqueUser() {
  userCounter++
  const ts = Date.now()
  return {
    name: `Test User ${userCounter}`,
    email: `test${ts}${userCounter}@example.com`,
    password: 'TestPass123!',
  }
}

export async function registerViaAPI(page: Page, user: { name: string; email: string; password: string }) {
  const res = await page.request.post(`${API_BASE}/auth/register`, { data: user })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

export async function loginViaAPI(page: Page, email: string, password: string) {
  const res = await page.request.post(`${API_BASE}/auth/login`, { data: { email, password } })
  expect(res.ok()).toBeTruthy()
  return res.json()
}

export async function registerAndLogin(page: Page) {
  const user = uniqueUser()
  await registerViaAPI(page, user)
  await page.goto('/')
  await page.waitForURL('/')
  return user
}

export async function createProjectViaAPI(page: Page, name: string) {
  const res = await page.request.post(`${API_BASE}/projects`, { data: { name } })
  expect(res.ok()).toBeTruthy()
  const body = await res.json()
  return body.data
}

export async function registerLoginAndCreateProject(page: Page, projectName = 'Test Project') {
  const user = await registerAndLogin(page)
  const project = await createProjectViaAPI(page, projectName)
  return { user, project }
}
