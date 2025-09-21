export default function Home() {
    return (
        <div className="space-y-8">
            {/* Hero Section */}
            <section className="text-center py-12">
                <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                    Delicious Food
                    <span className="text-primary-600"> Delivered Fast</span>
                </h1>
                <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
                    Order from your favorite restaurants and get your food delivered to your doorstep in minutes.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button className="btn-primary text-lg px-8 py-3">
                        Order Now
                    </button>
                    <button className="btn-secondary text-lg px-8 py-3">
                        Browse Restaurants
                    </button>
                </div>
            </section>

            {/* Features Section */}
            <section className="grid md:grid-cols-3 gap-8">
                <div className="card text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Fast Delivery</h3>
                    <p className="text-gray-600">Get your food delivered in 30 minutes or less</p>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Quality Food</h3>
                    <p className="text-gray-600">Fresh ingredients from trusted restaurants</p>
                </div>

                <div className="card text-center">
                    <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-semibold mb-2">Best Prices</h3>
                    <p className="text-gray-600">Competitive prices with no hidden fees</p>
                </div>
            </section>
        </div>
    )
}