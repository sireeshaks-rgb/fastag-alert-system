import 'dotenv/config';
import { db } from '../server/db';
import { users } from '@shared/schema';

async function run() {
  const admin = {
    email: 'admin@fastag.com',
    password: 'hash',
    name: 'Admin User',
    roleId: 1,
    fleetGroupId: null,
  };
  const q = db.insert(users).values(admin as any);
  console.log('query object', q);
  if ((q as any).toSQL) {
    console.log('toSQL', (q as any).toSQL());
  }
  try {
    const res = await q;
    console.log('result', res);
  } catch (e) {
    console.error('insert error', e);
  }
}
run();