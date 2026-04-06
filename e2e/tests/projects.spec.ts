import { test, expect } from '@playwright/test'
import { registerAndLogin, createProjectViaAPI } from './helpers'

test.describe('Projects', () => {
  test('create a project from dashboard @smoke', async ({ page }) => {
    await registerAndLogin(page)
    await page.goto('/')

    await page.getByRole('button', { name: /new project/i }).click()
    await page.getByPlaceholder(/project name/i).fill('My First Project')
    await page.getByRole('button', { name: /create/i }).click()

    // Project card should appear on dashboard
    await expect(page.getByText('My First Project')).toBeVisible()
  })

  test('display all projects on dashboard', async ({ page }) => {
    await registerAndLogin(page)
    await createProjectViaAPI(page, 'Project Alpha')
    await createProjectViaAPI(page, 'Project Beta')

    await page.goto('/')
    await expect(page.getByText('Project Alpha')).toBeVisible()
    await expect(page.getByText('Project Beta')).toBeVisible()
  })

  test('navigate to project board from dashboard', async ({ page }) => {
    await registerAndLogin(page)
    const project = await createProjectViaAPI(page, 'Board Project')

    await page.goto('/')
    await page.getByText('Board Project').click()

    await page.waitForURL(`/projects/${project.id}`)
    // Board should show default status columns
    await expect(page.getByText('To Do')).toBeVisible()
    await expect(page.getByText('In Progress')).toBeVisible()
    await expect(page.getByText('In Review')).toBeVisible()
    await expect(page.getByText('Done')).toBeVisible()
  })

  test('edit project name', async ({ page }) => {
    await registerAndLogin(page)
    const project = await createProjectViaAPI(page, 'Old Name')

    await page.goto('/')
    // Hover over project card to reveal edit action
    const card = page.getByText('Old Name').locator('..')
    await card.hover()

    // Look for edit button (pencil icon or dropdown)
    const editBtn = card.getByRole('button').first()
    await editBtn.click()

    // Fill new name in edit dialog/input
    const nameInput = page.locator('input[value="Old Name"]')
    await nameInput.clear()
    await nameInput.fill('New Name')
    await page.getByRole('button', { name: /save/i }).click()

    await expect(page.getByText('New Name')).toBeVisible()
  })

  test('delete project with confirmation', async ({ page }) => {
    await registerAndLogin(page)
    await createProjectViaAPI(page, 'Delete Me')

    await page.goto('/')
    const card = page.getByText('Delete Me').locator('..')
    await card.hover()

    // Find and click delete action
    const moreBtn = card.getByRole('button').first()
    await moreBtn.click()
    await page.getByText('Delete').click()

    // Confirmation dialog should appear
    await expect(page.getByText(/cannot be undone/i)).toBeVisible()
    await page.getByRole('button', { name: /delete/i }).click()

    // Project should be gone
    await expect(page.getByText('Delete Me')).not.toBeVisible()
  })

  test('new project has 4 default statuses', async ({ page }) => {
    await registerAndLogin(page)
    const project = await createProjectViaAPI(page, 'Status Check')

    await page.goto(`/projects/${project.id}`)

    await expect(page.getByText('To Do')).toBeVisible()
    await expect(page.getByText('In Progress')).toBeVisible()
    await expect(page.getByText('In Review')).toBeVisible()
    await expect(page.getByText('Done')).toBeVisible()
  })
})
