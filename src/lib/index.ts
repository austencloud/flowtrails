/**
 * FlowTrails Library Entry Point
 *
 * Use this to import FlowTrails as a module in other projects:
 *
 *   import { FlowTrailsModule } from '@flowtrails';
 *
 *   <FlowTrailsModule initialVideoUrl="/video.mp4" />
 */

// Main module component (for TKA-SCRIBE integration)
export { default as FlowTrailsModule } from './FlowTrailsModule.svelte';

// Shared components (for custom integrations)
export * from './components';

// Export modules
export * from './modules/video-management';
export * from './modules/effect-pipeline';
export * from './modules/effects';

// Export shared utilities
export * from './shared';
