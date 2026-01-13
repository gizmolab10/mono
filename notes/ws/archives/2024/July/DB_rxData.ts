import { getRxStorageDexie } from 'rxdb/plugins/storage-dexie';
import { RxDBDevModePlugin } from 'rxdb/plugins/dev-mode';
import { Page_State } from '../state/Page_States';
import { createRxDatabase } from 'rxdb';
import { addRxPlugin } from 'rxdb';

export class DB_rxData {
	db = createRxDatabase({
		name: 'rxDatabase',
		storage: getRxStorageDexie()
	});

	page_state_schema = {
		title: 'page state schema',
		description: 'encapsulates a page state',
		version: 0,
		type: 'object',
		properties: {
			atLimit: { type: '[boolean, boolean]'},
			points_out: { type: 'boolean' },
			show_thumb: { type: 'boolean' },
			kind: { type: 'string' },
			thing_hid: { type: 'number' },
			index: { type: 'number' },
			shown: { type: 'number' },
			total: { type: 'number' },
		},
		required: ['atLimit','points_out', 'show_thumb', 'kind', 'thing_hid', 'index', 'shown', 'total']
	};

	setup() {
		this.db.addCollections({ page_states: { schema: this.page_state_schema } });
	}

	async add(state: Page_State) {
		await this.db.page_states.insert(state);

		console.log('Database setup complete');
	}

}