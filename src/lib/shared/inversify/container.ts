/**
 * InversifyJS container configuration
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { TYPES } from './types';

// Import service implementations
import { RenderPipelineService } from '$pipeline/services/implementations/RenderPipelineService';
import { CapabilityDetectionService } from '$pipeline/services/implementations/CapabilityDetectionService';

// Import service contracts
import type { IRenderPipelineService } from '$pipeline/services/contracts/IRenderPipelineService';
import type { ICapabilityDetectionService } from '$pipeline/services/contracts/ICapabilityDetectionService';

// Create container
const container = new Container();

// Bind Effect Pipeline services
container.bind<IRenderPipelineService>(TYPES.IRenderPipelineService).to(RenderPipelineService);
container.bind<ICapabilityDetectionService>(TYPES.ICapabilityDetectionService).to(CapabilityDetectionService);

export { container };
