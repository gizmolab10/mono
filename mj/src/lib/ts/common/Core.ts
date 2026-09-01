// Everything (currently) mj adopts from core, in one file. Each line says where the
// thing really lives — through the "core" alias that tsconfig and vite.config both
// know. Only this file reaches through the alias; every other mj file imports here.

import 'core/ts/common/Extensions';
export { c } from 'core/ts/common/Configuration';
export { default, k } from 'core/ts/common/Constants';
