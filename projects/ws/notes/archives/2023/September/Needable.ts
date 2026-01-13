import { Need } from "../ts/common/Enumerations";

export default class Needable {
	id: string;
	needs = Need.none;
	isRemotelyStored: boolean;

	constructor(id: string, isRemotelyStored: boolean) {
		this.isRemotelyStored = isRemotelyStored;
		this.id = id;
	}

	get hasNeeds() : boolean { return !this.noNeeds() }

	noNeeds(flag: boolean | null = null)	{
		const was = this.needs == Need.none;
		if (flag != null && !flag) {
			if (this.needs & Need.create) {
				this.isRemotelyStored = true;
			}
			this.needs = 0;
		}
		return was;
	}

	needsPushToRemote() {
		if (this.isRemotelyStored) {
			this.needsUpdate(true);
		} else {
			this.needsCreate(true)
		}
	}

	needsCreate(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.create); }
	needsDelete(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.delete); }
	needsUpdate(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.update); }
	needsRemember(flag: boolean | null = null) { return this.modifyNeedTo(flag, Need.remember); }


	// if false, turn it off

	modifyNeedTo(flag: boolean | null = null, bitMask: Need) {
		const was = this.needs & bitMask;
		if (flag != null) {
			if (bitMask == Need.create) {
				if (!flag) {
					this.isRemotelyStored = true;
				} else {
					console.log('needs creating...');
				}
			}
			this.needs = flag ? this.needs | bitMask : this.needs & ~bitMask;	// if flag is true, turn needs on for bitMask
		}
		return was;
	}

}
