'use client'

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
    const res = await fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      show({ title: '订阅成功', description: '我们已收到你的订阅请求。', variant: 'default' })
    } else if (res.status === 429) {
      const retryAfter = Number(res.headers.get('Retry-After') || '0')
      const seconds = isNaN(retryAfter) ? 60 : Math.max(1, retryAfter)
      show({
        title: '请求过于频繁',
        description: `请在 ${seconds} 秒后重试。`,
        variant: 'destructive',
      })
    } else {
      show({ title: '订阅失败', description: '服务暂不可用，请稍后再试。', variant: 'destructive' })
    }
  }
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-sm space-y-3">
      <div>
        <label htmlFor="email" className="block text-sm font-medium">
          邮箱
        </label>
        <input
          id="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          className="mt-1 w-full rounded-md border px-3 py-2"
          {...register('email')}
        />
        {formState.errors.email && (
          <p className="text-sm text-destructive">{formState.errors.email.message}</p>
        )}
      </div>
      <Button type="submit">订阅</Button>
    </form>
  )
}
