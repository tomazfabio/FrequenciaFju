// Chart initialization and data visualization
document.addEventListener('DOMContentLoaded', function() {
  // Initialize charts on dashboard
  const attendanceChartContainer = document.getElementById('attendance-chart');
  
  if (attendanceChartContainer) {
    // Show loading indicator
    attendanceChartContainer.innerHTML = '<div class="text-center mt-4"><div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div><p class="mt-2">Carregando gráfico...</p></div>';
    
    // Fetch data from API
    fetch('/api/attendance/stats')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Create chart container
          attendanceChartContainer.innerHTML = '<canvas id="attendanceChart"></canvas>';
          
          // Initialize chart with data
          createAttendanceChart(data);
        } else {
          attendanceChartContainer.innerHTML = `<div class="alert alert-danger">Erro ao carregar dados: ${data.error}</div>`;
        }
      })
      .catch(error => {
        console.error('Error:', error);
        attendanceChartContainer.innerHTML = '<div class="alert alert-danger">Erro ao conectar com o servidor.</div>';
      });
  }
  
  // Function to create attendance chart
  function createAttendanceChart(data) {
    const ctx = document.getElementById('attendanceChart').getContext('2d');
    
    // Create youth attendance chart
    if (data.by_youth && Object.keys(data.by_youth).length > 0) {
      new Chart(ctx, {
        type: 'bar',
        data: {
          labels: Object.keys(data.by_youth),
          datasets: [{
            label: 'Frequência',
            data: Object.values(data.by_youth),
            backgroundColor: 'rgba(54, 162, 235, 0.6)',
            borderColor: 'rgba(54, 162, 235, 1)',
            borderWidth: 1
          }]
        },
        options: {
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                precision: 0
              }
            }
          },
          plugins: {
            title: {
              display: true,
              text: 'Frequência por Jovem',
              font: {
                size: 16
              }
            }
          },
          responsive: true,
          maintainAspectRatio: false
        }
      });
    } else {
      // No data available
      document.getElementById('attendanceChart').parentNode.innerHTML = 
        '<div class="alert alert-warning">Nenhum dado de frequência disponível.</div>';
    }
  }
});
