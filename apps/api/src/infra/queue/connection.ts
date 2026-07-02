import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL as string;

export const redisConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null, // exigido pelo BullMQ para conexões de Queue/Worker
});
