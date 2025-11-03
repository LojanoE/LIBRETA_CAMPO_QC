# Libreta de Campo - QC

## Project Overview

**Libreta de Campo - QC** (Field Notebook - Quality Control) is a progressive web application (PWA) designed for field observation recording and management. It allows users to register field observations with GPS coordinates, photos, and detailed notes, with support for offline functionality.

### Key Features

- **Observation Registration**: Create detailed field observation records with date, time, location coordinates (WGS84 and PSAD56 UTM 17S), work fronts, and activity types
- **GPS Integration**: Automatic GPS location capture with conversion to PSAD56 coordinate system
- **Photo Capture**: Take photos directly from the app or select from gallery with EXIF metadata extraction
- **Map Integration**: Visual representation of observation points on a map with coordinate system support
- **Offline Support**: Works offline with service worker caching
- **Data Export**: Export all observations and photos as ZIP files with JSON metadata
- **Multiple Work Fronts**: Support for various engineering/construction work areas
- **Search Functionality**: Search through work fronts and filter observations
- **Theme Support**: Multiple visual themes (dark, light, blue deep)

### Technology Stack

- **Frontend**: Pure JavaScript, HTML5, CSS3
- **Database**: IndexedDB for offline data storage
- **Caching**: Service Worker for offline functionality
- **Image Processing**: EXIF.js for metadata extraction
- **Archive Creation**: JSZip for export functionality
- **PWA Support**: Full progressive web app with manifest.json

### Architecture

The application is built as a single-page application with the following main components:

1. **UI Layer** (`index.html`, `styles.css`): Responsive user interface with tab navigation
2. **Logic Layer** (`script.js`): Core application functionality
3. **Data Layer** (`db.js`): IndexedDB wrapper for data persistence
4. **Service Worker** (`sw.js`): Offline caching and network management
5. **Assets**: Various images and manifest for PWA functionality

## Building and Running

### Prerequisites

- Modern web browser (Chrome, Firefox, Edge, Safari)
- Web server (for proper service worker functionality)

### Running the Application

1. **Local Server**: Serve the files through a local web server (e.g., `http-server`, Python's `http.server`, or similar)
2. **Direct File Access**: Open `index.html` directly in browser (service worker functionality may be limited)
3. **Mobile Installation**: Access the web app via browser and install as PWA for full offline experience

### Development

The application can be developed by:
1. Serving the files through a local server
2. Making changes to any of the HTML/CSS/JS files
3. Testing changes in the browser

## Key Functionality

### Coordinate System Support

The application supports conversion between WGS84 and PSAD56 coordinate systems with the following parameters:
- PSAD56 offset: Latitude offset of 0.0027°, Longitude offset of -0.0015°
- UTM Zone 17S for the region of operation
- Both coordinate systems are displayed in the UI

### Photo Handling

- Photos can be taken directly from camera or selected from gallery
- EXIF metadata is extracted from images to extract GPS coordinates if available
- Photos are stored as Blobs and saved in IndexedDB
- Export functionality includes photos as separate files in the ZIP archive

### Data Storage

- All observations are stored in IndexedDB with the following schema:
  - `id`: Unique identifier for each observation
  - `datetime`: Date and time of observation
  - `location`: Location string (coordinates and description)
  - `coordinates`: Object with WGS84 and PSAD56 coordinates
  - `workFront`: Work front identifier
  - `coronamiento`: Crown identification
  - `tag`: Observation type (rutina, novedad, importante)
  - `additionalInfo`: Additional information for specific work fronts
  - `notes`: Detailed observation notes
  - `photos`: Array of photo Blobs
  - `photoFileNames`: Array of photo file names
  - `photoMetadata`: Array of EXIF metadata
  - `timestamp`: Creation timestamp

### Offline Functionality

The service worker caches:
- Core application files (HTML, CSS, JS)
- Assets (images, icons)
- External dependencies (Font Awesome, EXIF.js)

The application functions fully offline after initial load, with data stored in IndexedDB persisting across sessions.

## Usage

### Registering Observations

1. Navigate to the "Registrar" tab
2. The app automatically fills current date and time
3. Add location using:
   - GPS button to get current location
   - Manual coordinate entry
   - Map pin placement functionality
4. Select work front and coronamiento from dropdowns
5. Choose observation type (routine, novelty, important)
6. Add detailed notes about activities
7. Optionally add photos
8. Save the observation

### Viewing Observations

- In the "Observaciones" tab, all registered observations are displayed in a grid
- Each observation shows location, date, work front, and type
- Photos are displayed as thumbnails
- Edit or delete functionality is available for each observation
- Export functionality allows downloading all data

### Map Visualization

- The "Mapa" tab shows all registered observations on a map
- Different observation types are represented with different icons and colors
- Map zoom and pan controls are provided
- Coordinate display updates as you move the cursor over the map

## Development Conventions

### Code Style

- JavaScript follows modern ES6+ syntax
- CSS uses CSS custom properties for theme management
- HTML follows semantic structure with proper accessibility attributes

### UI/UX

- Responsive design supporting mobile and desktop
- Dark theme as default with light theme option
- Intuitive tab-based navigation
- Visual feedback for user actions (toasts, loading states)

### Naming Conventions

- JavaScript: camelCase for variables and functions
- CSS: kebab-case for class names with BEM methodology
- Files: descriptive names reflecting content purpose

## Testing

The project includes basic test files:
- `test.html`: Tests JSZip functionality
- `test_coords.html`: Tests coordinate transformation logic

## Deployment

The application can be deployed to any web server that supports static file hosting. For full PWA functionality, ensure:
- HTTPS is used (required for service workers)
- Proper MIME types for all file extensions
- Service worker is allowed to run

The manifest.json file enables installation as a PWA on mobile devices.
