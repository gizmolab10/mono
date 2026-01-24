function(instance, properties) {
	const IGNORE_these_keys = ['Created Date', 'Created By', 'Slug', '_id'];
	const STRIP_these_suffixes = ['_boolean', '_custom', '_text', '_list'];
	const SERIOUSLY_keys_of_ITEMS = ['parent', 'child', 'owner', 'kind'];
	const has_two_tables = !!properties.edge_type;
	const MESSY_keys_by_PLUGIN_key = {};
	const MESSY_keys_of_LISTS = [];
	const debug = false;

	log('has_two_tables', has_two_tables);

	let PLUGIN_keys = [
		'object_id_field',
		'starting_object',
		'object_color_field',
		'object_title_field',
		'object_parents_field',
		'object_related_field'];

	if (has_two_tables) {
		PLUGIN_keys = [...PLUGIN_keys,
			'edge_id_field',
			'edge_kind_field',
			'edge_child_field',
			'edge_parent_field',
			'edge_orders_field',
			'edge_two_way_field'];
	}

	// five kinds of keys:

	// 1. PLUGIN keys				labels of element properties ('edge_parent_key' ...)
	// 2. MESSY keys of LISTS		'parent_by_a_different_key' ...
	// 3. STRIPPED keys				remove: '_boolean' ...
	// 4. SERIOUSLY keys			pass to SERIOUSLY app ('parent' ...)
	// 5. ignore keys				'Slug' ...

	PLUGIN_keys.forEach(PLUGIN_key => {
		MESSY_keys_by_PLUGIN_key[PLUGIN_key] = properties[PLUGIN_key];
	});

	['edge_parent_field', 'edge_child_field'].forEach(key => {
		MESSY_keys_of_LISTS.push(MESSY_keys_by_PLUGIN_key[key]);
	});

	// MESSY keys are static text, used indirectly to access lists and ITEMs

	function has_SERIOUSLY_key(key) { return Object.keys(MESSY_keys_by_PLUGIN_key).includes(key); }
	function log(message, ...optionalParams) { if (debug) { console.log(message, ...optionalParams); } }
	instance.data.attempts = instance.data.attempts || {};

	function SERIOUSLY_key_for(key, AVOID_key_startswith) {
		// convert to a key recognized by SERIOUSLY
		// NB must distinguish between objects and edges
		for (const [PLUGIN_key, MESSY_value] of Object.entries(MESSY_keys_by_PLUGIN_key)) {
			// if (typeof MESSY_value === 'object' && typeof MESSY_value.listProperties === 'function') {
			// 	log(key, 'has properties', MESSY_value.listProperties());
			// }
			if (MESSY_value == key && !key.startsWith(AVOID_key_startswith)) {
				return STRIP_key(PLUGIN_key, ['object_', 'edge_'], ['_field']);
			}
		}
		return null;
	}

	function STRIP_key(key, prefixes_to_remove, suffices_to_remove) {
		let STRIPPED_key = key;
		prefixes_to_remove.forEach(strip_me => {
			parts = STRIPPED_key.split(strip_me);
			if (parts.length > 1) {
				STRIPPED_key = parts[1];
			}
		});
		suffices_to_remove.forEach(strip_me_too => {
			parts = STRIPPED_key.split(strip_me_too);
			if (parts.length > 1) {
				STRIPPED_key = parts[0];
			}
		});
		return STRIPPED_key;
	}

	function extract_DICT_from(ITEM, key, visited = []) {
		// log('extract_DICT_from', key, ITEM, visited);
		let ITEM_dict = {};
		if (!!ITEM) {
			instance.data.attempts[key] = (instance.data.attempts[key] ?? 0) + 1;
			const MESSY_keys = ITEM.listProperties();
			const ITEM_key_value_pairs = MESSY_keys.reduce((keys, key) => {	// for debugging
				keys[key] = ITEM.get(key);
				return keys;
			}, {});
			MESSY_keys.forEach(MESSY_key => {
				const STRIPPED_key = STRIP_key(MESSY_key, [], STRIP_these_suffixes);
				if (!IGNORE_these_keys.includes(STRIPPED_key)) {
					const value = ITEM.get(MESSY_key);
					const AVOID = MESSY_key.startsWith('object_') || MESSY_key.endsWith('object') ? 'edge' : 'object';
					const SERIOUSLY_key = SERIOUSLY_key_for(MESSY_key, AVOID) ?? STRIPPED_key;
					log('extract_DICT_from', key, MESSY_key, STRIPPED_key, value, AVOID, SERIOUSLY_key);
					if (!SERIOUSLY_key) {
						if (has_SERIOUSLY_key(STRIPPED_key) || has_SERIOUSLY_key(MESSY_key)) {
							console.warn('extracted SERIOUSLY key unresolved for', MESSY_key, 'ITEM key_value_pairs:', ITEM_key_value_pairs);
						}
					} else if (!value && value != false) {
						if (value != null) {
							console.warn('value undefined for', MESSY_key, 'ITEM key_value_pairs:', ITEM_key_value_pairs);
						}
					} else if (SERIOUSLY_key == 'orders') {
						let orders = [];
						for (let i = 0; i < value.length(); i++) {
							const order = value.get(i, i + 1)[0];
							orders.push(order);
						}
						log('orders', orders);
					// 	ITEM_dict[SERIOUSLY_key] = orders;
					} else if (MESSY_key == 'owners_list_custom_thing') {	// for traits
						ITEM_dict['owners'] = extract_ARRAY_from(value);
					} else if (SERIOUSLY_keys_of_ITEMS.includes(STRIPPED_key) && typeof value != 'string') {
						log('recursively extract_DICT_from', STRIPPED_key, value, visited);
						ITEM_dict[SERIOUSLY_key] = extract_DICT_from(value, STRIPPED_key, [...visited, STRIPPED_key]);
					} else if (MESSY_keys_of_LISTS.includes(MESSY_key)) {
						log('MESSY_keys_of_LISTS.includes', MESSY_key, value, visited, ITEM_dict.id);
						const keepers = extract_ARRAY_at_key_ignoring(MESSY_key, value, visited, ITEM_dict.id);
						if (!!keepers) {
							ITEM_dict[SERIOUSLY_key] = keepers;
						}
					} else {
						ITEM_dict[SERIOUSLY_key] = value;
						log(key, MESSY_key, 'DEFAULT YIELDS:', SERIOUSLY_key, value, ITEM_dict);
					}
				}
			});
			instance.data.attempts[key] -= 1;
			if (instance.data.attempts[key] == 0) {
				delete instance.data.attempts[key];
			}
			log('ITEM dict:', key, ITEM_dict);
		}
		return ITEM_dict;
	}

	function extract_ARRAY_at_key_ignoring(key, value, visited, id_to_ignore) {
		if (!!value) {
			let keepers = [];
			// this is only for text values that correspond to objects or lists
			// value is a list of objects
			// log('extract_ARRAY_at_key_ignoring', key, value, visited, id_to_ignore);
			const extracted = extract_ARRAY_from(key, value, visited);
			if (extracted.length > 0) {
				for (const extracted_ITEM of extracted) {
					if (!!extracted_ITEM && extracted_ITEM.id != id_to_ignore) {
						keepers.push(extracted_ITEM);
					}
				}
				if (keepers.length > 0) {
					return keepers;
				}
			}
		}
		return null;
	}

	function extract_ARRAY_from(key, list = null, visited = []) {
		list = list || (typeof key === 'string' ? (properties[key] || null) : key);
		let extracted_data = [];
		// log('extract_ARRAY_from', key, list, visited);
		if (!list) return [];
		if (visited.includes(key)) {
			log(key, 'already visited');
		} else if (!list) {
			if (list != null) {
				console.warn(key, 'is null');
			}
		} else if (!list.length || typeof list.length !== 'function' || typeof list.get !== 'function') {
			console.warn(key, 'is not a list');
		} else {
			try {
				let sublist = list.get(0, list.length());		// this will throw an error if the list is not ready
				sublist.forEach(ITEM => {
					extracted_data.push(extract_DICT_from(ITEM, key, [...visited, key]));
				});
			} catch (error) {
				if (error.constructor.name != 'NotReadyError') {
					log('ERROR (extract_ARRAY_from)', key, list, visited, error);
				}
			}
		}
		return extracted_data;
	}

	function send(data) {
		const message = {
			type: 'UPDATE_PROPERTIES',
			properties: JSON.stringify(data)
		};

		console.log('send');
		if (!!instance.data.iframe?.contentWindow && instance.data.iframeIsListening) {
			instance.data.iframe.contentWindow.postMessage(message, '*');
		} else {
			instance.data.pendingMessages = instance.data.pendingMessages || [];
			instance.data.pendingMessages.push(message);
		}
	}

	try {

		var data = {
			things: extract_ARRAY_from('objects_table'),
			grabs: extract_ARRAY_from('selected_objects'),
			focus: extract_DICT_from(properties.focus_object, 'focus_object'),
			root: extract_DICT_from(properties.starting_object, 'starting_object'),
		};

		// if (has_two_tables) {
		// 	data.relationships = extract_ARRAY_from('edges_table');
		// }

		send(data);

	} catch (error) {
		if (error.constructor.key != 'NotReadyError') {
			console.warn('[PLUGIN] threw an error:', error);
		} else if (Object.keys(instance.data.attempts).length > 0) {
			log('[PLUGIN] data not ready:', instance.data.attempts);
		}
	}
}
