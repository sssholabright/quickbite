import { ReactNode } from 'react'

interface LayoutProps {
    children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-between items-center h-16">
                        <div className="flex items-center">
                            <h1 className="text-2xl font-bold text-primary-600">QuickBite</h1>
                        </div>
                        <nav className="hidden md:flex space-x-8">
                            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
                                Home
                            </a>
                            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
                                Restaurants
                            </a>
                            <a href="#" className="text-gray-700 hover:text-primary-600 transition-colors">
                                Orders
                            </a>
                        </nav>
                    </div>
                </div>
            </header>
        
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {children}
            </main>
        </div>
    )
}