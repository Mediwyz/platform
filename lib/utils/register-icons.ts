/**
 * Pre-loads icon collections so @iconify/react never makes a CDN fetch at runtime.
 * Import this module once (e.g. top of any 'use client' component that uses Icon).
 * Node module caching ensures addCollection() runs exactly once per process.
 */
import { addCollection } from '@iconify/react'
 
const healthiconsData = require('@iconify-json/healthicons/icons.json')
addCollection(healthiconsData)
