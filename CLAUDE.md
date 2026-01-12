# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

KruAi (ติวเตอร์อัจฉริยะ) is an AI-powered tutoring application for Thai elementary students (grades 4-6, ages 10-12). It summarizes lesson content and generates interactive quizzes using Google Gemini API.

## Development Commands

```bash
npm install          # Install dependencies
npm run dev          # Start dev server (port 3000, host 0.0.0.0)
npm run build        # Production build
npm run preview      # Preview production build
```

## Environment Setup

Requires `GEMINI_API_KEY` in `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

## Architecture

**Tech Stack:** React 19 + TypeScript + Vite + Tailwind CSS (CDN) + Google Gemini API

**Screen Flow (AppScreen enum):**
1. `UPLOAD` → User inputs lesson content (text or file)
2. `PROCESSING` → AI generates summary
3. `SUMMARY` → Display summary and key points
4. `QUIZ` → 10-question interactive quiz
5. `RESULT` → Score and feedback

**Key Files:**
- `App.tsx` - Main component with all screen logic and state management
- `services/geminiService.ts` - Gemini API integration (summary + quiz generation)
- `types.ts` - TypeScript interfaces (QuizQuestion, SummaryData, QuizState)
- `components/Button.tsx` - Reusable button with variants (primary, secondary, success, outline)
- `components/Mascot.tsx` - SVG mascot with emotions (happy, thinking, excited, neutral)

**AI Integration:**
- Model: `gemini-3-flash-preview`
- Uses JSON schema validation for structured responses
- `generateSummary()` - Creates Thai-language lesson summary
- `generateQuiz()` - Generates 10 multiple-choice questions with explanations

## UI Notes

- All UI text is in Thai language
- Fonts: Sarabun (body), Kodchasan (headings via `.fun-font` class)
- Tailwind loaded via CDN, not installed locally
- Path alias: `@` points to root directory

## Limitations

- File parsing (PDF/DOCX/PPTX) not implemented - uses filename only for generation
- No backend - Gemini API called directly from browser
- No external state management - React hooks only
