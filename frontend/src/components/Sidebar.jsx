import { useState } from 'react';

function Sidebar({ activeTab, setActiveTab, cartItemsCount, toggleCart, user, onLogout, onCollapseChange }) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Notify parent when collapse state changes
  const handleCollapseToggle = () => {
    const newCollapsedState = !isCollapsed;
    setIsCollapsed(newCollapsedState);
    if (onCollapseChange) {
      onCollapseChange(newCollapsedState);
    }
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to logout?')) {
      await onLogout();
    }
  };

  const menuItems = [
    {
      id: 'products',
      name: 'Products',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
        </svg>
      ),
      description: 'Browse products'
    },
    {
      id: 'orders',
      name: 'Orders',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      description: 'Manage orders'
    },
    {
      id: 'categories',
      name: 'Categories',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
      ),
      description: 'Product categories',
      roles: ['admin', 'manager'] // Only admins and managers can access
    },
    {
      id: 'inventory',
      name: 'Inventory',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
        </svg>
      ),
      description: 'Stock management',
      roles: ['admin', 'manager']
    },
    {
      id: 'reports',
      name: 'Reports',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      description: 'Sales analytics',
      roles: ['admin', 'manager']
    }
  ];

  // Filter menu items based on user role
  const filteredMenuItems = menuItems.filter(item => 
    !item.roles || item.roles.includes(user?.role)
  );

  const getRoleColor = (role) => {
    const colors = {
      admin: 'text-red-600 bg-red-100',
      manager: 'text-blue-600 bg-blue-100',
      cashier: 'text-green-600 bg-green-100'
    };
    return colors[role] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className={`fixed left-0 top-0 h-full bg-gray-900 text-white shadow-xl z-50 transition-all duration-300 ${
      isCollapsed ? 'w-20' : 'w-60'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-gray-700">
          <div className="flex items-center justify-between">
            {!isCollapsed && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">&gt;_</span>
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">&lt;POS/&gt;</h1>
                  <p className="text-xs text-gray-300">Point of Sale</p>
                </div>
              </div>
            )}
            
            <button
              onClick={handleCollapseToggle}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <svg 
                className={`w-5 h-5 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
          </div>
        </div>

        {/* User Info */}
        {!isCollapsed && user && (
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-sm font-semibold">
                  {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user.firstName} {user.lastName}
                </p>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Menu */}
        <nav className="flex-1 p-4 space-y-2">
          {filteredMenuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-left transition-all duration-200 group ${
                activeTab === item.id
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'text-gray-300 hover:text-white hover:bg-gray-800'
              }`}
            >
              <div className="flex-shrink-0">
                {item.icon}
              </div>
              {!isCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-xs opacity-75">{item.description}</div>
                </div>
              )}
              
              {/* Active indicator */}
              {activeTab === item.id && (
                <div className="w-2 h-2 bg-white rounded-full"></div>
              )}
            </button>
          ))}
        </nav>

        {/* Cart & Quick Actions */}
        <div className="p-4 border-t border-gray-700 space-y-2">
          {/* Cart Button - only show on products tab */}
          {activeTab === 'products' && (
            <button
              onClick={toggleCart}
              className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 transition-all duration-200 relative"
            >
              <div className="flex-shrink-0">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4m-2.4 0L3 3m4 10v6a1 1 0 001 1h12a1 1 0 001-1v-6m-6-4a1 1 0 11-2 0m2 0V7a1 1 0 00-1-1H9a1 1 0 00-1 1v2" />
                </svg>
              </div>
              {!isCollapsed && (
                <div className="flex-1">
                  <div className="font-medium">Shopping Cart</div>
                  <div className="text-xs opacity-75">View cart items</div>
                </div>
              )}
              
              {/* Cart badge */}
              {cartItemsCount > 0 && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                  {cartItemsCount > 99 ? '99+' : cartItemsCount}
                </div>
              )}
            </button>
          )}

          {/* Quick Stats */}
          {!isCollapsed && (
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-2">Quick Stats</div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center">
                  <div className="text-white font-semibold">{cartItemsCount}</div>
                  <div className="text-gray-400">Cart Items</div>
                </div>
                <div className="text-center">
                  <div className="text-white font-semibold">
                    {new Date().toLocaleDateString()}
                  </div>
                  <div className="text-gray-400">Today</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-gray-700">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-300 hover:text-red-100 hover:bg-red-900/20 transition-all duration-200"
          >
            <div className="flex-shrink-0">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </div>
            {!isCollapsed && (
              <div className="flex-1">
                <div className="font-medium">Logout</div>
                <div className="text-xs opacity-75">Sign out</div>
              </div>
            )}
          </button>
        </div>

        {/* Collapsed user info */}
        {isCollapsed && user && (
          <div className="p-4 border-t border-gray-700">
            <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center mx-auto">
              <span className="text-xs font-semibold">
                {user.firstName?.charAt(0)}{user.lastName?.charAt(0)}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Sidebar;