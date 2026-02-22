import { T_Startup } from '../common/Enumerations';

class S_Startup {
	t_startup = $state(T_Startup.start);

	get isReady(): boolean { return this.t_startup === T_Startup.ready; }
}

export const startup = new S_Startup();
