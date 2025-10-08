// Libreta de Campo - JavaScript functionality
// Current app version
const APP_VERSION = '1.1.0'; // Increment this version number for updates

document.addEventListener('DOMContentLoaded', function() {
    // Check for updates on page load
    checkForUpdates();
    
    // DOM elements
    const form = document.getElementById('observationForm');
    const observationsList = document.getElementById('observationsList');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const refreshBtn = document.getElementById('refresh-btn');
    const workFrontSelect = document.getElementById('work-front');
    const additionalInfoGroup = document.getElementById('additional-info-group');
    const getLocationBtn = document.getElementById('get-location-btn');
    const locationInput = document.getElementById('location');
    const locationDisplay = document.getElementById('location-display');
    const coordinatesSpan = document.getElementById('coordinates');
    
    // Auto-populate current date and time
    const now = new Date();
    // Format to YYYY-MM-DDTHH:MM for datetime-local input
    const formattedDateTime = now.toISOString().slice(0, 16);
    document.getElementById('date-time').value = formattedDateTime;
    
    // Show/hide additional info field based on work front selection
    workFrontSelect.addEventListener('change', function() {
        if (this.value === 'drenes_plataforma') {
            additionalInfoGroup.style.display = 'block';
        } else {
            additionalInfoGroup.style.display = 'none';
        }
    });
    
    // Check for app updates
    function checkForUpdates() {
        const storedVersion = localStorage.getItem('appVersion');
        
        // If no version is stored, this is the first time the app is running
        if (!storedVersion) {
            localStorage.setItem('appVersion', APP_VERSION);
            return;
        }
        
        // Check if version has changed (indicating an update)
        if (storedVersion !== APP_VERSION) {
            // For version changes, we can optionally clear old data if needed
            // For now, we'll just update the version and notify the user
            localStorage.setItem('appVersion', APP_VERSION);
            
            // Show update notification
            showMessage(`Aplicación actualizada a la versión ${APP_VERSION}`);
            
            // Optionally clear old data if there are breaking changes between versions
            // Example: if (compareVersions(storedVersion, '1.0.0') < 0) {
            //   localStorage.removeItem('oldDataFormat');
            // }
        }
    }
    
    // Helper function to compare versions (simplified)
    function compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const part1 = parts1[i] || 0;
            const part2 = parts2[i] || 0;
            
            if (part1 > part2) return 1;
            if (part1 < part2) return -1;
        }
        
        return 0;
    }
    
    // Function to force update the app (used when needed)
    function forceAppUpdate() {
        // Update the stored version
        localStorage.setItem('appVersion', APP_VERSION);
        
        // Clear any cached data if needed for this update
        // Add specific clearing logic if needed for this version
        
        // Show update notification
        showMessage(`Versión ${APP_VERSION} instalada correctamente`);
    }
    
    // Set the version in the UI
    const versionSpan = document.getElementById('app-version');
    if (versionSpan) {
        versionSpan.textContent = APP_VERSION;
    }
    
    // Expose forceAppUpdate to global scope if needed for debugging
    window.forceAppUpdate = forceAppUpdate;
    
    // Handle refresh button
    refreshBtn.addEventListener('click', function() {
        if (confirm('¿Está seguro de que desea actualizar la aplicación? Esto recargará la página.')) {
            // Store the current version before refreshing
            localStorage.setItem('appVersion', APP_VERSION);
            location.reload(true); // Force reload from server
        }
    });
    
    // Handle GPS location button
    getLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            // Show loading state
            getLocationBtn.textContent = '📍 Buscando...';
            getLocationBtn.disabled = true;
            
            navigator.geolocation.getCurrentPosition(
                // Success callback
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = position.coords.accuracy;
                    
                    // Update the location input with coordinates
                    locationInput.value = `Coordenadas: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    
                    // Show coordinates and accuracy
                    coordinatesSpan.innerHTML = `<strong>Ubicación:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} (±${accuracy.toFixed(2)}m)`;
                    locationDisplay.style.display = 'block';
                    
                    // Revert button text
                    getLocationBtn.textContent = '📍 GPS';
                    getLocationBtn.disabled = false;
                    
                    showMessage('Ubicación GPS obtenida exitosamente');
                },
                // Error callback
                function(error) {
                    let errorMessage = '';
                    
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'Permiso de ubicación denegado.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Información de ubicación no disponible.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'Tiempo de espera agotado para obtener ubicación.';
                            break;
                        default:
                            errorMessage = 'Error desconocido al obtener ubicación.';
                            break;
                    }
                    
                    showMessage('Error: ' + errorMessage);
                    
                    // Revert button text
                    getLocationBtn.textContent = '📍 GPS';
                    getLocationBtn.disabled = false;
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000, // 10 seconds
                    maximumAge: 60000 // 1 minute
                }
            );
        } else {
            showMessage('La geolocalización no es soportada por este navegador.');
        }
    });
    
    // Load saved observations when page loads
    loadObservations();
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            id: Date.now(), // Unique ID based on timestamp
            datetime: document.getElementById('date-time').value,
            location: document.getElementById('location').value,
            workFront: document.getElementById('work-front').value,
            additionalInfo: document.getElementById('additional-info').value,
            observer: document.getElementById('observer').value,
            species: document.getElementById('species').value,
            quantity: document.getElementById('quantity').value,
            notes: document.getElementById('notes').value,
            timestamp: new Date().toISOString()
        };
        
        // Save observation
        saveObservation(formData);
        
        // Reset form and auto-populate datetime
        form.reset();
        document.getElementById('date-time').value = new Date().toISOString().slice(0, 16);
        
        // Hide location display after form reset
        locationDisplay.style.display = 'none';
        coordinatesSpan.textContent = '';
        
        // Show/hide additional info based on current selection after reset
        if (workFrontSelect.value === 'drenes_plataforma') {
            additionalInfoGroup.style.display = 'block';
        } else {
            additionalInfoGroup.style.display = 'none';
        }
        
        // Reload observations
        loadObservations();
    });
    
    // Handle export button
    exportBtn.addEventListener('click', exportData);
    
    // Handle clear button
    clearBtn.addEventListener('click', function() {
        if (confirm('¿Está seguro de que desea eliminar todas las observaciones? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('observations');
            loadObservations();
        }
    });
    
    // Function to save observation to localStorage
    function saveObservation(observation) {
        let observations = getObservations();
        observations.push(observation);
        localStorage.setItem('observations', JSON.stringify(observations));
        showMessage('¡Observación guardada exitosamente!');
    }
    
    // Function to get all observations from localStorage
    function getObservations() {
        const observations = localStorage.getItem('observations');
        return observations ? JSON.parse(observations) : [];
    }
    
    // Function to load and display observations
    function loadObservations() {
        const observations = getObservations();
        
        if (observations.length === 0) {
            observationsList.innerHTML = '<div class="no-observations">No hay observaciones registradas aún</div>';
            return;
        }
        
        // Sort observations by datetime (newest first)
        observations.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        
        observationsList.innerHTML = '';
        
        observations.forEach(observation => {
            const observationCard = document.createElement('div');
            observationCard.className = 'observation-card';
            
            // Format work front for display
            const workFrontDisplay = formatWorkFront(observation.workFront);
            
            observationCard.innerHTML = `
                <h3>${observation.location} <small>(${formatDateTime(observation.datetime)})</small></h3>
                <div class="observation-details">
                    <div class="observation-detail"><strong>Frente de Trabajo:</strong> ${workFrontDisplay}</div>
                    <div class="observation-detail"><strong>Observador:</strong> ${observation.observer}</div>
                    ${observation.species ? `<div class="observation-detail"><strong>Especies:</strong> ${observation.species}</div>` : ''}
                    ${observation.quantity ? `<div class="observation-detail"><strong>Cantidad:</strong> ${observation.quantity}</div>` : ''}
                    ${observation.additionalInfo ? `<div class="observation-detail"><strong>Info Adicional:</strong> ${observation.additionalInfo}</div>` : ''}
                    ${observation.notes ? `<div class="observation-detail full-width"><strong>Notas:</strong> ${observation.notes}</div>` : ''}
                </div>
                <button class="delete-btn" data-id="${observation.id}">Eliminar</button>
            `;
            observationsList.appendChild(observationCard);
        });
        
        // Add event listeners to delete buttons
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteObservation(id);
            });
        });
    }
    
    // Function to delete an observation
    function deleteObservation(id) {
        let observations = getObservations();
        observations = observations.filter(obs => obs.id !== id);
        localStorage.setItem('observations', JSON.stringify(observations));
        loadObservations();
        showMessage('Observación eliminada');
    }
    
    // Function to export data as JSON
    function exportData() {
        const observations = getObservations();
        
        if (observations.length === 0) {
            alert('No hay datos para exportar');
            return;
        }
        
        const dataStr = JSON.stringify(observations, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `libreta_campo_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showMessage('¡Datos exportados exitosamente!');
    }
    
    // Helper function to show messages
    function showMessage(message) {
        // Create message element if it doesn't exist
        let messageEl = document.getElementById('message');
        if (!messageEl) {
            messageEl = document.createElement('div');
            messageEl.id = 'message';
            messageEl.style.position = 'fixed';
            messageEl.style.top = '20px';
            messageEl.style.right = '20px';
            messageEl.style.padding = '15px';
            messageEl.style.backgroundColor = '#2ecc71';
            messageEl.style.color = 'white';
            messageEl.style.borderRadius = '5px';
            messageEl.style.zIndex = '1000';
            messageEl.style.display = 'none';
            document.body.appendChild(messageEl);
        }
        
        // Show message
        messageEl.textContent = message;
        messageEl.style.display = 'block';
        
        // Hide message after 3 seconds
        setTimeout(() => {
            messageEl.style.display = 'none';
        }, 3000);
    }
    
    // Helper function to format date and time
    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        const options = { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        return date.toLocaleDateString('es-ES', options);
    }
    
    // Helper function to format work front for display
    function formatWorkFront(workFrontValue) {
        switch(workFrontValue) {
            case 'corona':
                return 'Corona';
            case 'estribo_izquierdo':
                return 'Estríbo Izquierdo';
            case 'estribo_derecho':
                return 'Estríbo Derecho';
            case 'banda_5':
                return 'Banda 5';
            case 'banda_6':
                return 'Banda 6';
            case 'dren_inclinado':
                return 'Dren Inclinado';
            case 'via':
                return 'Vía';
            case 'drenes_plataforma':
                return 'Drenes y Plataforma';
            default:
                return workFrontValue;
        }
    }
});