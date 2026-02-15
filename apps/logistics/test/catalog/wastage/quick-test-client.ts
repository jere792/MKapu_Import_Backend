import { ClientProxyFactory, Transport } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';

async function test() {
  const host = process.env.USERS_SERVICE_HOST ?? 'localhost';
  const port = Number(process.env.USERS_SERVICE_PORT ?? 3011);
  const secret = process.env.INTERNAL_COMM_SECRET ?? '';

  console.log(`Testing TCP connect to ${host}:${port} (secret length ${secret.length})`);
  const client = ClientProxyFactory.create({ transport: Transport.TCP, options: { host, port } });
  try {
    await client.connect();
    console.log('Connected, sending request...');
    const res = await firstValueFrom(client.send('users.findByIds', { ids: [1], secret }));
    console.log('Response:', JSON.stringify(res, null, 2));
  } catch (err) {
    console.error('Test client error:', err);
  } finally {
    client.close();
  }
}

test().catch((e) => {
  console.error('Fatal error', e);
  process.exit(1);
});