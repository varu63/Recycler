import { appConfig } from './config/env.js';
import { configureCloudinary } from './config/cloudinary.js';
import { connectDb } from './config/mongoose.js';
import { createApp } from './app.js';
import { logger } from './utils/logger.js';

async function main(): Promise<void> {
  await connectDb();

  try {
    configureCloudinary();
  } catch (error) {
    logger.warn(
      { message: error instanceof Error ? error.message : 'unknown error' },
      `Cloudinary is not configured; IMAGE_STORAGE is "${appConfig.imageStorage}"`
    );
  }

  const app = createApp();
  app.listen(appConfig.port, () => {
    logger.info(
      { port: appConfig.port, env: appConfig.env },
      `Material Mundi API listening on port ${appConfig.port}`
    );
  });
}

main().catch((error) => {
  logger.error({ err: error }, 'Failed to start server');
  process.exit(1);
});
