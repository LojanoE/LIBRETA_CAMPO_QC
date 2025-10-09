// Archivo para identificar el error exacto en la funcionalidad del PIN
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded ejecutado');
    
    try {
        // Intentar definir un elemento de prueba
        const placePinBtn = document.getElementById('place-pin-btn');
        const mapModal = document.getElementById('map-modal');
        
        console.log('Elementos obtenidos:', { placePinBtn, mapModal });
        
        if (placePinBtn) {
            console.log('Botón PIN encontrado');
            placePinBtn.addEventListener('click', function() {
                console.log('Click en botón PIN detectado');
                if (mapModal) {
                    console.log('Mostrando modal del mapa');
                    mapModal.style.display = 'block';
                } else {
                    console.error('mapModal no encontrado');
                }
            });
            console.log('Evento de click añadido al botón PIN');
        } else {
            console.error('Botón place-pin-btn no encontrado');
        }
    } catch (error) {
        console.error('Error al intentar añadir el evento:', error);
    }
});