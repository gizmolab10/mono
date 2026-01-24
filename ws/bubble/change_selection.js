function(instance, properties, context) {
	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	LOG('change_selection', properties);
	instance.data.send_to_webseriously('CHANGE_GRAB', {
		id: properties.id		// id of the new selected object
	});
}
