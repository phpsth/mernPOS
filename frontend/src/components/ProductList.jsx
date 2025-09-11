// src/components/ProductList.jsx
import React, { useState, useMemo } from "react";
import ProductCard from "./ProductCard";
import SearchBar from "./SearchBar";

function ProductList({ products, onAddToCart }) {
  const [searchTerm, setSearchTerm] = useState("");

  // Filter products based on search term
  const filteredProducts = useMemo(() => {
    if (!searchTerm) return products;
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, products]);

  return (
    <div>
      {/* Search Bar */}
      <SearchBar
        onSearch={setSearchTerm}
        placeholder="Search products by name..."
      />

      {/* Results Summary */}
      <div className="flex items-center justify-between mb-6">
        <div className="text-gray-600 dark:text-gray-300">
          {searchTerm ? (
            <span>
              Found {filteredProducts.length} products for "{searchTerm}"
            </span>
          ) : (
            <span>{products.length} products available</span>
          )}
        </div>

        {/* Sort Options */}
        <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <option>Sort by Name</option>
          <option>Sort by Price</option>
          <option>Sort by Stock</option>
        </select>
      </div>

      {/* Products Grid */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No products found
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            Try searching for something else
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={onAddToCart}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ProductList;