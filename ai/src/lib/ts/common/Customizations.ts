// What is true of ai and of no other host: the facts main.ts hands kb before anything mounts, as
// memory/kb/zone/adopt kb.md's table lays them out. core and kb know none of it, and nothing here
// is remembered between visits.

export const customizations = {
	name        : 'ai',                                   // what the controls row calls this project, while no file is open
	prefix      : 'ai_',                                  // what every remembered value is saved under, from step 9 of the plan
	host        : 'ai',                                   // the host whose db the dispatcher answers from: ov's, until ov is retired
	hierarchies : [{ label: 'folder', order: 'name' }],   // the one hierarchy the list offers: the folders, the rows by name

	// The kinds a file can be: four say how a file reads, and analyze says what it is about, a
	// taking apart of something to find out how it works. One of the five, said in the db rather
	// than worked out from the folder it sits in. music left the list 13 September 2026: mu's.
	kinds : ['analyze', 'arch', 'explain', 'howto', 'specify'],

	// The closed tag list, alphabetized, nothing invented on the spot.
	tags : [
		'always', 'born', 'build', 'data', 'debug', 'deploy', 'faster', 'geometry', 'incorporated',
		'journal', 'keep', 'later', 'maybe', 'migrate', 'next', 'notes', 'now', 'plans', 'platform',
		'port', 'program', 'proposal', 'prose', 'refactor', 'research', 'session', 'setup', 'soon',
		'stale', 'style', 'tabled', 'team', 'test', 'tools', 'UX', 'vision', 'visual', 'waiting',
		'weighed',
	],

	// The tags gathered into ten areas, each folding its tags away behind its own name. Six gather
	// by what a file is about. progress gathers by where a file stands in its own life, put forward
	// or written up. active gathers by how soon it is wanted: now, next, soon, later, or set aside.
	// Every tag belongs to exactly one area, and the tag areas test proves the two lists agree.
	tag_areas : [
		{ name: 'ai',        tags: ['always', 'prose', 'session', 'style', 'team'] },
		{ name: 'code',      tags: ['data', 'migrate', 'port', 'program', 'refactor'] },
		{ name: 'fix',       tags: ['debug', 'faster', 'test'] },
		{ name: 'fate',      tags: ['keep', 'maybe', 'stale'] },
		{ name: 'bedrock',   tags: ['build', 'deploy', 'platform', 'setup', 'tools'] },
		{ name: 'progress',  tags: ['proposal', 'journal'] },
		{ name: 'active',    tags: ['now', 'next', 'soon', 'later', 'tabled'] },
		{ name: 'lifecycle', tags: ['born', 'weighed', 'waiting', 'incorporated'] },
		{ name: 'think',     tags: ['notes', 'plans', 'research', 'vision'] },
		{ name: 'ux',        tags: ['geometry', 'UX', 'visual'] },
	],

	// The kind and the tag a new or unlabeled file starts with, since step 12 of the plan: a taking
	// apart, and the one being worked on. Composing labels puts stale on beside now.
	kind_when_new : 'analyze',
	tag_when_new  : 'born',

	// The kind and the tag a drawing, an svg file, is given when it is first opened, since
	// 18 September 2026: a howto, journaled. Its picture is shown as it is, never as markdown.
	kind_when_drawn : 'howto',
	tag_when_drawn  : 'journal',

	// The open buttons at the far right of the controls row while browsing, each opening one file in
	// the editor: code debt, the memory system's one line per file holding unfinished work.
	open_buttons : [
		{ title: 'de', key: 'memory/shared/zone/code debt.md' },
		{ title: 'wf', key: 'memory/shared/truth/workflow.md' },
		{ title: 'hb', key: 'memory/shared/truth/handbook.md' },
		{ title: 'sh', key: 'memory/shared/truth/shorthand.md' },
		{ title: 'ca', key: 'memory/shared/truth/artwork/cadence.svg' },
		{ title: 'co', key: 'memory/shared/truth/develop/constants.md' }
	],
};
