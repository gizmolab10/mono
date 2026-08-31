// ov's constants ARE core's, until ov disagrees with one. Every ov file keeps
// importing k from here; this file just says where k really lives — through the
// "core" nickname both tsconfig and vite know.
export { default, k } from 'core/ts/common/Constants';
