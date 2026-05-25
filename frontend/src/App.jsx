import Sidebar   from './components/Sidebar'
import Header    from './components/Header'
import Dashboard from './components/Dashboard'

export default function App() {
  return (
    <div
      className="flex"
      style={{ height: '100vh', overflow: 'hidden', background: '#020817' }}
    >
      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden">
        <Header />
        <Dashboard />
      </div>
    </div>
  )
}
