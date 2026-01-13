function(instance) {
	instance.data.enable_logging = false;
	instance.data.iframe_is_instantiated = false;	// assure_iframe_is_instantiated (right below, called from update) sets this to true
	instance.data.LOG = function (message, value, ...optionalParams) { if (instance.data.enable_logging && !!value) { console.log('[PLUGIN]', message, value, ...optionalParams); } }
	instance.data.assure_iframe_is_instantiated = function (properties) {
		if (!instance.data.iframe_is_instantiated) {
			instance.data.enable_logging = properties.enable_logging;
			if (!instance.data.iframe) {
				const iframe = document.createElement('iframe');
				iframe.src = url_from_properties(properties);
				iframe.style.overflow = 'hidden';
				iframe.style.border = 'none';
				iframe.style.height = '100%';
				iframe.style.width = '100%';
				instance.data.iframe = iframe;
				window.addEventListener('message', handle_webseriously_message);
			}
			instance.canvas.append(instance.data.iframe);
			instance.data.iframe_is_instantiated = true;
		}
	}

	function ERROR(message, ...optionalParams) { console.error('[PLUGIN]', message, ...optionalParams); }
	function LOG(message, value, ...optionalParams) { instance.data.LOG(message, value, ...optionalParams); }

	function url_from_properties(properties) {
		const pairs = {
			db: 'bubble',
			theme: 'bubble',
			debug: 'bubble',
			erase: properties.erase_user_settings ? 'settings' : 'unknown'
		}
		const urlParams = new URLSearchParams(window.location.search);
		// Merge pairs into URL params, overwriting duplicates and eliminating unknowns
		Object.entries(pairs).filter(([key, value]) => value !== 'unknown').forEach(([key, value]) => {
			const override = urlParams.get(key);
			if (!!override && override !== value) {
				urlParams.set(key, `${override},${value}`);
			} else {
				urlParams.set(key, override || value);
			}
		});
		const url = 'https://plugin.webseriously.org/?' + urlParams.toString().replace(/%2C/g, ',');
		LOG('initializing with url:', url);
		return url;
	}

	//////////////////////////////////////////////////////////////
	//															//
	//		   handle messages sent from webseriously			//
	//   	  from inside the iframe established above			//
	//   see prepare_to_signal_bubble_plugin in DB_Bubble.ts	//
	//															//
	//////////////////////////////////////////////////////////////

	function handle_webseriously_message(event) {
		if (event.data && !event.data.hello) {
			switch (event.data.type) {
				case 'focus_id':
					LOG('PUBLISH --> focus_id:', event.data.id);
					instance.publishState('focus_id', event.data.id)
					break;
				case 'details_id':
					LOG('PUBLISH --> details_id:', event.data.id);
					instance.publishState('details_id', event.data.id);
					break;
				case 'selected_ids':
					LOG('PUBLISH --> selected_ids:', event.data.ids);
					instance.publishState('selected_ids', event.data.ids);
					break;
				case 'in_radial_mode':
					LOG('PUBLISH --> in_radial_mode:', event.data.in_radial_mode);
					instance.publishState('in_radial_mode', event.data.in_radial_mode);
					break;
				case 'trigger_an_event':
					LOG('TRIGGER -->', event.data.trigger);
					instance.triggerEvent(event.data.trigger);
					break;
				case 'listening':
					LOG('LISTENING');
					instance.data.iframeIsListening = true;		// once set, no more messages will pend, update will send them all
					if (instance.data.pendingMessages) {		// update stored previously prepared messages (before iframe was ready to receive them)
						instance.data.pendingMessages.forEach(message => {
							try {
								instance.data.iframe.contentWindow.postMessage(message, '*');
							} catch (error) {
								ERROR('[PLUGIN] Failed to send pending message:', error);
							}
						});
						instance.data.pendingMessages = [];
					}
					break;
				default:
					break;
			}
		}
	}

	instance.data.send_to_webseriously = function (type, object) {
		const iframe = instance.data.iframe.contentWindow;
		const message = {
			type: type,
			properties: JSON.stringify(object)
		};
		if (instance.data.iframeIsListening && iframe) {
			iframe.postMessage(message, '*');
		} else {
			instance.data.pendingMessages = instance.data.pendingMessages || [];
			instance.data.pendingMessages.push(message);
		}
	}
}
