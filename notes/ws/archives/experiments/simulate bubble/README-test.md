# Bubble Plugin Simulation Test

This test setup simulates how Bubble would interact with your plugin files, allowing you to test your plugin functionality in a browser environment.

## Files

- `simulate.html` - The main test interface
- `test-simulator.js` - The simulation logic that mimics Bubble's plugin environment
- `README-test.md` - This documentation

## How to Use

1. **Open the test page**: Open `simulate.html` in your browser
2. **Load sample data**: Click "Load Sample Data" to populate with test data
3. **Test initialization**: Click "Test Initialize" to simulate Bubble calling your plugin's initialize function
4. **Test updates**: Modify the property inputs and click "Test Update" to simulate property changes
5. **Test iframe communication**: Use the iframe communication tests to verify message passing

## What's Simulated

### Bubble Plugin Environment
- **MockBubbleInstance**: Simulates Bubble's plugin instance with `publishState()` method
- **MockBubbleContext**: Simulates Bubble's async context
- **MockBubbleList/MockBubbleObject**: Simulates Bubble's data objects with `get()`, `listProperties()`, and `length()` methods

### Plugin Functions Tested
- **initialize()**: Called when Bubble loads your plugin
- **update()**: Called when Bubble properties change
- **iframe setup**: Tests iframe creation and communication
- **data extraction**: Tests extracting data from Bubble objects
- **state publishing**: Tests publishing state back to Bubble

### Test Features
- **Property inputs**: Modify plugin properties to test different configurations
- **Mock data generation**: Create random test data or load predefined samples
- **Logging**: All plugin operations are logged for debugging
- **Status updates**: Visual feedback on test progress
- **Iframe simulation**: Mock iframe communication without external dependencies

## Plugin Files Being Tested

The simulation tests these files from your codebase:

### Plugin Interface (`src/lib/ts/plugin/`)
- `initialize.ts` - Plugin initialization function
- `update.ts` - Plugin update function  
- `types.ts` - TypeScript type definitions

### App Runtime (`src/lib/ts/app/`)
- `pluginRuntime.ts` - Main plugin runtime
- `iframe.ts` - Iframe setup and communication
- `extract.ts` - Data extraction from Bubble objects
- `serializers.ts` - Data serialization utilities
- `hydration.ts` - Data hydration monitoring

## Running the Tests

1. **Start with initialization**: Always run "Test Initialize" first
2. **Test with different data**: Use "Generate Mock Data" or "Load Sample Data"
3. **Test property updates**: Modify the property inputs and run "Test Update"
4. **Test iframe communication**: Use the iframe communication tests
5. **Monitor logs**: Watch the log outputs for detailed information

## Expected Behavior

When working correctly, you should see:
- Successful plugin initialization with instance, properties, and context
- Iframe setup with proper styling
- Data extraction from mock Bubble objects
- State publishing back to Bubble
- Iframe communication messages
- Proper error handling for missing data

## Troubleshooting

- **Plugin not initialized**: Make sure to run "Test Initialize" first
- **No data extracted**: Check that mock data is loaded and properties are set correctly
- **Iframe not responding**: Use "Simulate Iframe Response" to test communication
- **Clear logs**: Use "Clear Logs" to reset the test interface

## Next Steps

After testing with this simulation, you can:
1. Deploy your plugin to Bubble for real testing
2. Use the logs to debug any issues
3. Modify the simulation to test additional scenarios
4. Add more sophisticated mock data for complex testing

## Query (to rebuild this test harness)

I've made fundamental changes to my plugin files in src/lib/ts/plugin/ and src/lib/ts/app/. Please:

1. Read and analyze my current plugin files to understand the new structure
2. Recreate the test simulation files in the bubble folder to match my changes
3. Update the mock environment to reflect any new APIs, functions, or data structures
4. Modify the test scenarios to test the new functionality
5. Update the HTML interface if needed for new features
6. Respect any changes I've made to the README-test.md file

The files to recreate/update are:
- bubble/simulate.html
- bubble/test-simulator.js  
- bubble/test-runner.js
- bubble/README-test.md (preserve any custom changes I made)

Please analyze my current plugin files first, then recreate the test environment to match my new plugin structure.