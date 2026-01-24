import { T_Persistence } from '../common/Enumerations';
import { k } from '../common/Global_Imports';
import { DB_Name, T_Database } from './DB_Common';
import DB_Common from './DB_Common';

export default class DB_Local extends DB_Common {
	t_persistence = T_Persistence.local;
	t_database = T_Database.local;
	idBase = DB_Name.local;
}
