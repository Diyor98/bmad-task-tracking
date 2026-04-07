import { test, expect } from '@playwright/test'
import { registerLoginAndCreateProject } from './helpers'

test.describe('Tasks', () => {
  test('create a task from board column @smoke', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)
    await page.goto(`/projects/${project.id}`)

    // Click "Add task" in the To Do column
    const todoColumn = page.locator('div').filter({ hasText: /^To Do/ }).first()
    await todoColumn.getByRole('button', { name: /add task/i }).click()

    // Fill task title in create dialog
    await page.getByLabel(/title/i).fill('My First Task')
    await page.getByRole('button', { name: /create/i }).click()

    // Task card should appear in To Do column
    await expect(page.getByText('My First Task')).toBeVisible()
  })

  test('open task detail panel by clicking task card', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)

    // Create task via API
    const defaultStatus = project.statuses[0]
    await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Detail Test Task', projectId: project.id, statusId: defaultStatus.id },
    })

    await page.goto(`/projects/${project.id}`)
    await page.getByText('Detail Test Task').click()

    // Detail panel should show task title
    await expect(page.getByRole('heading', { name: 'Detail Test Task' }).or(page.locator('input[value="Detail Test Task"]'))).toBeVisible()
  })

  test('edit task title from detail panel', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)
    const defaultStatus = project.statuses[0]
    await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Edit Me', projectId: project.id, statusId: defaultStatus.id },
    })

    await page.goto(`/projects/${project.id}`)
    await page.getByText('Edit Me').click()

    // Find and edit the title input in the detail panel
    const titleInput = page.locator('input[value="Edit Me"]')
    await titleInput.clear()
    await titleInput.fill('Edited Title')
    await titleInput.press('Tab') // trigger blur/save

    // Wait for update to settle
    await page.waitForTimeout(500)
    await page.reload()
    await expect(page.getByText('Edited Title')).toBeVisible()
  })

  test('delete task with confirmation dialog', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)
    const defaultStatus = project.statuses[0]
    await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Delete Me Task', projectId: project.id, statusId: defaultStatus.id },
    })

    await page.goto(`/projects/${project.id}`)

    // Hover over task card to reveal actions
    const taskCard = page.getByText('Delete Me Task').locator('..')
    await taskCard.hover()

    // Open dropdown menu
    await taskCard.getByRole('button').first().click()
    await page.getByText('Delete').click()

    // Confirm deletion
    await expect(page.getByText(/cannot be undone/i)).toBeVisible()
    await page.getByRole('button', { name: /delete/i }).click()

    await expect(page.getByText('Delete Me Task')).not.toBeVisible()
  })

  test('change task status via status chip dropdown', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)
    const todoStatus = project.statuses.find((s: { name: string }) => s.name === 'To Do')!
    await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Move Me', projectId: project.id, statusId: todoStatus.id },
    })

    await page.goto(`/projects/${project.id}`)

    // Click the status chip on the task card
    await page.getByText('Move Me').locator('..').getByRole('button', { name: /to do/i }).click()

    // Select "In Progress" from dropdown
    await page.getByRole('menuitem', { name: 'In Progress' }).click()

    // Task should now appear in the In Progress column
    await page.waitForTimeout(500)
    const inProgressColumn = page.locator('div').filter({ hasText: /^In Progress/ }).first()
    await expect(inProgressColumn.getByText('Move Me')).toBeVisible()
  })
})
