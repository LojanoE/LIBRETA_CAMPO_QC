// Implementación definitiva de pestañas
document.addEventListener('DOMContentLoaded', function() {
    // Verificar que los elementos existan
    const buttons = document.querySelectorAll('.nav-btn');
    const contents = document.querySelectorAll('.tab-content');
    
    if (buttons.length === 0 || contents.length === 0) {
        console.error('No se encontraron elementos de pestañas');
        return;
    }
    
    // Asegurar que solo una pestaña esté activa inicialmente
    const activeButtons = document.querySelectorAll('.nav-btn.active');
    const activeContents = document.querySelectorAll('.tab-content.active');
    
    // Si hay múltiples activos o ninguno, se corrige
    if (activeButtons.length !== 1 || activeContents.length !== 1) {
        // Remover todas las clases activas
        activeButtons.forEach(btn => btn.classList.remove('active'));
        activeContents.forEach(content => {
            content.classList.remove('active');
            content.style.display = 'none';
        });
        
        // Activar el primer elemento
        if (buttons.length > 0 && contents.length > 0) {
            buttons[0].classList.add('active');
            contents[0].classList.add('active');
            contents[0].style.display = 'block';
        }
    }
    
    // Asignar eventos a los botones
    buttons.forEach(button => {
        // Eliminar eventos previos por si acaso
        button.replaceWith(button.cloneNode(true));
        const newButton = button.parentElement.querySelector(`[data-tab="${button.getAttribute('data-tab')}"]`);
        
        newButton.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetTabId = this.getAttribute('data-tab');
            if (!targetTabId) return;
            
            // Buscar el contenido correspondiente
            const targetContent = document.getElementById(targetTabId);
            if (!targetContent) return;
            
            // Remover estado activo de todos
            document.querySelectorAll('.nav-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            
            document.querySelectorAll('.tab-content').forEach(content => {
                content.classList.remove('active');
                content.style.display = 'none';
            });
            
            // Activar el botón y contenido seleccionado
            this.classList.add('active');
            targetContent.classList.add('active');
            targetContent.style.display = 'block';
            
            // Cargar contenido específico si es necesario
            if (targetTabId === 'observaciones' && typeof loadObservations === 'function') {
                loadObservations();
            } else if (targetTabId === 'mapa' && typeof loadMap === 'function') {
                loadMap();
            }
        });
    });
});