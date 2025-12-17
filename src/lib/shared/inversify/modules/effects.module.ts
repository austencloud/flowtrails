/**
 * Effects DI Module
 * Tier 3: Feature-specific effect services
 */

import { ContainerModule } from 'inversify';
import { TYPES } from '../types';

import { LedDetectionService } from '$lib/modules/effects/led-detection/services/implementations/LedDetectionService';
import { TrailEffectsService } from '$lib/modules/effects/trail-effects/services/implementations/TrailEffectsService';

import type { ILedDetectionService } from '$lib/modules/effects/led-detection/services/contracts/ILedDetectionService';
import type { ITrailEffectsService } from '$lib/modules/effects/trail-effects/services/contracts/ITrailEffectsService';

export const effectsModule = new ContainerModule((options) => {
  options.bind<ILedDetectionService>(TYPES.ILedDetectionService).to(LedDetectionService);
  options.bind<ITrailEffectsService>(TYPES.ITrailEffectsService).to(TrailEffectsService);
});
