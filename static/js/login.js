// Login page functionality
document.addEventListener('DOMContentLoaded', function() {
    // Get references to form elements
    const roleSelect = document.getElementById('role');
    const tribeContainer = document.getElementById('tribe-container');
    const tribeSelect = document.getElementById('tribe');
    
    // Show/hide tribe selector based on role selection
    if (roleSelect && tribeContainer) {
        roleSelect.addEventListener('change', function() {
            const selectedRole = roleSelect.value;
            
            // Show tribe selector for tribe-specific roles
            if (selectedRole === 'Coordenador da Tribo' || selectedRole === 'Assistente da Tribo') {
                tribeContainer.classList.remove('d-none');
                tribeSelect.setAttribute('required', 'required');
            } else {
                tribeContainer.classList.add('d-none');
                tribeSelect.removeAttribute('required');
            }
        });
    }
});
