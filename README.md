# ccwarm

Optimize your Claude Code rate limit window by pre-warming sessions based on your usage patterns.

> **Note:** This tool is for **Claude Pro and Max** subscribers, not for API-based usage.

## The Problem

Claude Code's rate limits reset 5 hours after your **first message**.

## The Solution

ccwarm analyzes your usage history to find when you typically work. It then sends a short message to Claude Code at the optimal time, so your rate limit resets when you actually need it.

### Example

You typically work 9:00-13:30 and get blocked in the middle → ccwarm sends "hi" at 7:15 → limit resets at 12:15 instead of 14:00

## Usage

```bash
npx ccwarm
```

Or install globally:

```bash
npm install -g ccwarm
```

## Usage

```bash
ccwarm analyze [days]  # Analyze usage patterns (default: 30 days)
ccwarm warmup          # Run warmup check now
ccwarm start           # Start background daemon
ccwarm stop            # Stop daemon
ccwarm status          # Show status and plan
ccwarm logs            # Follow daemon logs
```
