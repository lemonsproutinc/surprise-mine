import { Outlet } from 'react-router-dom'
import BottomNav from './BottomNav'

export default function AppLayout() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-[430px] mx-auto relative min-h-screen">
        <main className="min-h-screen pb-24">
          <Outlet />
        </main>
        <BottomNav />
      </div>
    </div>
  )
}
