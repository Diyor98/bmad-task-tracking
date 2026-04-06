import { test, expect } from '@playwright/test'
import { uniqueUser } from './helpers'

test.describe('Authentication', () => {
  test('register a new user @smoke', async ({ page }) => {
    const user = uniqueUser()
    await page.goto('/register')

    await page.getByLabel('Name').fill(user.name)
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Register' }).click()

    // Should redirect to dashboard
    await page.waitForURL('/')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('reject duplicate email registration', async ({ page }) => {
    const user = uniqueUser()

    // Register first time via API
    await page.request.post('http://localhost:3000/api/auth/register', { data: user })

    // Try again via UI
    await page.goto('/register')
    await page.getByLabel('Name').fill(user.name)
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Register' }).click()

    await expect(page.getByText('already exists')).toBeVisible()
  })

  test('show validation errors on empty register form', async ({ page }) => {
    await page.goto('/register')
    // Button should be disabled when fields are empty
    await expect(page.getByRole('button', { name: 'Register' })).toBeDisabled()
  })

  test('login with valid credentials @smoke', async ({ page }) => {
    const user = uniqueUser()
    await page.request.post('http://localhost:3000/api/auth/register', { data: user })

    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Log in' }).click()

    await page.waitForURL('/')
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('reject invalid credentials', async ({ page }) => {
    await page.goto('/login')
    await page.getByLabel('Email').fill('nonexistent@example.com')
    await page.getByLabel('Password').fill('wrongpassword')
    await page.getByRole('button', { name: 'Log in' }).click()

    await expect(page.getByText('incorrect')).toBeVisible()
  })

  test('session persists across page refresh', async ({ page }) => {
    const user = uniqueUser()
    await page.request.post('http://localhost:3000/api/auth/register', { data: user })

    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForURL('/')

    // Refresh and verify still authenticated
    await page.reload()
    await expect(page.getByText('Dashboard')).toBeVisible()
  })

  test('logout clears session', async ({ page }) => {
    const user = uniqueUser()
    await page.request.post('http://localhost:3000/api/auth/register', { data: user })

    await page.goto('/login')
    await page.getByLabel('Email').fill(user.email)
    await page.getByLabel('Password').fill(user.password)
    await page.getByRole('button', { name: 'Log in' }).click()
    await page.waitForURL('/')

    // Click logout
    await page.getByRole('button', { name: 'Log out' }).click()
    await page.waitForURL('/login')
  })

  test('unauthenticated user redirected to login', async ({ page }) => {
    await page.goto('/')
    await page.waitForURL('/login')
  })
})
