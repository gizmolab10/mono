export function extract(app) {
	// Check if our list exists
	if (!app.properties?.objects_table) return;

	// Get all objects from the list
	let listObjects = app.properties.objects_table.get(0, app.properties.objects_table.length());

	// Create array to store our extracted data
	let extractedData = [];

	// Loop through each object in the list
	listObjects.forEach(obj => {
		// Get all available field names for this object type
		let fieldNames = obj.listProperties();

		// Create a plain JavaScript object to store this item's data
		let itemData = {};

		// Extract each field's value
		fieldNames.forEach(fieldName => {
			itemData[fieldName] = obj.get(fieldName);
		});

		// Add to our results array
		extractedData.push(itemData);
	});

	// Output the results
	console.log('Extracted Data:', extractedData);
	console.log('As JSON:', JSON.stringify(extractedData, null, 2));

	//# sourceURL=PLUGIN_1694208303063x996713694072143900_current/seriously--testing--update--seriously-graph-.js

}