/**
 * InversifyJS container configuration
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// Import service implementations
import { RenderPipelineService } from '$pipeline/services/implementations/RenderPipelineService';
import { CapabilityDetectionService } from '$pipeline/services/implementations/CapabilityDetectionService';
import { LedDetectionService } from '$lib/modules/effects/led-detection/services/implementations/LedDetectionService';
import { VideoManagerService } from '$video/services/implementations/VideoManagerService';

// Import service contracts
import type { IRenderPipelineService } from '$pipeline/services/contracts/IRenderPipelineService';
import type { ICapabilityDetectionService } from '$pipeline/services/contracts/ICapabilityDetectionService';
import type { ILedDetectionService } from '$lib/modules/effects/led-detection/services/contracts/ILedDetectionService';
import type { IVideoManagerService } from '$video/services/contracts/IVideoManagerService';

// Create container
const container = new Container();

// Bind Video Management services
container.bind<IVideoManagerService>(TYPES.IVideoManagerService).to(VideoManagerService);

// Bind Effect Pipeline services
container.bind<IRenderPipelineService>(TYPES.IRenderPipelineService).to(RenderPipelineService);
container.bind<ICapabilityDetectionService>(TYPES.ICapabilityDetectionService).to(CapabilityDetectionService);

// Bind Effects services
container.bind<ILedDetectionService>(TYPES.ILedDetectionService).to(LedDetectionService);

export { container };
