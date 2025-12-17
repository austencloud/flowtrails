/**
 * Effect Pipeline DI Module
 * Tier 2: Shared services for rendering
 */

import { ContainerModule } from 'inversify';
import { TYPES } from '../types';

import { RenderPipelineService } from '$pipeline/services/implementations/RenderPipelineService';
import { CapabilityDetectionService } from '$pipeline/services/implementations/CapabilityDetectionService';

import type { IRenderPipelineService } from '$pipeline/services/contracts/IRenderPipelineService';
import type { ICapabilityDetectionService } from '$pipeline/services/contracts/ICapabilityDetectionService';

export const pipelineModule = new ContainerModule((options) => {
  options.bind<IRenderPipelineService>(TYPES.IRenderPipelineService).to(RenderPipelineService);
  options.bind<ICapabilityDetectionService>(TYPES.ICapabilityDetectionService).to(CapabilityDetectionService);
});
