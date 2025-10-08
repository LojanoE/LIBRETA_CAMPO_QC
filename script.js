// Libreta de Campo - JavaScript functionality
// Current app version
const APP_VERSION = '1.1.2'; // Increment this version number for updates

// Function to set the version query parameter on assets
function setVersion() {
    const version = APP_VERSION;
    document.getElementById('main-styles').href = `styles.css?v=${version}`;
    document.getElementById('main-script').src = `script.js?v=${version}`;
    document.getElementById('app-version').textContent = version;
}

document.addEventListener('DOMContentLoaded', function() {
    // Set the version of the app
    setVersion();
    // Check for updates on page load
    checkForUpdates();
    
    // DOM elements
    const form = document.getElementById('observationForm');
    const observationsList = document.getElementById('observationsList');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    const refreshBtn = document.getElementById('refresh-btn');
    const workFrontSelect = document.getElementById('work-front'); // hidden input
    const workFrontHeader = document.getElementById('work-front-header');
    const workFrontOptions = document.getElementById('work-front-options');
    const selectedWorkFront = document.getElementById('selected-work-front');
    const tagSelect = document.getElementById('tag'); // hidden input
    const tagHeader = document.getElementById('tag-header');
    const tagOptions = document.getElementById('tag-options');
    const selectedTag = document.getElementById('selected-tag');
    const additionalInfoGroup = document.getElementById('additional-info-group');
    const getLocationBtn = document.getElementById('get-location-btn');
    const locationInput = document.getElementById('location');
    const locationDisplay = document.getElementById('location-display');
    const coordinatesSpan = document.getElementById('coordinates');
    const notesTextarea = document.getElementById('notes');
    if (notesTextarea.value === '') {
        notesTextarea.value = '• ';
    }

    notesTextarea.addEventListener('keydown', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            const start = this.selectionStart;
            const end = this.selectionEnd;
            const value = this.value;
            this.value = value.substring(0, start) + '\n• ' + value.substring(end);
            this.selectionStart = this.selectionEnd = start + 3;
        }
    });
    
    // Function to set the current date and time
    function setDateTime() {
        const now = new Date();
        const year = now.getFullYear();
        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        const day = now.getDate().toString().padStart(2, '0');
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('date-time').value = formattedDateTime;
    }

    // Auto-populate current date and time on page load
    setDateTime();
    
    // Dropdown functionality for work front
    workFrontHeader.addEventListener('click', function() {
        toggleDropdown('work-front-dropdown');
    });

    // Dropdown functionality for tags
    tagHeader.addEventListener('click', function() {
        toggleDropdown('tag-dropdown');
    });

    // Function to toggle dropdown visibility
    function toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        const options = dropdown.querySelector('.dropdown-options');
        dropdown.classList.toggle('active');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        closeAllDropdowns(event);
    });

    function closeAllDropdowns(event) {
        const dropdowns = document.querySelectorAll('.dropdown-card');
        dropdowns.forEach(dropdown => {
            if (!dropdown.contains(event.target)) {
                dropdown.classList.remove('active');
                dropdown.querySelector('.dropdown-options').style.display = 'none';
            }
        });
    }
    
    // Handle option selection for all dropdowns
    document.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function() {
            const value = this.getAttribute('data-value');
            const text = this.textContent;
            const dropdown = this.closest('.dropdown-card');
            const hiddenInput = dropdown.querySelector('input[type="hidden"]');
            const selectedDisplay = dropdown.querySelector('.dropdown-header span:first-child');

            hiddenInput.value = value;
            selectedDisplay.textContent = text;

            closeAllDropdowns({target: document.body}); // Close all dropdowns

            // Trigger change event to handle additional info for work front
            if (hiddenInput.id === 'work-front') {
                hiddenInput.dispatchEvent(new Event('change'));
            }
        });
    });
    
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
        // Simulate fetching a version file from the server
        const remoteVersion = '1.1.2'; // In a real app, you would fetch this from a file on your server

        if (compareVersions(APP_VERSION, remoteVersion) < 0) {
            if (confirm(`Hay una nueva versión (${remoteVersion}) disponible. ¿Desea actualizar ahora?`)) {
                localStorage.setItem('appVersion', remoteVersion);
                location.reload(true);
            }
        }
    }

    // Handle online status
    window.addEventListener('online', handleOnlineStatus);

    function handleOnlineStatus() {
        showMessage('Conectado a internet. Comprobando actualizaciones...');
        checkForUpdates();
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
    
    // Coordinate transformation functions
    // Convert WGS84 to PSAD56 UTM Zone 17S
    function convertToPSAD56(lat, lng) {
        // This is a simplified conversion using a common offset method
        // For more accurate conversion, a proper datum transformation library would be needed
        
        // Approximate offsets for the region
        const latOffset = 0.0027; // Approximate offset in degrees
        const lngOffset = -0.0015; // Approximate offset in degrees
        
        const psad56Lat = lat - latOffset;
        const psad56Lng = lng - lngOffset;
        
        // Calculate UTM zone 17S
        const utmResult = convertToUTM(psad56Lat, psad56Lng, 17);
        
        return {
            lat: psad56Lat,
            lng: psad56Lng,
            utmEasting: utmResult.easting,
            utmNorthing: utmResult.northing,
            utmZone: utmResult.zone
        };
    }
    
    // Convert latitude/longitude to UTM coordinates
    function convertToUTM(lat, lng, zoneNumber) {
        // Constants used in UTM calculations
        const K0 = 0.9996; // Scale factor
        const E = 0.00669438; // Eccentricity squared
        const E2 = Math.pow(E, 2);
        const E3 = Math.pow(E, 3);
        const E_P2 = E / (1 - E);
        
        // Semi-major axis
        const a = 6378137.0; // WGS84 semi-major axis
        
        // Make zone number negative for southern hemisphere
        const isSouthern = lat < 0;
        if (zoneNumber > 0 && isSouthern) {
            zoneNumber = -zoneNumber;
        }
        
        // Calculate UTM coordinates
        const latRad = lat * Math.PI / 180;
        const lngRad = lng * Math.PI / 180;
        const lngOriginRad = ((Math.abs(zoneNumber) - 1) * 6 - 180 + 3) * Math.PI / 180;
        const N = a / Math.sqrt(1 - E * Math.pow(Math.sin(latRad), 2));
        const T = Math.pow(Math.tan(latRad), 2);
        const C = E_P2 * Math.pow(Math.cos(latRad), 2);
        const A = Math.cos(latRad) * (lngRad - lngOriginRad);
        
        const M = a * (
            (1 - E / 4 - 3 * E2 / 64 - 5 * E3 / 256) * latRad
            - (3 * E / 8 + 3 * E2 / 32 + 45 * E3 / 1024) * Math.sin(2 * latRad)
            + (15 * E2 / 256 + 45 * E3 / 1024) * Math.sin(4 * latRad)
            - (35 * E3 / 3072) * Math.sin(6 * latRad)
        );
        
        const utmEasting = K0 * N * (
            A + (1 - T + C) * Math.pow(A, 3) / 6
            + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120
        ) + 500000;
        
        let utmNorthing = K0 * (
            M + N * Math.tan(latRad) * (
                Math.pow(A, 2) / 2
                + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24
                + (61 - 58 * T + T * T + 600 * C - 330 * E_P2) * Math.pow(A, 6) / 720
            )
        );
        
        // Adjust northing for southern hemisphere
        if (isSouthern) {
            utmNorthing += 10000000;
        }
        
        return {
            easting: Math.round(utmEasting),
            northing: Math.round(utmNorthing),
            zone: Math.abs(zoneNumber) + (isSouthern ? 'S' : 'N')
        };
    }
    
    // Helper function to extract WGS84 coordinates from location string
    function extractWGS84Coords(locationStr) {
        if (!locationStr) return null;
        
        // Extract coordinates from format like "WGS84: -12.345678, -77.123456"
        const wgs84Match = locationStr.match(/WGS84:\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (wgs84Match) {
            return {
                lat: parseFloat(wgs84Match[1]),
                lng: parseFloat(wgs84Match[2])
            };
        }
        
        // If location is just coordinates in "lat, lng" format
        const coordsMatch = locationStr.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
        if (coordsMatch) {
            return {
                lat: parseFloat(coordsMatch[1]),
                lng: parseFloat(coordsMatch[2])
            };
        }
        
        return null;
    }
    
    // Helper function to extract PSAD56 coordinates from display string
    function extractPSAD56Coords(displayStr) {
        if (!displayStr) return null;
        
        // Extract UTM coordinates from display string
        const eastingMatch = displayStr.match(/(\d+)E/);
        const northingMatch = displayStr.match(/(\d+)N/);
        
        if (eastingMatch && northingMatch) {
            return {
                easting: parseInt(eastingMatch[1]),
                northing: parseInt(northingMatch[1]),
                zone: '17S'
            };
        }
        
        return null;
    }
    
    // Set the version in the UI
    const versionSpan = document.getElementById('app-version');
    if (versionSpan) {
        versionSpan.textContent = APP_VERSION;
    }
    
    // Expose transformation functions to global scope for debugging
    window.convertToPSAD56 = convertToPSAD56;
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
                    
                    // Transform coordinates to PSAD56 UTM Zone 17S
                    const psad56Coords = convertToPSAD56(lat, lng);
                    
                    // Update the location input with coordinates
                    locationInput.value = `WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    
                    // Show coordinates in both formats
                    coordinatesSpan.innerHTML = `
                        <strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} 
                        <strong>PSAD56 UTM 17S:</strong> ${psad56Coords.utmEasting}E, ${psad56Coords.utmNorthing}N (±${accuracy.toFixed(2)}m)
                    `;
                    locationDisplay.style.display = 'block';
                    
                    // Revert button text
                    getLocationBtn.textContent = '📍 GPS';
                    getLocationBtn.disabled = false;
                    
                    showMessage('Ubicación GPS obtenida y convertida a PSAD56 UTM 17S');
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
            coordinates: {
                wgs84: extractWGS84Coords(document.getElementById('location').value),
                psad56: extractPSAD56Coords(coordinatesSpan.textContent)
            },
            workFront: document.getElementById('work-front').value,
            tag: document.getElementById('tag').value,
            additionalInfo: document.getElementById('additional-info').value,
            notes: notesTextarea.value, // Use textarea value
            timestamp: new Date().toISOString()
        };
        
        // Save observation
        saveObservation(formData);
        
        // Reset form and auto-populate datetime
        form.reset();
        setDateTime();
        
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
            const tagDisplay = formatTag(observation.tag);

            observationCard.style.borderLeftColor = tagDisplay.color;
            
            observationCard.innerHTML = `
                <h3>${observation.location} <small>(${formatDateTime(observation.datetime)})</small></h3>
                <div class="observation-details">
                    <div class="observation-detail"><strong>Frente de Trabajo:</strong> ${workFrontDisplay}</div>
                    <div class="observation-detail"><strong>Tipo:</strong> <span class="tag-display" style="background-color: ${tagDisplay.color}">${tagDisplay.name}</span></div>
                    ${observation.coordinates?.wgs84 ? `<div class="observation-detail"><strong>Coordenadas WGS84:</strong> ${observation.coordinates.wgs84.lat.toFixed(6)}, ${observation.coordinates.wgs84.lng.toFixed(6)}</div>` : ''}
                    ${observation.coordinates?.psad56 ? `<div class="observation-detail"><strong>PSAD56 UTM 17S:</strong> ${observation.coordinates.psad56.easting}E, ${observation.coordinates.psad56.northing}N</div>` : ''}
                    ${observation.additionalInfo ? `<div class="observation-detail"><strong>Info Adicional:</strong> ${observation.additionalInfo}</div>` : ''}
                    ${observation.notes ? `<div class="observation-detail full-width"><strong>Actividades Realizadas:</strong><div class="notes-content">${formatNotesWithBullets(observation.notes)}</div></div>` : ''}
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
    
    // Helper function to format notes with bullet points as HTML list
    function formatNotesWithBullets(notes) {
        if (!notes) return '';
        
        // Split by new lines
        const lines = notes.split('\n');
        
        // Process each line
        const processedLines = lines.map(line => {
            // Check if the line starts with a bullet
            if (line.trim().startsWith('•')) {
                return `<div class="bullet-item">${line.trim().substring(1).trim()}</div>`; // Remove the bullet character and trim
            } else if (line.trim() !== '') {
                return `<div class="regular-item">${line.trim()}</div>`;
            }
            return '';
        });
        
        return processedLines.join('\n');
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
            case 'talud':
                return 'Talud';
            case 'drenes_plataforma':
                return 'Drenes y Plataforma';
            default:
                return workFrontValue;
        }
    }

    function formatTag(tagValue) {
        switch(tagValue) {
            case 'importante':
                return { name: 'Importante', color: '#e74c3c' };
            case 'novedad':
                return { name: 'Novedad', color: '#f1c40f' };
            case 'rutina':
                return { name: 'Rutina', color: '#3498db' };
            default:
                return { name: tagValue, color: '#bdc3c7' };
        }
    }
});