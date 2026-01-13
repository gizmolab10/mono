function(instance, properties, context) {
	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	LOG('change_graph_mode', properties);
	instance.data.send_to_webseriously('CHANGE_GRAPH_MODE', {
		in_radial_mode: properties.in_radial_mode		// false means tree
	});
}
