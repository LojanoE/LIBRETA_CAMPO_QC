// Solución radical: Implementación de pestañas completamente aislada
(function() {
    'use strict';
    
    // Variables privadas para manejar el estado de las pestañas
    let currentTab = 'registro'; // Valor inicial por defecto
    
    function showTab(tabId) {
        // Ocultar todas las secciones
        const allContents = document.querySelectorAll('.tab-content');
        allContents.forEach(content => {
            content.style.display = 'none';
        });
        
        // Mostrar la sección seleccionada
        const selectedContent = document.getElementById(tabId);
        if (selectedContent) {
            selectedContent.style.display = 'block';
        }
        
        // Actualizar estado visual de botones
        const allButtons = document.querySelectorAll('.nav-btn');
        allButtons.forEach(button => {
            if (button.getAttribute('data-tab') === tabId) {
                button.classList.add('active');
                button.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
                button.style.color = '#0b1220';
            } else {
                button.classList.remove('active');
                button.style.background = '';
                button.style.color = '';
            }
        });
        
        // Actualizar estado interno
        currentTab = tabId;
        
        // Cargar contenido específico si es necesario
        if (tabId === 'observaciones') {
            if (typeof loadObservations === 'function') {
                setTimeout(loadObservations, 10); // Pequeño delay para asegurar renderizado
            }
        } else if (tabId === 'mapa') {
            if (typeof loadMap === 'function') {
                setTimeout(loadMap, 10);
            }
        }
    }
    
    // Inicializar cuando se cargue el DOM
    function initializeTabs() {
        // Aplicar estilos iniciales
        showTab(currentTab);
        
        // Asociar eventos click a los botones
        const buttons = document.querySelectorAll('.nav-btn');
        buttons.forEach(button => {
            // Remover cualquier evento anterior
            button.onclick = null;
            
            // Asociar nuevo evento
            button.addEventListener('click', function() {
                const tabId = this.getAttribute('data-tab');
                if (tabId) {
                    showTab(tabId);
                }
            });
        });
    }
    
    // Ejecutar cuando el DOM esté completamente cargado
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeTabs);
    } else {
        initializeTabs();
    }
    
})();