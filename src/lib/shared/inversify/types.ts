/**
 * InversifyJS service type symbols
 */

export const TYPES = {
  // Effect Pipeline Services
  IRenderPipelineService: Symbol.for('IRenderPipelineService'),
  ICapabilityDetectionService: Symbol.for('ICapabilityDetectionService'),
  
  // Video Management Services  
  IVideoManagerService: Symbol.for('IVideoManagerService'),
  
  // Future services
  IThresholdDetectionService: Symbol.for('IThresholdDetectionService'),
  ITrailEffectService: Symbol.for('ITrailEffectService'),
  IVideoExportService: Symbol.for('IVideoExportService')
} as const;
