import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { RegisterSchema, type RegisterInput } from '../schemas'
import { useRegister } from '../hooks/useAuth'
import { Button } from '@/components/ui/button'
import { AxiosError } from 'axios'

export function RegisterPage() {
  const [form, setForm] = useState<RegisterInput>({ name: '', email: '', password: '' })
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<keyof RegisterInput, string>>>({})
  const register = useRegister()

  function validateField(field: keyof RegisterInput) {
    const result = RegisterSchema.shape[field].safeParse(form[field])
    setFieldErrors((prev) => ({
      ...prev,
      [field]: result.success ? undefined : result.error.errors[0].message,
    }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const result = RegisterSchema.safeParse(form)
    if (!result.success) {
      const errors: Partial<Record<keyof RegisterInput, string>> = {}
      for (const issue of result.error.issues) {
        const field = issue.path[0] as keyof RegisterInput
        if (!errors[field]) errors[field] = issue.message
      }
      setFieldErrors(errors)
      return
    }
    register.mutate(result.data)
  }

  const allFilled = form.name.length > 0 && form.email.length > 0 && form.password.length > 0
  const apiError = register.error instanceof AxiosError
    ? register.error.response?.data?.error?.message
    : register.error?.message

  useEffect(() => {
    if (apiError) {
      const timer = setTimeout(() => register.reset(), 4000)
      return () => clearTimeout(timer)
    }
  }, [apiError, register])

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-xl font-semibold text-zinc-900">Create an account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-zinc-700">Name</label>
            <input
              id="name"
              type="text"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              onBlur={() => validateField('name')}
            />
            {fieldErrors.name && <p className="mt-1 text-xs text-red-500">{fieldErrors.name}</p>}
          </div>
          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-zinc-700">Email</label>
            <input
              id="email"
              type="email"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              onBlur={() => validateField('email')}
            />
            {fieldErrors.email && <p className="mt-1 text-xs text-red-500">{fieldErrors.email}</p>}
          </div>
          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-zinc-700">Password</label>
            <input
              id="password"
              type="password"
              className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              onBlur={() => validateField('password')}
            />
            {fieldErrors.password && <p className="mt-1 text-xs text-red-500">{fieldErrors.password}</p>}
          </div>
          {apiError && <p className="text-sm text-red-500">{apiError}</p>}
          <Button type="submit" className="w-full" disabled={!allFilled || register.isPending}>
            {register.isPending ? 'Creating account...' : 'Register'}
          </Button>
        </form>
        <p className="mt-4 text-center text-sm text-zinc-500">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 hover:text-indigo-700">Log in</Link>
        </p>
      </div>
    </div>
  )
}
