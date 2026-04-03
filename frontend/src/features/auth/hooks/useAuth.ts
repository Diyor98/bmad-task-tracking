import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import { queryKeys } from '@/lib/queryKeys'
import type { RegisterInput, LoginInput } from '../schemas'

interface User {
  id: string
  name: string
  email: string
}

export function useCurrentUser() {
  return useQuery({
    queryKey: queryKeys.auth.me,
    queryFn: async () => {
      const res = await apiClient.get<{ data: User }>('/auth/me')
      return res.data.data
    },
    retry: false,
  })
}

export function useRegister() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: RegisterInput) => {
      const res = await apiClient.post<{ data: User }>('/auth/register', input)
      return res.data.data
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me, user)
      navigate('/')
    },
  })
}

export function useLogin() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: LoginInput) => {
      const res = await apiClient.post<{ data: User }>('/auth/login', input)
      return res.data.data
    },
    onSuccess: (user) => {
      queryClient.setQueryData(queryKeys.auth.me, user)
      navigate('/')
    },
  })
}

export function useLogout() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async () => {
      await apiClient.post('/auth/logout')
    },
    onSuccess: () => {
      queryClient.setQueryData(queryKeys.auth.me, null)
      navigate('/login')
    },
  })
}
