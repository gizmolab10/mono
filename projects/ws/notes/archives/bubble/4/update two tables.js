function(instance, properties) {

	function normalizeField(name, endsWith) {
		if (name.endsWith(endsWith)) {
			return name.slice(0, -endsWith.length);
		}
		return name;
	}

	function extract_ITEM_data(item, name) {
		log('extract_ITEM_data', name, item, visited);
		let item_data = {};
		if (!!item) {
			instance.data.attempts[name] = (instance.data.attempts[name] ?? 0) + 1;
			const field_names = item.listProperties();
			const item_properties = field_names.reduce((names, field_name) => {	// for debugging
				names[field_name] = item.get(field_name);
				return names;
			}, {});
			field_names.forEach(field_name => {
				let clean_name = field_name;
				const endings = ['_custom_predicate', '_custom_thing', '_boolean', '_text'];
				endings.forEach(ending => {
					clean_name = normalizeField(clean_name, ending);
				});
				const value = item.get(field_name);
				const ignore_fields = ['Slug', 'parents_list', 'related_list'];
				if (!ignore_fields.includes(clean_name)) {
					const item_fields = ['child', 'parent', 'owner', 'kind'];
					const needs_extraction = item_fields.includes(clean_name) && typeof value != 'string';
					if (value == undefined) {
						if (value != null) {
							console.warn('value undefined for', field_name, 'item properties:', item_properties);
						}
					} else if (field_name == 'orders_list_number') {
						let orders = [];
						for (let i = 0; i < value.length(); i++) {
							const order = value.get(i, i + 1)[0];
							orders.push(order);
						}
						item_data['orders'] = orders;
					} else if (field_name == 'owners_list_custom_thing') {
						item_data['owners'] = extract_LIST_data(value);
					} else if (needs_extraction) {
						item_data[clean_name] = extract_ITEM_data(value, clean_name);
					} else {
						item_data[clean_name] = value;
					}
				}
			});
			instance.data.attempts[name] -= 1;
			if (instance.data.attempts[name] == 0) {
				delete instance.data.attempts[name];
			}
			// console.log('item data:', name, item_data);
		}
		return item_data;
	}

	function extract_LIST_data(name) {
		const list = typeof name === 'string' ? (properties[name] || null) : name;
		if (!list) return [];
		let sublist = list.get(0, list.length());
		let extracted_data = [];
		sublist.forEach(item => {
			extracted_data.push(extract_ITEM_data(item, name));
		});
		return extracted_data;
	}

	function send(object) {
		const contentWindow = instance.data.iframe.contentWindow;
		const message = {
			type: 'UPDATE_PROPERTIES',
			properties: JSON.stringify(object)
		};

		if (instance.data.iframeIsListening && contentWindow) {
			contentWindow.postMessage(message, '*');
		} else {
			instance.data.pendingMessages = instance.data.pendingMessages || [];
			instance.data.pendingMessages.push(message);
		}
	}

	try {
		instance.data.attempts = instance.data.attempts || {};

		send({
			objects_table: extract_LIST_data('objects_table'),
			predicates_table: extract_LIST_data('predicates_table'),
			relationships_table: extract_LIST_data('relationships_table'),
			starting_object: extract_ITEM_data(properties.starting_object, 'starting_object'),
		}, null, 0);

		send({
			selected_objects: extract_LIST_data('selected_objects'),
			focus_object: extract_ITEM_data(properties.focus_object, 'focus_object'),
		}, null, 0);

		send({
			tags_table: extract_LIST_data('tags_table'),
			traits_table: extract_LIST_data('traits_table')
		}, null, 0);

	} catch (error) {
		if (error.constructor.name != 'NotReadyError') {
			console.warn('[PLUGIN] threw an error:', error);
		} else if (Object.keys(instance.data.attempts).length > 0) {
			console.log('[PLUGIN] data not ready:', instance.data.attempts);
		}
	}
}
