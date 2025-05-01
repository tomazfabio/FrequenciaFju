// Attendance management functionality
document.addEventListener('DOMContentLoaded', function() {
  // Reference to attendance form
  const attendanceForm = document.getElementById('attendance-form');
  const namesList = document.getElementById('names-list');
  const addNameBtn = document.getElementById('add-name-btn');
  const clearNamesBtn = document.getElementById('clear-names-btn');
  const tribeSelect = document.getElementById('tribe-select');
  const eventSelect = document.getElementById('event-select');
  const submitBtn = document.getElementById('submit-attendance');
  const alertContainer = document.getElementById('alert-container');
  
  // Event listener for the "Add Name" button
  if (addNameBtn && namesList) {
    addNameBtn.addEventListener('click', function() {
      const nameInput = document.getElementById('name-input');
      const name = nameInput.value.trim();
      
      if (name) {
        // Add name to the list
        addNameToList(name);
        
        // Clear the input field
        nameInput.value = '';
        nameInput.focus();
      }
    });
  }
  
  // Handle clearing the names list
  if (clearNamesBtn && namesList) {
    clearNamesBtn.addEventListener('click', function() {
      // Clear the names list
      namesList.value = '';
    });
  }
  
  // Handle form submission
  if (attendanceForm) {
    attendanceForm.addEventListener('submit', function(e) {
      e.preventDefault();
      
      // Get form data
      const names = namesList.value.split('\n')
                    .map(name => name.trim())
                    .filter(name => name.length > 0);
      
      const eventType = eventSelect.value;
      const tribe = tribeSelect ? tribeSelect.value : null;
      
      // Validate form data
      if (names.length === 0) {
        showAlert('Erro', 'Por favor, adicione pelo menos um nome na lista.', 'danger');
        return;
      }
      
      if (!eventType) {
        showAlert('Erro', 'Por favor, selecione um tipo de evento.', 'danger');
        return;
      }
      
      if (tribeSelect && tribeSelect.hasAttribute('required') && !tribe) {
        showAlert('Erro', 'Por favor, selecione uma tribo.', 'danger');
        return;
      }
      
      // Disable submit button to prevent double submission
      submitBtn.disabled = true;
      submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Salvando...';
      
      // Prepare data for submission
      const attendanceData = {
        names: names,
        event_type: eventType,
        date: document.getElementById('attendance-date').value,
        tribe: tribe
      };
      
      // Send data to server
      fetch('/api/attendance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(attendanceData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          showAlert('Sucesso', `Registro salvo com sucesso! ${data.records} jovens registrados.`, 'success');
          
          // Clear form after successful submission
          namesList.value = '';
        } else {
          showAlert('Erro', data.error || 'Ocorreu um erro ao salvar os registros.', 'danger');
        }
      })
      .catch(error => {
        console.error('Error:', error);
        showAlert('Erro', 'Ocorreu um erro ao conectar com o servidor.', 'danger');
      })
      .finally(() => {
        // Re-enable submit button
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Salvar Presença';
      });
    });
  }
  
  // Function to add a name to the list
  function addNameToList(name) {
    // Get current list content
    let currentContent = namesList.value;
    
    // Add the new name with a newline
    if (currentContent && !currentContent.endsWith('\n')) {
      currentContent += '\n';
    }
    
    namesList.value = currentContent + name;
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
    alertContainer.innerHTML = '';
    alertContainer.appendChild(alertDiv);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      const alert = new bootstrap.Alert(alertDiv);
      alert.close();
    }, 5000);
  }
  
  // Handle paste events for the textarea
  if (namesList) {
    namesList.addEventListener('paste', function(e) {
      // The paste event is already handled by the textarea
      // This is just a hook if we need to do any processing
    });
    
    // Auto-resize textarea based on content
    namesList.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = (this.scrollHeight) + 'px';
    });
  }
});
