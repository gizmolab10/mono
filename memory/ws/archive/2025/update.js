function(instance, properties) {
	const BUBBLIZED_add_ons = '_boolean|_resource\\\\d*|_object|_custom|_field|_text|_list|object_|unique_';
	const ignore_fields = new Set(['Slug', 'Created By', 'Created Date', 'Modified Date']);
	const shortening_FIELD_pattern = new RegExp(`^${BUBBLIZED_add_ons}`, 'g');
	const SERIOUSLY_name_by_CUSTOM_name = new Map([['_id', 'id']]);
	const has_two_tables = properties.hasOwnProperty('edge_type');
	const shorter_FIELD_name_by_BUBBLIZED_field_name = new Map();
	const CUSTOM_FIELD_name_by_label = new Map();
	let CUSTOM_LIST_names = new Set();

	//////////////////////////////////////////////////////////////////////
	//																	//
	//	naming convention, uppercase for emphasis						//
	//																	//
	//	LIST		array of ITEM(s)									//
	//	ITEM		instance of CUSTOM data type (eg, "Object")			//
	//	SERIOUSLY	internal use within seriously netlify app			//
	//	FIELD		plugin Field (specified in bubble plugin editor)	//
	//	BUBBLIZED	verbose (sigh) field names created by bubble app	//
	//	LABELS		labels of text entries for CUSTOM field names		//
	//	CUSTOM		field name specified by author of bubble app		//
	//																	//
	//	_id			the unique id of ITEM								//
	//	c_			convert to											//
	//	_field		of ITEM												//
	//																	//
	//////////////////////////////////////////////////////////////////////

	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }
	function WARN(message, ...optionalParams) { if (instance.data.debug) { console.warn(message, ...optionalParams); } }

	const _____SETUP = Symbol('SETUP');

	setup_names();
	instance.data.assure_iframe_is_instantiated(properties);	// start the ball rolling, effective once
	process_incoming_properties();

	function setup_names() {
		const LABELS_of_CUSTOM_LISTS = [
			'object_parents_field',
			'object_related_field',
			'owners_field'];
		let LABELS_of_FIELD_names = [...LABELS_of_CUSTOM_LISTS,
			'object_title_field',
			'object_color_field'];
		if (has_two_tables) {
			LABELS_of_FIELD_names = [...LABELS_of_FIELD_names,
				'edge_two_way_field',
				'edge_parent_field',
				'edge_orders_field',
				'edge_child_field',
				'edge_kind_field'];
		}
		LABELS_of_FIELD_names.forEach(label => {
			const property_value = properties[label];
			if(!!property_value && property_value != 'undefined') {
				const ITEM_field_name = String(properties[label]).toLowerCase();
				// replace all spaces with underscores, and _list with s (eg, "object_list" becomes "objects")
				// this converges "related_objects" with "related objects"
				// unbubblizes them (strips the annoying list suffix added by bubble to its field names, grrrr)
				const CUSTOM_FIELD_name = ITEM_field_name.replace(/ /, '_').replace(/^_list/, 's');
				CUSTOM_FIELD_name_by_label[label] = CUSTOM_FIELD_name;
				const SERIOUSLY_field_name = c_shorter_FIELD_name_from(label);	// "parents_resource1" --> "parents"
				SERIOUSLY_name_by_CUSTOM_name.set(CUSTOM_FIELD_name, SERIOUSLY_field_name);
				LOG('setup_names', label, ITEM_field_name);
			}
		});
		CUSTOM_LIST_names = new Set(c_LABELS_to_CUSTOM_LIST_names(LABELS_of_CUSTOM_LISTS));	// N.B. needs CUSTOM_FIELD_name_by_label from LABELS_of_FIELD_names.forEach
	}

	const _____CONVERSIONS = Symbol('CONVERSIONS');

	function c_shorter_FIELD_name_from(name) {
		if (shorter_FIELD_name_by_BUBBLIZED_field_name.has(name)) {
			return shorter_FIELD_name_by_BUBBLIZED_field_name.get(name);
		}
		const rename = name.replace(shortening_FIELD_pattern, '');
		shorter_FIELD_name_by_BUBBLIZED_field_name.set(name, rename);
		return rename;
	}

	function c_LABELS_to_CUSTOM_LIST_names(LABELS_of_CUSTOM_LISTS) {
		// Ack! Bubble doesn't support lists within lists!!!!!!
		const translated = [];
		LABELS_of_CUSTOM_LISTS.forEach(label_of_LIST_name => {
			const name = CUSTOM_FIELD_name_by_label[label_of_LIST_name];
			if (!!name) {
				translated.push(name);
			} else {
				WARN(['c_LABELS_to_CUSTOM_LIST_names "', label_of_LIST_name, '" not found in CUSTOM_FIELD_name_by_label'].join(''));
			}
		});
		return translated;
	}

	const _____EXTRACTIONS = Symbol('EXTRACTIONS');

	function extract_ITEM_data(field_name_of_ITEM, ITEM = null) {
		let ITEM_data = {};
		if (!ITEM) {
			ITEM = properties[field_name_of_ITEM];
		}
		if (!!ITEM) {
			instance.data.attempts[field_name_of_ITEM] = (instance.data.attempts[field_name_of_ITEM] ?? 0) + 1;
			LOG('extracting data from ITEM for', field_name_of_ITEM, ITEM);
			const BUBBLIZED_field_names = ITEM.listProperties();
			for (const BUBBLIZED_field_name of BUBBLIZED_field_names) {
				const CUSTOM_FIELD_name = c_shorter_FIELD_name_from(BUBBLIZED_field_name);
				if (ignore_fields.has(CUSTOM_FIELD_name)) continue;
				const value = ITEM.get(BUBBLIZED_field_name);
				if (!!value || value == 0) {  // 0 is a valid value
					const SERIOUSLY_field_name = SERIOUSLY_name_by_CUSTOM_name.get(BUBBLIZED_field_name) ??
												 SERIOUSLY_name_by_CUSTOM_name.get(CUSTOM_FIELD_name);
					if (!!SERIOUSLY_field_name) {
						if (!CUSTOM_LIST_names.has(CUSTOM_FIELD_name)) {
							ITEM_data[SERIOUSLY_field_name] = value;
						} else {
							const LIST_data = extract_LIST_data(BUBBLIZED_field_name, value);
							if (!!LIST_data) {
								LOG('extracted LIST for', SERIOUSLY_field_name, LIST_data);
								ITEM_data[SERIOUSLY_field_name] = LIST_data;
							}
						}
					}
				}
			}
			instance.data.attempts[field_name_of_ITEM] -= 1;
			if (instance.data.attempts[field_name_of_ITEM] == 0) {
				delete instance.data.attempts[field_name_of_ITEM];
			}
		}
		return ITEM_data;
	}

	function extract_LIST_data(field_name, LIST = null) {
		// sometimes name is actually the LIST, use it as a string to get the LIST from properties
		LIST = !!LIST ? LIST : (typeof field_name != 'string') ? field_name : (properties[field_name] || null);
		let extracted_data = [];
		if (!LIST) {
			if (LIST != null) {
				WARN(field_name, 'is null');
			}
		} else if (!LIST.length || typeof LIST.length !== 'function' || typeof LIST.get !== 'function') {
			WARN(field_name, 'is not a LIST');
		} else {
			let sublist = LIST.get(0, LIST.length());
			sublist.forEach(item => {
				const ITEM_data = extract_ITEM_data(field_name, item);
				if (!!ITEM_data) {
					extracted_data.push(ITEM_data);
				}
			});
		}
		LOG('extracted data from LIST for', field_name, LIST, extracted_data);
		return extracted_data;
	}

	const _____PROCESS_AND_SEND = Symbol('PROCESS_AND_SEND');

	function send_to_webseriously(object) {
		const iframe = instance.data.iframe.contentWindow;
		const message = {
			type: 'UPDATE_PROPERTIES',
			properties: JSON.stringify(object)
		};
		if (instance.data.iframeIsListening && iframe) {
			iframe.postMessage(message, '*');
		} else {
			instance.data.pendingMessages = instance.data.pendingMessages || [];
			instance.data.pendingMessages.push(message);
		}
	}

	function process_incoming_properties() {
		LOG('incoming', properties);

		try {
			//////////////////////////////////////////////////////////
			//														//
			//	process incoming properties & send to webseriously	//
			//														//
			//	 the keys (below) are matched within DB_Bubble.ts	//
			//  	 (in its handle_bubble_message function)		//
			//														//
			//    instance.data.attempts tracks unhydrated ITEMs	//
			//														//
			//////////////////////////////////////////////////////////
			
			instance.data.attempts = instance.data.attempts || {};
			send_to_webseriously({
				overwrite_focus_and_mode: properties['overwrite_focus_and_mode'],
				erase_user_preferences: properties['erase_user_preferences'],
				inRadialMode: properties['show_radial_mode'],
				things: extract_LIST_data('objects_table'),
				root: extract_ITEM_data('starting_object'),
				focus: extract_ITEM_data('focus_object')
			});
		} catch (error) {
			if (error.constructor.name != 'NotReadyError') {
				WARN('[PLUGIN] threw an error:', error);
			} else if (instance.data.attempts && Object.entries(instance.data.attempts).some(([_, val]) => val > 0)) {
				WARN('[PLUGIN] data not ready:', instance.data.attempts);
			}
		}
	}
}