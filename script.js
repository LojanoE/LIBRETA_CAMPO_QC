// Libreta de Campo - JavaScript functionality

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
    updateLastSavedDisplay();
    
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
    const coronamientoSelect = document.getElementById('coronamiento'); // hidden input
    const coronamientoHeader = document.getElementById('coronamiento-header');
    const coronamientoOptions = document.getElementById('coronamiento-options');
    const selectedCoronamiento = document.getElementById('selected-coronamiento');
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
    const addMorePhotosBtn = document.getElementById('add-more-photos');
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
    
    // Coronamiento dropdown functionality
    coronamientoHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown('coronamiento-dropdown');
    });

    document.querySelectorAll('#coronamiento-options .dropdown-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.getAttribute('data-value');
            const text = this.textContent.trim();
            
            coronamientoSelect.value = value;
            selectedCoronamiento.textContent = text;
            closeAllDropdowns();
        });
    });
    
    // Get reference to the "otros" input field and its container
    const otrosInputGroup = document.getElementById('otros-input-group');
    const otrosInput = document.getElementById('otros-input');
    
    // Get references to the search input and options
    const workFrontSearch = document.getElementById('work-front-search');
    const workFrontOptionsContainer = document.getElementById('work-front-options');
    
    workFrontSelect.addEventListener('change', function() {
        additionalInfoGroup.style.display = this.value === 'drenes_plataforma' ? 'block' : 'none';
        
        // Show manual input group for 'otros' (Otros)
        if (this.value === 'otros') {
            otrosInputGroup.style.display = 'block';
        } else {
            otrosInputGroup.style.display = 'none';
        }
    });
    
    // Add search functionality for work front options
    workFrontSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        const options = workFrontOptionsContainer.querySelectorAll('.dropdown-option');
        
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            const value = option.getAttribute('data-value').toLowerCase();
            
            if (text.includes(searchTerm) || value.includes(searchTerm)) {
                option.style.display = 'block';
            } else {
                option.style.display = 'none';
            }
        });
    });
    
    if (workFrontSelect.value === 'drenes_plataforma') {
        additionalInfoGroup.style.display = 'block';
    }
    
    // Variable para almacenar los archivos de fotos seleccionados
    let selectedPhotoFiles = []; // Ahora almacena objetos { dataUrl, name }

    function updatePhotoPreview() {
        photoPreview.innerHTML = '';
        selectedPhotoFiles.forEach(photo => {
            const img = document.createElement('img');
            img.src = photo.dataUrl;
            photoPreview.appendChild(img);
        });
        addMorePhotosBtn.style.display = selectedPhotoFiles.length > 0 ? 'block' : 'none';
    }

    function loadPendingPhotos() {
        selectedPhotoFiles = JSON.parse(localStorage.getItem('pendingPhotos') || '[]');
        if (selectedPhotoFiles.length > 0) {
            updatePhotoPreview();
        }
    }

    // Cargar fotos pendientes al iniciar
    loadPendingPhotos();
    
    photoInput.addEventListener('change', async function() {
        const newFiles = Array.from(this.files);
        if (newFiles.length === 0) return;

        // Procesar imágenes en segundo plano sin mostrar mensaje
        try {
            const photoPromises = newFiles.map(file => {
                return new Promise((resolve, reject) => {
                    EXIF.getData(file, async function() {
                        const metadata = EXIF.getAllTags(this);
                        const resizedDataUrl = await resizeImage(file);
                        const originalDataUrl = await new Promise(res => {
                            const reader = new FileReader();
                            reader.onload = e => res(e.target.result);
                            reader.readAsDataURL(file);
                        });
                        const uniqueName = `observacion_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpeg`;

                        if (metadata.GPSLatitude && metadata.GPSLongitude) {
                            const lat = convertDMSToDD(metadata.GPSLatitude, metadata.GPSLatitudeRef);
                            const lon = convertDMSToDD(metadata.GPSLongitude, metadata.GPSLongitudeRef);
                            const psad56Coords = convertToPSAD56(lat, lon);
                            locationInput.value = `WGS84: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                            coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lon.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong> ${psad56Coords.utmEasting}E, ${psad56Coords.utmNorthing}N`;
                            locationDisplay.classList.add('show');
                            showMessage('Metadatos de ubicación extraídos de la foto.');
                        }

                        resolve({
                            dataUrl: resizedDataUrl,
                            originalDataUrl: originalDataUrl,
                            name: uniqueName,
                            metadata: {
                                dateTime: metadata.DateTimeOriginal,
                                gpsLatitude: metadata.GPSLatitude,
                                gpsLongitude: metadata.GPSLongitude,
                                gpsLatitudeRef: metadata.GPSLatitudeRef,
                                gpsLongitudeRef: metadata.GPSLongitudeRef,
                            }
                        });
                    });
                });
            });
            
            const newPhotos = await Promise.all(photoPromises);
            
            selectedPhotoFiles = [...selectedPhotoFiles, ...newPhotos];
            
            updatePhotoPreview();
            
            localStorage.setItem('pendingPhotos', JSON.stringify(selectedPhotoFiles));
            
        } catch (error) {
            showMessage('Error al procesar una imagen.');
            console.error(error);
        }
    });

    function convertDMSToDD(dms, ref) {
        if (!dms || dms.length !== 3) return 0;
        const degrees = dms[0].numerator / dms[0].denominator;
        const minutes = dms[1].numerator / dms[1].denominator;
        const seconds = dms[2].numerator / dms[2].denominator;
        let dd = degrees + minutes / 60 + seconds / 3600;
        if (ref === "S" || ref === "W") {
            dd = dd * -1;
        }
        return dd;
    }
    
    // Funcionalidad para el botón de añadir más fotos
    addMorePhotosBtn.addEventListener('click', function() {
        // Limpiar el input de archivos para permitir volver a seleccionar los mismos archivos si es necesario
        photoInput.value = '';
        // Simular click en el input para seleccionar más fotos
        photoInput.click();
    });
    
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
            selectedPhotoFiles = []; // Limpiar la variable de fotos seleccionadas
            addMorePhotosBtn.style.display = 'none'; // Ocultar el botón de añadir más fotos
            additionalInfoGroup.style.display = 'none';
        }
    });
    
    loadObservations();
    
    form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const photosData = selectedPhotoFiles.map(p => p.dataUrl);
        const originalPhotosData = selectedPhotoFiles.map(p => p.originalDataUrl);
        const photoFileNames = selectedPhotoFiles.map(p => p.name);
        const photoMetadata = selectedPhotoFiles.map(p => p.metadata);

        // If 'otros' is selected and there's manual input, use the manual input value
        let workFrontValue = document.getElementById('work-front').value;
        if (workFrontValue === 'otros' && otrosInput.value.trim() !== '') {
            workFrontValue = otrosInput.value.trim();
        } else if (workFrontValue === 'otros' && otrosInput.value.trim() === '') {
            // If 'otros' is selected but no manual input was provided, use 'Otros' as the value
            workFrontValue = 'Otros';
        }

        const formData = {
            id: Date.now(),
            datetime: document.getElementById('date-time').value,
            location: document.getElementById('location').value,
            coordinates: {
                wgs84: extractWGS84Coords(document.getElementById('location').value),
                psad56: extractPSAD56Coords(coordinatesSpan.textContent)
            },
            workFront: workFrontValue,
            coronamiento: coronamientoSelect.value,
            tag: document.getElementById('tag').value,
            additionalInfo: document.getElementById('additional-info').value,
            notes: notesTextarea.value,
            photos: photosData,
            originalPhotos: originalPhotosData,
            photoFileNames: photoFileNames,
            photoMetadata: photoMetadata, // Add metadata here
            timestamp: new Date().toISOString()
        };
        
        saveObservation(formData);
        form.reset();
        setDateTime();
        locationDisplay.classList.remove('show');
        coordinatesSpan.textContent = '';
        additionalInfoGroup.style.display = 'none';
        // Hide the otros input group when form is reset
        otrosInputGroup.style.display = 'none';
        // Ensure the work front dropdown shows the placeholder text after reset
        document.getElementById('selected-work-front').textContent = 'Seleccione un frente';
        
        // Limpiar fotos pendientes
        selectedPhotoFiles = [];
        localStorage.removeItem('pendingPhotos');
        updatePhotoPreview();

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
                    ${observation.photos.map((photo, index) => {
                        let metadataHTML = '';
                        if (observation.photoMetadata && observation.photoMetadata[index]) {
                            const metadata = observation.photoMetadata[index];
                            const dateTime = metadata.dateTime ? `<p>Tomada: ${metadata.dateTime}</p>` : '';
                            let gps = '';
                            if (metadata.gpsLatitude && metadata.gpsLongitude) {
                                const lat = convertDMSToDD(metadata.gpsLatitude, metadata.gpsLatitudeRef);
                                const lon = convertDMSToDD(metadata.gpsLongitude, metadata.gpsLongitudeRef);
                                gps = `<p>GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}</p>`;
                            }
                            metadataHTML = `<div class="photo-metadata">${dateTime}${gps}</div>`;
                        }
                        return `<div><img src="${photo}" alt="Foto ${index + 1}" class="observation-photo-thumbnail">${metadataHTML}</div>`;
                    }).join('')}
                </div></div>`;
            }

            let downloadBtnsHTML = '';
            if (observation.originalPhotos && observation.originalPhotos.length > 0) {
                downloadBtnsHTML = observation.originalPhotos.map((photo, index) => 
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
                if (observation?.originalPhotos?.[photoIndex]) {
                    const link = document.createElement('a');
                    link.href = observation.originalPhotos[photoIndex];
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
        if (typeof JSZip === 'undefined') {
            alert('La biblioteca JSZip no está disponible. Por favor, asegúrese de que jszip.min.js se ha cargado correctamente.');
            console.error('JSZip no está definido');
            
            // Alternativa: exportar solo los datos JSON sin archivos adjuntos
            const observations = getObservations();
            if (observations.length === 0) {
                alert('No hay datos para exportar');
                return;
            }
            
            // Crear un objeto con las observaciones pero sin las fotos (porque no se puede exportar archivos sin JSZip)
            const observationsForJson = observations.map(({ photos, originalPhotos, photoFileNames, ...obs }) => obs);
            
            const dataStr = JSON.stringify(observationsForJson, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            const url = URL.createObjectURL(dataBlob);
            const linkElement = document.createElement('a');
            linkElement.href = url;
            const jsonNow = new Date();
            const jsonTimestamp = jsonNow.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-mm-ss
            linkElement.download = `libreta_campo_${jsonTimestamp}.json`;
            linkElement.click();
            URL.revokeObjectURL(url);
            
            showMessage('Los datos se exportaron como JSON (solo se incluyeron los metadatos, sin fotos).');
            return;
        }
        
        const observations = getObservations();
        if (observations.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const zip = new JSZip();
        const observationsForJson = observations.map(({ photos, originalPhotos, ...obs }) => obs);

        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-mm-ss
        zip.file(`libreta_campo_${timestamp}.json`, JSON.stringify(observationsForJson, null, 2));

        observations.forEach(obs => {
            if (obs.originalPhotos && obs.photoFileNames) {
                obs.originalPhotos.forEach((photoData, index) => {
                    zip.file(obs.photoFileNames[index], photoData.split(',')[1], { base64: true });
                });
            }
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const fileName = `export_libreta_campo_${timestamp}.zip`;
            
            // Comprobar si la API de Compartir está disponible
            if (navigator.share && navigator.canShare) {
                // Crear un archivo blob con el contenido
                const file = new File([content], fileName, { type: content.type });
                
                // Comprobar si el archivo puede ser compartido
                if (navigator.canShare({ files: [file] })) {
                    try {
                        await navigator.share({
                            title: 'Exportación Libreta de Campo',
                            text: 'Datos exportados de la libreta de campo',
                            files: [file]
                        });
                        showMessage('¡Datos compartidos exitosamente!');
                    } catch (shareError) {
                        // Si falla el compartir, usar método alternativo
                        console.log('Compartir falló:', shareError);
                        const url = URL.createObjectURL(content);
                        const linkElement = document.createElement('a');
                        linkElement.href = url;
                        linkElement.download = fileName;
                        linkElement.click();
                        URL.revokeObjectURL(url);
                        showMessage('¡Datos exportados exitosamente en un archivo ZIP!');
                    }
                } else {
                    // Si no se puede compartir el archivo, descargar normalmente
                    const url = URL.createObjectURL(content);
                    const linkElement = document.createElement('a');
                    linkElement.href = url;
                    linkElement.download = fileName;
                    linkElement.click();
                    URL.revokeObjectURL(url);
                    showMessage('¡Datos exportados exitosamente en un archivo ZIP!');
                }
            }
            else {
                // Si la API de Compartir no está disponible, usar descarga normal
                const url = URL.createObjectURL(content);
                const linkElement = document.createElement('a');
                linkElement.href = url;
                linkElement.download = fileName;
                linkElement.click();
                URL.revokeObjectURL(url);
                showMessage('¡Datos exportados exitosamente en un archivo ZIP!');
            }
        } catch (error) {
            console.error('Error al generar el archivo ZIP:', error);
            showMessage('Error al generar el archivo ZIP: ' + error.message);
        }
    }

    function resizeImage(file, maxWidth = 1280) {
        return new Promise((resolve, reject) => {
            // Si la imagen es pequeña, no la redimensionamos
            if (file.size < 200000) { // Menos de 200KB, no redimensionar
                const reader = new FileReader();
                reader.onload = function(event) {
                    resolve(event.target.result);
                };
                reader.onerror = reject;
                reader.readAsDataURL(file);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(event) {
                const img = new Image();
                img.onload = function() {
                    const canvas = document.createElement('canvas');
                    const { width: w, height: h } = img;
                    
                    // Solo redimensionar si la imagen es mayor que el ancho máximo
                    if (w <= maxWidth) {
                        canvas.width = w;
                        canvas.height = h;
                    } else {
                        const ratio = h / w;
                        canvas.width = maxWidth;
                        canvas.height = maxWidth * ratio;
                    }
                    
                    const ctx = canvas.getContext('2d');
                    // Configurar opciones para una mejor calidad/fps
                    ctx.imageSmoothingEnabled = true;
                    ctx.imageSmoothingQuality = 'high';
                    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                    resolve(canvas.toDataURL('image/jpeg', 0.8)); // Calidad 80% para mejor rendimiento
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
            'estribo_izquierdo': 'Estribo Izquierdo',
            'estribo_derecho': 'Estribo Derecho',
            'banda_5': 'Banda 5',
            'banda_6': 'Banda 6',
            'dren_inclinado': 'Dren Inclinado',
            'talud': 'Talud',
            'drenes_plataforma': 'Drenes y Plataforma',
            'acceso_835': 'Acceso 835',
            'acceso_870': 'Acceso 870',
            'acceso_banda_y_p865': 'Acceso Banda y P865',
            'acceso_de_estabilizacion': 'Acceso de estabilización',
            'acceso_fbc5': 'Acceso FBC5',
            'acceso_p960_p980': 'Acceso P960 - P980',
            'acceso_p980_via_12': 'Acceso P980 - Via 12',
            'acceso_subpresa': 'Acceso SubPresa',
            'acceso_sur_c970': 'Acceso Sur C970',
            'bypass_via_del_condor': 'Baipás Vía del Cóndor',
            'berma_de_refuerzo_p830': 'Berma de refuerzo P830',
            'c980_ed_p895_sub1': 'C980-ED P895 (Subsecuencia 1)',
            'c980_ed_p920_sub1': 'C980-ED P920 (Subsecuencia 1)',
            'c980_ei_p890_sub1': 'C980-EI P890 (Subsecuencia 1)',
            'corona_960': 'Corona 960',
            'corona_970': 'Corona 970',
            'coronamiento_945': 'Coronamiento 945',
            'dren_28_a': 'Dren 28 A',
            'dren_980_a': 'Dren 980-A',
            'dren_980_b': 'Dren 980-B',
            'dren_acceso_p980': 'Dren Acceso P980',
            'dren_basal': 'Dren Basal',
            'dren_d_24': 'Dren D-24',
            'dren_d_25': 'Dren D-25',
            'dren_de_derivacion': 'Dren de Derivación',
            'dren_derivacion_01': 'Dren de Derivación D-01',
            'dren_derivacion_02': 'Dren de Derivación D-02',
            'dren_derivacion_03': 'Dren de Derivación D-03',
            'dren_derivacion_04': 'Dren de Derivación D-04',
            'dren_derivacion_05': 'Dren de Derivación D-05',
            'dren_derivacion_06': 'Dren de Derivación D-06',
            'dren_derivacion_vc': 'Dren de Derivación D-V.C.',
            'dren_derivacion_p980': 'Dren de derivación P980',
            'dren_derivacion_37': 'Dren Derivación 37',
            'dren_existente_p885': 'Dren existente P885',
            'dren_inclinado': 'Dren Inclinado',
            'dren_inclinado_p970_ei': 'Dren Inclinado P970 E.I.',
            'dren_inclinado_subpresa': 'Dren Inclinado Subpresa',
            'hombro_izquierdo': 'Hombro Izquierdo',
            'impermeabilizacion_c970': 'Impermeabilizacion C970',
            'p835': 'P835',
            'p845_estribo_izq': 'P845 Estribo Izq.',
            'p865_estribo_der': 'P865 Estribo der',
            'p865_estribo_izq_1': 'P865 Estribo Izq',
            'p865_estribo_izq_2': 'P865 Estribo Izq',
            'p870_acceso_fbc6': 'P870 (acceso a la FBC6)',
            'p885_estribo_der': 'P885 Estribo Der',
            'p885_estribo_izq': 'P885 Estribo Izq',
            'p895_c980_sub1': 'P895 (C980 Subsecuencia 1)',
            'p912_estribo_der': 'P912 Estribo Der.',
            'p912_estribo_izq': 'P912 Estribo Izq',
            'p920_c980_sub1': 'P920 (C980 Subsecuencia 1)',
            'p920_sub2': 'P920 (Subsecuencia 2)',
            'p945_sub5': 'P945 (Subsecuencia 5)',
            'p920_estribo_izquierdo': 'P920 Estribo Izquierdo',
            'p960_acceso_fbc5': 'P960 Acceso FBC5',
            'p960_estribo_der': 'P960 Estribo Der',
            'p960_estribo_izq': 'P960 Estribo Izq',
            'p970_sub3': 'P970 (Subsecuencia 3)',
            'p980': 'P980',
            'plataforma_890': 'Plataforma 890',
            'plataforma_895': 'Plataforma 895',
            'plataforma_920': 'Plataforma 920',
            'plataforma_945': 'Plataforma 945',
            'plataforma_980': 'Plataforma 980',
            'plataforma_dren_basal': 'Plataforma Dren Basal',
            'plataforma_p830': 'Plataforma P830',
            'plataforma_p845': 'Plataforma P845',
            'plataforma_p860': 'Plataforma P860',
            'plataforma_p865': 'Plataforma P865',
            'plataforma_p870': 'Plataforma P870',
            'plataforma_p875': 'Plataforma P875',
            'plataforma_p885': 'Plataforma P885',
            'plataforma_p895_2': 'Plataforma P895',
            'plataforma_p912': 'Plataforma P912',
            'plataforma_p960': 'Plataforma P960',
            'plataforma_p970_ei': 'Plataforma P970 E.I.',
            'plataforma_p980_ei': 'Plataforma P980 E.I.',
            'subdren': 'Subdren',
            'subpresa_c970': 'Subpresa C970',
            'talud_margen_izquierdo': 'Talud Margen Izquierdo',
            'tapete_drenante': 'Tapete Drenante',
            'tapete_drenante_tipo_a': 'Tapete Drenante Tipo A estr. der.',
            'tapete_drenante_tipo_b': 'Tapete Drenante Tipo B estr. izq.',
            'tapete_subpresa': 'Tapete Subpresa',
            'via_al_condor': 'Via al condor',
            'via_alterna_fbc_5': 'Vía Alterna FBC 5',
            'c980_ed_p920_sub2': 'C980-ED P920 (Subsecuencia 2)',
            'c980_ei_p920_sub2': 'C980-EI P920 (Subsecuencia 2)',
            'c980_ei_p950_sub2': 'C980-EI P950 (Subsecuencia 2)',
            'c980_ed_p965_sub2': 'C980-ED P965 (Subsecuencia 2)',
            'p920_cuerpo_principal_sub2': 'P920 Cuerpo principal (C980 Subsec 2)',
            'p965_cuerpo_principal_sub2': 'P965 Cuerpo principal (C980 Subsec 2)',
            'p896_cuerpo_principal_sub2': 'P896 Cuerpo principal (C980 Subsec 2)',
            'otros': 'Otros'
        };
        return fronts[workFrontValue] || workFrontValue;
    }

    function formatCoronamiento(coronamientoValue) {
        const coronamientos = {
            'c970': 'C970',
            'c980': 'C980',
            'c960': 'C960',
            'ninguno': 'Ninguno'
        };
        return coronamientos[coronamientoValue] || coronamientoValue;
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
