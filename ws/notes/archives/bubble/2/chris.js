function(instance, properties, context) {
	console.warn("[PLUGIN] Initializing plugin and checking for hydration...");
	instance.data.iframeListening = false;
	instance.data.dataIsReady = false;

	function isReady(list) {
		try {
			if (!!list &&
				typeof list.length === "function" &&
				typeof list.get == "function" &&
				list.length() > 0) {
					const first = list.get(0);
					return !!first;
				}
		} catch (e) {
			console.log("[PLUGIN] watching failed...", e);
			return false;
		}
		
		return false;
	}

	function readyToUpdate() {
		const objList = instance.data.properties.objects_table_list;
		const relList = instance.data.properties.relationships_table_list;
		const ready = isReady(objList) &&
			isReady(relList) &&
			instance.data.iframeListening &&
			instance.data.dataIsReady == 'yes' &&
			instance.data.iframe?.contentWindow;

		return ready;
	}

	function sendAllData() {
		const p = instance.data.properties;
//		if (!p || !readyToUpdate()) {
//			console.warn("[PLUGIN] Update aborted: too soon", instance.data.dataIsReady);
//		} else {
			console.warn("[PLUGIN] Update proceeding...");
			function serializeObject(object) {
				const result = {};
				const fields = object?.listProperties?.() || [];
				for (const key of fields) {
					result[key] = object.get(key);
				}
				return result;
			}
			function serializeList(list) {
				const items = list?.listProperties?.() || [];
				return items.map(serializeObject);
			}
			const serializedObjects = serializeList(p.objects_table_list);
			const serializedRelationships = serializeList(p.relationships_table_list);

			const message = {
				type: "update",
				objectsTable: JSON.stringify(serializedObjects),
				relationshipsTable: JSON.stringify(serializedRelationships),
				startingObject: p.starting_object?.get?.("_id") ?? null,
				objectTitleField: p.object_title_field,
				objectChildrenField: p.object_children_field,
				objectIdField: p.object_id_field,
				relationshipIdField: p.relationship_id_field,
				objectColorField: p.object_color_field,
				objectTypeField: p.object_type_field
			};
			instance.data.iframe.contentWindow.postMessage(message, "*");
//		}
	}

	function sendDataWhenReady() {
		// If hydration watcher is already running, do nothing
		if (instance.data._hydrationTimer) {
			console.warn("[PLUGIN] Hydration timer already running.");
			return;
		}
		console.log("[PLUGIN] Starting hydration watcher...");
		instance.data._hydrationTimer = setInterval(() => {
			if (readyToUpdate()) {
				clearInterval(instance.data._hydrationTimer);
				instance.data._hydrationTimer = null;
				instance.data.dataIsReady = true;
				sendAllData();
			}
		}, 500);
	}

	instance.data.sendDataWhenReady = sendDataWhenReady;
	instance.data.sendAllData = sendAllData;

	// Set up postMessage listener
	console.log("[INIT] registering message handler");
	instance.data.messageQueue = instance.data.messageQueue || [];

	function handleMessage(event) {
		if (event.data?.type === "listening") {
			console.log("[PLUGIN] Iframe is listening");
			instance.data.iframeListening = true;
			const queue = instance.data.messageQueue;
			while (queue.length > 0) {
				const message = queue.shift();
				instance.data.iframe?.contentWindow?.postMessage(message, "*");
			}
		} else if (!(event.data?.hello ?? false)) {
			console.log("[PLUGIN] Received message:", event.data);
		}
	}

	window.addEventListener("message", handleMessage);

	// Set up the iframe
	const iframe = document.createElement("iframe");
	iframe.src = "https://webseriously.netlify.app/?db=bubble";
	iframe.style.width = "100%";
	iframe.style.height = "100%";
	iframe.style.border = "none";
	iframe.style.overflow = "hidden";
	instance.canvas.appendChild(iframe);
	instance.data.iframe = iframe;
}
