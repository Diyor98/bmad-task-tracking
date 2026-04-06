import { test, expect } from '@playwright/test'
import { uniqueUser, registerViaAPI, loginViaAPI } from './helpers'

const API = 'http://localhost:3000/api'

test.describe('API Validation', () => {
  test('all responses use { data } wrapper', async ({ page }) => {
    const user = uniqueUser()
    await registerViaAPI(page, user)

    // GET /projects should return { data: [...] }
    const res = await page.request.get(`${API}/projects`)
    const body = await res.json()
    expect(body).toHaveProperty('data')
    expect(Array.isArray(body.data)).toBeTruthy()
  })

  test('error responses use { error } wrapper', async ({ page }) => {
    const user = uniqueUser()
    await registerViaAPI(page, user)

    // POST /projects with empty body should return validation error
    const res = await page.request.post(`${API}/projects`, { data: {} })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body).toHaveProperty('error')
    expect(body.error).toHaveProperty('code')
    expect(body.error).toHaveProperty('message')
  })

  test('protected endpoints return 401 without auth', async ({ request }) => {
    const res = await request.get(`${API}/projects`)
    expect(res.status()).toBe(401)
    const body = await res.json()
    expect(body.error.code).toBe('UNAUTHORIZED')
  })

  test('non-existent resource returns 404', async ({ page }) => {
    const user = uniqueUser()
    await registerViaAPI(page, user)

    const res = await page.request.get(`${API}/projects/nonexistent-id`)
    expect(res.status()).toBe(404)
    const body = await res.json()
    expect(body.error.code).toBe('NOT_FOUND')
  })

  test('invalid body returns 400 with validation details', async ({ page }) => {
    const user = uniqueUser()
    await registerViaAPI(page, user)

    const res = await page.request.post(`${API}/tasks`, {
      data: { title: '', projectId: '', statusId: '' },
    })
    expect(res.status()).toBe(400)
    const body = await res.json()
    expect(body.error.code).toBe('VALIDATION_ERROR')
  })

  test('register with invalid email returns 400', async ({ request }) => {
    const res = await request.post(`${API}/auth/register`, {
      data: { name: 'Test', email: 'not-an-email', password: 'TestPass123!' },
    })
    expect(res.status()).toBe(400)
  })

  test('health endpoint returns ok', async ({ request }) => {
    const res = await request.get(`${API}/health`)
    expect(res.ok()).toBeTruthy()
    const body = await res.json()
    expect(body.data).toBe('ok')
  })

  test('status deletion of default returns 400', async ({ page }) => {
    const user = uniqueUser()
    await registerViaAPI(page, user)

    // Create a project to get default statuses
    const projRes = await page.request.post(`${API}/projects`, { data: { name: 'API Test Project' } })
    const project = (await projRes.json()).data
    const defaultStatusId = project.statuses[0].id

    // Try to delete the default status
    const delRes = await page.request.delete(`${API}/projects/${project.id}/statuses/${defaultStatusId}`)
    expect(delRes.status()).toBe(400)
    const body = await delRes.json()
    expect(body.error.message).toContain('default')
  })
})
