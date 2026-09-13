// What is true of ai and of no other host: the facts main.ts hands kb before anything mounts, as
// memory/kb/zone/adopt kb.md's table lays them out. core and kb know none of it, and nothing here
// is remembered between visits. The kinds, the tags and the tag areas are still kb's own, until
// step 7 of the plan moves them here.

export const customizations = {
	name        : 'ai',                                   // what the controls row calls this project, while no file is open
	prefix      : 'ai_',                                  // what every remembered value is saved under, from step 9 of the plan
	host        : 'ai',                                   // the host whose db the dispatcher answers from: ov's, until ov is retired
	hierarchies : [{ label: 'folder', order: 'name' }],   // the one hierarchy the list offers: the folders, the rows by name
};
