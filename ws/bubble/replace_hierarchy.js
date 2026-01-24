function(instance, properties, context) {
	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	LOG('replace_hierarchy', properties);
	instance.data.send_to_webseriously('REPLACE_HIERARCHY', {});
}
