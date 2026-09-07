export async function serializeObject(object) {
  const result = {};
  const keys = await object?.listProperties?.() || [];
  for (const key of keys) {
    result[key] = await object.get(key);
  }
  return result;
}

export async function serializeList(list) {
  const results = [];
  const count = list.length?.() || 0;
  for (let i = 0; i < count; i++) {
    const item = await list.get(i);
    if (item) results.push(await serializeObject(item));
  }
  return results;
}

export async function serializeAndSend(app) {
  const p = app.properties;
  if (!p) return;

  const [objects, relationships] = await Promise.all([
    serializeList(p.objects_table),
    serializeList(p.relationships_table)
  ]);

  const message = {
    type: "update",
    objectsTable: JSON.stringify(objects),
    relationshipsTable: JSON.stringify(relationships),
    objectTitleField: p.object_title_field,
    objectChildrenField: p.object_children_field,
    objectIdField: p.object_id_field,
    relationshipIdField: p.relationship_id_field,
    objectColorField: p.object_color_field,
    objectTypeField: p.object_type_field
  };

  app.sendToIframe(message);
}