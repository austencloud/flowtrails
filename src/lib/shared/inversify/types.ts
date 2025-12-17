/**
 * InversifyJS service type symbols
 */

export const TYPES = {
  // Effect Pipeline Services
  IRenderPipelineService: Symbol.for('IRenderPipelineService'),
  ICapabilityDetectionService: Symbol.for('ICapabilityDetectionService'),
  
  // Video Management Services
  IVideoManagerService: Symbol.for('IVideoManagerService'),
  IVideoSyncService: Symbol.for('IVideoSyncService'),
  
  // Effects Services
  ILedDetectionService: Symbol.for('ILedDetectionService'),
  ITrailEffectsService: Symbol.for('ITrailEffectsService'),

  // Future services
  IVideoExportService: Symbol.for('IVideoExportService')
} as const;
