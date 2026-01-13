import { k, PersistID, persistLocal } from '../../src/lib/ts/common/GlobalImports';
import { ids_grabbed } from '../../src/lib/ts/managers/State';

export default class Embed {

	constructor() {
		ids_grabbed.subscribe((ids: string[]) => { // executes whenever ids_grabbed changes
            this.sendGrabbedIDs(ids);
		});
	};

    sendGrabbedIDs(ids: string[]) {
        if (ids && k.isEmbedded) {
            const message = ids?.join('$');
            // @ts-ignore
            // window.parent.bubble_fn_select(message);
            persistLocal.writeToKey(PersistID.select, message);
            console.log('iframe', message);
        }
    }
}

export const embed = new Embed();