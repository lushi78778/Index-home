"use client"

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { useToast } from '@/components/ui/toast'

const Schema = z.object({ email: z.string().email('邮箱格式不正确') })

export default function SubscribePage() {
  const { show } = useToast()
  const { register, handleSubmit, formState } = useForm<{ email: string }>({
    resolver: zodResolver(Schema),
  })
  async function onSubmit(values: { email: string }) {
    await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    show({ title: '订阅成功', description: '我们已收到你的订阅请求。', variant: 'default' })
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-3">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">邮箱</label>
  <input id="email" className="mt-1 w-full rounded-md border px-3 py-2" {...register('email')} />
        {formState.errors.email && (
          <p className="text-sm text-destructive">{formState.errors.email.message}</p>
        )}
      </div>
      <Button type="submit">订阅</Button>
    </form>
  )
}
