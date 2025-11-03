// Funcionalidad de pestañas completamente nueva y funcional
document.addEventListener('DOMContentLoaded', function() {
    console.log('Inicializando pestañas...');
    
    // Validar que existan los elementos necesarios
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    console.log('Botones encontrados:', navButtons.length);
    console.log('Contenidos encontrados:', tabContents.length);
    
    if (navButtons.length === 0 || tabContents.length === 0) {
        console.error('No se encontraron elementos necesarios para las pestañas');
        return;
    }
    
    // Asegurar que siempre haya una pestaña activa por defecto
    let activeTabButton = document.querySelector('.nav-btn.active');
    let activeTabContent = document.querySelector('.tab-content.active');
    
    // Si no hay pestaña activa, activar la primera
    if (!activeTabButton && navButtons.length > 0) {
        navButtons[0].classList.add('active');
        activeTabButton = navButtons[0];
    }
    
    if (!activeTabContent && tabContents.length > 0) {
        tabContents[0].classList.add('active');
        activeTabContent = tabContents[0];
    }
    
    // Asegurar que las pestañas inactivas estén ocultas
    tabContents.forEach(content => {
        if (content !== activeTabContent) {
            content.style.display = 'none';
        }
    });
    
    // Agregar evento click a cada botón de navegación
    navButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('Botón clickeado:', this.getAttribute('data-tab'));
            
            // Obtener el ID de la pestaña objetivo
            const targetTabId = this.getAttribute('data-tab');
            if (!targetTabId) {
                console.error('Botón sin data-tab:', this);
                return;
            }
            
            // Validar que exista la pestaña objetivo
            const targetTab = document.getElementById(targetTabId);
            if (!targetTab) {
                console.error('No se encontró la pestaña con ID:', targetTabId);
                return;
            }
            
            // Remover la clase 'active' de todos los botones
            navButtons.forEach(btn => btn.classList.remove('active'));
            
            // Agregar la clase 'active' al botón clickeado
            this.classList.add('active');
            
            // Ocultar todas las pestañas
            tabContents.forEach(content => {
                content.style.display = 'none';
                content.classList.remove('active');
            });
            
            // Mostrar la pestaña objetivo
            targetTab.style.display = 'block';
            targetTab.classList.add('active');
            
            // Cargar contenido específico si es necesario
            if (targetTabId === 'observaciones') {
                if (typeof loadObservations === 'function') {
                    loadObservations();
                }
            } else if (targetTabId === 'mapa') {
                if (typeof loadMap === 'function') {
                    loadMap();
                }
            }
            
            return false;
        });
    });
    
    console.log('Pestañas inicializadas correctamente');
});