/**
 * Vitest setup file
 * Initializes the test environment before running tests
 */

// Mock window.location for tests that need it
if (typeof window !== 'undefined' && !window.location.search) {
	Object.defineProperty(window, 'location', {
		value: {
			search: '',
		},
		writable: true,
	});
}

// Import enumerations first to ensure they're available before any classes use them
import { T_Persistence } from '../common/Enumerations';

// Verify T_Persistence is available before importing anything that uses it
if (!T_Persistence || !T_Persistence.none) {
	throw new Error('T_Persistence enum not properly initialized');
}

// Then import Global_Imports to ensure all modules are initialized
// Global_Imports now has the correct import order (k and features before radial and search)
// This ensures enumerations and managers are available
// Note: Some managers may try to access browser APIs, which will be mocked above
import '../common/Global_Imports';

// Additional setup can be added here if needed
// For example, mocking browser APIs, setting up test data, etc.

