# Libreta de Campo - QC

## Project Overview

**Libreta de Campo - QC** is a Progressive Web Application (PWA) designed for field observation recording with offline capabilities. It allows users to register field observations with detailed information including location coordinates (GPS and PSAD56 UTM 17S), photos with EXIF metadata, work front, observation type, and notes. The application is built with vanilla JavaScript, HTML, and CSS with IndexedDB for local storage.

### Key Features
- **Field Observation Registration**: Record observations with date/time, location, work front, type, and detailed notes
- **GPS Integration**: Obtain real-time GPS coordinates with conversion to PSAD56 UTM 17S
- **Photo Capture**: Take photos with EXIF metadata extraction and storage
- **Map Visualization**: Display observations on a custom map with markers
- **Offline Support**: All functionality works offline with PWA capabilities
- **Data Export**: Export observations and photos as ZIP files with JSON metadata
- **Searchable Dropdowns**: Work front selection with search functionality
- **Image-Based Map Selection**: Select locations by placing pins on an image-based map
- **Multiple Themes**: Support for dark, light, and blue themes

## File Structure

```
LIBRETA_CAMPO_QC/
├── index.html          # Main application page
├── script.js           # Core JavaScript functionality
├── styles.css          # Styling and responsive design
├── db.js               # IndexedDB database operations
├── sw.js               # Service worker for PWA functionality
├── manifest.json       # PWA manifest configuration
├── jszip.min.js        # JSZip library for export functionality
├── RAC-FOT.jpg         # Application logo and map image
├── debug.js            # Debug utilities
├── test.html           # JSZip functionality test
├── test_coords.html    # Coordinate transformation test
├── .gitattributes      # Git file attribute configuration
├── .vscode/            # VSCode settings
└── QWEN.md             # This documentation file
```

## Technical Architecture

### Core Technologies
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Database**: IndexedDB for local storage
- **PWA**: Service Worker for offline capabilities
- **Geolocation**: Browser Geolocation API
- **EXIF Metadata**: exif-js library for photo metadata extraction

### Key Components

#### Database Layer (`db.js`)
- IndexedDB implementation for storing observations
- CRUD operations for observations with full IndexedDB transactions
- Structured storage for photos, coordinates, metadata, and notes

#### Main Application (`script.js`)
- Form handling and validation
- GPS location acquisition and PSAD56 coordinate conversion
- Photo processing with EXIF metadata extraction
- Map visualization and marker placement
- Tab navigation and UI interactions
- Coordinate transformation algorithms

#### Offline Capabilities (`sw.js`)
- Caching strategy for app shell
- Version management for cache invalidation
- Offline fallback handling
- Resource caching and updates

### Coordinate System
The application uses a dual coordinate system:
- **WGS84**: Standard GPS coordinates (latitude/longitude)
- **PSAD56 UTM 17S**: Regional coordinate system used in Peru
- Includes custom transformation algorithms for coordinate conversion

### Image Handling
- Photo capture with camera access
- EXIF metadata extraction for GPS coordinates
- Photo storage as Blobs with unique naming
- Thumbnail previews and batch processing

## Building and Running

### Prerequisites
- Web server capable of serving static files
- Modern browser with JavaScript enabled
- Geolocation API support (for GPS functionality)

### Local Development
1. Serve the project directory using any local web server:
   ```bash
   # Using Python
   python -m http.server 8000
   
   # Using Node.js
   npx http-server
   
   # Or any other static file server
   ```

2. Open the application in a modern browser at the served URL

### PWA Installation
1. Access the application via HTTPS (required for PWA features)
2. Use the browser's install prompt
3. The app will be available as a standalone application

## Development Conventions

### Code Style
- Consistent use of vanilla JavaScript (no external frameworks)
- Modular function structure in script.js
- Clean and semantic HTML markup
- CSS custom properties for theming

### Naming Conventions
- JavaScript: camelCase for variables and functions
- HTML: kebab-case for class names
- CSS: kebab-case for class names
- File naming: descriptive names with appropriate extensions

### UI/UX Patterns
- Tab-based navigation for different sections
- Responsive design for mobile and desktop
- Material-inspired design elements
- Consistent color coding for observation types (Rutina, Novedad, Importante)

## Testing

### Functional Tests
- `test.html`: JSZip functionality verification
- `test_coords.html`: Coordinate transformation validation
- Coordinate conversion accuracy verification

### Offline Testing
1. Load application in browser
2. Disable network connection
3. Verify all functionality remains operational
4. Test data persistence and synchronization

## Deployment

### Production Deployment
1. Host files on a static web server
2. Ensure HTTPS configuration for PWA features
3. Verify service worker registration
4. Test offline functionality

### Configuration Files
- `manifest.json`: PWA configuration (name, icons, display mode)
- `sw.js`: Service worker caching strategy
- `index.html`: Application entry point and structure

## Troubleshooting

### Common Issues
1. **GPS Not Working**: Check browser permissions for location access
2. **Photos Not Storing**: Verify IndexedDB support in browser
3. **Offline Not Working**: Ensure HTTPS and service worker registration
4. **Coordinate Conversion**: Check coordinate systems and transformation algorithms

### Debugging
- Use `debug.js` for debugging specific functionality
- Check browser developer tools for JavaScript errors
- Verify IndexedDB storage through browser's storage inspector
- Test coordinate transformations with `test_coords.html`

## Application Sections

### Registration Section
- Form for creating new observations
- GPS location capture or manual entry
- Work front selection with search
- Photo capture with metadata
- Notes and additional information

### Observations Section
- List view of saved observations
- Filter and sorting capabilities
- Photo thumbnail previews
- Export functionality
- Data management tools

### Map Section
- Visual display of observation locations
- Custom map with coordinate overlay
- Marker representation by observation type
- Coordinate display on hover

### Configuration Section
- Theme selection (dark/light/blue)
- Auto-save toggle
- Notification settings
- Backup and restore functionality

## Data Model

### Observation Object
- `id`: Unique identifier (timestamp-based)
- `datetime`: Observation date and time
- `location`: Location description
- `coordinates`: WGS84 and PSAD56 coordinate objects
- `workFront`: Selected work front
- `coronamiento`: Selected coronamiento
- `tag`: Observation type (rutina/novedad/importante)
- `additionalInfo`: Additional information (for drenes/plataforma)
- `notes`: Detailed activity notes
- `photos`: Array of photo Blobs
- `photoFileNames`: Array of photo file names
- `photoMetadata`: Array of EXIF metadata
- `timestamp`: ISO timestamp for sorting

## Security Considerations

- Client-side only data storage (IndexedDB)
- No server communication required
- Local photo storage with no external uploads
- Geolocation data processed locally

## Browser Compatibility

- Modern browsers with IndexedDB support
- Geolocation API support for GPS functionality
- Service Worker support for PWA features
- Canvas API for image processing
- ES6+ JavaScript features