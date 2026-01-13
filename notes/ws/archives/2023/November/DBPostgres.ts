import { Thing, DBType, Hierarchy, Relationship } from '../ts/common/GlobalImports';
import DBInterface from '../ts/db/DBInterface';
import * as pgPromise from 'pg-promise';

class DBPostgres implements DBInterface {
	hierarchy = new Hierarchy(DBType.postgres);
  private db: pgPromise.IDatabase<any> | null = null;
  dbType = DBType.postgres;
  hasData = false;
  loadTime = null;

  connect(connectionString: string) {
    this.db = pgPromiseNamespace(connectionString);
  }

	setHasData(flag: boolean) { this.hasData = flag; }

  fetch_all(): Promise<void> {
      throw new Error('Method not implemented.');
  }
  fetch_allFrom(bulkName: string): Promise<void> {
      throw new Error('Method not implemented.');
  }
  thing_remoteUpdate(thing: Thing): Promise<void> {
      throw new Error('Method not implemented.');
  }
  thing_remoteDelete(thing: Thing): Promise<void> {
      throw new Error('Method not implemented.');
  }
  relationship_remoteUpdate(relationship: Relationship): Promise<void> {
      throw new Error('Method not implemented.');
  }
  relationship_remoteDelete(relationship: Relationship): Promise<void> {
      throw new Error('Method not implemented.');
  }
  relationship_remember_remoteCreate(relationship: Relationship | null): Promise<void> {
      throw new Error('Method not implemented.');
  }

  async thing_remember_remoteCreate(thing: Thing): Promise<void> {
    const query = `INSERT INTO 'Things' (thing) VALUES ($1) RETURNING *`;
    const values = [thing];
    const result = await this.client.query(query, values);
    Promise.resolve(result.rows[0]);
  }
  async query(sql: string, values?: any[]): Promise<any[]> {
    try {
      const result = await this.db.query(sql, values);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async insert(table: string, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, index) => `$${index + 1}`).join(', ');

    const insertQuery = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;

    try {
      const result = await this.db.one(insertQuery, values);
      return result;
    } catch (error) {
      throw error;
    }
  }

  async update(table: string, id: number, data: Record<string, any>): Promise<any> {
    const columns = Object.keys(data).map((column) => `${column} = $/data.${column}/`).join(', ');

    const updateQuery = `UPDATE ${table} SET ${columns} WHERE id = $/id/ RETURNING *`;

    try {
      const result = await this.db.one(updateQuery, { id, data });
      return result;
    } catch (error) {
      throw error;
    }
  }

  async delete(table: string, id: number): Promise<void> {
    const deleteQuery = `DELETE FROM ${table} WHERE id = $1`;

    try {
      await this.db.none(deleteQuery, [id]);
    } catch (error) {
      throw error;
    }
  }
}

// // Example usage:
// const connectionString = 'postgres://username:password@hostname:port/database';
// const p = new P(connectionString);

// // Query example
// p.query('SELECT * FROM your_table')
//   .then((result) => {
//     console.log(result);
//   })
//   .catch((error) => {
//     console.error(error);
//   });

// // Insert example
// const insertData = { name: 'New Item', description: 'Description' };
// p.insert('your_table', insertData)
//   .then((result) => {
//     console.log(result);
//   })
//   .catch((error) => {
//     console.error(error);
//   });

// // Update example
// const updateData = { name: 'Updated Item', description: 'Updated Description' };
// p.update('your_table', 1, updateData)
//   .then((result) => {
//     console.log(result);
//   })
//   .catch((error) => {
//     console.error(error);
//   });

// // Delete example
// p.delete('your_table', 1)
//   .then(() => {
//     console.log('Item deleted');
//   })
//   .catch((error) => {
//     console.error(error);
//   });

class oDBPostgres implements DBInterface {
	hierarchy = new Hierarchy(DBType.postgres);
  dbType = DBType.postgres;
  hasData = false;
  loadTime = null;
  client: Client;

	setHasData(flag: boolean) { this.hasData = flag; }

  fetch_all(): Promise<void> {
      throw new Error('Method not implemented.');
  }
  fetch_allFrom(bulkName: string): Promise<void> {
      throw new Error('Method not implemented.');
  }
  thing_remoteUpdate(thing: Thing): Promise<void> {
      throw new Error('Method not implemented.');
  }
  thing_remoteDelete(thing: Thing): Promise<void> {
      throw new Error('Method not implemented.');
  }
  relationship_remoteUpdate(relationship: Relationship): Promise<void> {
      throw new Error('Method not implemented.');
  }
  relationship_remoteDelete(relationship: Relationship): Promise<void> {
      throw new Error('Method not implemented.');
  }
  relationship_remember_remoteCreate(relationship: Relationship | null): Promise<void> {
      throw new Error('Method not implemented.');
  }

  connect(connectionString: string) {
    this.client = new Client({ connectionString });
    this.client.connect();
  }

  async thing_remember_remoteCreate(thing: Thing): Promise<void> {
    const query = `INSERT INTO 'Things' (thing) VALUES ($1) RETURNING *`;
    const values = [thing];
    const result = await this.client.query(query, values);
    Promise.resolve(result.rows[0]);
  }

  async read(table: string, id: number): Promise<any> {
    const query = `SELECT * FROM ${table} WHERE id = $1`;
    const values = [id];

    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  async update(table: string, id: number, newData: any): Promise<any> {
    const query = `UPDATE ${table} SET data = $1 WHERE id = $2 RETURNING *`;
    const values = [newData, id];

    const result = await this.client.query(query, values);
    return result.rows[0];
  }

  async delete(table: string, id: number): Promise<void> {
    const query = `DELETE FROM ${table} WHERE id = $1`;
    const values = [id];

    await this.client.query(query, values);
  }

  async close(): Promise<void> {
    await this.client.end();
  }
}

export const dbPostgres = new DBPostgres();

// Example usage:
(async () => {
  try {
    dbPostgres.connect('postgres://username:password@foo:5432/database')
    const newItem = await dbPostgres.create('items', { name: 'New Item' });
    console.log('Created Item:', newItem);

    const readItem = await dbPostgres.read('items', newItem.id);
    console.log('Read Item:', readItem);

    const updatedItem = await dbPostgres.update('items', newItem.id, { name: 'Updated Item' });
    console.log('Updated Item:', updatedItem);

    await dbPostgres.delete('items', newItem.id);
    console.log('Item Deleted');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await dbPostgres.close();
  }
})();
