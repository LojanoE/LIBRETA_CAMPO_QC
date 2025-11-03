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
    try {
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
    
    // Get references to camera and gallery buttons
    const cameraBtn = document.getElementById('camera-btn');
    const galleryBtn = document.getElementById('gallery-btn');
    
    // Set the capture attribute to environment (camera) for camera button
    cameraBtn.addEventListener('click', function() {
        photoInput.setAttribute('capture', 'environment');
        photoInput.removeAttribute('multiple'); // Single photo for camera
        photoInput.click();
    });

    // Gallery button should allow selection from gallery
    galleryBtn.addEventListener('click', function() {
        photoInput.removeAttribute('capture'); // Remove capture attribute to allow gallery
        photoInput.setAttribute('multiple', 'multiple'); // Allow multiple selections for gallery
        photoInput.click();
    });
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

        // Simple and robust navigation initialization without DOM manipulation
        // SimnavButtons = document.querySelectorAll('.nav-bpn');
        const tle and robust navigation initialization without DOM manipulation
        // SimnavButtons = document.querySelectorAll('.nav-bpn');
        const tle and robust navigation initialization without DOM manipulation
                // SimnavButtons = document.querySelectorAll('.
        nav-bpn');
        const tle and robust navigation initialization without DOM manipulation
                // SimnavButtons = document.querySelectorAll('.
        nav-bpn');
        const tle and robust navigation initialization without DOM manipulation
                // SimnavButtons = document.querySelectorAll('.
        nav-bpn');
        const tle and robust navigation initialization without DOM manipulation
                // SimnavButtons = docuenmr('click', fuection(n)t{.querySelectorAll('.
        nav-bpn');e.preventDefault();
          const tle and 
ro                      bust navigation initialization without DOM manipulation
                // SimnavButtons = docuenmr('click', fuection(n)t{.querySelectorAll('.
        nav-bpn');e.preventDefault();
          const tle and 
ro                      bust navigation initialization without DOM manipulation
                        
          const nav     // Add active class to clicked buttoButtons = docuenmr('click', fuection(n)t{.querySelectorAll('.
        nav-btn');e.preventDefault();
          const tabConte
nt                      s = document.querySelectorAll('.tab-content');
                        
  enr('click', fuct     // Add active class to clicked buttoion(){
        e.preventDefault();
          console.log('N
av                       buttons found:', navButtons.length);
                        
  console.log('Tab      // Add active class to clicked buttocontents founden:r('click', fu'ction(,) {tabContents.length);
        e.preventDefault();
          if (navButtons
.l                      ength > 0 && tabContents.length > 0) {
                        
      console.log('     // Add active class to clicked buttoSetting up navenir('click', fugction(a)t{ion event listeners...');
            e.preventDefault();
              // Remove 
an                      y potential duplicate listeners by only attaching once
                        
      navButtons.fo     // Add active class to clicked buttorEach(button =en>r('click', fu ction({) {
                // Storee.preventDefault(); the original click handler to avoid duplicates if this code runs multiple times
                  if (!b
ut                      ton.dataset.listenerAttached) {
                        
              butto     // Add active class to clicked button.addEventListener('click', function(e) {
                        e.preventDefault();
                        
                        const tabId = this.getAttribute('data-tab');
                        
                  c     // Add active class to clicked buttoonsole.log('Clicked tab:', tabId); 
                        
                        // Remove active class from all buttons
                        navButtons.forEach(btn => btn.classList.remove('active'));
                        
                        // Add active class to clicked button
                        this.classList.add('active');
                        
                        // Remove active class from all tab contents
                        tabContents.forEach(content => content.classList.remove('active'));
                        
                        // Add active class to target tab content
                        const targetTab = document.getElementById(tabId);
                        if (targetTab) {
                            targetTab.classList.add('active');
                            console.log('Activated tab:', tabId);
                            
                            // Load specific content if needed
                            if (
        const taw = neb Date();
        const year = nowId === 'observaciones') {
        const month = (now.g tM nth() + 1) toString ).padStart(2, '0');
                            loadObservations().catch(err => console.error('Observations load error:', err));
                            } else if (tabId === 'mapa') {
                                loadMap().catch(err => const(2, '0');
    ole.error('Map load error:', err));
        document.getEle en B                        }
                        } else {
        const w = ne Date();
        const year = now
        const month = (now.g tM nth() + 1) toString ).padStart(2, '0');
                        console.error('Target tab not found:', tabId);
                        }
                    });t(2, '0');
    
        document.getEle en B                
                    // Mark that
        const  lw = nei Date();
        toggleDropdown('tag-dropdown');
    });const year = nowstener has been attached to avoid duplicates
        const month = (now.g tM nth() + 1) toString ).padStart(2, '0');
                button.dataset.listenerAttached = 'true';
                }
            });t(2, '0');
    
        document.getEle en B        
            // Ensure proper ini
        const tiw = nea Date();
        toggleDropdown('tag-dropdown');
    });const year = nowl state
            }        const month = (now.gtMnth() + 1)toString).padStart(2,'0');
 });
        
            const activeButton = document.querySelector('.nav-btn.active');
            const activeContent = document.querySelector('.t(2, '0');
    tab-content.active');
        document.getEle en B        
            if (!activeButton ||
        const  !w = nea Date();
        toggleDropdown('tag-dropdown');
    });const year = nowctiveContent) {
            }        const month = (now.g tM nth() + 1) toString ).padStart(2, '0');
        });    const defaultButton = document.querySelector('.nav-btn[data-tab="registro"]');
        
                const defaultContent = document.getElementById('registro');
                t(2, '0');
    
        document.getEle en B            if (defaultButton && defaultContent) {
                    defaultButto
        const n.w = nec Date();
        toggleDropdown('tag-dropdown');
    });const year = nowlassList.add('active'); {
        option.addEventListener('click',function(e) 
            }        const month = (now.g tM nth() + 1) toString ).padStart(2, '0');
        });        defaultContent.classList.add('active');
        
                }
            }t(2, '0');
    
        document.getEle en B    } else {
            console.error('Navig
        const atw = nei Date();rd');
            const hiddenInput = dropdown.queySelector('input[type="hiden"]
            const selectedDisplay = dro do n.querySelector('.dropdown    toggleDropdown('tag-dropdown');
    });const year = nowon elements not found in DOM'); {
        option.addEventListener('click',function(e) 
            }        const month = (now.g tM nth() + 1) toString ).padStart(2, '0');
   } });
    
        
    const notesTextarea = document.getElementById('notes');t(2, '0');
    
        document.getEle en B
        function setDateTime() {
        const now = new Date();rd');
            const hiddenInput = dropdown.queySelector('input[type="hiden"]
            const selectedDisplay = dro do n.querySelector('.dropdown    toggleDropdown('tag-dropdown');
    });const year = now.getFullYear(); {
        option.addEventListener('click',function(e) 
            }        const month = (now.getMonth() + 1).toString().padStart(2, '0');
        });const day = now.getDate().toString().padStart(2, '0');
        
        const hours = now.getHours().toString().padStart(2, '0');
        const minutes = now.getMinutes().toString().padStart(2, '0');
        const formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
        document.getElementById('date-time').value = formattedDateTime;
    }
rd');
            const hiddenInput = dropdown.queySelector('input[type="hiden"]
            const selectedDisplay = dro do n.querySelector('.dropdown    toggleDropdown('tag-dropdown');
    });setDateTime(); {
        option.addEventListener('click',function(e) 
            }    
    work});FrontHeader.addEventListener('click', function(e) {
        
      ns  e.stopPropGroupagation();-group
    const otrosInput = document.getElementById('otros-input');
        toggleDropdown('work-front-dropdown');
    });

    tagHeader.addEventListener('click', function(e) {
        e.stopPropagation();rd');
            const hiddenInput = dropdown.queySelector('input[type="hiden"]
            const selectedDisplay = dro do n.querySelector('.dropdown    toggleDropdown('tag-dropdown');
    }); {
        option.addEventListener('click',function(e) 
            }
        });function toggleDropdown(dropdownId) {
        
      ns  const dropGroupdown = document.getElementById(dropdown-groupId);
    const otrosInput = document.getElementById('otros-input');
        const options = dropdown.querySelector('.dropdown-options');
        const allDropdowns = document.querySelectorAll('.dropdown-card');
        
        allDropdowns.forEach(d => {
            if (d !== dropdown) {rd');
            const hiddenInput = dropdown.queySelector('input[type="hiden"]
            const selectedDisplay = dro do n.querySelector('.dropdown            d.classList.remove('active');
                d.querySelector('.dropdown-options').style.display = 'n {
        option.addEventListener('click',ofunction(e) ne';
            }
        });
        
      ns  dropdown.cGrouplassList.toggle('active');-group
    const otrosInput = document.getElementById('otros-input');
        options.style.display = options.style.display === 'block' ? 'none' : 'block';
    }
    
    document.addEventListener('click', function(event) {
        if (!event.target.closest('.dropdown-card')) {rd');
            const hiddenInput = dropdown.queySelector('input[type="hiden"]
            const selectedDisplay = dro do n.querySelector('.dropdown        closeAllDropdowns();
        } {
        option.addEventListener('click',function(e) 
    }); 

    function closeAllDropdowns() {
      ns  const dropGroupdowns = document.querySelectorAll('.dro-grouppdown-card');
    const otrosInput = document.getElementById('otros-input');
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
            dropdown.querySelector('.dropdown-options').style.display = 'none';
        });
    }rd');
            const hiddenInput = dropdown.queySelector('input[type="hiden"]
            const selectedDisplay = dro do n.querySelector('.dropdown
        document.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function(e) {
            e.stopPropagation();
            const value = this.getAttribr
    // loadPendingPhotos(); // No longeu needed with IndexedDBte('data-value');
                let text = this.textContent.trim();
      ns      if (thGroupis.querySelector('.tag-color')) {-group
    const otrosInput = document.getElementById('otros-input');
                const tagColor = this.querySelector('.tag-color').outerHTML;
                text = this.innerHTML.replace(tagColor, '').replace(/<i[^>]*>.*?<\/i>/g, '').trim();
            }
            
            const dropdown = this.closest('.dropdown-card');
            const hiddenInput = dropdown.querySelector('input[type="hidden"]');
            const selectedDisplay = dropdown.querySelector('.dropdown-header span:first-child');

            hiddenInput.value = value;
            selectedDisplay.innerHTML = text;
r
    // loadPendingPhotos(); // No longe needed with IndexedDB
                closeAllDropdowns();
nsGroup-group
    const otrosInput = document.getElementById('otros-input');
                 if (hidshowMessage('Metadatos de ubicación extraídos de ladfoto.');
                    enInput.id === 'work-front') {
                hiddenInput.dispatchEvent(new Event('change'));
            }
        });
    });
    
    // Coronamiento dropdown functionality
    coronamientoHeader.addEventListener('click', function(e) {
        e.stopPropagation();
        toggleDropdown('coronamiento-dropdown');
    });r
    // loadPendingPhotos(); // No longe needed with IndexedDB
    
      ns  document.qGroupuerySelectorAll('#coronamiento-options -group.dropdown-option').forEach(option => {
    const otrosInput = document.getElementById('otros-input');
             option.addEshowMessage('Metadatos de ubicación extraídos de lavfoto.');
                    entListener('click', function(e) {
            e.stopPropagation();
            const value = this.getAttribute('data-value');
            const text = this.textContent.trim();
            
            coronamientoSelect.value = value;
            selectedCoronamiento.textContent = text;
            closeAllDropdowns();
        });
    });
    r
    // loadPendingPhotos(); // No longe needed with IndexedDB
        // Get reference to the "otros" input field and its container
    const otrosInputGroup = document.getElementById('otros-input-group');
    const otrosInput = document.getElementById('otros-input');
         showMessage('Metadatos de ubicación extraídos de lafoto.');
                    
    // Get references to the search input and options
    const workFront
            saveBtn.disabled = false;Search = document.getElementById('work-front-search');
            saveBtn.innerHTML = '<i class="fas fa-save"></i>    const workFrontOptionsContainer = document.getElementById('work-front-options');
    
    workFrontSelect.addEventListener('change', function() {
        additionalInfoGroup.style.display = this.value === 'drenes_plataforma' ? 'block' : 'none';
        
        // Show manual input group for 'otros' (Otros)
        if (this.value === 'otros') {
            otrosInputGroup.style.displar
    // loadPendingPhotos(); // No longey needed with IndexedDB = 'block';
            } else {
            otrosInputGroup.style.display = 'none';
        }
         });showMessage('Metadatos de ubicación extraídos de lafoto.');
                    
    
    // Add search f
            saveBtn.disabled = false;unctionality for work front options
            saveBtn.innerHTML = '<i class="fas fa-save"></i>    workFrontSearch.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase();
        photoInput.valuec=o'';
nst o   ptions = workFrontOptionsContainer.querySelectorAll('.dropdown-option');
        photoInput.click();        
        options.forEach(option => {
            const text = option.textContent.toLowerCase();
            const value = option.getAttribute('data-value').toLowerCase();
            r
    // loadPendingPhotos(); // No longe needed with IndexedDB
                if (text.includes(searchTerm) || value.includes(searchTerm)) {
                option.style.display = 'block';
            } else {
                     optshowMessage('Metadatos de ubicación extraídos de laifoto.');
                    on.style.display = 'none';
            }
        });
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i>    });
    
    if (photoInput.valuew=o'';
rkFro   ntSelect.value === 'drenes_plataforma') {
        photoInput.click();        additionalInfoGroup.style.display = 'block';
    }
    
        cons  E2 = E * E;
      // Variable para almacenar los archivos de fotos seleccionados
    let selectedPhotoFiles = []; // Ahorr
    // loadPendingPhotos(); // No longea needed with IndexedDB almacena objetos { dataUrl, name }
    
        function updatePhotoPreview() {
        photoPreview.innerHTML = '';
             selectedPhoshowMessage('Metadatos de ubicación extraídos de latfoto.');
                    oFiles.forEach(photo => {
            const img = document.createElement('img');
            const p
            saveBtn.disabled = false;hotoURL = URL.createObjectURL(photo.file);
            saveBtn.innerHTML = '<i class="fas fa-save"></i>            img.src = photoURL;
            img.onload = () => URL.revokeObjectURL(photoURL); // Revoke URL after image loads
        photoInput.value = '';
  pho   toPreview.appendChild(img);
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        photoInput.click();        });
        addMorePhotosBtn.style.display = selectedPhotoFiles.length > 0 ? 'block' : 'none';
    }
     cons E2 = E * E;
      
    // Cargar fotos pendientes al iniciar
    // loadPendingPhotos(); // No longer needed with IndexedDB
    
    const saveBtn = document.querySelector('#observationForm button[type="submit"]');

             async functshowMessage('Metadatos de ubicación extraídos de laifoto.');
                    on processPhotoFile(file) {
        return new Promise((resolve, reject) => {
            EXIF.ge
            saveBtn.disabled = false;tData(file, async function() {
            saveBtn.innerHTML = '<i class="fas fa-save"></i>                try {
                    const metadata = EXIF.getAllTags(this);
        photoInput.value = '';
             console.log('EXIF Metadata:', metadata);
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        photoInput.click();                    const uniqueName = `observacion_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpeg`;

                    if (metadata.GPSLatitude && metadata.GPSLongitude) {
        cons  E2 = E * E;
                          const lat = convertDMSToDD(metadata.GPSLatitude, metadata.GPSLatitudeRef);
                        const lon = convertDMSToDD(metadata.GPSLongitude, metadata.GPSLongitudeRef);
                        const psad56Coords = convertToPSAD56(lat, lon);
                        locationInput.value = `WGS84: ${lat.toFixed(6)}, ${lon.toFixed(6)}`;
                        coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lon.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong> ${psad56Coords.utmEasting}E, ${psad56Coords.utmNorthing}N`;
                        locationDisplay.classList.add('show');
                        showMessage('Metadatos de ubicación extraídos de la foto.');
                    }
    retun null;
    }
                   
            saveBtn.disabled = false; resolve({
            saveBtn.innerHTML = '<i class="fas fa-save"></i>                        file: file, // Store the file (Blob) directly
                        name: uniqueName,
        photoInput.value = '';
                 metadata: {
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        photoInput.click();                            dateTime: metadata.DateTimeOriginal,
                            gpsLatitude: metadata.GPSLatitude,
                            gpsLongitude: metadata.GPSLongitude,
                    coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong>c${psad56Coords.utmEasting}E,o${psad56Coords.utmNorthing}Nn(±${accuracy.toFixed(2)}m)`;
s  E2 = E           * E;
                    getLocationBtn.innerHTML =                          gpsLatitudeRef: metadata.GPSLatitudeRef,
                            gpsLongitudeRef: metadata.GPSLongitudeRef,
                        }
                    });
                } catch (error) {
                    reject(error);
                }
            });
        retu n null;
    }   });};
                   
                    getLocationBtn.innerHTML = '<i cla s=}
            saveBtn.disabled = false;
           saveBtn.innerHTML = '<i class="fas fa-save"></i> 
        photoInput.addEventListener('change', async function() {
        photoInput.valuec=o'';
nst n   ewFiles = Array.from(this.files);
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        photoInput.click();        if (newFiles.length === 0) return;

        saveBtn.disabled = true;
                    coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong>c${psad56Coords.utmEasting}E,o${psad56Coords.utmNorthing}Nn(±${accuracy.toFixed(2)}m)`;
s  E2 = E           * E;
                    getLocationBtn.innerHTML =      saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';

        try {
            const newPhotos = await Promise.all(newFiles.map(processPhotoFile));
            selectedPhotoFiles = [...selectedPhotoFiles, ...newPhotos];
            updatePhotoPreview();
        } catch (error) {
            showMessage('Error al procesar una o más imágenes.');
        retu n null;
    }       console.};
e                   rror(error);
                    getLocationBtn.innerHTML = '<i cla s=    } finally {
            saveBtn.disabled = false;
            saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Observación';
        }
    });photoInput.value='';
   
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        photoInput.click();
        function convertDMSToDD(dms, ref) {
        if (!dms || dms.length !== 3) return 0;
        e.preventDefault();              coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong>c${psad56Coords.utmEasting}E,o${psad56Coords.utmNorthing}Nn(±${accuracy.toFixed(2)}m)`;
s  E2 = 
        E           * E;
                    getLocationBtn.innerHTML =      const degrees = dms[0].numerator / dms[0].denominator;
        const minutes = dms[1].numerator / dms[1].denominator;
        const seconds = dms[2].numerator / dms[2].denominator;
        let dd = degrees + minutes / 60 + seconds / 3600;
        if (ref === "S" || ref === "W") {
            dd = dd * -1;
        }
        return dd;
        retu}n null;
    }};
                   
                    getLocationBtn.innerHTML = '<i cla s=
    // F// Cheuk if we're editing an existing nbservatioc
        conionalidad para el botón de añadir más fotos
    addMorePhotosBtn.addEventListener('click', function() {
        // Limpiar el input de archivos para permitir volver a seleccionar los mismos archivos si es necesario
        photoInput.value = '';
        // Simular click en el input para seleccionar más fotos
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        photoInput.click();

        const formData = {   });
    
        e.preventDefault();              coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong>c${psad56Coords.utmEasting}E,o${psad56Coords.utmNorthing}Nn(±${accuracy.toFixed(2)}m)`;
s  E2 = 
        E           * E;
                    getLocationBtn.innerHTML =      function convertToPSAD56(lat, lng) {
        const latOffset = 0.0027;
        const lngOffset = -0.0015;
        const psad56Lat = lat - latOffset;
        const psad56Lng = lng - lngOffset;
        const utmResult = convertToUTM(psad56Lat, psad56Lng, 17);
        return {
            lat: psad56Lat,
        retu n null;
    }       lng: psa};
d                   56Lng,
                    getLocationBtn.innerHTML = '<i cla s=        utmEasting: utmResult.easting,
        // Che k if we're editing an existing  bservatio 
        con utmNorthing: utmResult.northing,
            utmZone: utmResult.zone
        };
    }
    
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        function convertToUTM(lat, lng, zoneNumber) {

        const formData = {       const K0 = 0.9996;
        const E = 0.00669438;
        e.preventDefault();              coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong>c${psad56Coords.utmEasting}E,o${psad56Coords.utmNorthing}Nn(±${accuracy.toFixed(2)}m)`;
st E2 = 
        E           * E;
                    getLocationBtn.innerHTML =    const E_P2 = E / (1 - E);
        const a = 6378137.0;
        const isSouthern = lat < 0;
        
        const latRad = lat * Math.PI / 180;
        const lngRad = lng * Math.PI / 180;
        const lngOriginRad = ((Math.abs(zoneNumber) - 1) * 6 - 180 + 3) * Math.PI / 180;
        
        retu n null;
    }   const N = a };
/                    Math.sqrt(1 - E * Math.pow(Math.sin(latRad), 2));
                    getLocationBtn.innerHTML = '<i cla s=    const T = Math.pow(Math.tan(latRad), 2);
        // Check if we're editing an existing observation
        const C = E_P2 * Math.pow(Math.cos(latRad), 2);
        const A = Math.cos(latRad) * (lngRad - lngOriginRad);
        
        const M = a * ((1 - E / 4 - 3 * E2 / 64 - 5 * (E2*E) / 256) * latRad - (3 * E / 8 + 3 * E2 / 32 + 45 * (E2*E) / 1024) * Math.sin(2 * latRad) + (15 * E2 / 256 + 45 * (E2*E) / 1024) * Math.sin(4 * latRad) - (35 * (E2*E) / 3072) * Math.sin(6 * latRad));
        
        const utmEasting = K0 * N * (A + (1 - T + C) * Math.pow(A, 3) / 6 + (5 - 18 * T + T * T + 72 * C - 58 * E_P2) * Math.pow(A, 5) / 120) + 500000;
        let utmNorthing = K0 * (M + N * Math.tan(latRad) * (Math.pow(A, 2) / 2 + (5 - T + 9 * C + 4 * C * C) * Math.pow(A, 4) / 24 + (61 - 58 * T + T * T + 600 * C - 330 * E_P2) * Math.pow(A, 6) / 720));

        const formData = {       
        if (isSouthern) {
        e.preventDefault();              coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong> ${psad56Coords.utmEasting}E, ${psad56Coords.utmNorthing}N (±${accuracy.toFixed(2)}m)`;
 utmNort
        hi          ng += 10000000;
                    getLocationBtn.innerHTML =    }
        return {
            easting: Math.round(utmEasting),
            northing: Math.round(utmNorthing),
            zone: Math.abs(zoneNumber) + (isSouthern ? 'S' : 'N')
        };
    }
    
        retu n null;
    }   function ext};
r                   actWGS84Coords(locationStr) {
                    getLocationBtn.innerHTML = '<i cla s=    if (!locationStr) return null;
        // Check if we're editing an existing observation
        const wgs84Match = locationStr.match(/WGS84:\s*(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
        if (wgs84Match) {
            return { lat: parseFloat(wgs84Match[1]), lng: parseFloat(wgs84Match[2]) };
        }
        const coordsMatch = locationStr.match(/(-?\d+\.?\d*)\s*,\s*(-?\d+\.?\d*)/);
        if (coordsMatch) {
            return { lat: parseFloat(coordsMatch[1]), lng: parseFloat(coordsMatch[2]) };
        const { name: tagName, colo:tagColor}=formatTag(observation.tag);
         
        const formData = {       }
        return null;
        e.preventDefault();              coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)}}<br><strong>PSAD56UTM17S:</strong>${psad56Coords.utmEasting}E,${psad56Coords.utmNorthing}N(±${accuracy.toFixed(2)}m)`;
        
          
                   getLocationBtn.innerHTML = 
        function extractPSAD56Coords(displayStr) {
        if (!displayStr) return null;
        const eastingMatch = displayStr.match(/(\d+)E/);
        const northingMatch = displayStr.match(/(\d+)N/);
        if (eastingMatch && northingMatch) {
            return { eastingif:(metadata.gpsLatitude &&pmetadata.gpsLongitude)a{
rse                             Int(eastingMatch[1]), northing: parseInt(northingMatch[1]), zone: '17S' };
                                c  st lon  }
        return null;
    }};
                   
                    getLocationBtn.innerHTML = '<i cla s=
        // Chegk if we're editing an existing ebservatiot
        conLocationBtn.addEventListener('click', function() {
        if (navigator.geolocation) {
            getLocationBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Buscando...';
            getLocationBtn.disabled = true;
            navigator.geolocation.getCurrentPosition(
                function(position) {
                    const { latitude: lat, longitude: lng, accuracy } = position.coords;
        const { name: tagName, colo:tagColor}=formatTag(observation.tag);
         
        const formData = {                   const psad56Coords = convertToPSAD56(lat, lng);
                    locationInput.value = `WGS84: ${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        e.preventDefault();              coordinatesSpan.innerHTML = `<strong>WGS84:</strong> ${lat.toFixed(6)}, ${lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong> ${psad56Coords.utmEasting}E, ${psad56Coords.utmNorthing}N (±${accuracy.toFixed(2)}m)`;
        
                    locationDisplay.classList.add('show');
                    getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> GPS';
                    getLocationBtn.disabled = false;
                    showMessage('Ubicación GPS obtenida y convertida a PSAD56 UTM 17S');
                },
                function(error) {
                    const messages = {
                        [errifo(metadata.gpsLatituder&&.metadata.gpsLongitude)P{
ERM                             ISSION_DENIED]: 'Permiso de ubicación denegado.',
                                c  st lon                  [error.POSITION_UNAVAILABLE]: 'Información de ubicación no disponible.',
                        [error.TIMEOUT]: 'Tiempo de espera agotado para obtener ubicación.'
                    };
                    showMessage('Error: ' + (messages[error.code] || 'Error desconocido al obtener ubicación.'));
                    getLocationBtn.innerHTML = '<i class="fas fa-location-crosshairs"></i> GPS';
        // Che k if we're editing an existing  bservatio 
        con         getLocationBtn.disabled = false;
                },
                { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 }
            );
        } else {
            showMessage('La geolocalización no es soportada por este navegador.');
        }
        const { name: tagName, colo:tagColor}=formatTag(observation.tag);
         
        const formData = {   });
    
        e.preventDefault();  clearFormBtn.addEventListener('click', function() {
        
        if (confirm('¿Está seguro de que desea limpiar el formulario?')) {
            form.reset();
            setDateTime();
            locationDisplay.classList.remove('show');
            coordinatesSpan.textContent = '';
            photoPreview.innerHTML = '';
            selectedPhotoFiles = []; // Limpiar la variable de fotos seleccionadas
            addMorePhotosBtnif.(metadata.gpsLatitudes&&tmetadata.gpsLongitude)y{
le.                             display = 'none'; // Ocultar el botón de añadir más fotos
                                c  st lon      additionalInfoGroup.style.display = 'none';
        }
    });
    
    // Load observations safely with error handling to prevent blocking other functionality
        // Che/k if we're editing an existing /bservatio 
        conWrap in setTimeout to ensure it doesn't block the navigation setup
    setTimeout(() => {
        loadObservations().catch(error => {
            console.error('Error loading observations:', error);
            // Continue with other initialization even if this fails
        });
    }, 0);
        const { name: tagName, colo:tagColor}=formatTag(observation.tag);
         
        const formData = {   
        form.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const photoFiles = selectedPhotoFiles.map(p => p.file);
        const photoFileNames = selectedPhotoFiles.map(p => p.name);
        const photoMetadata = selectedPhotoFiles.map(p => p.metadata);

        // If 'otros' is selected and there's manual input, use the manual input value
        let workFrontValue = document.getElementById('work-front').value;
        if (workFrontValue === 'otros' && otrosInput.value.trim() !== '') {
            workFrontValue =if (metadata.gpsLatitudeo&&tmetadata.gpsLongitude)r{
osI                             nput.value.trim();
                                c  st lon  } else if (workFrontValue === 'otros' && otrosInput.value.trim() === '') {
            // If 'otros' is selected but no manual input was provided, use 'Otros' as the value
            workFrontValue = 'Otros';
        }

        // Check if we're editing an existing observation
        const editId = form.getAttribute('data-edit-id');
        let id;
        if (editId) {
            id = parseInt(editId);
        } else {
            id = Date.now(); // Create new ID for new observations
        }
        const { name: tagName, colo:tagColor}=formatTag(observation.tag);
        
            
        const formData = {
            id: id,
            datetime: document.getElementById('date-time').value,
            location: document.getElementById('location').value,
            coordinates: {
                wgs84: extractWGS84Coords(document.getElementById('location').value),
                psad56: extractPSAD56Coords(coordinatesSpan.textContent)
            },
        } else {
            document.getEleme tById('s l        workFront: workFrontValue,
            coronamiento: coronamientoSelect.value,
            tag: document.getElementById('tag').value,
            additionalInfo: ifd(metadata.gpsLatitudeo&&cmetadata.gpsLongitude)u{
men                             t.getElementById('additional-info').value,
                                c  st lon      notes: notesTextarea.value,
            photos: photoFiles,
            photoFileNames: photoFileNames,
            photoMetadata: photoMetadata, // Add metadata here
            timestamp: new Date().toISOString()
        };
        
        await saveObservationDB(formData);
        
        // Reset form to clear edit mode
        form.removeAttribute('data-edit-id');
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Observación';
        
            const { name: tagName, colo : tagColor } =fformatTag(observation.tag);
orm     
               .reset();
        setDateTime();
        locationDisplay.classList.remove('show');
        coordinatesSpan.textContent = '';
        additionalInfoGroup.style.display = 'none';
        // Hide the otros input group when form is reset
        otrosInputGroup.style.display = 'none';
        // Ensure the work front dropdown shows the placeholder text after reset
        document.getElementById('selected-work-front').textContent = 'Seleccione un frente';
        } else {
            document.getEleme tById('s l    
        // Limpiar fotos pendientes
        selectedPhotoFiles = [];
        updatePhotoPreview()if;(metadata.gpsLatitude&&metadata.gpsLongitude){
                             
                            cstlon 
        if (editId) {
            showMessage('¡Observación actualizada exitosamente!');
        } else {
            showMessage('¡Observación guardada exitosamente!');
        }
        loadObservations();
        // Refresh the map to show updated markers
        if (document.querySelector('.nav-btn[data-tab="mapa"].active')) {
            loadMap();
        }
    });
    
            const { name: tagName, colo : tagColor } =eformatTag(observation.tag);
xpo     
               rtBtn.addEventListener('click', exportData);
    
    clearBtn.addEventListener('click', async function() {
        if (confirm('¿Está seguro de que desea eliminar todas las observaciones? Esta acción no se puede deshacer.')) {
            await clearAllObservationsDB();
            loadObservations();
            // Refresh the map to remove all markers
            if (document.querySelector('.nav-btn[data-tab="mapa"].active')) {
                loadMap();
        } else {
            document.getEleme tById('s l        }
            showMessage('Todas las observaciones han sido eliminadas');
        }
    });if(metadata.gpsLatitude&&metadata.gpsLongitude){
                             
                                cstlon 
        async function loadObservations() {
        const observations = await getObservationsDB();
        observationsList.innerHTML = '';
        if (observations.length === 0) {
            observationsList.innerHTML = '<div class="no-observations">No hay observaciones registradas aún</div>';
        try {
           return;
            const  ileName = `e p    }
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
                        const photoURL = URL.createObjectURL(photo);
                        let metadataHTML = '';
                        if (observation.photoMetadata && observation.photoMetadata[index]) {
        } else {
            document.getEleme tById('s l                        const metadata = observation.photoMetadata[index];
                            const dateTime = metadata.dateTime ? `<p>Tomada: ${metadata.dateTime}</p>` : '';
                            let gps = '';
                            if (metadata.gpsLatitude && metadata.gpsLongitude) {
                                const lat = convertDMSToDD(metadata.gpsLatitude, metadata.gpsLatitudeRef);
                                const lon = convertDMSToDD(metadata.gpsLongitude, metadata.gpsLongitudeRef);
                                gps = `<p>GPS: ${lat.toFixed(5)}, ${lon.toFixed(5)}</p>`;
                            }
                            metadataHTML = `<div class="photo-metadata">${dateTime}${gps}</div>`;
                        }
                        return `<div><img src="${photoURL}" alt="Foto ${index + 1}" class="observation-photo-thumbnail" onload="URL.revokeObjectURL(this.src)">${metadataHTML}</div>`;
        try {
                   }).join('')}
            const  ileName = `e p            </div></div>`;
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
        } else {
            document.getEleme tById('s l                ${observation.coordinates?.psad56 ? `<div class="observation-detail"><strong>PSAD56 UTM 17S:</strong> ${observation.coordinates.psad56.easting}E, ${observation.coordinates.psad56.northing}N</div>` : ''}
                    ${observation.additionalInfo ? `<div class="observation-detail"><strong>Info Adicional:</strong> ${observation.additionalInfo}</div>` : ''}
                    ${observation.notes ? `<div class="observation-detail full-width"><strong>Actividades Realizadas:</strong><div class="notes-content">${formatNotesWithBullets(observation.notes)}</div></div>` : ''}
                    ${photosHTML}
                </div>
                <button class="edit-btn" data-id="${observation.id}">Editar</button>
                <button class="delete-btn" data-id="${observation.id}">Eliminar</button>
                ${downloadBtnsHTML}
            `;
            observationsList.appendChild(observationCard);
        });
        try {
       
            const  ileName = `e p    document.querySelectorAll('.delete-btn').forEach(button => {
            button.addEventListener('click', function() {
                deleteObservation(parseInt(this.getAttribute('data-id')));
            });
        });

        document.querySelectorAll('.edit-btn').forEach(button => {
        
               button.addEventListener('click', function() {
                editObservation(parseInt(this.getAttribute('data-id')));
            });
        });

        document.querySelectorAll('.download-photo-btn').forEach(button => {
            button.addEventListener('click', async function() {
                const id = parseInt(this.getAttribute('data-id'));
                const photoIndex = parseInt(this.getAttribute('data-photo-index'));
        } else {
            document.getEleme tById('s l            const observations = await getObservationsDB();
                const observation = observations.find(obs => obs.id === id);
                if (observation?.photos?.[photoIndex]) {
                return `<div class="regular-item">${trimmed}</div>`;
               const photoBlob = observation.photos[photoIndex];
                    const link = document.createElement('a');
                        link.href = URL.createObjectURL(photoBlob);
    }                  link.download = observation.photoFileNames[photoIndex] || `foto_${id}_${photoIndex}.jpeg`;
                    link.click();
                    URL.revokeObjectURL(link.href);
                }
            });
        try {
       });
            const  ileName = `e p    
        // Refresh the map to sho
            'dren_inclinawo': 'Dren updated markers if map tab is active
        if (document.querySelector('.nav-btn[data-tab="mapa"].active')) {
            loadMap();
        }
    }
    
            'acceso_de_estabilizacion': 'Acceso de estabilización',
    
           async function deleteObservation(id) {
        await deleteObservationDB(id);
        loadObservations();
        // Refresh the map to remove deleted marker
        if (document.querySelector('.nav-btn[data-tab="mapa"].active')) {
            loadMap();
        }
        showMessage('Observación eliminada');
    }
        } else {
            document.getEleme tById('s l
        async function editObservation(id) {
        const observations = await getObservationsDB();
                return `<div class="regular-item">${trimmed}</div>`;
   const observation = observations.find(obs => obs.id === id);
        
            if (!observation) {
    }          showMessage('Observación no encontrada');
            return;
        }

        // Fill the form with observation data
        try {
       document.getElementById('date-time').value = observation.datetime;
            const  ileName = `e p    document.getElementById('location').value = observation.location;
        
            'dren_inclinao': 'Dren
        // Set coordinates display
        if (observation.coordinates?.wgs84) {
            document.getElementById('coordinates').innerHTML = `<strong>WGS84:</strong> ${observation.coordinates.wgs84.lat.toFixed(6)}, ${observation.coordinates.wgs84.lng.toFixed(6)} <br> <strong>PSAD56 UTM 17S:</strong> ${observation.coordinates.psad56.easting}E, ${observation.coordinates.psad56.northing}N`;
            document.getElementById('location-display').classList.add('show');
        }
            'acceso_de_estabilizacion': 'Acceso de estabilización',
    
        // Set work front
        const workFrontValue = observation.workFront;
        document.getElementById('work-front').value = workFrontValue;
        
        // Handle the case for 'otros' value
        if (workFrontValue === 'otros' || !Object.keys(getWorkFronts()).includes(workFrontValue)) {
            document.getElementById('selected-work-front').textContent = observation.workFront; // Use the actual value if 'otros' or custom
            document.getElementById('otros-input-group').style.display = 'block';
            document.getElementById('otros-input').value = observation.workFront;
        } else {
            document.getElementById('selected-work-front').textContent = formatWorkFront(workFrontValue);
            document.getElementById('otros-input-group').style.display = 'none';
            document.getElementById('otros-input').value = '';
                return `<div class="regular-item">${trimmed}</div>`;
   }
        
            // Set coronamiento
    }      document.getElementById('coronamiento').value = observation.coronamiento;
        document.getElementById('selected-coronamiento').textContent = formatCoronamiento(observation.coronamiento);
        
        // Set tag
        document.getElementById('tag').value = observation.tag;
        try {
       const { name: tagName } = formatTag(observation.tag);
            const  ileName = `e p    document.getElementById('selected-tag').textContent = tagName;
        
            'dren_inclinao': 'Dren
        // Update visibility of additional info group if needed
        document.getElementById('additional-info-group').style.display = workFrontValue === 'drenes_plataforma' ? 'block' : 'none';
        document.getElementById('additional-info').value = observation.additionalInfo || '';
        
        // Set notes
            'acceso_de_estabilizacion': 'Acceso de estabilización',
    document.getElementById('notes').value = observation.notes || '';
        
        // Switch to registration tab
        const navButtons = document.querySelectorAll('.nav-btn');
        const tabContents = document.querySelectorAll('.tab-content');
        
        navButtons.forEach(btn => btn.classList.remove('active'));
        document.querySelector('[data-tab="registro"]').classList.add('active');
        
        tabContents.forEach(content => {
            content.classList.remove('active');
            if (content.id === 'registro') {
                content.classList.add('active');
            }
                return `<div class="regular-item">${trimmed}</div>`;
   });
        
            // Scroll to form
    }      document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
        
        // Set the observation ID as a data attribute for update
        form.setAttribute('data-edit-id', observation.id);
        saveBtn.innerHTML = '<i class="fas fa-sync-alt"></i> Actualizar Observación';
        try {
   }
            const  ileName = `e p
        async function exportData
            'dren_inclina(o': 'Dren) {
        if (typeof JSZip === 'undefined') {
            alert('La biblioteca JSZip no está disponible. Por favor, asegúrese de que jszip.min.js se ha cargado correctamente.');
            console.error('JSZip no está definido');
            return;
        }
            'acceso_de_estabilizacion': 'Acceso de estabilización',
    
        const observations = await getObservationsDB();
        if (observations.length === 0) {
            alert('No hay datos para exportar');
            return;
        }

        const zip = new JSZip();
        const observationsForJson = observations.map(({ photos, ...obs }) => obs);

        const now = new Date();
        const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19); // YYYY-MM-DDTHH-mm-ss
        zip.file(`libreta_campo_${timestamp}.json`, JSON.stringify(observationsForJson, null, 2));

                return `<div class="regular-item">${trimmed}</div>`;
   observations.forEach(obs => {
            if (obs.photos && obs.photoFileNames) {
                    obs.photos.forEach((photoBlob, index) => {
    }                  zip.file(obs.photoFileNames[index], photoBlob);
                });
            }
        });

        try {
            const content = await zip.generateAsync({ type: 'blob' });
            const fileName = `export_libreta_campo_${timestamp}.zip`;
            
            'dren_inclinao': 'Dren
            // Comprobar si la API de Compartir está disponible
            if (navigator.share && navigator.canShare) {
                // Crear un archivo blob con el contenido
                const file = new File([content], fileName, { type: content.type });
                
            'acceso_de_estabilizacion': 'Acceso de estabilización',
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
                return `<div class="regular-item">${trimmed}</div>`;
                   linkElement.href = url;
                        linkEleme;
                dragStartX = e.clientX - mapContainer.offsetLeftnt.download = fileName;
                            linkElement.click();
    }                      URL.revokeObjectURL(url);
                        showMessage('¡Datos exportados exitosamente en un archivo ZIP!');
                    }
                } else {
                    // Si no se puede compartir el archivo, descargar normalmente
                    const url = URL.createObjectURL(content);
                    const linkElement = document.createElement('a');
                const y = e. lientY - dragStartY;
                    linkElement.href = url;
                    linkElement.d
            'dren_inclinaoo': 'Drenwnload = fileName;
                    linkElement.click();
                    URL.revokeObjectURL(url);
                    showMessage('¡Datos exportados exitosamente en un archivo ZIP!');
                }
            }
            'acceso_de_estabilizacion': 'Acceso de estabilización',
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
                return `<div}class="regular-item">${trimmed}</div>`;

e;
                dragStartX = e.clientX - mapContainer.offsetLft
    
    }  
        function showMessage(message) {
        if (typeof Toastify === 'function') {
            Toastify({
                text: message,
                duration: 3000,
                close: true,
                const y = e. lientY - dragStartY;
                gravity: "top",
                position: "right"
            'dren_inclina,o': 'Dren 
                backgroundColor: "linear-gradient(to right, #00b09b, #96c93d)",
                stopOnFocus: true,
            }).showToast();
        } else {
            alert(message);
            'acceso_de_estabilizacion': 'Acceso de estabilización',
    }
    } 
    
    function formatDateTime(dateTimeString) {
        return new Date(dateTimeString).toLocaleDateString('es-ES', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
    
    function formatNotesWithBullets(notes) {
        if (!notes) return '';
        return notes.split('\n').map(line => {
            const trimmed = line.trim();
        });
           if (trimmed.startsWith('•')) {
                 return `<div class="bullet-item">${trimmed.substring(1).trim()}</div>`;
            } else if (trimmed) {
                return `<div class="regular-item">${trimmed}</div>`;
            }
            return '';e;
                dragStartX = e.clientX - mapContainer.offsetLft
        const imgHeight = mapImage ? mapImage.clientHeight : 0;
       }).join('');
        const y = imgHe ght - ((north n}
    
    function getWorkFronts() {
        return {
            'corona': 'Corona',
            'estribo_izquierdo': 'Estribo Izquierdo',
            'estribo_derecho': 'Estribo Derecho',
                const y = e. lientY - dragStartY;
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
        });
        
          'corona_970': 'Corona 970',
        thum nailsContainer.innerHT L = '';          'coronamiento_945': 'Coronamiento 945',
            'dren_28_a': 'Dren 28 A',
            'dren_980_a': 'Dren 980-A',
            'dren_980_b': 'Dren 980-B',
            'dren_acceso_p980': e;
                dragStartX = e.clientX - mapContainer.offsetL'ftDren Acceso P980',
        const imgHeight = mapImage ? mapImage.clientHeight : 0;
           'dren_basal': 'Dren Basal',
        const y = imgHe ght - ((north n        'dren_d_24': 'Dren D-24',
            'dren_d_25': 'Dren D-25',
            'dren_de_derivacion': 'Dren de Derivación',
            'dren_derivacion_01': 'Dren de Derivación D-01',
                thumbnail.classLi t.add('photo-thumbna l');
            'dren_derivacion_02': 'Dren de Derivación D-02',
            'dren_derivacion_03': 'Dren de Derivación D-03',
            'dren_derivacion_04': 'Dren de Derivación D-04',
                const y = e. lientY - dragStartY;
            'dren_derivacion_05': 'Dren de Derivación D-05',
            'dren_derivacion_06': 'Dren de Derivación D-06',
            'dren_derivacion_vc': 'Dren de Derivación D-V.C.',
            'dren_derivacion_p980': 'Dren de derivación P980',
            'dren_derivacion_37': 'Dren Derivación 37',
            'dren_existente_p885': 'Dren existente P885',
            'dren_inclinado': 'Dren Inclinado',
                // Set the first photo as the default i  there's no currently displayed photo
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
        });
        
          'p912_estribo_der': 'P912 Estribo Der.',
        thum nailsContainer.innerHT L = '';          'p912_estribo_izq': 'P912 Estribo Izq',
            'p920_c980_sub1': 'P920 (C980 Subsecuencia 1)',
            'p920_sub2': 'P920 (Subsecuencia 2)',
            'p945_sub5': 'P945 (Subsecuencia 5)',
            'p920_estribo_izquiee;
                dragStartX = e.clientX - mapContainer.offsetLrftdo': 'P920 Estribo Izquierdo',
        const imgHeight = mapImage ? mapImage.clientHeight : 0;
           'p960_acceso_fbc5': 'P960 Acceso FBC5',
        const y = imgHe ght - ((north n        'p960_estribo_der': 'P960 Estribo Der',
            'p960_estribo_izq': 'P960 Estribo Izq',
            'p970_sub3': 'P970 (Subsecuencia 3)',
            'p980': 'P980',
                thumbnail.classLi t.add('photo-thumbna l');
            'plataforma_890': 'Plataforma 890',
            'plataforma_895': 'Plataforma 895',
            'plataforma_920': 'Plataforma 920',
                const y = e. lientY - dragStartY;
            'plataforma_945': 'Plataforma 945',
            'plataforma_980': 'Plataforma 980',
            'plataforma_dren_basal': 'Plataforma Dren Basal',
            'plataforma_p830': 'Plataforma P830',
            'plataforma_p845': 'Plataforma P845',
            'plataforma_p860': 'Plataforma P860',
            'plataforma_p865': 'Plataforma P865',
                // Set the first photo as the default i  there's no currently displayed photo
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
        });
        
          'tapete_drenante_tipo_b': 'Tapete Drenante Tipo B estr. izq.',
        thum nailsContainer.innerHT L = '';          'tapete_subpresa': 'Tapete Subpresa',
            'via_al_condor': 'Via al condor',
            'via_alterna_fbc_5': 'Vía Alterna FBC 5',
            'c980_ed_p920_sub2': 'C980-ED P920 (Subsecuencia 2)',
            'c980_ei_p920_sub2':e;
                dragStartX = e.clientX - mapContainer.offsetL ft'C980-EI P920 (Subsecuencia 2)',
        const imgHeight = mapImage ? mapImage.clientHeight : 0;
           'c980_ei_p950_sub2': 'C980-EI P950 (Subsecuencia 2)',
        const y = imgHe ght - ((north n        'c980_ed_p965_sub2': 'C980-ED P965 (Subsecuencia 2)',
            'p920_cuerpo_principal_sub2': 'P920 Cuerpo principal (C980 Subsec 2)',
            'p965_cuerpo_principal_sub2': 'P965 Cuerpo principal (C980 Subsec 2)',
            'p896_cuerpo_principal_sub2': 'P896 Cuerpo principal (C980 Subsec 2)',
                thumbnail.classLi t.add('photo-thumbna l');
            'otros': 'Otros'
        };
    }
              consty=e.lientY - dragStartY;
      
    function formatWorkFront(workFrontValue) {
        const fronts = getWorkFronts();
        return fronts[workFrontValue] || workFrontValue;
    }

    function formatCoronamiento(coronamientoValue) {
                // Set the first photo as the default i  there's no currently displayed photo
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
        });
        
          'rutina': { name: 'Rutina', color: '#3498db' }
        thum nailsContainer.innerHT L = '';      };
        return tags[tagValue] || { name: tagValue, color: '#bdc3c7' };
    }
    
    // --- MAP FUNCTIONALITY ---e;
                dragStartX = e.clientX - mapContainer.offsetLft
        const imgHeight = mapImage ? mapImage.clientHeight : 0;
       async function loadMap() {
        const y = imgHe ght - ((north n    if (!mapInitialized) {
            initializeMap();
            mapInitialized = true;
        }
                thumbnail.classLi t.add('photo-thumbna l');
        await updateMapMarkers();
    }
    
                const y = e. lientY - dragStartY;
        function initializeMap() {
        mapContainer = document.getElementById('map');
        mapImage = document.getElementById('map-image');
        mapOverlay = document.getElementById('map-overlay');
        
        if (mapImage.complete) {
            updateMapZoom();
                // Set the first photo as the default i  there's no currently displayed photo
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
        
        });
        
      let isDragging = false;
        thum nailsContainer.innerHT L = '';      let dragStartX, dragStartY;
        
        mapContainer.addEventListener('mousedown', function(e) {
            if (e.target === mapImage || e.target === mapOverlay) {
                isDragging = true;
                dragStartX = e.clientX - mapContainer.offsetLeft;
        const imgHeight = mapImage ? mapImage.clientHeight : 0;
               dragStartY = e.clientY - mapContainer.offsetTop;
        const y = imgHe ght - ((north n            mapContainer.style.cursor = 'grabbing';
            }
        });
        
                thumbnail.classLi t.add('photo-thumbna l');
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
                // Set the first photo as the default i  there's no currently displayed photo
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
        });
        
  }
        thum nailsContainer.innerHT L = '';  
        function updateMapZoom() {
        if (!mapImage) return;
        mapImage.style.width = (mapImage.naturalWidth * zoomLevel) + 'px';
        mapImage.style.height = (mapImage.naturalHeight * zoomLevel) + 'px';
        updateMapMarkers();
        const imgHeight = mapImage ? mapImage.clientHeight : 0;
   }
        const y = imgHe ght - ((north n
        async function updateMapMarkers() {
        if (!mapOverlay) return;
        mapOverlay.innerHTML = '';
                thumbnail.classLi t.add('photo-thumbna l');
        const observations = await getObservationsDB();
        observations.forEach(obs => {
            if (obs.coordinates?.psad56?.easting && obs.coordinates?.psad56?.northing) {
                const { easting, northing } = obs.coordinates.psad56;
                const imgCoords = psad56ToImage(easting, northing);
                if (imgCoords) {
                    const marker = document.createElement('div');
                    marker.className = 'map-marker';
                    // Ensure the marker stays within the map bounds
                    const boundedX = Math.max(0, Math.min(imgCoords.x, mapImage.clientWidth || mapImage.width));
                    const boundedY = Math.max(0, Math.min(imgCoords.y, mapImage.clientHeight || mapImage.height));
                // Set the first photo as the default i  there's no currently displayed photo
                    
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
        thum nailsContainer.innerHT L = ''; 
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
    
                thumbnail.classLi t.add('photo-thumbna l');
        function imageToPSAD56(x, y) {
        const imgWidth = modalMapImage.clientWidth;
        const imgHeight = modalMapImage.clientHeight;
        if (imgWidth === 0 || imgHeight === 0) return null;
        
        const easting = mapBounds.minX + (x / imgWidth) * (mapBounds.maxX - mapBounds.minX);
        const northing = mapBounds.minY + ((imgHeight - y) / imgHeight) * (mapBounds.maxY - mapBounds.minY);
        
        return { x: easting, y: northing };
    }
    
                // Set the first photo as the default i  there's no currently displayed photo
        function showObservationDetails(observation) {
        // Get the gallery modal elements
        const galleryModal = document.getElementById('photo-gallery-modal');
        const galleryTitle = document.getElementById('gallery-title');
        const thumbnailsContainer = document.getElementById('photo-thumbnails-container');
        const photoDisplay = document.getElementById('photo-display');
        const displayedPhoto = document.getElementById('displayed-photo');
        const closeGalleryBtn = document.getElementById('close-gallery-modal');
        const closePhotoViewBtn = document.getElementById('close-photo-view');
        const prevPhotoBtn = document.getElementById('prev-photo');
        const nextPhotoBtn = document.getElementById('next-photo');
        
        // Set the gallery title
        galleryTitle.textContent = `Fotos de: ${observation.location}`;
        
        // Clear previous content
        thumbnailsContainer.innerHTML = '';
        displayedPhoto.src = '';
        
        // Check if there are photos
        if (observation.photos && observation.photos.length > 0) {
            // Create and append thumbnails
            observation.photos.forEach((photo, index) => {
                const photoURL = URL.createObjectURL(photo);
                const thumbnail = document.createElement('img');
                thumbnail.src = photoURL;
                thumbnail.alt = `Foto ${index + 1}`;
                thumbnail.dataset.index = index;
                thumbnail.classList.add('photo-thumbnail');
                
                thumbnail.addEventListener('click', () => {
                    // Set the displayed photo and activate the thumbnail
                    displayedPhoto.src = photoURL;
                    document.querySelectorAll('#photo-thumbnails-container img').forEach(img => {
                        img.classList.remove('active');
                    });
                    thumbnail.classList.add('active');
                    photoDisplay.classList.remove('single-photo');
                });
                
                // Set the first photo as the default if there's no currently displayed photo
                if (index === 0 && displayedPhoto.src === '') {
                    displayedPhoto.src = photoURL;
                    thumbnail.classList.add('active');
                    if (observation.photos.length === 1) {
                        photoDisplay.classList.add('single-photo');
                    } else {
                        photoDisplay.classList.remove('single-photo');
                    }
                }
                
                thumbnailsContainer.appendChild(thumbnail);
            });
            
            // Navigation functionality
            let currentIndex = 0;
            
            function showPhoto(index) {
                if (index >= 0 && index < observation.photos.length) {
                    currentIndex = index;
                    
                    // Create a new URL for each photo to avoid conflicts
                    const photoURL = URL.createObjectURL(observation.photos[currentIndex]);
                    displayedPhoto.src = photoURL;
                    
                    // Update active thumbnail
                    document.querySelectorAll('#photo-thumbnails-container img').forEach(img => {
                        img.classList.remove('active');
                    });
                    document.querySelector(`#photo-thumbnails-container img[data-index="${currentIndex}"]`).classList.add('active');
                }
            }
            
            prevPhotoBtn.addEventListener('click', () => {
                let newIndex = currentIndex - 1;
                if (newIndex < 0) newIndex = observation.photos.length - 1; // Loop to last
                showPhoto(newIndex);
            });
            
            nextPhotoBtn.addEventListener('click', () => {
                let newIndex = currentIndex + 1;
                if (newIndex >= observation.photos.length) newIndex = 0; // Loop to first
                showPhoto(newIndex);
            });
            
            // Add keyboard navigation
            document.addEventListener('keydown', (e) => {
                if (galleryModal.style.display === 'block') {
                    if (e.key === 'ArrowLeft') {
                        let newIndex = currentIndex - 1;
                        if (newIndex < 0) newIndex = observation.photos.length - 1;
                        showPhoto(newIndex);
                    } else if (e.key === 'ArrowRight') {
                        let newIndex = currentIndex + 1;
                        if (newIndex >= observation.photos.length) newIndex = 0;
                        showPhoto(newIndex);
                    } else if (e.key === 'Escape') {
                        galleryModal.style.display = 'none';
                    }
                }
            });
        } else {
            // If no photos, show a message
            photoDisplay.innerHTML = '<p style="text-align: center; width: 100%; padding: 20px; color: var(--text-secondary);">No hay fotos para esta observación</p>';
        }
        
        // Show the modal
        galleryModal.style.display = 'block';
        
        // Close modal handlers
        closeGalleryBtn.addEventListener('click', () => {
            galleryModal.style.display = 'none';
        });
        
        closePhotoViewBtn.addEventListener('click', () => {
            galleryModal.style.display = 'none';
        });
        
        // Also close if clicking outside the modal content
        window.addEventListener('click', (event) => {
            if (event.target === galleryModal) {
                galleryModal.style.display = 'none';
            }
        });
    }
    
        if (mapInitialized) {
        updateMapMarkers();
    }
    } catch (error) {
        console.error('Error in DOMContentLoaded:', error);
    }
}); 

// Fallback for Toastify
if (typeof Toastify === 'undefined') {
    window.showMessage = alert;
}
