'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import Sidebar from './Sidebar'
import { getToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/register']

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const isPublic = PUBLIC_PATHS.includes(pathname)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const token = getToken()
    if (!token && !isPublic) {
      router.replace('/login')
    } else if (token && isPublic) {
      router.replace('/')
    } else {
      setReady(true)
    }
  }, [pathname])

  if (!ready && !isPublic) return null

  if (isPublic) {
    return <>{children}</>
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        className="flex-1 overflow-y-auto pt-14 lg:pt-0 lg:pb-0"
        style={{ paddingBottom: 'calc(4rem + env(safe-area-inset-bottom))' }}
      >{children}</main>
    </div>
  )
}
