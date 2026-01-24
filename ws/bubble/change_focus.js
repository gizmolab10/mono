function(instance, properties, context) {
	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	LOG('change_focus', properties);
	instance.data.send_to_webseriously('CHANGE_FOCUS', {
		id: properties.id		// id of the new focus object
	});
}