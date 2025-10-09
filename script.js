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
    const modalCoordinatesDisplay = document.getElementById('modal-coordinates-display');
    const modalZoomInBtn = document.getElementById('modal-zoom-in');
    const modalZoomOutBtn = document.getElementById('modal-zoom-out');
    
    // Map related variables
    let mapInitialized = false;
    let mapContainer, mapImage, mapOverlay;
    let zoomLevel = 1;
    let modalZoomLevel = 1;
    const mapBounds = { minX: 780470.010, maxX: 782341.423, minY: 9602159.372, maxY: 9603738.377 };
    let selectedPinCoords = null;
    let truePinPosition = null; // To store pin position on the un-zoomed image

    // --- MAP MODAL ---
    let isModalDragging = false;
    let hasDragged = false;
    let modalDragStartX, modalDragStartY;
    let modalScrollLeft, modalScrollTop;

    function updatePinPosition() {
        if (!truePinPosition) return;

        // With zoom disabled, use direct coordinates without scaling
        const left = truePinPosition.x;
        const top = truePinPosition.y;

        // Get the dimensions of the image to ensure pin stays within bounds
        const imgWidth = modalMapImage.naturalWidth || modalMapImage.width;
        const imgHeight = modalMapImage.naturalHeight || modalMapImage.height;
        
        // Calculate maximum allowed positions
        const maxLeft = imgWidth;
        const maxTop = imgHeight;
        
        // Ensure the pin stays within the image bounds
        const boundedLeft = Math.max(0, Math.min(left, maxLeft));
        const boundedTop = Math.max(0, Math.min(top, maxTop));

        modalMapPin.style.left = `${boundedLeft}px`;
        modalMapPin.style.top = `${boundedTop}px`;
        // With zoom disabled, keep transform at normal scale
        modalMapPin.style.transform = 'translate(-50%, -100%)';
        modalMapPin.style.display = 'block';
    }

    placePinBtn.addEventListener('click', () => {
        mapModal.style.display = 'block';
        confirmLocationBtn.disabled = true;
        modalCoordinatesDisplay.textContent = 'Seleccione un punto en el mapa...';
        modalMapPin.style.display = 'none';
        selectedPinCoords = null;
        truePinPosition = null;
        // Disable zoom functionality
        modalZoomLevel = 1;
        modalMapImage.style.transform = 'scale(1)';
        modalMapContainer.scrollTop = 0;
        modalMapContainer.scrollLeft = 0;
        // Hide zoom controls
        document.querySelector('.modal-map-controls').style.display = 'none';
    });

    closeMapModalBtn.addEventListener('click', () => {
        mapModal.style.display = 'none';
        // Show zoom controls again when modal is closed
        document.querySelector('.modal-map-controls').style.display = 'flex';
    });

    modalZoomInBtn.addEventListener('click', () => {
        // Disable zoom functionality - keep zoom level at 1
        // modalZoomLevel = Math.min(modalZoomLevel + 0.3, 4);
        // modalMapImage.style.transform = `scale(${modalZoomLevel})`;
        // updatePinPosition();
    });

    modalZoomOutBtn.addEventListener('click', () => {
        // Disable zoom functionality - keep zoom level at 1
        // modalZoomLevel = Math.max(modalZoomLevel - 0.3, 1);
        // modalMapImage.style.transform = `scale(${modalZoomLevel})`;
        // updatePinPosition();
    });

    function handlePinPlacement(e) {
        const rect = modalMapContainer.getBoundingClientRect();
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        const xOnContainer = clientX - rect.left;
        const yOnContainer = clientY - rect.top;

        // With zoom disabled, modalZoomLevel = 1, so no division needed
        const xOnImage = xOnContainer + modalMapContainer.scrollLeft;
        const yOnImage = yOnContainer + modalMapContainer.scrollTop;

        // Boundary check
        const imgWidth = modalMapImage.naturalWidth;
        const imgHeight = modalMapImage.naturalHeight;

        if (xOnImage < 0 || xOnImage > imgWidth || yOnImage < 0 || yOnImage > imgHeight) {
            modalMapPin.style.display = 'none';
            modalCoordinatesDisplay.textContent = 'Haga clic dentro del mapa.';
            confirmLocationBtn.disabled = true;
            truePinPosition = null;
            selectedPinCoords = null;
            return;
        }

        // Ensure the position is within bounds
        const boundedX = Math.max(0, Math.min(xOnImage, imgWidth));
        const boundedY = Math.max(0, Math.min(yOnImage, imgHeight));
        
        truePinPosition = { x: boundedX, y: boundedY };
        updatePinPosition();

        const psad56Coords = imageToPSAD56(boundedX, boundedY);

        if (psad56Coords) {
            selectedPinCoords = psad56Coords;
            modalCoordinatesDisplay.textContent = `PSAD56: ${psad56Coords.x.toFixed(2)}E, ${psad56Coords.y.toFixed(2)}N`;
            confirmLocationBtn.disabled = false;
        } else {
            selectedPinCoords = null;
            modalCoordinatesDisplay.textContent = 'Punto fuera de los límites del mapa.';
            confirmLocationBtn.disabled = true;
        }
    }

    modalMapContainer.addEventListener('mousedown', (e) => {
        isModalDragging = true;
        hasDragged = false;
        modalMapContainer.style.cursor = 'grabbing';
        modalDragStartX = e.pageX - modalMapContainer.offsetLeft;
        modalDragStartY = e.pageY - modalMapContainer.offsetTop;
        modalScrollLeft = modalMapContainer.scrollLeft;
        modalScrollTop = modalMapContainer.scrollTop;
    });
    
    modalMapContainer.addEventListener('touchstart', (e) => {
        isModalDragging = true;
        hasDragged = false;
        modalDragStartX = e.touches[0].pageX - modalMapContainer.offsetLeft;
        modalDragStartY = e.touches[0].pageY - modalMapContainer.offsetTop;
        modalScrollLeft = modalMapContainer.scrollLeft;
        modalScrollTop = modalMapContainer.scrollTop;
    });

    modalMapContainer.addEventListener('mousemove', (e) => {
        if (!isModalDragging) return;
        hasDragged = true;
        e.preventDefault();
        const x = e.pageX - modalMapContainer.offsetLeft;
        const y = e.pageY - modalMapContainer.offsetTop;
        const walkX = (x - modalDragStartX);
        const walkY = (y - modalDragStartY);
        modalMapContainer.scrollLeft = modalScrollLeft - walkX;
        modalMapContainer.scrollTop = modalScrollTop - walkY;
    });

    modalMapContainer.addEventListener('touchmove', (e) => {
        if (!isModalDragging) return;
        hasDragged = true;
        const x = e.touches[0].pageX - modalMapContainer.offsetLeft;
        const y = e.touches[0].pageY - modalMapContainer.offsetTop;
        const walkX = (x - modalDragStartX);
        const walkY = (y - modalDragStartY);
        modalMapContainer.scrollLeft = modalScrollLeft - walkX;
        modalMapContainer.scrollTop = modalScrollTop - walkY;
    });

    modalMapContainer.addEventListener('mouseup', (e) => {
        isModalDragging = false;
        modalMapContainer.style.cursor = 'grab';
        if (!hasDragged) {
            handlePinPlacement(e);
        }
    });

    modalMapContainer.addEventListener('touchend', (e) => {
        isModalDragging = false;
        if (!hasDragged) {
            handlePinPlacement(e);
        }
    });

    confirmLocationBtn.addEventListener('click', () => {
        if (selectedPinCoords) {
            locationInput.value = `PSAD56: ${selectedPinCoords.x.toFixed(3)}, ${selectedPinCoords.y.toFixed(3)}`;
            coordinatesSpan.innerHTML = `<strong>PSAD56 UTM 17S:</strong> ${Math.round(selectedPinCoords.x)}E, ${Math.round(selectedPinCoords.y)}N`;
            locationDisplay.classList.add('show');
            showMessage('Ubicación seleccionada desde el mapa.');
            mapModal.style.display = 'none';
        }
    });

    window.addEventListener('click', (event) => {
        if (event.target == mapModal) {
            mapModal.style.display = 'none';
        }
    });

    // Tab navigation
    const navButtons = document.querySelectorAll('.nav-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    navButtons.forEach(button => {
        button.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            navButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            
            tabContents.forEach(content => {
                content.classList.remove('active');
                if (content.id === tabId) {
                    content.classList.add('active');
                }
            });
            
            if (tabId === 'observaciones') {
                loadObservations();
            } else if (tabId === 'mapa') {
                loadMap();
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

    setDateTime();
    
    workFrontHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown('work-front-dropdown');
    });

    tagHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown('tag-dropdown');
    });

    function toggleDropdown(dropdownId) {
        const dropdown = document.getElementById(dropdownId);
        const options = dropdown.querySelector('.dropdown-options');
        const allDropdowns = document.querySelectorAll('.dropdown-card');
        
        allDropdowns.forEach(d => {
            if (d !== dropdown) {
                d.classList.remove('active');
                d.querySelector('.dropdown-options').style.display = 'none';
            }
        });
        
        dropdown.classList.toggle('active');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    }
    
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
    
    document.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.getAttribute('data-value');
            let text = this.textContent.trim();
            if (this.querySelector('.tag-color')) {
                const tagColor = this.querySelector('.tag-color').outerHTML;
                text = this.innerHTML.replace(tagColor, '').replace(/<i[^>]*>.*?<\/i>/g, '').trim();
            }
            
            const dropdown = this.closest('.dropdown-card');
            const hiddenInput = dropdown.querySelector('input[type="hidden"]');
            const selectedDisplay = dropdown.querySelector('.dropdown-header span:first-child');

            hiddenInput.value = value;
            selectedDisplay.innerHTML = text;

            closeAllDropdowns();

            if (hiddenInput.id === 'work-front') {
                hiddenInput.dispatchEvent(new Event('change'));
            }
        });
    });
    
    workFrontSelect.addEventListener('change', function() {
        additionalInfoGroup.style.display = this.value === 'drenes_plataforma' ? 'block' : 'none';
    });
    
    if (workFrontSelect.value === 'drenes_plataforma') {
        additionalInfoGroup.style.display = 'block';
    }
    
    photoInput.addEventListener('change', function() {
        photoPreview.innerHTML = '';
        Array.from(this.files).forEach(file => {
            const reader = new FileReader();
            reader.onload = function(e) {
                const img = document.createElement('img');
                img.src = e.target.result;
                photoPreview.appendChild(img);
            }
            reader.readAsDataURL(file);
        });
    });
    
    function checkForUpdates() {
        const remoteVersion = '1.4.1'; 
        if (compareVersions(APP_VERSION, remoteVersion) < 0) {
            if (confirm(`Hay una nueva versión (${remoteVersion}) disponible. ¿Desea actualizar ahora?`)) {
                localStorage.setItem('appVersion', remoteVersion);
                location.reload(true);
            }
        }
    }

    window.addEventListener('online', () => showMessage('Conectado a internet. Comprobando actualizaciones...'));
    
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
    
    window.forceAppUpdate = function() {
        localStorage.setItem('appVersion', APP_VERSION);
        showMessage(`Versión ${APP_VERSION} instalada correctamente`);
    }
    
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
        const E2 = E * E;
        const E_P2 = E / (1 - E);
        const a = 6378137.0;
        const isSouthern = lat < 0;
        
        const latRad = lat * Math.PI / 180;
        const lngRad = lng * Math.PI / 180;
        const lngOriginRad = ((Math.abs(zoneNumber) - 1) * 6 - 180 + 3) * Math.PI / 180;
        
        const N = a / Math.sqrt(1 - E * Math.pow(Math.sin(latRad), 2));
        const T = Math.pow(Math.tan(latRad), 2);
        const C = E_P2 * Math.pow(Math.cos(latRad), 2);
        const A = Math.cos(latRad) * (lngRad - lngOriginRad);
        
        const M = a * ((1 - E / 4 - 3 * E2 / 64 - 5 * (E2*E) / 256) * latRad - (3 * E / 8 + 3 * E2 / 32 + 45 * (E2*E) / 1024) * Math.sin(2 * latRad) + (15 * E2 / 256 + 45 * (E2*E) / 1024) * Math.sin(4 * latRad) - (35 * (E2*E) / 3072) * Math.sin(6 * latRad));
        
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
    
    getLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            getLocationBtn.disabled = true;
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const { latitude: lat, longitude: lng, accuracy } = position.coords;
                    const psad56Coords = convertToPSAD56(lat, lng);
                    locationInput.value = `WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                    coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong> ${psad56Coords.utmEasting}E, ${psad56Coords.utmNorthing}N (±${accuracy.toFixed(2)}m)`;
                    locationDisplay.classList.add('show');
                    getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> GPS';
                    getLocationBtn.disabled = false;
                    showMessage('Ubicación GPS obtenida y convertida a PSAD56 UTM 17S');
                },
                function(error) {
                    const messages = {
                        [error.PERMISSION_DENIED]: 'Permiso de ubicación denegado.',
                        [error.POSITION_UNAVAILABLE]: 'Información de ubicación no disponible.',
                        [error.TIMEOUT]: 'Tiempo de espera agotado para obtener ubicación.'
                    };
                    showMessage('Error: ' + (messages[error.code] || 'Error desconocido al obtener ubicación.'));
                    getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> GPS';
                    getLocationBtn.disabled = false;
                },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
            );
        } else {
            showMessage('La geolocalización no es soportada por este navegador.');
        }
    });
    
    clearFormBtn.addEventListener('click', function() {
        if (confirm('¿Está seguro de que desea limpiar el formulario?')) {
            form.reset();
            setDateTime();
            locationDisplay.classList.remove('show');
            coordinatesSpan.textContent = '';
            photoPreview.innerHTML = '';
            additionalInfoGroup.style.display = 'none';
        }
    });
    
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
        additionalInfoGroup.style.display = 'none';
        showMessage('¡Observación guardada exitosamente!');
        loadObservations();
    });
    
    exportBtn.addEventListener('click', exportData);
    
    clearBtn.addEventListener('click', function() {
        if (confirm('¿Está seguro de que desea eliminar todas las observaciones? Esta acción no se puede deshacer.')) {
            localStorage.removeItem('observations');
            localStorage.removeItem('lastSaved');
            loadObservations();
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
        return JSON.parse(localStorage.getItem('observations') || '[]');
    }
    
    function loadObservations() {
        const observations = getObservations();
        observationsList.innerHTML = '';
        if (observations.length === 0) {
            observationsList.innerHTML = '<div class="no-observations">No hay observaciones registradas aún</div>';
            return;
        }
        observations.sort((a, b) => new Date(b.datetime) - new Date(a.datetime));
        
        observations.forEach(observation => {
            const observationCard = document.createElement('div');
            observationCard.className = 'observation-card';
            const { name: tagName, color: tagColor } = formatTag(observation.tag);
            observationCard.style.borderLeftColor = tagColor;

            let photosHTML = '';
            if (observation.photos && observation.photos.length > 0) {
                photosHTML = `<div class="observation-detail full-width"><strong>Fotos:</strong><br><div class="photo-thumbnails">
                    ${observation.photos.map((photo, index) => `<img src="${photo}" alt="Foto ${index + 1}" class="observation-photo-thumbnail">`).join('')}
                </div></div>`;
            }

            let downloadBtnsHTML = '';
            if (observation.photos && observation.photos.length > 0) {
                downloadBtnsHTML = observation.photos.map((photo, index) => 
                    `<button class="download-photo-btn" data-id="${observation.id}" data-photo-index="${index}">Descargar Foto ${index + 1}</button>`
                ).join('');
            }
            
            observationCard.innerHTML = `
                <h3>${observation.location} <small>(${formatDateTime(observation.datetime)})</small></h3>
                <div class="observation-details">
                    <div class="observation-detail"><strong>Frente de Trabajo:</strong> ${formatWorkFront(observation.workFront)}</div>
                    <div class="observation-detail"><strong>Tipo:</strong> <span class="tag-display" style="background-color: ${tagColor}">${tagName}</span></div>
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
                deleteObservation(parseInt(this.getAttribute('data-id')));
            });
        });

        document.querySelectorAll('.download-photo-btn').forEach(button => {
            button.addEventListener('click', function() {
                const id = parseInt(this.getAttribute('data-id'));
                const photoIndex = parseInt(this.getAttribute('data-photo-index'));
                const observation = getObservations().find(obs => obs.id === id);
                if (observation?.photos?.[photoIndex]) {
                    const link = document.createElement('a');
                    link.href = observation.photos[photoIndex];
                    link.download = observation.photoFileNames[photoIndex] || `foto_${id}_${photoIndex}.jpeg`;
                    link.click();
                }
            });
        });
    }
    
    function deleteObservation(id) {
        let observations = getObservations().filter(obs => obs.id !== id);
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
        const observationsForJson = observations.map(({ photos, ...obs }) => obs);

        zip.file(`libreta_campo_${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(observationsForJson, null, 2));

        observations.forEach(obs => {
            if (obs.photos && obs.photoFileNames) {
                obs.photos.forEach((photoData, index) => {
                    zip.file(obs.photoFileNames[index], photoData.split(',')[1], { base64: true });
                });
            }
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const url = URL.createObjectURL(content);
            const linkElement = document.createElement('a');
            linkElement.href = url;
            linkElement.download = `export_libreta_campo_${new Date().toISOString().slice(0,10)}.zip`;
            linkElement.click();
            URL.revokeObjectURL(url);
            showMessage('¡Datos exportados exitosamente en un archivo ZIP!');
        } catch (error) {
            showMessage('Error al generar el archivo ZIP.');
        }
    }

    function resizeImage(file, maxWidth = 1280) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const { width: w, height: h } = img;
                    const ratio = w / h;
                    
                    canvas.width = w > maxWidth ? maxWidth : w;
                    canvas.height = w > maxWidth ? maxWidth / ratio : h;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg'));
                };
                img.onerror = reject;
                img.src = event.target.result;
            }
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }
    
    function showMessage(message) {
        if (typeof Toastify === 'function') {
            Toastify({
                text: message,
                duration: 3000,
                close: true,
                gravity: "top",
                position: "right",
                backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
                stopOnFocus: true,
            }).showToast();
        } else {
            alert(message);
        }
    }
    
    function formatDateTime(dateTimeString) {
        return new Date(dateTimeString).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    function formatNotesWithBullets(notes) {
        if (!notes) return '';
        return notes.split('\n').map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('•')) {
                return `<div class="bullet-item">${trimmed.substring(1).trim()}</div>`;
            } else if (trimmed) {
                return `<div class="regular-item">${trimmed}</div>`;
            }
            return '';
        }).join('');
    }
    
    function formatWorkFront(workFrontValue) {
        const fronts = {
            'corona': 'Corona',
            'estribo_izquierdo': 'Estríbo Izquierdo',
            'estribo_derecho': 'Estríbo Derecho',
            'banda_5': 'Banda 5',
            'banda_6': 'Banda 6',
            'dren_inclinado': 'Dren Inclinado',
            'talud': 'Talud',
            'drenes_plataforma': 'Drenes y Plataforma'
        };
        return fronts[workFrontValue] || workFrontValue;
    }

    function formatTag(tagValue) {
        const tags = {
            'importante': { name: 'Importante', color: '#e74c3c' },
            'novedad': { name: 'Novedad', color: '#f1c40f' },
            'rutina': { name: 'Rutina', color: '#3498db' }
        };
        return tags[tagValue] || { name: tagValue, color: '#bdc3c7' };
    }
    
    // --- MAP FUNCTIONALITY ---
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
        
        if (mapImage.complete) {
            updateMapZoom();
        } else {
            mapImage.onload = updateMapZoom;
        }
        
        document.getElementById('zoom-in').addEventListener('click', () => { zoomLevel = Math.min(zoomLevel + 0.2, 3); updateMapZoom(); });
        document.getElementById('zoom-out').addEventListener('click', () => { zoomLevel = Math.max(zoomLevel - 0.2, 0.5); updateMapZoom(); });
        document.getElementById('reset-view').addEventListener('click', () => {
            zoomLevel = 1;
            mapContainer.scrollLeft = 0;
            mapContainer.scrollTop = 0;
            updateMapZoom();
        });
        
        let isDragging = false;
        let dragStartX, dragStartY;
        
        mapContainer.addEventListener('mousedown', function(e) {
            if (e.target === mapImage || e.target === mapOverlay) {
                isDragging = true;
                dragStartX = e.clientX - mapContainer.offsetLeft;
                dragStartY = e.clientY - mapContainer.offsetTop;
                mapContainer.style.cursor = 'grabbing';
            }
        });
        
        mapContainer.addEventListener('mousemove', function(e) {
            if (isDragging) {
                const x = e.clientX - dragStartX;
                const y = e.clientY - dragStartY;
                mapContainer.style.left = x + "px";
                mapContainer.style.top = y + "px";
                e.preventDefault();
            }
            
            const rect = mapContainer.getBoundingClientRect();
            const x_coord = e.clientX - rect.left;
            const y_coord = e.clientY - rect.top;
            const psad56Coords = imageToPSAD56(x_coord, y_coord);
            if (psad56Coords) {
                document.getElementById('map-coordinates').textContent = `Coordenadas: ${psad56Coords.x.toFixed(3)}, ${psad56Coords.y.toFixed(3)}`;
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
            mapContainer.style.cursor = 'grab';
        });
        
        mapContainer.addEventListener('mouseleave', () => document.getElementById('map-coordinates').textContent = 'Coordenadas: --');
    }
    
    function updateMapZoom() {
        if (!mapImage) return;
        mapImage.style.width = (mapImage.naturalWidth * zoomLevel) + 'px';
        mapImage.style.height = (mapImage.naturalHeight * zoomLevel) + 'px';
        updateMapMarkers();
    }
    
    function updateMapMarkers() {
        if (!mapOverlay) return;
        mapOverlay.innerHTML = '';
        getObservations().forEach(obs => {
            if (obs.coordinates?.psad56?.easting && obs.coordinates?.psad56?.northing) {
                const { easting, northing } = obs.coordinates.psad56;
                const imgCoords = psad56ToImage(easting, northing);
                if (imgCoords) {
                    const marker = document.createElement('div');
                    marker.className = 'map-marker';
                    // Ensure the marker stays within the map bounds
                    const boundedX = Math.max(0, Math.min(imgCoords.x, mapImage.clientWidth || mapImage.width));
                    const boundedY = Math.max(0, Math.min(imgCoords.y, mapImage.clientHeight || mapImage.height));
                    
                    marker.style.left = boundedX + 'px';
                    marker.style.top = boundedY + 'px';
                    marker.style.color = formatTag(obs.tag).color;
                    
                    const icons = { 'importante': 'fa-exclamation-triangle', 'novedad': 'fa-exclamation-circle', 'rutina': 'fa-check-circle' };
                    marker.innerHTML = `<i class="fas ${icons[obs.tag] || 'fa-circle'}"></i>`;
                    
                    marker.addEventListener('click', () => showObservationDetails(obs));
                    marker.title = `${obs.location} (${formatDateTime(obs.datetime)})`;
                    mapOverlay.appendChild(marker);
                }
            }
        });
    }
    
    function psad56ToImage(easting, northing) {
        if (easting < mapBounds.minX || easting > mapBounds.maxX || northing < mapBounds.minY || northing > mapBounds.maxY) {
            return null;
        }
        const imgWidth = mapImage ? mapImage.clientWidth : 0;
        const imgHeight = mapImage ? mapImage.clientHeight : 0;
        const x = ((easting - mapBounds.minX) / (mapBounds.maxX - mapBounds.minX)) * imgWidth;
        const y = imgHeight - ((northing - mapBounds.minY) / (mapBounds.maxY - mapBounds.minY)) * imgHeight;
        return { x, y };
    }
    
    function imageToPSAD56(x, y) {
        const imgWidth = modalMapImage.clientWidth;
        const imgHeight = modalMapImage.clientHeight;
        if (imgWidth === 0 || imgHeight === 0) return null;
        
        const easting = mapBounds.minX + (x / imgWidth) * (mapBounds.maxX - mapBounds.minX);
        const northing = mapBounds.minY + ((imgHeight - y) / imgHeight) * (mapBounds.maxY - mapBounds.minY);
        
        return { x: easting, y: northing };
    }
    
    function showObservationDetails(observation) {
        const details = `
            <h3>${observation.location}</h3>
            <p><strong>Fecha y Hora:</strong> ${formatDateTime(observation.datetime)}</p>
            <p><strong>Frente de Trabajo:</strong> ${formatWorkFront(observation.workFront)}</p>
            <p><strong>Tipo:</strong> <span class="tag-display" style="background-color: ${formatTag(observation.tag).color}">${formatTag(observation.tag).name}</span></p>
            <p><strong>Coordenadas PSAD56 UTM 17S:</strong> ${observation.coordinates.psad56.easting}E, ${observation.coordinates.psad56.northing}N</p>
            ${observation.additionalInfo ? `<p><strong>Info Adicional:</strong> ${observation.additionalInfo}</p>` : ''}
            ${observation.notes ? `<p><strong>Actividades Realizadas:</strong><br>${formatNotesWithBullets(observation.notes).replace(/<div class="bullet-item">/g, '• ').replace(/<\/div>/g, '<br>').replace(/<div class="regular-item">/g, '').replace(/<\/div>/g, '<br>')}</p>` : ''}
            ${observation.photos?.length > 0 ? `<p><strong>Fotos:</strong> ${observation.photos.length} foto(s)</p>` : ''}
        `;
        // This should be a modal, but for now, it's an alert.
        alert(details.replace(/<[^>]*>/g, ''));
    }
    
    if (mapInitialized) {
        updateMapMarkers();
    }
});

// Fallback for Toastify
if (typeof Toastify === 'undefined') {
    window.showMessage = alert;
}
