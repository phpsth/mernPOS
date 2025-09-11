import { statsAPI } from './api.js';

/**
 * Stats Service - Bridge between Reports component and API layer
 * Provides data transformation, error handling, and business logic for statistics
 */
class StatsService {

  /**
   * Get overview statistics with enhanced error handling
   */
  async getOverviewStats(period = '30') {
    try {
      const response = await statsAPI.getOverviewStats(period);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch overview stats');
      }

      // Transform and validate data
      const stats = response.data;
      return {
        success: true,
        data: {
          overview: {
            totalRevenue: Number(stats.overview?.totalRevenue || 0),
            totalOrders: Number(stats.overview?.totalOrders || 0),
            avgOrderValue: Number(stats.overview?.avgOrderValue || 0),
            lowStockProducts: Number(stats.overview?.lowStockProducts || 0),
            revenueGrowth: Number(stats.overview?.revenueGrowth || 0),
            orderGrowth: Number(stats.overview?.orderGrowth || 0)
          }
        }
      };
    } catch (error) {
      console.error('StatsService: Error fetching overview stats:', error);
      return {
        success: false,
        error: error.message,
        data: null
      };
    }
  }

  /**
   * Get sales statistics with data transformation
   */
  async getSalesStats(period = '30', groupBy = 'day') {
    try {
      const response = await statsAPI.getSalesStats(period, groupBy);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch sales stats');
      }

      // Transform sales data for charts
      const salesData = response.data.salesData || [];
      const transformedData = salesData.map(item => ({
        date: item.date,
        revenue: Number(item.revenue || 0),
        orders: Number(item.orders || 0),
        avgOrderValue: Number(item.avgOrderValue || 0)
      }));

      return {
        success: true,
        data: {
          salesData: transformedData,
          totalRevenue: transformedData.reduce((sum, item) => sum + item.revenue, 0),
          totalOrders: transformedData.reduce((sum, item) => sum + item.orders, 0)
        }
      };
    } catch (error) {
      console.error('StatsService: Error fetching sales stats:', error);
      return {
        success: false,
        error: error.message,
        data: { salesData: [] }
      };
    }
  }

  /**
   * Get product statistics with ranking
   */
  async getProductStats(period = '30') {
    try {
      const response = await statsAPI.getProductStats(period);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch product stats');
      }

      const stats = response.data;
      
      // Sort products by revenue and add ranking
      const productPerformance = (stats.productPerformance || [])
        .map(product => ({
          _id: product._id,
          name: product.name || 'Unknown Product',
          totalQuantitySold: Number(product.totalQuantitySold || 0),
          totalRevenue: Number(product.totalRevenue || 0),
          orderCount: Number(product.orderCount || 0),
          avgSellingPrice: Number(product.avgSellingPrice || 0)
        }))
        .sort((a, b) => b.totalRevenue - a.totalRevenue)
        .map((product, index) => ({
          ...product,
          rank: index + 1
        }));

      return {
        success: true,
        data: {
          productPerformance,
          totalProducts: productPerformance.length,
          topProduct: productPerformance[0] || null
        }
      };
    } catch (error) {
      console.error('StatsService: Error fetching product stats:', error);
      return {
        success: false,
        error: error.message,
        data: { productPerformance: [] }
      };
    }
  }

  /**
   * Get revenue statistics with trend analysis
   */
  async getRevenueStats(period = '30', forecast = false) {
    try {
      const response = await statsAPI.getRevenueStats(period, forecast);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch revenue stats');
      }

      const stats = response.data;
      const dailyRevenue = (stats.dailyRevenue || []).map(day => ({
        _id: day._id,
        revenue: Number(day.revenue || 0),
        orders: Number(day.orders || 0),
        date: day.date
      }));

      // Calculate trend
      const trend = this.calculateTrend(dailyRevenue);

      return {
        success: true,
        data: {
          dailyRevenue,
          totalRevenue: dailyRevenue.reduce((sum, day) => sum + day.revenue, 0),
          totalOrders: dailyRevenue.reduce((sum, day) => sum + day.orders, 0),
          trend,
          period: Number(period)
        }
      };
    } catch (error) {
      console.error('StatsService: Error fetching revenue stats:', error);
      return {
        success: false,
        error: error.message,
        data: { dailyRevenue: [] }
      };
    }
  }

  /**
   * Calculate trend from daily revenue data
   */
  calculateTrend(dailyRevenue) {
    if (dailyRevenue.length < 2) {
      return { direction: 'stable', percentage: 0 };
    }

    const sortedData = [...dailyRevenue].sort((a, b) => new Date(a.date) - new Date(b.date));
    const midPoint = Math.floor(sortedData.length / 2);
    
    const firstHalf = sortedData.slice(0, midPoint);
    const secondHalf = sortedData.slice(midPoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.revenue, 0) / firstHalf.length;
    const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.revenue, 0) / secondHalf.length;
    
    const percentage = firstHalfAvg > 0 ? 
      ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;
    
    let direction = 'stable';
    if (percentage > 5) direction = 'up';
    else if (percentage < -5) direction = 'down';
    
    return {
      direction,
      percentage: Math.abs(percentage).toFixed(1)
    };
  }

  /**
   * Get all stats data in one call for dashboard
   */
  async getAllStats(period = '30') {
    try {
      const [overview, sales, products, revenue] = await Promise.allSettled([
        this.getOverviewStats(period),
        this.getSalesStats(period, 'day'),
        this.getProductStats(period),
        this.getRevenueStats(period)
      ]);

      return {
        overview: overview.status === 'fulfilled' ? overview.value : null,
        sales: sales.status === 'fulfilled' ? sales.value : null,
        products: products.status === 'fulfilled' ? products.value : null,
        revenue: revenue.status === 'fulfilled' ? revenue.value : null,
        errors: [
          overview.status === 'rejected' ? overview.reason : null,
          sales.status === 'rejected' ? sales.reason : null,
          products.status === 'rejected' ? products.reason : null,
          revenue.status === 'rejected' ? revenue.reason : null
        ].filter(Boolean)
      };
    } catch (error) {
      console.error('StatsService: Error fetching all stats:', error);
      throw error;
    }
  }

  /**
   * Refresh specific stats (fetches fresh data)
   */
  async refreshStats(type, period = '30') {
    const methods = {
      overview: () => this.getOverviewStats(period),
      sales: () => this.getSalesStats(period, 'day'),
      products: () => this.getProductStats(period),
      revenue: () => this.getRevenueStats(period)
    };

    if (type === 'all') {
      return this.getAllStats(period);
    }

    if (methods[type]) {
      return methods[type]();
    }

    throw new Error(`Unknown stats type: ${type}`);
  }
}

// Create singleton instance
const statsService = new StatsService();

export default statsService;