import React, { useState, useEffect } from 'react';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import Sidebar from './Sidebar';
import ProductList from './ProductList';
import Cart from './Cart';
import Reports from './Reports';
import CategoryManagement from './CategoryManagement';
import ProductManagement from './ProductManagement';
import OrderManagement from './OrderManagement';

function Dashboard({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('products');
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [productsData, ordersData] = await Promise.all([
          productService.getProducts(),
          orderService.getOrders()
        ]);
        console.log('📦 Loaded products data:', productsData);
        setProducts(productsData);
        setOrders(ordersData);
      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const addToCart = (product) => {
    console.log('🛒 Adding product to cart:', product);
    setCartItems(prevItems => {
      console.log('📦 Current cart items:', prevItems);
      const productId = product.id || product._id;
      console.log('🔍 Looking for product with ID:', productId);
      
      const existingItem = prevItems.find(item => (item.id || item._id) === productId);
      console.log('🔍 Existing item found:', existingItem);
      
      if (existingItem) {
        console.log('➕ Incrementing quantity for existing item');
        return prevItems.map(item =>
          (item.id || item._id) === productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        console.log('🆕 Adding new item to cart');
        const newCartItems = [...prevItems, { ...product, quantity: 1 }];
        console.log('📋 New cart items:', newCartItems);
        return newCartItems;
      }
    });
  };

  const updateCartItem = (productId, quantity) => {
    console.log('🔄 Updating item:', productId, 'to quantity:', quantity);
    setCartItems(prevItems => {
      if (quantity <= 0) {
        return prevItems.filter(item => (item.id || item._id) !== productId);
      }
      return prevItems.map(item =>
        (item.id || item._id) === productId
          ? { ...item, quantity }
          : item
      );
    });
  };

  const removeFromCart = (productId) => {
    console.log('🗑️ Removing item with ID:', productId);
    setCartItems(prevItems => {
      const newItems = prevItems.filter(item => (item.id || item._id) !== productId);
      console.log('📋 Cart after removal:', newItems);
      return newItems;
    });
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const toggleCart = () => {
    setIsCartOpen(prev => !prev);
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <span className="ml-3 text-gray-600 dark:text-gray-300">Loading...</span>
        </div>
      );
    }

    switch (activeTab) {
      case 'products':
        return <ProductList products={products} onAddToCart={addToCart} />;
      case 'orders':
        return <OrderManagement />;
      case 'categories':
        return <CategoryManagement />;
      case 'inventory':
        return <ProductManagement />;
      case 'reports':
        return <Reports orders={orders} products={products} />;
      default:
        return <ProductList products={products} onAddToCart={addToCart} />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartItemsCount={cartItems.reduce((total, item) => total + item.quantity, 0)}
        toggleCart={toggleCart}
        user={user}
        onLogout={onLogout}
        onCollapseChange={setIsSidebarCollapsed}
      />

      {/* Main Content Area */}
      <div 
        className={`min-h-screen transition-all duration-300 ${
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        }`}
      >
        <div className="px-6 py-6">
          {/* Main Content */}
          {renderContent()}
        </div>
      </div>

      {/* Cart Sidebar */}
      <Cart
        cartItems={cartItems}
        isOpen={isCartOpen}
        onClose={toggleCart}
        onUpdateItem={updateCartItem}
        onRemoveItem={removeFromCart}
        onClearCart={clearCart}
      />
    </div>
  );
}

export default Dashboard;