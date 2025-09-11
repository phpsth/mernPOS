// src/components/Header.jsx
import React from 'react'

function Header({ activeTab, setActiveTab, cartItemsCount, toggleCart, isDarkMode, toggleDarkMode, user, onLogout }) {
  const handleLogout = async () => {
    await onLogout()
  }

  return (
    <header className="bg-gray-900 dark:bg-gray-800 text-white shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
          {/* Logo Section */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary-500 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">&gt;_</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">POS System</h1>
              {user && (
                <p className="text-xs text-gray-300">
                  Welcome, {user.firstName} ({user.role})
                </p>
              )}
            </div>
          </div>
          
          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-2">
            <button 
              onClick={() => setActiveTab('products')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'products' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              Products
            </button>
            <button 
              onClick={() => setActiveTab('orders')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'orders' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              Orders
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded-lg transition-colors duration-200 ${
                activeTab === 'reports' 
                  ? 'bg-primary-600 text-white' 
                  : 'text-gray-300 hover:text-white hover:bg-gray-800 dark:hover:bg-gray-700'
              }`}
            >
              Reports
            </button>
            
            {/* Cart Button - only show on products tab */}
            {activeTab === 'products' && (
              <button 
                onClick={toggleCart}
                className="relative px-3 py-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
                title="Shopping Cart"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3m4 10v6a1 1 0 001 1h12a1 1 0 001-1v-6m-6-4a1 1 0 11-2 0m2 0V7a1 1 0 00-1-1H9a1 1 0 00-1 1v2" />
                </svg>
                {cartItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {cartItemsCount}
                  </span>
                )}
              </button>
            )}

            {/* Dark Mode Toggle */}
            <button 
              onClick={toggleDarkMode}
              className="p-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-200"
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDarkMode ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
            
            <button 
              onClick={handleLogout}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
            >
              Logout
            </button>
          </nav>
          
          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 rounded-lg hover:bg-gray-800 dark:hover:bg-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </div>
    </header>
  )
}

export default Header