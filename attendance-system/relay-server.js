/**
 * Relay Server for CompreFace → Dify Integration
 * Keeps API keys secure and manages conversation flow
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import multer from 'multer';
import FormData from 'form-data';

const app = express();
const upload = multer();

// Middleware
app.use(express.json());
app.use(cors({
  origin: [
    'http://localhost:8888',
    'http://localhost:8000',
    'http://localhost:3000',
    'http://localhost'
  ],
  credentials: true
}));

// Configuration
const DIFY_API_KEY = process.env.DIFY_API_KEY || 'your-dify-api-key';
const DIFY_API_URL = process.env.DIFY_API_URL || 'https://api.dify.ai/v1';
const COMPREFACE_URL = process.env.COMPREFACE_URL || 'http://localhost:8000';
const COMPREFACE_API_KEY = process.env.COMPREFACE_API_KEY || 'your-compreface-api-key';
const PORT = process.env.PORT || 8787;

// In-memory storage (use Redis/Database in production)
const conversations = new Map();
const detectionHistory = [];
const lastNotification = new Map(); // For debouncing

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'CompreFace-Dify Relay',
    timestamp: new Date().toISOString()
  });
});

/**
 * Main endpoint: Receive face detection and forward to Dify
 * 
 * Body:
 * {
 *   event: 'face_detected',
 *   name: 'Abaan',
 *   confidence: 0.97,
 *   conversation_id: 'optional-conv-id',
 *   camera_id: 'camera-01',
 *   metadata: { age: 18, gender: 'M' }
 * }
 */
app.post('/face-event', async (req, res) => {
  try {
    const { event, name, confidence, conversation_id, camera_id, metadata } = req.body;

    // Validation
    if (!name) {
      return res.status(400).json({ error: 'name is required' });
    }

    // Debouncing: Don't spam same person within 3 seconds
    const debounceKey = `${camera_id || 'default'}-${name}`;
    const lastTime = lastNotification.get(debounceKey);
    const now = Date.now();
    
    if (lastTime && (now - lastTime) < 3000) {
      console.log(`[DEBOUNCE] Skipping ${name}, last seen ${now - lastTime}ms ago`);
      return res.json({ 
        success: true, 
        debounced: true,
        message: 'Event debounced' 
      });
    }
    
    lastNotification.set(debounceKey, now);

    // Log detection
    const detection = {
      name,
      confidence,
      camera_id: camera_id || 'default',
      timestamp: new Date().toISOString(),
      metadata
    };
    detectionHistory.push(detection);
    console.log('[DETECTION]', detection);

    // Get or create conversation ID
    const convId = conversation_id || conversations.get(camera_id || 'default');

    // Prepare Dify payload
    const difyPayload = {
      inputs: {
        person_name: name,
        confidence: confidence || 1.0,
        camera_id: camera_id || 'entrance',
        timestamp: detection.timestamp,
        ...(metadata || {})
      },
      query: `Student ${name} has been detected at ${camera_id || 'entrance'} with ${((confidence || 1) * 100).toFixed(1)}% confidence. Please provide their information and status.`,
      response_mode: 'blocking', // Use 'streaming' for SSE
      user: camera_id || 'camera-01',
      conversation_id: convId || undefined
    };

    console.log('[DIFY] Sending to Dify:', {
      name,
      conversation_id: convId,
      query_preview: difyPayload.query.substring(0, 60) + '...'
    });

    // Call Dify Chat Messages API
    const difyResponse = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(difyPayload)
    });

    const difyData = await difyResponse.json();

    if (!difyResponse.ok) {
      console.error('[DIFY ERROR]', difyData);
      return res.status(500).json({
        success: false,
        error: 'Dify API error',
        details: difyData
      });
    }

    // Store conversation ID for future messages
    if (difyData.conversation_id) {
      conversations.set(camera_id || 'default', difyData.conversation_id);
    }

    console.log('[DIFY] Success:', {
      conversation_id: difyData.conversation_id,
      answer_preview: difyData.answer?.substring(0, 60) + '...'
    });

    // Return response
    res.json({
      success: true,
      detection,
      dify_response: {
        conversation_id: difyData.conversation_id,
        answer: difyData.answer,
        message_id: difyData.message_id
      }
    });

  } catch (error) {
    console.error('[ERROR]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Manual chat endpoint (for testing or manual queries)
 */
app.post('/chat', async (req, res) => {
  try {
    const { query, conversation_id, camera_id } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'query is required' });
    }

    const convId = conversation_id || conversations.get(camera_id || 'default');

    const difyPayload = {
      inputs: {},
      query,
      response_mode: 'blocking',
      user: camera_id || 'manual',
      conversation_id: convId || undefined
    };

    const difyResponse = await fetch(`${DIFY_API_URL}/chat-messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DIFY_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(difyPayload)
    });

    const difyData = await difyResponse.json();

    if (difyData.conversation_id) {
      conversations.set(camera_id || 'default', difyData.conversation_id);
    }

    res.json({
      success: true,
      conversation_id: difyData.conversation_id,
      answer: difyData.answer,
      message_id: difyData.message_id
    });

  } catch (error) {
    console.error('[CHAT ERROR]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get detection history
 */
app.get('/detections', (req, res) => {
  const limit = parseInt(req.query.limit) || 50;
  res.json({
    total: detectionHistory.length,
    detections: detectionHistory.slice(-limit)
  });
});

/**
 * Get active conversations
 */
app.get('/conversations', (req, res) => {
  res.json({
    count: conversations.size,
    conversations: Array.from(conversations.entries()).map(([camera, conv_id]) => ({
      camera_id: camera,
      conversation_id: conv_id
    }))
  });
});

/**
 * Clear conversation for a camera (start fresh)
 */
app.delete('/conversations/:camera_id', (req, res) => {
  const { camera_id } = req.params;
  conversations.delete(camera_id);
  res.json({
    success: true,
    message: `Conversation cleared for ${camera_id}`
  });
});

/**
 * Secure face recognition proxy
 * Accepts frame from browser, forwards to CompreFace with server-side API key
 * This prevents exposing CompreFace API key to the browser
 */
app.post('/recognize-frame', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'file is required' });
    }

    // Get query parameters from request
    const { det_prob_threshold, face_plugins } = req.query;

    // Create FormData for CompreFace
    const fd = new FormData();
    fd.append('file', req.file.buffer, {
      filename: 'frame.jpg',
      contentType: 'image/jpeg'
    });

    // Build CompreFace URL with parameters
    const params = new URLSearchParams({
      prediction_count: '1',
      limit: '0',
      det_prob_threshold: det_prob_threshold || '0.7',
      status: 'true',
      face_plugins: face_plugins || 'age,gender'
    });

    const url = `${COMPREFACE_URL}/api/v1/recognition/recognize?${params}`;

    console.log('[RECOGNIZE] Forwarding frame to CompreFace');

    // Forward to CompreFace with server-side API key (SECURE!)
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-api-key': COMPREFACE_API_KEY, // Key stays on server
        ...fd.getHeaders()
      },
      body: fd
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[RECOGNIZE ERROR]', data);
      return res.status(response.status).json(data);
    }

    // Return recognition results
    res.json(data);

  } catch (error) {
    console.error('[RECOGNIZE ERROR]', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════╗
║  CompreFace ↔ Dify Relay Server           ║
║  Running on port ${PORT}                      ║
╚════════════════════════════════════════════╝

Endpoints:
  POST /face-event     - Receive face detections
  POST /chat           - Manual chat messages
  GET  /detections     - View detection history
  GET  /conversations  - View active conversations
  GET  /health         - Health check

Configuration:
  Dify API: ${DIFY_API_URL}
  CompreFace: ${COMPREFACE_URL}
  
Ready to relay face detections to Dify! 🚀
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});
