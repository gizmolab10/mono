// Mock Bubble Plugin Environment
class MockBubbleInstance {
    constructor() {
        this.data = {};
        this.canvas = document.getElementById('plugin-canvas');
        this.publishedStates = {};
    }

    publishState(key, value) {
        this.publishedStates[key] = value;
        logToElement('init-log', `Published state: ${key} = ${JSON.stringify(value)}`);
    }
}

class MockBubbleContext {
    async(fn) {
        // Simulate async context
        setTimeout(() => {
            fn((err, result) => {
                if (err) {
                    logToElement('init-log', `Async error: ${err}`);
                } else {
                    logToElement('init-log', `Async result: ${JSON.stringify(result)}`);
                }
            });
        }, 100);
    }
}

// Mock Bubble List/Objects
class MockBubbleList {
    constructor(data) {
        this.data = data;
    }

    length() {
        return this.data.length;
    }

    get(index) {
        return new MockBubbleObject(this.data[index]);
    }

    listProperties() {
        if (this.data.length === 0) return [];
        return Object.keys(this.data[0]);
    }
}

class MockBubbleObject {
    constructor(data) {
        this.data = data;
    }

    get(fieldName) {
        return this.data[fieldName];
    }

    listProperties() {
        return Object.keys(this.data);
    }
}

// Global state for testing
let mockInstance = null;
let mockContext = null;
let mockProperties = {};
let mockObjects = [];
let mockRelationships = [];

// Import the actual plugin functions (we'll need to adapt them for browser)
// For now, we'll create simplified versions that work in the browser

// Simplified plugin runtime for browser testing
const pluginApp = {
    instance: null,
    properties: null,
    context: null,

    init(instance, properties, context) {
        this.instance = instance;
        this.properties = properties;
        this.context = context;

        logToElement('init-log', 'Plugin initialized');
        logToElement('init-log', `Instance: ${JSON.stringify(instance, null, 2)}`);
        logToElement('init-log', `Properties: ${JSON.stringify(properties, null, 2)}`);
        logToElement('init-log', `Context: ${JSON.stringify(context, null, 2)}`);

        this.setupIframe();
    },

    update(properties) {
        this.properties = properties;
        logToElement('update-log', 'Plugin updated with new properties');
        logToElement('update-log', `New properties: ${JSON.stringify(properties, null, 2)}`);

        this.extract();
    },

    publish(key, value) {
        this.instance?.publishState(key, value);
    },

    sendToIframe(message) {
        logToElement('iframe-log', `Sending to iframe: ${JSON.stringify(message, null, 2)}`);
        // In real implementation, this would send to the iframe
        // For testing, we just log it
    },

    setupIframe() {
        logToElement('init-log', 'Setting up iframe...');
        
        // Create a mock iframe element for testing
        const iframe = document.createElement('div');
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = '2px dashed #007bff';
        iframe.style.backgroundColor = '#f8f9fa';
        iframe.innerHTML = '<p style="text-align: center; padding: 20px; color: #666;">Mock Iframe Content<br>Would load: https://webseriously.netlify.app/?db=bubble</p>';
        
        this.instance.canvas.innerHTML = '';
        this.instance.canvas.appendChild(iframe);
        this.instance.data.iframe = iframe;

        // Simulate iframe listening
        setTimeout(() => {
            this.instance.data.iframeListening = true;
            logToElement('iframe-log', 'Iframe is now listening');
        }, 1000);
    },

    extract() {
        logToElement('update-log', 'Extracting data...');
        
        if (!this.properties?.objects_table) {
            logToElement('update-log', 'No objects_table found in properties');
            return;
        }

        try {
            const listObjects = this.properties.objects_table.get(0, this.properties.objects_table.length());
            const extractedData = [];

            listObjects.forEach(obj => {
                const fieldNames = obj.listProperties();
                const itemData = {};

                fieldNames.forEach(fieldName => {
                    itemData[fieldName] = obj.get(fieldName);
                });

                extractedData.push(itemData);
            });

            logToElement('update-log', 'Extracted Data:');
            logToElement('update-log', JSON.stringify(extractedData, null, 2));
        } catch (error) {
            logToElement('update-log', `Error extracting data: ${error.message}`);
        }
    }
};

// Utility functions
function logToElement(elementId, message) {
    const element = document.getElementById(elementId);
    if (element) {
        const timestamp = new Date().toLocaleTimeString();
        element.innerHTML += `[${timestamp}] ${message}\n`;
        element.scrollTop = element.scrollHeight;
    }
}

function updateStatus(message, type = 'info') {
    const statusElement = document.getElementById('status');
    if (statusElement) {
        statusElement.textContent = message;
        statusElement.className = `status ${type}`;
    }
}

// Test functions
window.testInitialize = function() {
    logToElement('init-log', '=== Testing Plugin Initialization ===');
    
    // Create mock instance
    mockInstance = new MockBubbleInstance();
    mockContext = new MockBubbleContext();
    
    // Create initial properties
    mockProperties = {
        objects_table: new MockBubbleList(mockObjects),
        relationships_table: new MockBubbleList(mockRelationships),
        object_title_field: document.getElementById('object-title-field').value,
        object_children_field: document.getElementById('object-children-field').value,
        object_id_field: document.getElementById('object-id-field').value,
        relationship_id_field: document.getElementById('relationship-id-field').value,
        object_color_field: document.getElementById('object-color-field').value,
        object_type_field: document.getElementById('object-type-field').value
    };

    // Call the initialize function
    pluginApp.init(mockInstance, mockProperties, mockContext);
    
    updateStatus('Plugin initialized successfully', 'success');
};

window.testUpdate = function() {
    logToElement('update-log', '=== Testing Plugin Update ===');
    
    // Update properties with current form values
    const newProperties = {
        objects_table: new MockBubbleList(mockObjects),
        relationships_table: new MockBubbleList(mockRelationships),
        object_title_field: document.getElementById('object-title-field').value,
        object_children_field: document.getElementById('object-children-field').value,
        object_id_field: document.getElementById('object-id-field').value,
        relationship_id_field: document.getElementById('relationship-id-field').value,
        object_color_field: document.getElementById('object-color-field').value,
        object_type_field: document.getElementById('object-type-field').value
    };

    // Call the update function
    pluginApp.update(newProperties);
    
    updateStatus('Plugin updated successfully', 'success');
};

window.testIframeCommunication = function() {
    logToElement('iframe-log', '=== Testing Iframe Communication ===');
    
    if (!pluginApp.instance) {
        logToElement('iframe-log', 'Plugin not initialized. Please run initialization first.');
        return;
    }

    // Test sending a message to iframe
    const testMessage = {
        type: 'update',
        objectsTable: JSON.stringify(mockObjects),
        relationshipsTable: JSON.stringify(mockRelationships),
        objectTitleField: document.getElementById('object-title-field').value,
        objectChildrenField: document.getElementById('object-children-field').value,
        objectIdField: document.getElementById('object-id-field').value,
        relationshipIdField: document.getElementById('relationship-id-field').value,
        objectColorField: document.getElementById('object-color-field').value,
        objectTypeField: document.getElementById('object-type-field').value
    };

    pluginApp.sendToIframe(testMessage);
    logToElement('iframe-log', 'Test message sent to iframe');
};

window.simulateIframeResponse = function() {
    logToElement('iframe-log', '=== Simulating Iframe Response ===');
    
    // Simulate iframe sending a response
    const mockResponse = {
        type: 'listening',
        status: 'ready'
    };
    
    logToElement('iframe-log', `Iframe response: ${JSON.stringify(mockResponse, null, 2)}`);
    
    if (pluginApp.instance) {
        pluginApp.instance.data.iframeListening = true;
        logToElement('iframe-log', 'Iframe listening status set to true');
    }
};

window.generateMockData = function() {
    logToElement('init-log', '=== Generating Mock Data ===');
    
    // Generate random mock objects
    mockObjects = [
        {
            id: 'obj1',
            name: 'Root Object',
            type: 'root',
            color: '#ff6b6b',
            children: ['obj2', 'obj3']
        },
        {
            id: 'obj2',
            name: 'Child Object 1',
            type: 'child',
            color: '#4ecdc4',
            children: ['obj4']
        },
        {
            id: 'obj3',
            name: 'Child Object 2',
            type: 'child',
            color: '#45b7d1',
            children: []
        },
        {
            id: 'obj4',
            name: 'Grandchild Object',
            type: 'grandchild',
            color: '#96ceb4',
            children: []
        }
    ];

    // Generate random mock relationships
    mockRelationships = [
        {
            id: 'rel1',
            source: 'obj1',
            target: 'obj2',
            type: 'parent-child'
        },
        {
            id: 'rel2',
            source: 'obj1',
            target: 'obj3',
            type: 'parent-child'
        },
        {
            id: 'rel3',
            source: 'obj2',
            target: 'obj4',
            type: 'parent-child'
        }
    ];

    // Update display
    document.getElementById('mock-objects-display').textContent = `${mockObjects.length} objects`;
    document.getElementById('mock-relationships-display').textContent = `${mockRelationships.length} relationships`;
    
    logToElement('init-log', `Generated ${mockObjects.length} objects and ${mockRelationships.length} relationships`);
    updateStatus('Mock data generated successfully', 'success');
};

window.loadSampleData = function() {
    logToElement('init-log', '=== Loading Sample Data ===');
    
    // Load predefined sample data
    mockObjects = [
        {
            id: '1',
            name: 'Company A',
            type: 'company',
            color: '#e74c3c',
            children: ['2', '3']
        },
        {
            id: '2',
            name: 'Department 1',
            type: 'department',
            color: '#3498db',
            children: ['4', '5']
        },
        {
            id: '3',
            name: 'Department 2',
            type: 'department',
            color: '#2ecc71',
            children: ['6']
        },
        {
            id: '4',
            name: 'Team Alpha',
            type: 'team',
            color: '#f39c12',
            children: []
        },
        {
            id: '5',
            name: 'Team Beta',
            type: 'team',
            color: '#9b59b6',
            children: []
        },
        {
            id: '6',
            name: 'Team Gamma',
            type: 'team',
            color: '#1abc9c',
            children: []
        }
    ];

    mockRelationships = [
        {
            id: 'rel1',
            source: '1',
            target: '2',
            type: 'owns'
        },
        {
            id: 'rel2',
            source: '1',
            target: '3',
            type: 'owns'
        },
        {
            id: 'rel3',
            source: '2',
            target: '4',
            type: 'contains'
        },
        {
            id: 'rel4',
            source: '2',
            target: '5',
            type: 'contains'
        },
        {
            id: 'rel5',
            source: '3',
            target: '6',
            type: 'contains'
        }
    ];

    // Update display
    document.getElementById('mock-objects-display').textContent = `${mockObjects.length} objects`;
    document.getElementById('mock-relationships-display').textContent = `${mockRelationships.length} relationships`;
    
    logToElement('init-log', `Loaded sample data: ${mockObjects.length} objects and ${mockRelationships.length} relationships`);
    updateStatus('Sample data loaded successfully', 'success');
};

window.clearLogs = function() {
    document.getElementById('init-log').innerHTML = '';
    document.getElementById('update-log').innerHTML = '';
    document.getElementById('iframe-log').innerHTML = '';
    updateStatus('Logs cleared', 'info');
};

// Initialize with sample data on page load
document.addEventListener('DOMContentLoaded', function() {
    loadSampleData();
    updateStatus('Test environment ready. Click "Test Initialize" to begin.', 'info');
}); 