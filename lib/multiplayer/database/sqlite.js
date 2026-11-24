import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';

export function openRoomDatabase(path) {
  const sqlite = new DatabaseSync(path);
  sqlite.exec('PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000');
  for (const name of ['0000_mayhem','0001_lobby_codes']) {
    sqlite.exec(readFileSync(new URL(name+'.sql',import.meta.url),'utf8').replace('CREATE TABLE mayhem_rooms','CREATE TABLE IF NOT EXISTS mayhem_rooms'));
  }
  const expire = (now) => {
    sqlite.exec('BEGIN');
    try {
      sqlite.prepare('DELETE FROM lobby_codes WHERE code IN (SELECT code FROM mayhem_rooms WHERE updated_at < ?)').run(now-86400000);
      sqlite.prepare('DELETE FROM mayhem_rooms WHERE updated_at < ?').run(now-86400000);
      sqlite.exec('COMMIT');
    } catch (error) {
      sqlite.exec('ROLLBACK');
      throw error;
    }
  };
  return {
    prepare(query) {
      const statement = sqlite.prepare(query);
      return {bind(...args) {
        return {first:() => statement.get(...args), run:() => ({meta: statement.run(...args)})};
      }};
    },
    expire,
    close:() => sqlite.close()
  };
}
