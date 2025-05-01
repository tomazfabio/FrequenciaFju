// Authentication and session management
document.addEventListener('DOMContentLoaded', function() {
  // Handle login form submission
  const loginForm = document.getElementById('login-form');
  
  if (loginForm) {
    loginForm.addEventListener('submit', function(e) {
      // Form validation
      const roleSelect = document.getElementById('role');
      const tribeSelect = document.getElementById('tribe');
      const tribeContainer = document.getElementById('tribe-container');
      
      const selectedRole = roleSelect.value;
      const isTribeRole = ['Coordenador da Tribo', 'Assistente da Tribo'].includes(selectedRole);
      
      if (isTribeRole && (!tribeSelect.value || tribeSelect.value === '')) {
        e.preventDefault();
        
        // Show validation error
        tribeContainer.classList.add('border', 'border-danger', 'p-2', 'rounded');
        
        const errorMsg = document.createElement('div');
        errorMsg.className = 'text-danger mt-2';
        errorMsg.innerText = 'Por favor, selecione uma tribo';
        
        if (!document.querySelector('#tribe-container .text-danger')) {
          tribeContainer.appendChild(errorMsg);
        }
        
        return false;
      }
    });
    
    // Show/hide tribe dropdown based on role selection
    const roleSelect = document.getElementById('role');
    const tribeContainer = document.getElementById('tribe-container');
    
    if (roleSelect && tribeContainer) {
      roleSelect.addEventListener('change', function() {
        const selectedRole = this.value;
        const isTribeRole = ['Coordenador da Tribo', 'Assistente da Tribo'].includes(selectedRole);
        
        if (isTribeRole) {
          tribeContainer.classList.remove('d-none');
          document.getElementById('tribe').setAttribute('required', 'required');
        } else {
          tribeContainer.classList.add('d-none');
          document.getElementById('tribe').removeAttribute('required');
        }
        
        // Remove any previous validation errors
        tribeContainer.classList.remove('border', 'border-danger', 'p-2', 'rounded');
        const errorMsg = tribeContainer.querySelector('.text-danger');
        if (errorMsg) {
          errorMsg.remove();
        }
      });
      
      // Trigger change event to set initial state
      roleSelect.dispatchEvent(new Event('change'));
    }
  }
  
  // Handle logout
  const logoutBtn = document.getElementById('logout-btn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', function(e) {
      // Redirect to logout route
      window.location.href = '/logout';
    });
  }
});
