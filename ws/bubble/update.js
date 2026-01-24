function(instance, properties) {
	const field_labels = [
		'override_focus_and_mode',
		'override_depth_limit',
		'override_zoom_scale',
		'erase_user_settings',
		'starting_object_id',
		'suppress_tree_mode',
		'focus_object_id',
		'in_radial_mode',
		'show_details',
		'depth_limit',
		'zoom_scale'];
	const field_labels_of_arrays = [
		'related_ids_array',
		'parent_ids_array',
		'titles_array',
		'colors_array',
		'ids_array'];

	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	instance.data.assure_iframe_is_instantiated(properties);	// start the ball rolling, effective once
	process_incoming_properties();

	function process_incoming_properties() {
		LOG('INCOMING');

		//////////////////////////////////////////////////////////
		//														//
		//	process incoming properties & send to webseriously	//
		//														//
		//	seriously_name(s) are recognized by DB_Bubble.ts	//
		//  instance.data.attempts tracks unhydrated properties	//
		//														//
		//////////////////////////////////////////////////////////

		instance.data.attempts = instance.data.attempts || {};
		let to_send = {};
		field_labels.forEach(label => {
			const seriously_name = label.replace('_object_id', '').replace('starting', 'root');
			to_send[seriously_name] = properties[label]
		});
		field_labels_of_arrays.forEach(label => {
			const array = properties[label];
			if (!!array && typeof array == 'object' && typeof array.length === 'function' && array.length() > 0) {
				const seriously_name = label.replace('parent_', 'parents_').replace('_ids', '').replace('_array', '').replace('_object_id', '');
				const length = array.length();
				let items = [];
				for (let i = 0; i < length; i++) {
					const item = array.get(i, 1)[0] ?? '';
					items.push(item);
				}
				to_send[seriously_name] = items;
			}
		});
		instance.data.send_to_webseriously('UPDATE_PROPERTIES', to_send);
	}
}
