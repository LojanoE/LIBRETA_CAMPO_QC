// Field Notebook App - JavaScript functionality

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const form = document.getElementById('observationForm');
    const observationsList = document.getElementById('observationsList');
    const exportBtn = document.getElementById('exportBtn');
    const clearBtn = document.getElementById('clearBtn');
    
    // Load saved observations when page loads
    loadObservations();
    
    // Handle form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Get form data
        const formData = {
            id: Date.now(), // Unique ID based on timestamp
            location: document.getElementById('location').value,
            date: document.getElementById('date').value,
            observer: document.getElementById('observer').value,
            species: document.getElementById('species').value,
            quantity: document.getElementById('quantity').value,
            notes: document.getElementById('notes').value,
            timestamp: new Date().toISOString()
        };
        
        // Save observation
        saveObservation(formData);
        
        // Reset form
        form.reset();
        
        // Reload observations
        loadObservations();
    });
    
    // Handle export button
    exportBtn.addEventListener('click', exportData);
    
    // Handle clear button
    clearBtn.addEventListener('click', function() {
        if (confirm('Are you sure you want to delete all observations? This cannot be undone.')) {
            localStorage.removeItem('observations');
            loadObservations();
        }
    });
    
    // Function to save observation to localStorage
    function saveObservation(observation) {
        let observations = getObservations();
        observations.push(observation);
        localStorage.setItem('observations', JSON.stringify(observations));
        showMessage('Observation saved successfully!');
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
            observationsList.innerHTML = '<div class="no-observations">No observations recorded yet</div>';
            return;
        }
        
        // Sort observations by date (newest first)
        observations.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        observationsList.innerHTML = '';
        
        observations.forEach(observation => {
            const observationCard = document.createElement('div');
            observationCard.className = 'observation-card';
            observationCard.innerHTML = `
                <h3>${observation.location} <small>(${formatDate(observation.date)})</small></h3>
                <div class="observation-details">
                    <div class="observation-detail"><strong>Observer:</strong> ${observation.observer}</div>
                    <div class="observation-detail"><strong>Species:</strong> ${observation.species || 'N/A'}</div>
                    <div class="observation-detail"><strong>Quantity:</strong> ${observation.quantity || 'N/A'}</div>
                    <div class="observation-detail"><strong>Notes:</strong> ${observation.notes || 'N/A'}</div>
                </div>
                <button class="delete-btn" data-id="${observation.id}">Delete</button>
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
        showMessage('Observation deleted');
    }
    
    // Function to export data as JSON
    function exportData() {
        const observations = getObservations();
        
        if (observations.length === 0) {
            alert('No data to export');
            return;
        }
        
        const dataStr = JSON.stringify(observations, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `field_notebook_data_${new Date().toISOString().slice(0,10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        showMessage('Data exported successfully!');
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
    
    // Helper function to format date
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }
});