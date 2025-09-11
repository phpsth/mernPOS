// Export utility functions for reports

// Utility function to convert data to CSV format
const convertToCSV = (data, headers) => {
  const csvHeader = headers.join(',') + '\n';
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      // Handle values that might contain commas, quotes, or newlines
      if (typeof value === 'string' && (value.includes(',') || value.includes('"') || value.includes('\n'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value || '';
    }).join(',');
  }).join('\n');
  
  return csvHeader + csvRows;
};

// Function to trigger file download
const downloadFile = (content, filename, contentType) => {
  const blob = new Blob([content], { type: contentType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

// Export to Excel (CSV format)
export const exportToExcel = (reportData, filename = 'analytics_report') => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.csv`;
    
    let csvContent = '';
    
    // Overview Stats Section
    if (reportData.overviewStats) {
      csvContent += 'OVERVIEW STATISTICS\n';
      csvContent += 'Metric,Value\n';
      csvContent += `Total Revenue,$${reportData.overviewStats.overview.totalRevenue}\n`;
      csvContent += `Total Orders,${reportData.overviewStats.overview.totalOrders}\n`;
      csvContent += `Average Order Value,$${reportData.overviewStats.overview.avgOrderValue}\n`;
      csvContent += `Total Products,${reportData.overviewStats.overview.totalProducts}\n`;
      csvContent += `Total Customers,${reportData.overviewStats.overview.totalCustomers}\n`;
      csvContent += `Low Stock Products,${reportData.overviewStats.overview.lowStockProducts}\n`;
      csvContent += `Revenue Growth,${reportData.overviewStats.overview.revenueGrowth}%\n`;
      csvContent += `Order Growth,${reportData.overviewStats.overview.orderGrowth}%\n`;
      csvContent += '\n';
    }
    
    // Top Products Section
    if (reportData.topProducts && reportData.topProducts.length > 0) {
      csvContent += 'TOP SELLING PRODUCTS\n';
      csvContent += 'Rank,Product Name,Quantity Sold,Revenue,Orders\n';
      reportData.topProducts.forEach((product, index) => {
        csvContent += `${index + 1},${product.name},${product.totalQuantitySold},$${product.totalRevenue},${product.orderCount}\n`;
      });
      csvContent += '\n';
    }
    
    // Daily Revenue Section
    if (reportData.revenueStats && reportData.revenueStats.dailyRevenue) {
      csvContent += 'DAILY REVENUE BREAKDOWN\n';
      csvContent += 'Date,Revenue,Orders\n';
      reportData.revenueStats.dailyRevenue.forEach(day => {
        const date = `${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}`;
        csvContent += `${date},$${day.revenue},${day.orders}\n`;
      });
      csvContent += '\n';
    }
    
    // Summary
    csvContent += 'REPORT SUMMARY\n';
    csvContent += `Generated on,${new Date().toLocaleString()}\n`;
    csvContent += `Report Period,Last ${reportData.period} days\n`;
    
    downloadFile(csvContent, finalFilename, 'text/csv');
    return { success: true, message: 'Excel report exported successfully' };
  } catch (error) {
    console.error('Export to Excel failed:', error);
    return { success: false, message: 'Failed to export Excel report' };
  }
};

// Export to PDF (HTML-based approach)
export const exportToPDF = (reportData, filename = 'analytics_report') => {
  try {
    const timestamp = new Date().toISOString().split('T')[0];
    const finalFilename = `${filename}_${timestamp}.pdf`;
    
    // Create HTML content for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Analytics Report</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            margin: 20px; 
            color: #333; 
          }
          .header { 
            text-align: center; 
            margin-bottom: 30px; 
            border-bottom: 2px solid #007bff; 
            padding-bottom: 10px; 
          }
          .section { 
            margin-bottom: 25px; 
          }
          .section h2 { 
            color: #007bff; 
            border-bottom: 1px solid #eee; 
            padding-bottom: 5px; 
          }
          table { 
            width: 100%; 
            border-collapse: collapse; 
            margin-bottom: 15px; 
          }
          th, td { 
            border: 1px solid #ddd; 
            padding: 8px; 
            text-align: left; 
          }
          th { 
            background-color: #f8f9fa; 
            font-weight: bold; 
          }
          .metric-grid { 
            display: grid; 
            grid-template-columns: 1fr 1fr; 
            gap: 10px; 
            margin-bottom: 20px; 
          }
          .metric-card { 
            border: 1px solid #ddd; 
            padding: 10px; 
            border-radius: 5px; 
          }
          .metric-value { 
            font-size: 18px; 
            font-weight: bold; 
            color: #007bff; 
          }
          .footer { 
            margin-top: 30px; 
            text-align: center; 
            font-size: 12px; 
            color: #666; 
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Analytics Report</h1>
          <p>Generated on ${new Date().toLocaleString()}</p>
          <p>Report Period: Last ${reportData.period || 30} days</p>
        </div>

        ${reportData.overviewStats ? `
        <div class="section">
          <h2>Overview Statistics</h2>
          <div class="metric-grid">
            <div class="metric-card">
              <div>Total Revenue</div>
              <div class="metric-value">$${reportData.overviewStats.overview.totalRevenue}</div>
            </div>
            <div class="metric-card">
              <div>Total Orders</div>
              <div class="metric-value">${reportData.overviewStats.overview.totalOrders}</div>
            </div>
            <div class="metric-card">
              <div>Average Order Value</div>
              <div class="metric-value">$${reportData.overviewStats.overview.avgOrderValue}</div>
            </div>
            <div class="metric-card">
              <div>Low Stock Products</div>
              <div class="metric-value">${reportData.overviewStats.overview.lowStockProducts}</div>
            </div>
          </div>
        </div>
        ` : ''}

        ${reportData.topProducts && reportData.topProducts.length > 0 ? `
        <div class="section">
          <h2>Top Selling Products</h2>
          <table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Product Name</th>
                <th>Quantity Sold</th>
                <th>Revenue</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.topProducts.slice(0, 10).map((product, index) => `
                <tr>
                  <td>${index + 1}</td>
                  <td>${product.name}</td>
                  <td>${product.totalQuantitySold}</td>
                  <td>$${product.totalRevenue}</td>
                  <td>${product.orderCount}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        ${reportData.revenueStats && reportData.revenueStats.dailyRevenue ? `
        <div class="section">
          <h2>Daily Revenue Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Revenue</th>
                <th>Orders</th>
              </tr>
            </thead>
            <tbody>
              ${reportData.revenueStats.dailyRevenue.slice(-7).map(day => `
                <tr>
                  <td>${day._id.year}-${String(day._id.month).padStart(2, '0')}-${String(day._id.day).padStart(2, '0')}</td>
                  <td>$${day.revenue}</td>
                  <td>${day.orders}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>
        ` : ''}

        <div class="footer">
          <p>This report was generated automatically by the POS Analytics System</p>
        </div>
      </body>
      </html>
    `;
    
    // Create a new window for PDF generation
    const printWindow = window.open('', '_blank');
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    // Wait for content to load, then print
    printWindow.onload = () => {
      printWindow.print();
      // Close the window after printing (optional)
      setTimeout(() => {
        printWindow.close();
      }, 1000);
    };
    
    return { success: true, message: 'PDF report generated successfully' };
  } catch (error) {
    console.error('Export to PDF failed:', error);
    return { success: false, message: 'Failed to generate PDF report' };
  }
};

// Share Report function
export const shareReport = async (reportData, shareMethod = 'url') => {
  try {
    const reportSummary = {
      totalRevenue: reportData.overviewStats?.overview?.totalRevenue || 0,
      totalOrders: reportData.overviewStats?.overview?.totalOrders || 0,
      period: reportData.period || 30,
      topProduct: reportData.topProducts?.[0]?.name || 'N/A',
      generatedAt: new Date().toISOString()
    };
    
    if (shareMethod === 'url' && navigator.share) {
      // Use Web Share API if available
      await navigator.share({
        title: 'Analytics Report',
        text: `Analytics Report Summary:\n• Revenue: $${reportSummary.totalRevenue}\n• Orders: ${reportSummary.totalOrders}\n• Period: Last ${reportSummary.period} days\n• Top Product: ${reportSummary.topProduct}`,
        url: window.location.href
      });
      return { success: true, message: 'Report shared successfully' };
    } else if (shareMethod === 'clipboard' || !navigator.share) {
      // Fallback to clipboard
      const shareText = `📊 Analytics Report Summary
      
💰 Total Revenue: $${reportSummary.totalRevenue}
📦 Total Orders: ${reportSummary.totalOrders}
📅 Period: Last ${reportSummary.period} days
🏆 Top Product: ${reportSummary.topProduct}
⏰ Generated: ${new Date().toLocaleString()}

View full report at: ${window.location.href}`;
      
      await navigator.clipboard.writeText(shareText);
      return { success: true, message: 'Report summary copied to clipboard' };
    } else if (shareMethod === 'email') {
      // Generate email link
      const subject = encodeURIComponent('Analytics Report Summary');
      const body = encodeURIComponent(`Hi there,

Here's a summary of our latest analytics report:

• Total Revenue: $${reportSummary.totalRevenue}
• Total Orders: ${reportSummary.totalOrders}
• Report Period: Last ${reportSummary.period} days
• Top Selling Product: ${reportSummary.topProduct}

Generated on: ${new Date().toLocaleString()}

You can view the full interactive report at: ${window.location.href}

Best regards`);
      
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      return { success: true, message: 'Email client opened with report summary' };
    }
  } catch (error) {
    console.error('Share failed:', error);
    return { success: false, message: 'Failed to share report' };
  }
};