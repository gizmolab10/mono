function(instance, properties, context) {
	console.log("[PLUGIN] Initializing plugin and checking for hydration...");
	instance.publishState("objects_table", properties.objects_table);
	// instance.publishState("relationships_table", properties.relationships_table);
	// instance.publishState("starting_object", properties.starting_object);
	// instance.publishState("object_title_field", properties.object_title_field);
	// instance.publishState("object_children_field", properties.object_children_field);
	// instance.publishState("object_id_field", properties.object_id_field);
	// instance.publishState("relationship_id_field", properties.relationship_id_field);
	// instance.publishState("object_color_field", properties.object_color_field);
	// instance.publishState("object_type_field", properties.object_type_field);

	instance.data.context = context;
	instance.data.iframeListening = false;
	instance.data.dataIsReady = false;

	async function isListHydrated(list) {
		try {
			if (
				!!list &&
				typeof list.length === "function" &&
				typeof list.get === "function"
			) {
				const length = list.length();
				if (length != 0) {
					const first = await list.get(0);
					return !!first;
				}
			}
		} catch (e) {
			console.log("[PLUGIN] watching failed...", e);
		}
		return false;
	}

	async function serializeObject(object) {
		try {
			const result = {};
			const fields = (await object?.listProperties?.()) || [];
			for (const key of fields) {
				result[key] = await object.get(key);
			}
			return result;
		} catch (e) {
			console.log("[PLUGIN] serializeObject failed...", e);
			return null;
		}
	}

	async function serializeList(list) {
		try {
			const items = list?.get ? await list.get(0)?.listProperties?.() : [];
			const results = [];
			for (const item of items) {
				const result = await serializeObject(item);
				results.push(result);
			}
			return results;
		} catch (e) {
			console.log("[PLUGIN] serializeList failed...", e);
			return null;
		}
	}

	async function sendRemainingData() {
		const p = instance.data.properties;
		if (!!p) {
			const startingObjectId = p.starting_object?.get?.("_id") ?? null;
			const message = {
				type: "update",
				startingObject: startingObjectId,
				objectTitleField: p.object_title_field,
				objectChildrenField: p.object_children_field,
				objectIdField: p.object_id_field,
				relationshipIdField: p.relationship_id_field,
				objectColorField: p.object_color_field,
				objectTypeField: p.object_type_field
			};
			instance.data.iframe?.contentWindow?.postMessage(message, "*");
		}
	}

	function sendDataWhenReady() {
		const context = instance.data.context;

		if (!context || typeof context.async !== "function") {
			console.warn("[PLUGIN] context.async unavailable");
		} else if (instance.data.hydrationTimer) {
			console.log("[PLUGIN] Hydration timer already running.");
		} else {
			return context.async((callback) => {
				console.log("[PLUGIN] Starting staged hydration watcher...");
				const { objects_table, relationships_table } = instance.data.properties;
				let stage = "objects";
				instance.data.hydrationTimer = setInterval(async () => {
					if (stage === "objects") {
						const ready = await isListHydrated(objects_table);
						if (ready) {
							console.log("[PLUGIN] Objects table is hydrated. Sending...");
							const serialized = await serializeList(objects_table);
							postPartialData("objectsTable", serialized);
							stage = "relationships";
						}
					} else if (stage === "relationships") {
						const ready = await isListHydrated(relationships_table);
						if (ready) {
							console.log("[PLUGIN] Relationships table is hydrated. Sending...");
							const serialized = await serializeList(relationships_table);
							postPartialData("relationshipsTable", serialized);
							clearInterval(instance.data.hydrationTimer);
							instance.data.hydrationTimer = null;
							instance.data.dataIsReady = true;
							sendRemainingData();
							callback(null);
						}
					}
				}, 500);
			});
		}
	}

	instance.data.sendDataWhenReady = sendDataWhenReady;
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
			sendDataWhenReady(); // no context needed
		} else if (!(event.data?.hello ?? false)) {
			console.log("[PLUGIN] Received message:", event.data);
		}
	}

	window.addEventListener("message", handleMessage);

	instance.canvas.style.height = window.innerHeight + "px";
	instance.canvas.style.width = window.innerWidth + "px";

	// Set up the iframe
	const iframe = document.createElement("iframe");
	iframe.src = "https://webseriously.netlify.app/?db=bubble&disable=full_UI";
	iframe.style.width = "100%";
	iframe.style.height = "100%";
	iframe.style.border = "none";
	iframe.style.overflow = "hidden";
	instance.canvas.appendChild(iframe);
	instance.data.iframe = iframe;
}
