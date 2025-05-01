// Reports and statistics management
document.addEventListener('DOMContentLoaded', function() {
  // Elements for report generation
  const generateReportBtn = document.getElementById('generate-report-btn');
  const downloadReportBtn = document.getElementById('download-report-btn');
  const monthSelect = document.getElementById('month-select');
  const yearSelect = document.getElementById('year-select');
  const reportResultsContainer = document.getElementById('report-results');
  
  // Attendance data storage
  let reportData = [];
  
  // Initialize date selectors with current month and year
  if (monthSelect && yearSelect) {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // JS months are 0-indexed
    const currentYear = currentDate.getFullYear();
    
    // Set default month
    monthSelect.value = currentMonth;
    
    // Generate year options (current year and 3 years back)
    for (let i = 0; i < 4; i++) {
      const year = currentYear - i;
      const option = document.createElement('option');
      option.value = year;
      option.textContent = year;
      yearSelect.appendChild(option);
    }
  }
  
  // Handle report generation
  if (generateReportBtn) {
    generateReportBtn.addEventListener('click', function() {
      const month = monthSelect.value;
      const year = yearSelect.value;
      
      if (!month || !year) {
        showAlert('Erro', 'Por favor, selecione o mês e o ano para o relatório.', 'danger');
        return;
      }
      
      // Show loading indicator
      generateReportBtn.disabled = true;
      generateReportBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Gerando...';
      reportResultsContainer.innerHTML = '<div class="text-center mt-4"><div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div><p class="mt-2">Carregando dados...</p></div>';
      
      // Fetch report data from API
      fetch(`/api/attendance/monthly-report?month=${month}&year=${year}`)
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Store report data for download
            reportData = data.data;
            
            // Display report results
            displayReportResults(reportData, month, year);
            
            // Enable download button
            downloadReportBtn.classList.remove('d-none');
          } else {
            reportResultsContainer.innerHTML = `<div class="alert alert-danger mt-3">Erro ao gerar relatório: ${data.error}</div>`;
            downloadReportBtn.classList.add('d-none');
          }
        })
        .catch(error => {
          console.error('Error:', error);
          reportResultsContainer.innerHTML = '<div class="alert alert-danger mt-3">Erro ao conectar com o servidor.</div>';
          downloadReportBtn.classList.add('d-none');
        })
        .finally(() => {
          // Reset button state
          generateReportBtn.disabled = false;
          generateReportBtn.innerHTML = 'Gerar Relatório';
        });
    });
  }
  
  // Handle report download
  if (downloadReportBtn) {
    downloadReportBtn.addEventListener('click', function() {
      if (reportData.length === 0) {
        showAlert('Erro', 'Não há dados para baixar. Por favor, gere o relatório primeiro.', 'danger');
        return;
      }
      
      // Generate text report
      const month = monthSelect.value;
      const year = yearSelect.value;
      const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
      ];
      
      let reportText = `RELATÓRIO DE FREQUÊNCIA FJU - ${monthNames[month-1]} ${year}\n`;
      reportText += '=' .repeat(50) + '\n\n';
      
      // Group by event
      const eventGroups = {};
      reportData.forEach(record => {
        if (!eventGroups[record.event]) {
          eventGroups[record.event] = [];
        }
        eventGroups[record.event].push(record);
      });
      
      // Add event sections
      for (const [event, records] of Object.entries(eventGroups)) {
        reportText += `EVENTO: ${event}\n`;
        reportText += '-'.repeat(50) + '\n';
        
        // Group by date
        const dateGroups = {};
        records.forEach(record => {
          if (!dateGroups[record.date]) {
            dateGroups[record.date] = [];
          }
          dateGroups[record.date].push(record);
        });
        
        // Add date sections
        for (const [date, dateRecords] of Object.entries(dateGroups)) {
          // Format date
          const [year, month, day] = date.split('-');
          const formattedDate = `${day}/${month}/${year}`;
          
          reportText += `Data: ${formattedDate}\n`;
          
          // Group by tribe
          const tribeGroups = {};
          dateRecords.forEach(record => {
            if (!tribeGroups[record.tribe]) {
              tribeGroups[record.tribe] = [];
            }
            tribeGroups[record.tribe].push(record);
          });
          
          // Add tribe sections
          for (const [tribe, tribeRecords] of Object.entries(tribeGroups)) {
            reportText += `Tribo: ${tribe}\n`;
            
            // List names
            tribeRecords.forEach((record, index) => {
              reportText += `${index+1}. ${record.name}\n`;
            });
            
            reportText += `Total na tribo ${tribe}: ${tribeRecords.length}\n\n`;
          }
          
          reportText += `Total na data ${formattedDate}: ${dateRecords.length}\n\n`;
        }
        
        reportText += `Total no evento ${event}: ${records.length}\n\n`;
      }
      
      reportText += `TOTAL GERAL: ${reportData.length} presenças\n`;
      reportText += '=' .repeat(50) + '\n';
      reportText += `Relatório gerado em: ${new Date().toLocaleString('pt-BR')}\n`;
      
      // Create download link
      const blob = new Blob([reportText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `relatorio-fju-${monthNames[month-1].toLowerCase()}-${year}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }
  
  // Function to display report results
  function displayReportResults(data, month, year) {
    if (data.length === 0) {
      reportResultsContainer.innerHTML = '<div class="alert alert-warning mt-3">Nenhum registro encontrado para o período selecionado.</div>';
      return;
    }
    
    // Group by event
    const eventGroups = {};
    data.forEach(record => {
      if (!eventGroups[record.event]) {
        eventGroups[record.event] = [];
      }
      eventGroups[record.event].push(record);
    });
    
    // Convert month to month name
    const monthNames = [
      'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
      'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    const monthName = monthNames[month-1];
    
    // Create report HTML
    let htmlContent = `
      <div class="mt-4">
        <h3>Relatório de Frequência - ${monthName} ${year}</h3>
        <p class="mb-3">Total de registros: <strong>${data.length}</strong></p>
        
        <div class="accordion" id="reportAccordion">
    `;
    
    // Add event sections
    let eventIndex = 0;
    for (const [event, records] of Object.entries(eventGroups)) {
      const eventId = `event-${eventIndex}`;
      eventIndex++;
      
      htmlContent += `
        <div class="accordion-item">
          <h2 class="accordion-header">
            <button class="accordion-button ${eventIndex > 1 ? 'collapsed' : ''}" type="button" data-bs-toggle="collapse" data-bs-target="#${eventId}" aria-expanded="${eventIndex === 1}" aria-controls="${eventId}">
              ${event} <span class="badge bg-primary ms-2">${records.length}</span>
            </button>
          </h2>
          <div id="${eventId}" class="accordion-collapse collapse ${eventIndex === 1 ? 'show' : ''}" data-bs-parent="#reportAccordion">
            <div class="accordion-body">
      `;
      
      // Group by date
      const dateGroups = {};
      records.forEach(record => {
        if (!dateGroups[record.date]) {
          dateGroups[record.date] = [];
        }
        dateGroups[record.date].push(record);
      });
      
      // Create dates accordion
      htmlContent += `<div class="accordion" id="dateAccordion-${eventId}">`;
      
      let dateIndex = 0;
      for (const [date, dateRecords] of Object.entries(dateGroups)) {
        const dateId = `date-${eventId}-${dateIndex}`;
        dateIndex++;
        
        // Format date
        const [year, month, day] = date.split('-');
        const formattedDate = `${day}/${month}/${year}`;
        
        htmlContent += `
          <div class="accordion-item">
            <h2 class="accordion-header">
              <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${dateId}" aria-expanded="false" aria-controls="${dateId}">
                ${formattedDate} <span class="badge bg-secondary ms-2">${dateRecords.length}</span>
              </button>
            </h2>
            <div id="${dateId}" class="accordion-collapse collapse" data-bs-parent="#dateAccordion-${eventId}">
              <div class="accordion-body">
        `;
        
        // Group by tribe
        const tribeGroups = {};
        dateRecords.forEach(record => {
          if (!tribeGroups[record.tribe]) {
            tribeGroups[record.tribe] = [];
          }
          tribeGroups[record.tribe].push(record);
        });
        
        // Add tribe sections
        for (const [tribe, tribeRecords] of Object.entries(tribeGroups)) {
          htmlContent += `
            <div class="card mb-3">
              <div class="card-header">
                <strong>Tribo: ${tribe}</strong> <span class="badge bg-info ms-2">${tribeRecords.length}</span>
              </div>
              <div class="card-body">
                <ul class="list-group">
          `;
          
          // List names
          tribeRecords.forEach(record => {
            htmlContent += `<li class="list-group-item">${record.name}</li>`;
          });
          
          htmlContent += `
                </ul>
              </div>
            </div>
          `;
        }
        
        htmlContent += `
              </div>
            </div>
          </div>
        `;
      }
      
      htmlContent += `
            </div>
          </div>
        </div>
      `;
    }
    
    htmlContent += `
        </div>
      </div>
    `;
    
    // Insert HTML into container
    reportResultsContainer.innerHTML = htmlContent;
  }
  
  // Function to display alerts
  function showAlert(title, message, type) {
    // Create alert element
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    
    // Add alert content
    alertDiv.innerHTML = `
      <strong>${title}</strong> ${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    // Add to the container
    const alertContainer = document.getElementById('alert-container');
    if (alertContainer) {
      alertContainer.innerHTML = '';
      alertContainer.appendChild(alertDiv);
      
      // Auto-dismiss after 5 seconds
      setTimeout(() => {
        const alert = new bootstrap.Alert(alertDiv);
        alert.close();
      }, 5000);
    }
  }
  
  // Load attendance statistics
  loadAttendanceStats();
  
  function loadAttendanceStats() {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;
    
    // Show loading indicator
    statsContainer.innerHTML = '<div class="text-center mt-4"><div class="spinner-border" role="status"><span class="visually-hidden">Carregando...</span></div><p class="mt-2">Carregando estatísticas...</p></div>';
    
    // Fetch data from API
    fetch('/api/attendance/stats')
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Create charts with the data
          renderCharts(data);
        } else {
          statsContainer.innerHTML = `<div class="alert alert-danger mt-3">Erro ao carregar estatísticas: ${data.error}</div>`;
        }
      })
      .catch(error => {
        console.error('Error:', error);
        statsContainer.innerHTML = '<div class="alert alert-danger mt-3">Erro ao conectar com o servidor.</div>';
      });
  }
  
  // Function to render charts
  function renderCharts(data) {
    const statsContainer = document.getElementById('stats-container');
    if (!statsContainer) return;
    
    // Clear container
    statsContainer.innerHTML = '';
    
    // Create event chart
    const eventChartContainer = document.createElement('div');
    eventChartContainer.className = 'mb-5';
    eventChartContainer.innerHTML = `
      <h4>Frequência por Evento</h4>
      <div class="chart-container" style="position: relative; height:300px;">
        <canvas id="eventChart"></canvas>
      </div>
    `;
    statsContainer.appendChild(eventChartContainer);
    
    // Create youth chart
    const youthChartContainer = document.createElement('div');
    youthChartContainer.className = 'mb-5';
    youthChartContainer.innerHTML = `
      <h4>Top 20 Jovens por Frequência</h4>
      <div class="chart-container" style="position: relative; height:400px;">
        <canvas id="youthChart"></canvas>
      </div>
    `;
    statsContainer.appendChild(youthChartContainer);
    
    // Create tribe chart
    const tribeChartContainer = document.createElement('div');
    tribeChartContainer.className = 'mb-5';
    tribeChartContainer.innerHTML = `
      <h4>Frequência por Tribo</h4>
      <div class="chart-container" style="position: relative; height:300px;">
        <canvas id="tribeChart"></canvas>
      </div>
    `;
    statsContainer.appendChild(tribeChartContainer);
    
    // Initialize charts using Chart.js
    initEventChart(data.by_event);
    initYouthChart(data.by_youth);
    initTribeChart(data.by_tribe);
  }
  
  // Initialize event chart
  function initEventChart(data) {
    const ctx = document.getElementById('eventChart').getContext('2d');
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Presenças',
          data: Object.values(data),
          backgroundColor: [
            'rgba(75, 192, 192, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(255, 99, 132, 0.6)',
            'rgba(255, 205, 86, 0.6)'
          ],
          borderColor: [
            'rgba(75, 192, 192, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(255, 99, 132, 1)',
            'rgba(255, 205, 86, 1)'
          ],
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
          legend: {
            display: false
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  // Initialize youth chart
  function initYouthChart(data) {
    const ctx = document.getElementById('youthChart').getContext('2d');
    
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Presenças',
          data: Object.values(data),
          backgroundColor: 'rgba(54, 162, 235, 0.6)',
          borderColor: 'rgba(54, 162, 235, 1)',
          borderWidth: 1
        }]
      },
      options: {
        indexAxis: 'y',
        scales: {
          x: {
            beginAtZero: true,
            ticks: {
              precision: 0
            }
          }
        },
        plugins: {
          legend: {
            display: false
          }
        },
        responsive: true,
        maintainAspectRatio: false
      }
    });
  }
  
  // Initialize tribe chart
  function initTribeChart(data) {
    const ctx = document.getElementById('tribeChart').getContext('2d');
    
    new Chart(ctx, {
      type: 'pie',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Presenças',
          data: Object.values(data),
          backgroundColor: [
            'rgba(255, 99, 132, 0.6)',
            'rgba(54, 162, 235, 0.6)',
            'rgba(255, 206, 86, 0.6)',
            'rgba(75, 192, 192, 0.6)',
            'rgba(153, 102, 255, 0.6)',
            'rgba(255, 159, 64, 0.6)',
            'rgba(199, 199, 199, 0.6)',
            'rgba(83, 102, 255, 0.6)',
            'rgba(40, 159, 64, 0.6)',
            'rgba(210, 99, 132, 0.6)',
            'rgba(150, 162, 235, 0.6)',
            'rgba(240, 206, 86, 0.6)'
          ],
          borderColor: [
            'rgba(255, 99, 132, 1)',
            'rgba(54, 162, 235, 1)',
            'rgba(255, 206, 86, 1)',
            'rgba(75, 192, 192, 1)',
            'rgba(153, 102, 255, 1)',
            'rgba(255, 159, 64, 1)',
            'rgba(199, 199, 199, 1)',
            'rgba(83, 102, 255, 1)',
            'rgba(40, 159, 64, 1)',
            'rgba(210, 99, 132, 1)',
            'rgba(150, 162, 235, 1)',
            'rgba(240, 206, 86, 1)'
          ],
          borderWidth: 1
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'right',
            labels: {
              boxWidth: 15
            }
          }
        }
      }
    });
  }
});
