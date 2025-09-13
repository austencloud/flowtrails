/**
 * Application initialization
 * Sets up InversifyJS and other global dependencies
 */

import 'reflect-metadata';

// Initialize the DI container by importing it
import '$shared/inversify/container';

console.log('✅ Application initialized with dependency injection');
