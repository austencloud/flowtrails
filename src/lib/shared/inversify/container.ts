/**
 * InversifyJS container configuration
 * Uses modular loading for better organization
 */

import 'reflect-metadata';
import { Container } from 'inversify';
import { videoModule, pipelineModule, effectsModule } from './modules';

// Create container
const container = new Container();

// Load modules (order matters for dependencies)
// Tier 2: Shared services
container.load(videoModule);
container.load(pipelineModule);

// Tier 3: Feature services
container.load(effectsModule);

export { container };
