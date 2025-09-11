// src/components/Reports.jsx
import React, { useState, useEffect } from 'react'
import statsService from '../services/statsService'
import { exportToExcel, exportToPDF, shareReport } from '../utils/exportUtils'

function Reports({ orders = [], products = [] }) {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [period, setPeriod] = useState('30')
  
  // Stats data state
  const [overviewStats, setOverviewStats] = useState(null)
  const [salesData, setSalesData] = useState([])
  const [topProducts, setTopProducts] = useState([])
  const [productStats, setProductStats] = useState(null)
  const [revenueStats, setRevenueStats] = useState(null)

  // Export state
  const [exportLoading, setExportLoading] = useState(false)
  const [exportMessage, setExportMessage] = useState('')

  // Fetch all stats data using statsService
  const fetchStatsData = async () => {
    try {
      setLoading(true)
      setError(null)

      const results = await statsService.getAllStats(period)

      // Handle overview stats
      if (results.overview?.success) {
        setOverviewStats(results.overview.data)
      }

      // Handle sales stats
      if (results.sales?.success) {
        setSalesData(results.sales.data.salesData || [])
      }

      // Handle product stats
      if (results.products?.success) {
        setProductStats(results.products.data)
        setTopProducts(results.products.data.productPerformance || [])
      }

      // Handle revenue stats
      if (results.revenue?.success) {
        setRevenueStats(results.revenue.data)
      }

      // Handle any errors
      if (results.errors && results.errors.length > 0) {
        console.warn('Some stats failed to load:', results.errors)
      }

    } catch (err) {
      setError('Failed to load analytics data')
      console.error('Error fetching stats:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStatsData()
  }, [period])

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  // Export handler functions
  const handleExportExcel = async () => {
    setExportLoading(true)
    setExportMessage('')
    
    try {
      const reportData = {
        overviewStats,
        topProducts,
        revenueStats,
        period
      }
      
      const result = await exportToExcel(reportData, 'analytics_report')
      setExportMessage(result.message)
      
      // Clear message after 3 seconds
      setTimeout(() => setExportMessage(''), 3000)
    } catch (error) {
      setExportMessage('Failed to export Excel report')
      setTimeout(() => setExportMessage(''), 3000)
    } finally {
      setExportLoading(false)
    }
  }

  const handleExportPDF = async () => {
    setExportLoading(true)
    setExportMessage('')
    
    try {
      const reportData = {
        overviewStats,
        topProducts,
        revenueStats,
        period
      }
      
      const result = await exportToPDF(reportData, 'analytics_report')
      setExportMessage(result.message)
      
      // Clear message after 3 seconds
      setTimeout(() => setExportMessage(''), 3000)
    } catch (error) {
      setExportMessage('Failed to generate PDF report')
      setTimeout(() => setExportMessage(''), 3000)
    } finally {
      setExportLoading(false)
    }
  }

  const handleShareReport = async () => {
    setExportLoading(true)
    setExportMessage('')
    
    try {
      const reportData = {
        overviewStats,
        topProducts,
        revenueStats,
        period
      }
      
      const result = await shareReport(reportData, 'clipboard')
      setExportMessage(result.message)
      
      // Clear message after 3 seconds
      setTimeout(() => setExportMessage(''), 3000)
    } catch (error) {
      setExportMessage('Failed to share report')
      setTimeout(() => setExportMessage(''), 3000)
    } finally {
      setExportLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Loading analytics...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
        <div className="flex justify-between items-center">
          <p className="text-red-600">{error}</p>
          <button
            onClick={fetchStatsData}
            className="text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
        <p className="text-gray-600">Track your business performance and insights</p>
      </div>

      {/* Quick Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-green-600">
                {overviewStats ? formatCurrency(overviewStats.overview.totalRevenue) : '$0.00'}
              </p>
              <p className={`text-xs mt-1 ${overviewStats?.overview.revenueGrowth >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                {overviewStats?.overview.revenueGrowth >= 0 ? '↗' : '↘'} 
                {overviewStats ? ` ${Math.abs(overviewStats.overview.revenueGrowth)}%` : ' 0%'} from last period
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Orders</p>
              <p className="text-2xl font-bold text-blue-600">
                {overviewStats ? formatNumber(overviewStats.overview.totalOrders) : '0'}
              </p>
              <p className={`text-xs mt-1 ${overviewStats?.overview.orderGrowth >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                {overviewStats?.overview.orderGrowth >= 0 ? '↗' : '↘'} 
                {overviewStats ? ` ${Math.abs(overviewStats.overview.orderGrowth)}%` : ' 0%'} from last period
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Average Order</p>
              <p className="text-2xl font-bold text-purple-600">
                {overviewStats ? formatCurrency(overviewStats.overview.avgOrderValue) : '$0.00'}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Per order value
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Low Stock Items</p>
              <p className="text-2xl font-bold text-orange-600">
                {overviewStats ? overviewStats.overview.lowStockProducts : '0'}
              </p>
              <p className="text-xs text-orange-500 mt-1">
                Need attention
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.854-.833-2.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sales Chart */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Daily Sales Trend</h3>
            <select 
              value={period}
              onChange={(e) => handlePeriodChange(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-white"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          
          {/* Revenue Chart */}
          <div className="space-y-3">
            {revenueStats?.dailyRevenue?.length > 0 ? (
              revenueStats.dailyRevenue.slice(-7).map((day, index) => {
                const maxRevenue = Math.max(...revenueStats.dailyRevenue.map(d => d.revenue))
                const percentage = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0
                
                return (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-sm text-gray-500 w-20">
                        {`${day._id.month}/${day._id.day}`}
                      </span>
                      <div className="flex-1">
                        <div className="bg-gray-200 rounded-full h-2 w-48">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${percentage}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">{formatCurrency(day.revenue)}</div>
                      <div className="text-xs text-gray-500">{day.orders} orders</div>
                    </div>
                  </div>
                )
              })
            ) : (
              <div className="text-center py-8 text-gray-500">
                No sales data available for the selected period
              </div>
            )}
          </div>
        </div>

        {/* Top Products */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Top Selling Products</h3>
            <span className="text-sm text-gray-500">Last {period} days</span>
          </div>
          
          <div className="space-y-4">
            {topProducts?.length > 0 ? (
              topProducts.slice(0, 5).map((product, index) => (
                <div key={product._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-orange-500' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{product.name}</div>
                      <div className="text-sm text-gray-500">{formatNumber(product.totalQuantitySold)} units sold</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatCurrency(product.totalRevenue)}</div>
                    <div className="text-xs text-gray-500">{formatNumber(product.orderCount)} orders</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                No product sales data available for the selected period
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity & Export Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-900">Order #ORD-001 completed</div>
                <div className="text-xs text-gray-500">85,000 LAK • 2 hours ago</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-900">New order #ORD-002 received</div>
                <div className="text-xs text-gray-500">59,000 LAK • 3 hours ago</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-900">Low stock alert: ປີ້ງແບ້</div>
                <div className="text-xs text-gray-500">0 units left • 5 hours ago</div>
              </div>
            </div>
            <div className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <div className="flex-1">
                <div className="text-sm text-gray-900">Order #ORD-003 cancelled</div>
                <div className="text-xs text-gray-500">18,000 LAK • 6 hours ago</div>
              </div>
            </div>
          </div>
        </div>

        {/* Export & Actions */}
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Reports</h3>
          
          {/* Export Message */}
          {exportMessage && (
            <div className={`mb-4 p-3 rounded-lg text-sm ${
              exportMessage.includes('success') || exportMessage.includes('copied') 
                ? 'bg-green-100 text-green-700' 
                : 'bg-red-100 text-red-700'
            }`}>
              {exportMessage}
            </div>
          )}
          
          <div className="space-y-3">
            <button 
              onClick={handleExportExcel}
              disabled={exportLoading || !overviewStats}
              className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {exportLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              <span>Export Excel</span>
            </button>
            
            <button 
              onClick={handleExportPDF}
              disabled={exportLoading || !overviewStats}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {exportLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              )}
              <span>Export PDF</span>
            </button>
            
            <button 
              onClick={handleShareReport}
              disabled={exportLoading || !overviewStats}
              className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 flex items-center justify-center space-x-2"
            >
              {exportLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l3-3m-3 3L9 8m-5 5h2.586a1 1 0 01.707.293l2.414 2.414a1 1 0 00.707.293H14" />
                </svg>
              )}
              <span>Share Report</span>
            </button>
            
            <hr className="my-4" />
            
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">Generate Custom Report</p>
              <p className="text-xs text-gray-500">
                Reports include data from the last {period} days
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Reports