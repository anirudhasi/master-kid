import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
      <h1 className="text-6xl font-bold mb-4 gradient-text">404</h1>
      <p className="text-2xl text-slate-300 mb-8">Page not found</p>
      <Link to="/" className="inline-block bg-gradient-to-r from-purple-600 to-pink-600 text-white px-8 py-4 rounded-xl font-bold hover:shadow-lg">
        Go back home
      </Link>
    </div>
  )
}
