// Funcionalidad de pestañas depurada paso a paso
(function() {
    'use strict';
    
    function debugTabs() {
        console.log('=== DIAGNÓSTICO DE PESTAÑAS ===');
        
        // Paso 1: Verificar que existan los elementos
        const buttons = document.querySelectorAll('.nav-btn');
        const contents = document.querySelectorAll('.tab-content');
        
        console.log('Botones encontrados:', buttons.length);
        console.log('Contenidos encontrados:', contents.length);
        
        // Paso 2: Mostrar información de cada botón
        buttons.forEach((btn, index) => {
            const tabId = btn.getAttribute('data-tab');
            const isActive = btn.classList.contains('active');
            console.log(`Botón ${index}: data-tab="${tabId}", activo=${isActive}, texto="${btn.textContent.trim()}"`);
        });
        
        // Paso 3: Mostrar información de cada contenido
        contents.forEach((content, index) => {
            const contentId = content.id;
            const isContentActive = content.classList.contains('active');
            const isDisplayNone = content.style.display === 'none';
            console.log(`Contenido ${index}: id="${contentId}", activo=${isContentActive}, display=none=${isDisplayNone}`);
        });
        
        // Paso 4: Verificar que cada botón tenga su contenido correspondiente
        buttons.forEach(btn => {
            const tabId = btn.getAttribute('data-tab');
            const correspondingContent = document.getElementById(tabId);
            if (correspondingContent) {
                console.log(`✓ Botón "${tabId}" tiene contenido correspondiente`);
            } else {
                console.log(`✗ Botón "${tabId}" NO tiene contenido correspondiente`);
            }
        });
        
        console.log('=============================');
    }
    
    // Ejecutar diagnóstico cuando se cargue el DOM
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', debugTabs);
    } else {
        debugTabs();
    }
})();