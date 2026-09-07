// Test Runner for Bubble Plugin Simulation
// This script can be run in the browser console to automate testing

class PluginTestRunner {
    constructor() {
        this.testResults = [];
        this.currentTest = null;
    }

    // Run all tests
    async runAllTests() {
        console.log('🚀 Starting Bubble Plugin Simulation Tests...');
        
        this.testResults = [];
        
        await this.testInitialization();
        await this.testDataGeneration();
        await this.testPropertyUpdates();
        await this.testIframeCommunication();
        await this.testErrorHandling();
        
        this.printResults();
    }

    // Test 1: Plugin Initialization
    async testInitialization() {
        this.currentTest = 'Plugin Initialization';
        console.log(`\n📋 Running: ${this.currentTest}`);
        
        try {
            // Load sample data first
            if (typeof loadSampleData === 'function') {
                loadSampleData();
            }
            
            // Test initialization
            if (typeof testInitialize === 'function') {
                testInitialize();
                
                // Wait a bit for async operations
                await this.wait(1000);
                
                // Check if plugin was initialized
                const initLog = document.getElementById('init-log');
                if (initLog && initLog.textContent.includes('Plugin initialized')) {
                    this.addResult(true, 'Plugin initialized successfully');
                } else {
                    this.addResult(false, 'Plugin initialization failed');
                }
            } else {
                this.addResult(false, 'testInitialize function not found');
            }
        } catch (error) {
            this.addResult(false, `Initialization error: ${error.message}`);
        }
    }

    // Test 2: Data Generation
    async testDataGeneration() {
        this.currentTest = 'Data Generation';
        console.log(`\n📋 Running: ${this.currentTest}`);
        
        try {
            if (typeof generateMockData === 'function') {
                generateMockData();
                await this.wait(500);
                
                const objectsDisplay = document.getElementById('mock-objects-display');
                const relationshipsDisplay = document.getElementById('mock-relationships-display');
                
                if (objectsDisplay && relationshipsDisplay) {
                    const objectCount = objectsDisplay.textContent.match(/\d+/)?.[0];
                    const relationshipCount = relationshipsDisplay.textContent.match(/\d+/)?.[0];
                    
                    if (objectCount > 0 && relationshipCount >= 0) {
                        this.addResult(true, `Generated ${objectCount} objects and ${relationshipCount} relationships`);
                    } else {
                        this.addResult(false, 'Data generation failed');
                    }
                } else {
                    this.addResult(false, 'Data display elements not found');
                }
            } else {
                this.addResult(false, 'generateMockData function not found');
            }
        } catch (error) {
            this.addResult(false, `Data generation error: ${error.message}`);
        }
    }

    // Test 3: Property Updates
    async testPropertyUpdates() {
        this.currentTest = 'Property Updates';
        console.log(`\n📋 Running: ${this.currentTest}`);
        
        try {
            // Set some test properties
            const testProperties = {
                'objects-table': 'test_objects',
                'relationships-table': 'test_relationships',
                'object-title-field': 'title',
                'object-children-field': 'children',
                'object-id-field': 'id',
                'relationship-id-field': 'rel_id',
                'object-color-field': 'color',
                'object-type-field': 'type'
            };
            
            // Update property inputs
            Object.entries(testProperties).forEach(([id, value]) => {
                const element = document.getElementById(id);
                if (element) {
                    element.value = value;
                }
            });
            
            // Test update
            if (typeof testUpdate === 'function') {
                testUpdate();
                await this.wait(500);
                
                const updateLog = document.getElementById('update-log');
                if (updateLog && updateLog.textContent.includes('Plugin updated')) {
                    this.addResult(true, 'Property updates processed successfully');
                } else {
                    this.addResult(false, 'Property update failed');
                }
            } else {
                this.addResult(false, 'testUpdate function not found');
            }
        } catch (error) {
            this.addResult(false, `Property update error: ${error.message}`);
        }
    }

    // Test 4: Iframe Communication
    async testIframeCommunication() {
        this.currentTest = 'Iframe Communication';
        console.log(`\n📋 Running: ${this.currentTest}`);
        
        try {
            if (typeof testIframeCommunication === 'function') {
                testIframeCommunication();
                await this.wait(500);
                
                const iframeLog = document.getElementById('iframe-log');
                if (iframeLog && iframeLog.textContent.includes('Test message sent')) {
                    this.addResult(true, 'Iframe communication test passed');
                } else {
                    this.addResult(false, 'Iframe communication test failed');
                }
            } else {
                this.addResult(false, 'testIframeCommunication function not found');
            }
        } catch (error) {
            this.addResult(false, `Iframe communication error: ${error.message}`);
        }
    }

    // Test 5: Error Handling
    async testErrorHandling() {
        this.currentTest = 'Error Handling';
        console.log(`\n📋 Running: ${this.currentTest}`);
        
        try {
            // Test with invalid data
            if (typeof testUpdate === 'function') {
                // Clear mock data to test error handling
                window.mockObjects = [];
                window.mockRelationships = [];
                
                testUpdate();
                await this.wait(500);
                
                const updateLog = document.getElementById('update-log');
                if (updateLog && updateLog.textContent.includes('No objects_table found')) {
                    this.addResult(true, 'Error handling for missing data works correctly');
                } else {
                    this.addResult(false, 'Error handling test failed');
                }
            } else {
                this.addResult(false, 'Error handling test could not be performed');
            }
        } catch (error) {
            this.addResult(false, `Error handling test error: ${error.message}`);
        }
    }

    // Utility methods
    addResult(passed, message) {
        this.testResults.push({
            test: this.currentTest,
            passed,
            message,
            timestamp: new Date().toISOString()
        });
        
        const status = passed ? '✅ PASS' : '❌ FAIL';
        console.log(`${status}: ${message}`);
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    printResults() {
        console.log('\n📊 Test Results Summary:');
        console.log('========================');
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        
        this.testResults.forEach(result => {
            const status = result.passed ? '✅' : '❌';
            console.log(`${status} ${result.test}: ${result.message}`);
        });
        
        console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
        
        if (passed === total) {
            console.log('🎉 All tests passed! Plugin simulation is working correctly.');
        } else {
            console.log('⚠️  Some tests failed. Check the logs for details.');
        }
    }
}

// Create and expose the test runner
window.pluginTestRunner = new PluginTestRunner();

// Auto-run tests when page loads (optional)
// Uncomment the line below to automatically run tests when the page loads
// document.addEventListener('DOMContentLoaded', () => {
//     setTimeout(() => window.pluginTestRunner.runAllTests(), 2000);
// });

console.log('🧪 Plugin Test Runner loaded!');
console.log('Run: window.pluginTestRunner.runAllTests() to execute all tests');
console.log('Or run individual tests:');
console.log('- window.pluginTestRunner.testInitialization()');
console.log('- window.pluginTestRunner.testDataGeneration()');
console.log('- window.pluginTestRunner.testPropertyUpdates()');
console.log('- window.pluginTestRunner.testIframeCommunication()');
console.log('- window.pluginTestRunner.testErrorHandling()'); 