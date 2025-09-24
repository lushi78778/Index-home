"use client"

import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useState } from 'react'
import { Button } from '@/components/ui/button'

// 表单校验规则（最小验证 + 蜜罐）
const FormSchema = z.object({
  name: z.string().min(2, '请填写姓名'),
  email: z.string().email('邮箱格式不正确'),
  message: z.string().min(10, '请至少输入 10 个字符'),
  website: z.string().optional(), // 蜜罐字段（应保持为空）
})

type FormValues = z.infer<typeof FormSchema>

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<FormValues>({ resolver: zodResolver(FormSchema) })

  async function onSubmit(values: FormValues) {
    // 蜜罐拦截
    if (values.website) return
    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(values),
    })
    if (res.ok) {
      setSent(true)
      reset()
    } else {
      alert('发送失败，请稍后重试')
    }
  }

  if (sent)
    return (
      <div className="max-w-lg">
        <h1 className="text-2xl font-bold">感谢联系</h1>
        <p className="text-muted-foreground mt-2">我们会尽快回复你。</p>
      </div>
    )

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-lg space-y-4">
      <div>
        <label className="block text-sm font-medium">姓名</label>
        <input className="mt-1 w-full rounded-md border px-3 py-2" {...register('name')} />
        {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">邮箱</label>
        <input className="mt-1 w-full rounded-md border px-3 py-2" {...register('email')} />
        {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
      </div>
      <div>
        <label className="block text-sm font-medium">消息</label>
        <textarea className="mt-1 w-full rounded-md border px-3 py-2" rows={5} {...register('message')} />
        {errors.message && (
          <p className="text-sm text-destructive">{errors.message.message}</p>
        )}
      </div>
      {/* 蜜罐字段：隐藏输入，若被机器人填写则拒绝 */}
      <input type="text" className="hidden" tabIndex={-1} autoComplete="off" {...register('website')} />
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? '发送中…' : '发送'}
      </Button>
    </form>
  )
}
