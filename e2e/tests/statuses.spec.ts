import { test, expect } from '@playwright/test'
import { registerLoginAndCreateProject } from './helpers'

test.describe('Status Management', () => {
  test('default statuses cannot be deleted (no delete button)', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)
    await page.goto(`/projects/${project.id}`)

    // Open status settings panel
    await page.getByRole('button', { name: /settings/i }).or(page.locator('button:has(svg.lucide-settings)')).click()

    // Verify "To Do" row exists but has no delete button
    const statusPanel = page.locator('div').filter({ hasText: 'Status Settings' })
    await expect(statusPanel.getByText('To Do')).toBeVisible()

    // Default statuses should not have trash icons
    const todoRow = statusPanel.locator('div').filter({ hasText: /^To Do$/ })
    await expect(todoRow.locator('button:has(svg)')).not.toBeVisible()
  })

  test('create a custom status', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)
    await page.goto(`/projects/${project.id}`)

    // Open status settings
    await page.locator('button:has(svg.lucide-settings)').click()

    // Add new status
    await page.getByPlaceholder(/new status/i).fill('QA Testing')
    await page.getByPlaceholder(/new status/i).press('Enter')

    // Should appear in the list
    await expect(page.getByText('QA Testing')).toBeVisible()

    // Close settings and verify column on board
    await page.locator('button:has(svg.lucide-x)').click()
    await expect(page.getByText('QA Testing')).toBeVisible()
  })

  test('rename a status', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)
    await page.goto(`/projects/${project.id}`)

    // Open status settings
    await page.locator('button:has(svg.lucide-settings)').click()

    // Click on "To Do" text to start editing
    const statusPanel = page.locator('div').filter({ hasText: 'Status Settings' })
    await statusPanel.getByText('To Do').click()

    // Edit the name
    const input = statusPanel.locator('input[value="To Do"]')
    await input.clear()
    await input.fill('Backlog')
    await input.press('Enter')

    await expect(statusPanel.getByText('Backlog')).toBeVisible()
  })

  test('delete custom status reassigns tasks to fallback', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)

    // Create a custom status via API
    const createRes = await page.request.post(`http://localhost:3000/api/projects/${project.id}/statuses`, {
      data: { name: 'Temp Status', color: 'red-500' },
    })
    const customStatus = (await createRes.json()).data

    // Create a task in the custom status
    await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Orphan Task', projectId: project.id, statusId: customStatus.id },
    })

    await page.goto(`/projects/${project.id}`)

    // Open status settings
    await page.locator('button:has(svg.lucide-settings)').click()

    // Find and click delete on "Temp Status"
    const statusPanel = page.locator('div').filter({ hasText: 'Status Settings' })
    const tempRow = statusPanel.locator('div').filter({ hasText: /Temp Status/ })
    await tempRow.locator('button:has(svg.lucide-trash-2)').click()

    // Confirm deletion
    await page.getByRole('button', { name: /delete/i }).click()

    // Close settings and check task moved to a default column
    await page.locator('button:has(svg.lucide-x)').click()
    await page.waitForTimeout(500)

    // Task should still exist somewhere on the board
    await expect(page.getByText('Orphan Task')).toBeVisible()
  })
})
