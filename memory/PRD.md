# PlantaScan - PRD (Product Requirements Document)

## Problem Statement
Build a mobile-first plant scanning web app called "PlantaScan" that uses phone camera to identify plants via AI, diagnose diseases, provide care recommendations, and manage care reminders for registered plants.

## Architecture
- **Backend**: FastAPI + MongoDB + GPT-5.2 Vision (Emergent LLM Key)
- **Frontend**: React + Tailwind CSS + Lucide Icons
- **Database**: MongoDB (collections: scans, plants, reminders)
- **AI**: OpenAI GPT-5.2 Vision via emergentintegrations library

## User Personas
1. Plant enthusiast who wants to identify unknown plants
2. Gardener who needs health diagnostics and care tips
3. Plant owner who needs reminders for watering and care

## Core Requirements
- Camera/upload plant image scanning
- AI-powered plant identification (species, family, scientific name)
- Health diagnosis with disease detection
- Care recommendations (water, light, temp, soil, fertilizer)
- Save plants to personal collection
- Reminder system for plant care (water, fertilize, prune, repot, etc.)
- Scan history

## What's Been Implemented (2026-04-12)
- [x] Full backend API with 15+ endpoints
- [x] GPT-5.2 Vision AI integration for plant identification
- [x] Plant scanning with image upload/camera
- [x] Disease diagnosis and health scoring
- [x] Care recommendations with detailed tips
- [x] My Plants collection (CRUD)
- [x] Reminders system with auto-scheduling
- [x] Scan history page
- [x] Plant detail page with tabs (Care, Diagnosis, Reminders)
- [x] Bottom navigation (Scanner, Plants, Reminders, History)
- [x] Mobile-first responsive design
- [x] All text in Brazilian Portuguese
- [x] Testing: 100% backend + 100% frontend pass rate

## API Endpoints
- POST /api/scan - Upload and analyze plant image
- GET /api/scans - Scan history
- GET /api/scans/:id - Scan details
- POST /api/plants - Save plant from scan
- GET /api/plants - List plants
- GET /api/plants/:id - Plant details
- PUT /api/plants/:id - Update plant
- DELETE /api/plants/:id - Delete plant + reminders
- GET /api/plants/:id/image - Get plant image
- POST /api/reminders - Create reminder
- GET /api/reminders - List reminders
- GET /api/reminders/pending - Pending reminders
- PUT /api/reminders/:id/complete - Complete reminder
- DELETE /api/reminders/:id - Delete reminder
- GET /api/stats - Dashboard stats

## Backlog
- P1: Push notifications for reminders (Web Push API)
- P1: Plant health tracking over time (re-scan same plant)
- P2: Plant care calendar view
- P2: Weather-based care recommendations
- P2: Social sharing of plant collections
- P3: Plant identification from plant name (text search)
- P3: Community features (share tips)

## Next Tasks
- Implement push notifications for overdue reminders
- Add plant re-scanning to track health over time
- Calendar view for reminder schedule
