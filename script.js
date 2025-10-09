// Libreta de Campo - JavaScript functionality
// Current app version
const APP_VERSION = '1.4.1'; // Increment this version number for updates

// Function to set the version query parameter on assets
function setVersion() {
    const version = APP_VERSION;
    document.getElementById('main-styles').href = `styles.css?v=${version}`;
    document.getElementById('main-script').src = `script.js?v=${version}`;
    document.getElementById('app-version').textContent = version;
    updateLastSavedDisplay();
}

// Function to update last saved display
function updateLastSavedDisplay() {
    const lastSaved = localStorage.getItem('lastSaved');
    if (lastSaved) {
        document.getElementById('last-saved').textContent = new Date(lastSaved).toLocaleString('es-ES');
    } else {
        document.getElementById('last-saved').textContent = 'Nunca';
    }
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
    const clearFormBtn = document.getElementById('clear-form-btn');
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
    const photoInput = document.getElementById('photo');
    const photoPreview = document.getElementById('photo-preview');
    const mainContent = document.getElementById('main-content');
    const mapModal = document.getElementById('map-modal');
    const placePinBtn = document.getElementById('place-pin-btn');
    const closeMapModalBtn = document.getElementById('close-map-modal');
    const modalMapContainer = document.getElementById('modal-map-container');
    const modalMapImage = document.getElementById('modal-map-image');
    const modalMapPin = document.getElementById('modal-map-pin');
    const confirmLocationBtn = document.getElementById('confirm-location-btn');
    let selectedPinCoords = null;
    
    // Tab navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Update active nav button
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            // Show corresponding tab content
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            // Load appropriate content
            switch(tabId) {
                case 'observaciones':
                    loadObservations();
                    break;
                case 'mapa':
                    loadMap();
                    break;
            }
        });
    });
    
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
    workFrontHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown('work-front-dropdown');
    });

    // Dropdown functionality for tags
    tagHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown('tag-dropdown');
    });

    // Function to toggle dropdown visibility
    function toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        const options = dropdown.querySelector('.dropdown-options');
        const allDropdowns = document.querySelectorAll('.dropdown-card');
        
        // Close all other dropdowns
        allDropdowns.forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('active');
                d.querySelector('.dropdown-options').style.display = 'none';
            }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('active');
        if (options.style.display === 'block') {
            options.style.display = 'none';
        } else {
            options.style.display = 'block';
        }
    }
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown-card')) {
            closeAllDropdowns();
        }
    });

    function closeAllDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown-card');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.querySelector('.dropdown-options').style.display = 'none';
        });
    }
    
    // Handle option selection for all dropdowns
    document.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation(); // Prevent event bubbling
            const value = this.getAttribute('data-value');
            // Extract text content without the tag-color span
            let text = this.textContent.trim();
            if (this.querySelector('.tag-color')) {
                // If there's a tag-color span, get the text after it
                const tagColor = this.querySelector('.tag-color').outerHTML;
                text = this.innerHTML.replace(tagColor, '').replace(/<i[^>]*>.*?<\/i>/g, '').trim();
            }
            
            const dropdown = this.closest('.dropdown-card');
            const hiddenInput = dropdown.querySelector('input[type="hidden"]');
            const selectedDisplay = dropdown.querySelector('.dropdown-header span:first-child');

            hiddenInput.value = value;
            selectedDisplay.innerHTML = text;

            closeAllDropdowns(); // Close all dropdowns

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
    
    // Also check on page load in case there's a saved value
    if (workFrontSelect.value === 'drenes_plataforma') {
        additionalInfoGroup.style.display = 'block';
    } else {
        additionalInfoGroup.style.display = 'none';
    }
    
    // Photo preview functionality
    photoInput.addEventListener('change', function() {
        photoPreview.innerHTML = '';
        const files = this.files;
        
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                img.alt = `Foto ${i + 1}`;
                photoPreview.appendChild(img);
            }
            
            reader.readAsDataURL(file);
        }
    });
    
    // Check for app updates
    function checkForUpdates() {
        const remoteVersion = '1.4.1'; 
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
    
    function forceAppUpdate() {
        localStorage.setItem('appVersion', APP_VERSION);
        showMessage(`Versión ${APP_VERSION} instalada correctamente`);
    }
    
    // Coordinate transformation functions
    function convertToPSAD56(lat, lng) {
        const latOffset = 0.0027;
        const lngOffset = -0.0015;
        const psad56Lat = lat - latOffset;
        const psad56Lng = lng - lngOffset;
        const utmResult = convertToUTM(psad56Lat, psad56Lng, 17);
        return {
            lat: psad56Lat,
            lng: psad56Lng,
            utmEasting: utmResult.easting,
            utmNorthing: utmResult.northing,
            utmZone: utmResult.zone
        };
    }
    
    function convertToUTM(lat, lng, zoneNumber) {
        const K0 = 0.9996;
        const E = 0.00669438;
        const E2 = Math.pow(E, 2);
        const E3 = Math.pow(E, 3);
        const E_P2 = E / (1 - E);
        const a = 6378137.0;
        const isSouthern = lat < 0;
        if (zoneNumber > 0 && isSouthern) {
            zoneNumber = -zoneNumber;
        }
        const latRad = lat * Math.PI / 180;
        const lngRad = lng * Math.PI / 180;
        const lngOriginRad = ((Math.abs(zoneNumber) - 1) * 6 - 180 + 3) * Math.PI / 180;
        const N = a / Math.sqrt(1 - E * Math.pow(Math.sin(latRad), 2));
        const T = Math.pow(Math.tan(latRad), 2);
        const C = E_P2 * Math.pow(Math.cos(latRad), 2);
        const A = Math.cos(latRad) * (lngRad - lngOriginRad);
        const M = a * ((1 - E / 4 - 3 * E2 / 64 - 5 * E3 / 256) * latRad - (3 * E / 8 + 3 * E2 / 32 + 45 * E3 / 1024) * Math.sin(2 * latRad) + (15 * E2 / 256 + 45 * E3 / 1024) * Math.sin(4 * latRad) - (35 * E3 / 3072) * Math.sin(6 * latRad));
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        let utmNorthing = K0 * (M + N * Math.tan(latRad) * (Math.pow(A, 2) / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * E_P2) * Math.pow(A, 6) / 720));
        if (isSouthern) {
            utmNorthing += 10000000;
        }
        return {
            easting: Math.round(utmEasting),
            northing: Math.round(utmNorthing),
            zone: Math.abs(zoneNumber) + (isSouthern ? 'S' : 'N')
        };
    }
    
    function extractWGS84Coords(locationStr) {
        if (!locationStr) return null;
        const wgs84Match = locationStr.match(/WGS84:\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (wgs84Match) {
            return { lat: parseFloat(wgs84Match[1]), lng: parseFloat(wgs84Match[2]) };
        }
        const coordsMatch = locationStr.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
        if (coordsMatch) {
            return { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) };
        }
        return null;
    }
    
    function extractPSAD56Coords(displayStr) {
        if (!displayStr) return null;
        const eastingMatch = displayStr.match(/(\d+)E/);
        const northingMatch = displayStr.match(/(\d+)N/);
        if (eastingMatch && northingMatch) {
            return { easting: parseInt(eastingMatch[1]), northing: parseInt(northingMatch[1]), zone: '17S' };
        }
        return null;
    }
    
    const versionSpan = document.getElementById('app-version');
    if (versionSpan) {
        versionSpan.textContent = APP_VERSION;
    }
    
    window.convertToPSAD56 = convertToPSAD56;
    window.forceAppUpdate = forceAppUpdate;
    
    // Update GPS button to show loading state
    getLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            getLocationBtn.disabled = true;
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const lat = position.coords.latitude;
                    const lng = position.coords.longitude;
                    const accuracy = position.coords.accuracy;
                    const psad56Coords = convertToPSAD56(lat, lng);
                    locationInput.value = `WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong> ${psad56Coords.utmEasting}E, ${psad56Coords.utmNorthing}N (±${accuracy.toFixed(2)}m)`;
                    locationDisplay.classList.add('show');
                    getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> GPS';
                    getLocationBtn.disabled = false;
                    showMessage('Ubicación GPS obtenida y convertida a PSAD56 UTM 17S');
                },
                function(error) {
                    let errorMessage = '';
                    switch(error.code) {
                        case error.PERMISSION_DENIED: errorMessage = 'Permiso de ubicación denegado.'; break;
                        case error.POSITION_UNAVAILABLE: errorMessage = 'Información de ubicación no disponible.'; break;
                        case error.TIMEOUT: errorMessage = 'Tiempo de espera agotado para obtener ubicación.'; break;
                        default: errorMessage = 'Error desconocido al obtener ubicación.'; break;
                    }
                    showMessage('Error: ' + errorMessage);
                    getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> GPS';
                    getLocationBtn.disabled = false;
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            showMessage('La geolocalización no es soportada por este navegador.');
        }
    });
    
    // Clear form button functionality
    clearFormBtn.addEventListener('click', function() {
        if (confirm('¿Está seguro de que desea limpiar el formulario?')) {
            form.reset();
            setDateTime();
            locationDisplay.classList.remove('show');
            coordinatesSpan.textContent = '';
            photoPreview.innerHTML = '';
            additionalInfoGroup.style.display = 'none'; // Ocultar el campo adicional al limpiar
        }
    });
    
    // Load initial observations
    loadObservations();
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const photoFiles = document.getElementById('photo').files;
        let photosData = [];
        let photoFileNames = [];

        if (photoFiles.length > 0) {
            const resizePromises = Array.from(photoFiles).map(file => resizeImage(file));
            try {
                const resizedPhotos = await Promise.all(resizePromises);
                resizedPhotos.forEach((resizedPhoto, index) => {
                    photosData.push(resizedPhoto);
                    photoFileNames.push(`observacion_${Date.now()}_${index}.jpeg`);
                });
            } catch (error) {
                showMessage('Error al procesar las imágenes.');
                console.error(error);
                return;
            }
        }

        const formData = {
            id: Date.now(),
            datetime: document.getElementById('date-time').value,
            location: document.getElementById('location').value,
            coordinates: {
                wgs84: extractWGS84Coords(document.getElementById('location').value),
                psad56: extractPSAD56Coords(coordinatesSpan.textContent)
            },
            workFront: document.getElementById('work-front').value,
            tag: document.getElementById('tag').value,
            additionalInfo: document.getElementById('additional-info').value,
            notes: notesTextarea.value,
            photos: photosData,
            photoFileNames: photoFileNames,
            timestamp: new Date().toISOString()
        };
        
        saveObservation(formData);
        form.reset();
        setDateTime();
        locationDisplay.classList.remove('show');
        coordinatesSpan.textContent = '';
        photoPreview.innerHTML = '';
        additionalInfoGroup.style.display = 'none'; // Ocultar el campo adicional después de guardar
        showMessage('¡Observación guardada exitosamente!');
        loadObservations();
    });
    
    exportBtn.addEventListener('click', exportData);
    
    clearBtn.addEventListener('click', function() {
        if (confirm('¿Está seguro de que desea eliminar todas las observaciones? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('observations');
            localStorage.removeItem('lastSaved');
            loadObservations();
            updateStats();
            updateLastSavedDisplay();
            showMessage('Todas las observaciones han sido eliminadas');
        }
    });
    
    function saveObservation(observation) {
        let observations = getObservations();
        observations.push(observation);
        localStorage.setItem('observations', JSON.stringify(observations));
        localStorage.setItem('lastSaved', new Date().toISOString());
        updateLastSavedDisplay();
    }
    
    function getObservations() {
        const observations = localStorage.getItem('observations');
        return observations ? JSON.parse(observations) : [];
    }
    
    function loadObservations() {
        const observations = getObservations();
        if (observations.length === 0) {
            observationsList.innerHTML = '<div class="no-observations">No hay observaciones registradas aún</div>';
            return;
        }
        observations.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        observationsList.innerHTML = '';
        observations.forEach(observation => {
            const observationCard = document.createElement('div');
            observationCard.className = 'observation-card';
            const workFrontDisplay = formatWorkFront(observation.workFront);
            const tagDisplay = formatTag(observation.tag);
            observationCard.style.borderLeftColor = tagDisplay.color;

            let photosHTML = '';
            if (observation.photos && observation.photos.length > 0) {
                photosHTML += '<div class="observation-detail full-width"><strong>Fotos:</strong><br><div class="photo-thumbnails">';
                observation.photos.forEach((photo, index) => {
                    photosHTML += `<img src="${photo}" alt="Foto de la observación ${index + 1}" class="observation-photo-thumbnail">`;
                });
                photosHTML += '</div></div>';
            }

            let downloadBtnsHTML = '';
            if (observation.photos && observation.photos.length > 0) {
                observation.photos.forEach((photo, index) => {
                    downloadBtnsHTML += `<button class="download-photo-btn" data-id="${observation.id}" data-photo-index="${index}">Descargar Foto ${index + 1}</button>`;
                });
            }
            
            observationCard.innerHTML = `
                <h3>${observation.location} <small>(${formatDateTime(observation.datetime)})</small></h3>
                <div class="observation-details">
                    <div class="observation-detail"><strong>Frente de Trabajo:</strong> ${workFrontDisplay}</div>
                    <div class="observation-detail"><strong>Tipo:</strong> <span class="tag-display" style="background-color: ${tagDisplay.color}">${tagDisplay.name}</span></div>
                    ${observation.coordinates?.wgs84 ? `<div class="observation-detail"><strong>Coordenadas WGS84:</strong> ${observation.coordinates.wgs84.lat.toFixed(6)}, ${observation.coordinates.wgs84.lng.toFixed(6)}</div>` : ''}
                    ${observation.coordinates?.psad56 ? `<div class="observation-detail"><strong>PSAD56 UTM 17S:</strong> ${observation.coordinates.psad56.easting}E, ${observation.coordinates.psad56.northing}N</div>` : ''}
                    ${observation.additionalInfo ? `<div class="observation-detail"><strong>Info Adicional:</strong> ${observation.additionalInfo}</div>` : ''}
                    ${observation.notes ? `<div class="observation-detail full-width"><strong>Actividades Realizadas:</strong><div class="notes-content">${formatNotesWithBullets(observation.notes)}</div></div>` : ''}
                    ${photosHTML}
                </div>
                <button class="delete-btn" data-id="${observation.id}">Eliminar</button>
                ${downloadBtnsHTML}
            `;
            observationsList.appendChild(observationCard);
        });
        
        document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                deleteObservation(id);
            });
        });

        document.querySelectorAll('.download-photo-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const photoIndex = parseInt(this.getAttribute('data-photo-index'));
                const observations = getObservations();
                const observation = observations.find(obs => obs.id === id);
                if (observation && observation.photos && observation.photos[photoIndex]) {
                    const link = document.createElement('a');
                    link.href = observation.photos[photoIndex];
                    link.download = observation.photoFileNames[photoIndex] || `foto_${id}_${photoIndex}.jpeg`;
                    link.click();
                }
            });
        });
    }
    
    function deleteObservation(id) {
        let observations = getObservations();
        observations = observations.filter(obs => obs.id !== id);
        localStorage.setItem('observations', JSON.stringify(observations));
        localStorage.setItem('lastSaved', new Date().toISOString());
        loadObservations();
        updateLastSavedDisplay();
        showMessage('Observación eliminada');
    }
    
    async function exportData() {
        const observations = getObservations();
        if (observations.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const zip = new JSZip();
        const observationsForJson = observations.map(obs => {
            const obsCopy = { ...obs };
            delete obsCopy.photos;
            return obsCopy;
        });

        zip.file(`libreta_campo_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(observationsForJson, null, 2));

        observations.forEach(obs => {
            if (obs.photos && obs.photoFileNames) {
                obs.photos.forEach((photoData, index) => {
                    const photoBase64 = photoData.split(',')[1];
                    zip.file(obs.photoFileNames[index], photoBase64, { base64: true });
                });
            }
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const linkElement = document.createElement('a');
            const url = URL.createObjectURL(content);
            linkElement.setAttribute('href', url);
            linkElement.setAttribute('download', `export_libreta_campo_${new Date().toISOString().slice(0,10)}.zip`);
            linkElement.click();
            URL.revokeObjectURL(url);
            showMessage('¡Datos exportados exitosamente en un archivo ZIP!');
        } catch (error) {
            showMessage('Error al generar el archivo ZIP.');
            console.error(error);
        }
    }

    function resizeImage(file, maxWidth = 1280) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    let width = img.width;
                    let height = img.height;

                    if (width > maxWidth) {
                        height *= maxWidth / width;
                        width = maxWidth;
                    }

                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);

                    resolve(canvas.toDataURL('image/jpeg'));
                };
                img.src = event.target.result;
            }
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function showMessage(message) {
        // Usar un toast notification o modal mejorado
        Toastify({
            text: message,
            duration: 3000,
            close: true,
            gravity: "top", // `top` or `bottom`
            position: "right", // `left`, `center` or `right`
            backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
            stopOnFocus: true, // Prevents dismissing of toast on hover
        }).showToast();
    }
    
    function formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return date.toLocaleDateString('es-ES', options);
    }
    
    function formatNotesWithBullets(notes) {
        if (!notes) return '';
        const lines = notes.split('\n');
        const processedLines = lines.map(line => {
            if (line.trim().startsWith('•')) {
                return `<div class="bullet-item">${line.trim().substring(1).trim()}</div>`;
            } else if (line.trim() !== '') {
                return `<div class="regular-item">${line.trim()}</div>`;
            }
            return '';
        });
        return processedLines.join('\n');
    }
    
    function formatWorkFront(workFrontValue) {
        switch(workFrontValue) {
            case 'corona': return 'Corona';
            case 'estribo_izquierdo': return 'Estríbo Izquierdo';
            case 'estribo_derecho': return 'Estríbo Derecho';
            case 'banda_5': return 'Banda 5';
            case 'banda_6': return 'Banda 6';
            case 'dren_inclinado': return 'Dren Inclinado';
            case 'talud': return 'Talud';
            case 'drenes_plataforma': return 'Drenes y Plataforma';
            default: return workFrontValue;
        }
    }

    function formatTag(tagValue) {
        switch(tagValue) {
            case 'importante': return { name: 'Importante', color: '#e74c3c' };
            case 'novedad': return { name: 'Novedad', color: '#f1c40f' };
            case 'rutina': return { name: 'Rutina', color: '#3498db' };
            default: return { name: tagValue, color: '#bdc3c7' };
        }
    }
    
    
    // Actualizar marcadores del mapa cuando se inicie
    if (mapInitialized) {
        updateMapMarkers();
    }
    
    // Funcionalidad para la sección de configuración
    const themeSelector = document.getElementById('theme-selector');
    if (themeSelector) {
        themeSelector.addEventListener('change', function() {
            // Aquí se podría implementar la lógica para cambiar el tema
            showMessage(`Tema cambiado a: ${this.value}`);
        });
    }
    
    const backupBtn = document.getElementById('backup-btn');
    if (backupBtn) {
        backupBtn.addEventListener('click', function() {
            const observations = getObservations();
            const backupData = {
                observations: observations,
                version: APP_VERSION,
                backupDate: new Date().toISOString()
            };
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupData));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", `backup_libreta_campo_${new Date().toISOString().slice(0,10)}.json`);
            document.body.appendChild(downloadAnchorNode); // required for firefox
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            showMessage('Copia de seguridad creada exitosamente');
        });
    }
    
    const restoreBtn = document.getElementById('restore-btn');
    if (restoreBtn) {
        restoreBtn.addEventListener('click', function() {
            // Aquí se podría implementar la lógica para restaurar desde una copia de seguridad
            showMessage('Funcionalidad de restauración de copia de seguridad en desarrollo');
        });
    }
    
    // Funcionalidad del mapa
    let mapInitialized = false;
    let mapContainer = null;
    let mapImage = null;
    let mapOverlay = null;
    let zoomLevel = 1;
    let isDragging = false;
    let dragStartX = 0;
    let dragStartY = 0;
    
    // Límites del mapa en coordenadas PSAD56
    const mapBounds = {
        minX: 780470.010,
        maxX: 782341.423,
        minY: 9602159.372,
        maxY: 9603738.377
    };
    
    function loadMap() {
        if (!mapInitialized) {
            initializeMap();
            mapInitialized = true;
        }
        updateMapMarkers();
    }
    
    function initializeMap() {
        mapContainer = document.getElementById('map');
        mapImage = document.getElementById('map-image');
        mapOverlay = document.getElementById('map-overlay');
        
        // Esperar a que la imagen se cargue completamente para obtener dimensiones precisas
        mapImage.onload = function() {
            updateMapZoom();
        };
        
        // Configurar eventos de zoom
        document.getElementById('zoom-in').addEventListener('click', function() {
            zoomLevel = Math.min(zoomLevel + 0.2, 3); // Máximo 3x zoom
            updateMapZoom();
        });
        
        document.getElementById('zoom-out').addEventListener('click', function() {
            zoomLevel = Math.max(zoomLevel - 0.2, 0.5); // Mínimo 0.5x zoom
            updateMapZoom();
        });
        
        document.getElementById('reset-view').addEventListener('click', function() {
            zoomLevel = 1;
            mapContainer.scrollLeft = 0;
            mapContainer.scrollTop = 0;
            updateMapZoom();
        });
        
        // Configurar eventos de arrastre
        let isMouseDown = false;
        
        mapContainer.addEventListener('mousedown', function(e) {
            if (e.target === mapContainer || e.target === mapImage || e.target === mapOverlay) {
                isMouseDown = true;
                isDragging = true;
                dragStartX = e.clientX - mapContainer.scrollLeft;
                dragStartY = e.clientY - mapContainer.scrollTop;
                mapContainer.style.cursor = 'grabbing';
            }
        });
        
        mapContainer.addEventListener('mousemove', function(e) {
            if (isMouseDown && isDragging) {
                mapContainer.scrollLeft = e.clientX - dragStartX;
                mapContainer.scrollTop = e.clientY - dragStartY;
                e.preventDefault();
            }
            
            // Mostrar coordenadas bajo el cursor
            if (mapImage && mapOverlay && mapImage.complete) {
                const rect = mapContainer.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                
                // Convertir coordenadas de imagen a coordenadas PSAD56
                const psad56Coords = imageToPSAD56(x, y);
                if (psad56Coords) {
                    document.getElementById('map-coordinates').textContent = 
                        `Coordenadas: ${psad56Coords.x.toFixed(3)}, ${psad56Coords.y.toFixed(3)}`;
                }
            }
        });
        
        mapContainer.addEventListener('mouseup', function() {
            isMouseDown = false;
            isDragging = false;
            mapContainer.style.cursor = 'grab';
        });
        
        mapContainer.addEventListener('mouseleave', function() {
            isMouseDown = false;
            isDragging = false;
            document.getElementById('map-coordinates').textContent = 'Coordenadas: --';
            mapContainer.style.cursor = 'default';
        });
        
        // Evitar selección de texto durante arrastre
        mapContainer.addEventListener('selectstart', function(e) {
            if (isDragging) {
                e.preventDefault();
            }
        });
        
        // Inicializar el zoom solo si la imagen ya está cargada
        if (mapImage.complete) {
            updateMapZoom();
        }
    }
    
    function updateMapZoom() {
        if (!mapImage || !mapImage.complete) return;
        
        const newWidth = mapImage.naturalWidth * zoomLevel;
        const newHeight = mapImage.naturalHeight * zoomLevel;
        
        mapImage.style.width = newWidth + 'px';
        mapImage.style.height = newHeight + 'px';
    }
    
    function updateMapMarkers() {
        // Limpiar marcadores anteriores
        const existingMarkers = mapOverlay.querySelectorAll('.map-marker');
        existingMarkers.forEach(marker => marker.remove());
        
        const observations = getObservations();
        
        // Filtrar observaciones con coordenadas PSAD56 válidas
        const validObservations = observations.filter(obs => 
            obs.coordinates && obs.coordinates.psad56 && 
            obs.coordinates.psad56.easting && obs.coordinates.psad56.northing
        );
        
        // Añadir marcadores para cada observación
        validObservations.forEach(obs => {
            const psad56 = obs.coordinates.psad56;
            const iconColor = getTagColor(obs.tag);
            
            // Convertir coordenadas PSAD56 a coordenadas de imagen
            const imgCoords = psad56ToImage(psad56.easting, psad56.northing);
            
            if (imgCoords) {
                const marker = document.createElement('div');
                marker.className = 'map-marker';
                marker.style.left = imgCoords.x + 'px';
                marker.style.top = imgCoords.y + 'px';
                marker.style.color = iconColor;
                
                // Usar icono diferente según el tipo de observación
                let iconClass = 'fas fa-circle';
                switch(obs.tag) {
                    case 'importante':
                        iconClass = 'fas fa-exclamation-triangle';
                        break;
                    case 'novedad':
                        iconClass = 'fas fa-exclamation-circle';
                        break;
                    case 'rutina':
                        iconClass = 'fas fa-check-circle';
                        break;
                }
                
                marker.innerHTML = `<i class="${iconClass}"></i>`;
                
                // Añadir evento de clic para mostrar detalles
                marker.addEventListener('click', function() {
                    showObservationDetails(obs);
                });
                
                // Añadir tooltip con información básica
                marker.title = `${obs.location} (${formatDateTime(obs.datetime)})`;
                
                mapOverlay.appendChild(marker);
            }
        });
    }
    
    function psad56ToImage(easting, northing) {
        // Verificar si las coordenadas están dentro de los límites del mapa
        if (easting < mapBounds.minX || easting > mapBounds.maxX || 
            northing < mapBounds.minY || northing > mapBounds.maxY) {
            console.log(`Coordenada fuera de los límites: ${easting}, ${northing}`);
            return null; // Fuera de los límites
        }
        
        // Obtener dimensiones reales de la imagen visible
        const imgWidth = mapImage ? mapImage.clientWidth : 800;
        const imgHeight = mapImage ? mapImage.clientHeight : 600;
        
        // Ajustar el cálculo considerando la proporción de la imagen
        const x = ((easting - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX)) * imgWidth;
        // Invertir el eje Y para que coincida con el sistema de coordenadas del mapa
        const y = imgHeight - ((northing - mapBounds.minY) / (mapBounds.maxY - mapBounds.minY)) * imgHeight;
        
        return { x: x, y: y };
    }
    
    function imageToPSAD56(x, y) {
        if (!mapImage || !mapImage.complete) return null;
        
        // Obtener dimensiones reales de la imagen visible
        const imgWidth = mapImage.clientWidth;
        const imgHeight = mapImage.clientHeight;
        
        // Convertir coordenadas de imagen a PSAD56
        const easting = mapBounds.minX + (x / imgWidth) * (mapBounds.maxX - mapBounds.minX);
        // Invertir el eje Y para que coincida con el sistema de coordenadas del mapa
        const northing = mapBounds.minY + ((imgHeight - y) / imgHeight) * (mapBounds.maxY - mapBounds.minY);
        
        return { x: easting, y: northing };
    }
    
    function getTagColor(tag) {
        switch(tag) {
            case 'importante': return '#e74c3c'; // Rojo
            case 'novedad': return '#f1c40f';   // Amarillo
            case 'rutina': return '#3498db';    // Azul
            default: return '#bdc3c7';          // Gris
        }
    }
    
    function showObservationDetails(observation) {
        // Crear un modal con los detalles de la observación
        const details = `
            <div class="observation-details-modal">
                <h3>${observation.location}</h3>
                <p><strong>Fecha y Hora:</strong> ${formatDateTime(observation.datetime)}</p>
                <p><strong>Frente de Trabajo:</strong> ${formatWorkFront(observation.workFront)}</p>
                <p><strong>Tipo:</strong> <span class="tag-display" style="background-color: ${formatTag(observation.tag).color}">${formatTag(observation.tag).name}</span></p>
                <p><strong>Coordenadas PSAD56 UTM 17S:</strong> ${observation.coordinates.psad56.easting}E, ${observation.coordinates.psad56.northing}N</p>
                ${observation.additionalInfo ? `<p><strong>Info Adicional:</strong> ${observation.additionalInfo}</p>` : ''}
                ${observation.notes ? `<p><strong>Actividades Realizadas:</strong><br>${formatNotesWithBullets(observation.notes).replace(/<div class="bullet-item">/g, '• ').replace(/<\/div>/g, '<br>').replace(/<div class="regular-item">/g, '').replace(/<\/div>/g, '<br>')}</p>` : ''}
                ${observation.photos && observation.photos.length > 0 ? `<p><strong>Fotos:</strong> ${observation.photos.length} foto(s)</p>` : ''}
            </div>
        `;
        
        // Mostrar los detalles (podríamos usar un modal o una notificación)
        alert(details.replace(/<[^>]*>/g, '')); // Por ahora, usar alert para mostrar los detalles
    }
    
    // Actualizar marcadores cuando se guarden nuevas observaciones
    const originalSaveObservation = saveObservation;
    saveObservation = function(observation) {
        originalSaveObservation(observation);
        if (mapInitialized) {
            setTimeout(updateMapMarkers, 100); // Pequeño retraso para asegurar que se guardó
        }
    };
    
    // Actualizar marcadores cuando se eliminen observaciones
    const originalDeleteObservation = deleteObservation;
    deleteObservation = function(id) {
        originalDeleteObservation(id);
        if (mapInitialized) {
            setTimeout(updateMapMarkers, 100); // Pequeño retraso para asegurar que se eliminó
        }
    };

    // Funcionalidad del modal del mapa para colocar un pin
    if (placePinBtn && mapModal) {
        placePinBtn.addEventListener('click', () => {
            console.log('Botón PIN clickeado'); // Debug message
            mapModal.style.display = 'block';
            console.log('Modal debería estar visible ahora'); // Debug message
        });
        console.log('Evento de PIN añadido correctamente'); // Debug message
    } else {
        console.error('Error: No se encontraron los elementos necesarios para el botón PIN');
        console.log('placePinBtn existe:', !!placePinBtn);
        console.log('mapModal existe:', !!mapModal);
    }

    if (closeMapModalBtn && mapModal) {
        closeMapModalBtn.addEventListener('click', () => {
            mapModal.style.display = 'none';
        });
    }

    if (modalMapContainer && modalMapImage && modalMapPin) {
        modalMapContainer.addEventListener('click', (e) => {
            if (e.target === modalMapContainer || e.target === modalMapImage) {
                const rect = modalMapImage.getBoundingClientRect();
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                modalMapPin.style.left = `${x}px`;
                modalMapPin.style.top = `${y}px`;
                modalMapPin.style.display = 'block';

                selectedPinCoords = { x, y };
            }
        });
    }

    if (confirmLocationBtn && mapModal) {
        confirmLocationBtn.addEventListener('click', () => {
            if (selectedPinCoords && typeof imageToPSAD56 === 'function') {
                const psad56Coords = imageToPSAD56(selectedPinCoords.x, selectedPinCoords.y);
                if (psad56Coords) {
                    if (locationInput) {
                        locationInput.value = `PSAD56: ${psad56Coords.x.toFixed(3)}, ${psad56Coords.y.toFixed(3)}`;
                    }
                    if (coordinatesSpan) {
                        coordinatesSpan.innerHTML = `<strong>PSAD56 UTM 17S:</strong> ${psad56Coords.x.toFixed(0)}E, ${psad56Coords.y.toFixed(0)}N`;
                    }
                    if (locationDisplay) {
                        locationDisplay.classList.add('show');
                    }
                    showMessage('Ubicación seleccionada desde el mapa.');
                }
                mapModal.style.display = 'none';
            } else {
                if (!imageToPSAD56) {
                    console.error('Error: La función imageToPSAD56 no está definida');
                }
            }
        });
    }

    window.addEventListener('click', (event) => {
        if (mapModal && event.target == mapModal) {
            mapModal.style.display = 'none';
        }
    });
});

// Añadir Toastify si no está disponible
if (typeof Toastify === 'undefined') {
    // Si no está disponible, mostrar mensaje de fallback
    window.showMessage = function(message) {
        alert(message);
    };
}