import Database from 'better-sqlite3';
const db = new Database('./dev.db');
console.log('tables', db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all());
console.log('roles', db.prepare('SELECT * FROM roles').all());
console.log('users', db.prepare('SELECT * FROM users').all());
console.log('vehicles', db.prepare('SELECT * FROM vehicles').all());
