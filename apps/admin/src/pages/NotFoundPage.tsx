import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="text-center">
                    {/* 404 Illustration */}
                    <div className="mx-auto h-32 w-32 text-gray-400 mb-8">
                        <svg
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            className="h-full w-full"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={1}
                                d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.47-.881-6.08-2.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                        </svg>
                    </div>

                    {/* Error Code */}
                    <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                    
                    {/* Error Message */}
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">
                        Page Not Found
                    </h2>
                    
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                        Sorry, we couldn't find the page you're looking for. 
                        It might have been moved, deleted, or you entered the wrong URL.
                    </p>

                    {/* Action Buttons */}
                    <div className="space-y-4 sm:space-y-0 sm:space-x-4 sm:flex sm:justify-center">
                        <Link
                            to="/admin/dashboard"
                            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                            Go to Dashboard
                        </Link>
                        
                        <button
                            onClick={() => window.history.back()}
                            className="inline-flex items-center justify-center w-full sm:w-auto px-6 py-3 border border-gray-300 text-base font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-150 ease-in-out"
                        >
                            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            Go Back
                        </button>
                    </div>

                    {/* Help Section */}
                    <div className="mt-12 text-sm text-gray-500">
                        <p className="mb-2">Need help? Try these links:</p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link to="/admin/dashboard" className="text-blue-600 hover:text-blue-800">
                                Dashboard
                            </Link>
                            <Link to="/admin/orders" className="text-blue-600 hover:text-blue-800">
                                Orders
                            </Link>
                            <Link to="/admin/customers" className="text-blue-600 hover:text-blue-800">
                                Customers
                            </Link>
                            <Link to="/admin/vendors" className="text-blue-600 hover:text-blue-800">
                                Vendors
                            </Link>
                            <Link to="/admin/logistics" className="text-blue-600 hover:text-blue-800">
                                Logistics
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NotFoundPage;
