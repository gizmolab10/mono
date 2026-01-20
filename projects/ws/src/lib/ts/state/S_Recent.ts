import type Ancestry from '../runtime/Ancestry';
import type S_Items from './S_Items';

export type S_Recent = {
	si_grabs: S_Items<Ancestry>; 
	focus: Ancestry;
	depth: number;
};
