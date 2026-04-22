import { Bell } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface HeaderProps {
  title: string
}

export default function Header({ title }: HeaderProps) {
  const { user } = useAuth()

  return (
    <header className="flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-4">
        <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-700">
          <Bell className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
            {user?.fullName?.charAt(0) ?? 'U'}
          </div>
          <span className="text-sm font-medium text-gray-700">{user?.fullName}</span>
        </div>
      </div>
    </header>
  )
}
