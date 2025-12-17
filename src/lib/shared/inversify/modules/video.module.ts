/**
 * Video Management DI Module
 * Tier 2: Shared services used across features
 */

import { ContainerModule } from 'inversify';
import { TYPES } from '../types';

import { VideoManagerService } from '$video/services/implementations/VideoManagerService';
import { VideoSyncService } from '$video/services/implementations/VideoSyncService';

import type { IVideoManagerService } from '$video/services/contracts/IVideoManagerService';
import type { IVideoSyncService } from '$video/services/contracts/IVideoSyncService';

export const videoModule = new ContainerModule((options) => {
  options.bind<IVideoManagerService>(TYPES.IVideoManagerService).to(VideoManagerService);
  options.bind<IVideoSyncService>(TYPES.IVideoSyncService).to(VideoSyncService);
});
