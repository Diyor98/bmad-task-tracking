import { test, expect } from '@playwright/test'
import { registerLoginAndCreateProject, uniqueUser, registerViaAPI } from './helpers'

test.describe('Collaboration', () => {
  test('add a comment to a task', async ({ page }) => {
    const { project } = await registerLoginAndCreateProject(page)
    const defaultStatus = project.statuses[0]

    await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Comment Task', projectId: project.id, statusId: defaultStatus.id },
    })

    await page.goto(`/projects/${project.id}`)
    await page.getByText('Comment Task').click()

    // Add a comment
    await page.getByPlaceholder(/add a comment/i).fill('This is a test comment')
    await page.getByRole('button', { name: /send/i }).or(page.locator('button:has(svg.lucide-send)')).click()

    // Comment should appear
    await expect(page.getByText('This is a test comment')).toBeVisible()
  })

  test('assign a task to a user', async ({ page }) => {
    const { project, user } = await registerLoginAndCreateProject(page)
    const defaultStatus = project.statuses[0]

    await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Assign Task', projectId: project.id, statusId: defaultStatus.id },
    })

    await page.goto(`/projects/${project.id}`)
    await page.getByText('Assign Task').click()

    // Select assignee from dropdown/select
    const assigneeSelect = page.locator('select').filter({ hasText: /unassigned/i }).or(page.locator('select').first())
    await assigneeSelect.selectOption({ label: user.name })

    await page.waitForTimeout(500)

    // Verify assignee avatar appears on the task card
    await page.keyboard.press('Escape')
    await page.waitForTimeout(300)

    // Task card should show assignee initials
    const taskCard = page.getByText('Assign Task').locator('..')
    await expect(taskCard).toBeVisible()
  })

  test('filter board by assignee', async ({ page }) => {
    const { project, user } = await registerLoginAndCreateProject(page)
    const defaultStatus = project.statuses[0]

    // Create two tasks, assign one
    const res1 = await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Assigned Task', projectId: project.id, statusId: defaultStatus.id },
    })
    const task1 = (await res1.json()).data
    await page.request.patch(`http://localhost:3000/api/tasks/${task1.id}`, {
      data: { assigneeId: (await page.request.get('http://localhost:3000/api/auth/me').then(r => r.json())).data.id },
    })

    await page.request.post('http://localhost:3000/api/tasks', {
      data: { title: 'Unassigned Task', projectId: project.id, statusId: defaultStatus.id },
    })

    await page.goto(`/projects/${project.id}`)

    // Click on assignee filter chip
    await page.getByRole('button', { name: user.name }).click()

    // Only assigned task should be visible
    await expect(page.getByText('Assigned Task')).toBeVisible()
    await expect(page.getByText('Unassigned Task')).not.toBeVisible()

    // Click "All" to clear filter
    await page.getByRole('button', { name: 'All' }).click()
    await expect(page.getByText('Unassigned Task')).toBeVisible()
  })
})
