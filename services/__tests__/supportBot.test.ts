import { describe, it, expect } from 'vitest';
import {
  answerSupportOffline,
  buildOfflineFallback,
  SUPPORT_CONTACT,
} from '../supportBot';

/**
 * Regression coverage for the StockBot offline fallback: when the AI gateway
 * is unreachable or not configured, the landing-page chat must still answer
 * common questions instead of showing a generic failure.
 */
describe('answerSupportOffline', () => {
  it('answers what StockBit Pro is', () => {
    const answer = answerSupportOffline('What is StockBit Pro?');
    expect(answer).toContain('inventory');
    expect(answer).toContain('60-day trial');
  });

  it('answers the free-trial question', () => {
    expect(answerSupportOffline('How long is the free trial?')).toContain('60-day');
  });

  it('answers the barcode scanning question', () => {
    const answer = answerSupportOffline('Is barcode scanning supported?');
    expect(answer).toContain('Yes');
    expect(answer).toContain('smartphone');
  });

  it('answers pricing questions with the current plans', () => {
    const answer = answerSupportOffline('How much does it cost?');
    expect(answer).toContain('₦5,000');
    expect(answer).toContain('₦7,999');
    expect(answer).toContain('₦12,999');
  });

  it('answers support-contact questions with both numbers', () => {
    const answer = answerSupportOffline('Show support contact');
    expect(answer).toContain(SUPPORT_CONTACT.call);
    expect(answer).toContain(SUPPORT_CONTACT.whatsapp);
  });

  it('answers staff invite questions without inventing a phone requirement', () => {
    const answer = answerSupportOffline('How do staff join my shop?');
    expect(answer).toContain('invite code');
    expect(answer).not.toMatch(/phone number is (needed|required)/i);
  });

  it('answers signup questions accurately (no phone number)', () => {
    const answer = answerSupportOffline('How do I create an account?');
    expect(answer).toContain('No phone number is needed');
  });

  it('returns null for questions that need the live AI', () => {
    expect(answerSupportOffline('Write a haiku regarding yams in Kano')).toBeNull();
  });

  it('routes scanning questions to the scanner answer, not support contact', () => {
    // "supported" contains "support" — the barcode rule must win.
    const answer = answerSupportOffline('Is barcode scanning supported?');
    expect(answer).toContain('barcode scanner');
    expect(answer).not.toContain(SUPPORT_CONTACT.call);
  });

  it('returns null for empty input', () => {
    expect(answerSupportOffline('   ')).toBeNull();
  });
});

describe('buildOfflineFallback', () => {
  it('always includes the support contact', () => {
    const fallback = buildOfflineFallback();
    expect(fallback).toContain(SUPPORT_CONTACT.call);
    expect(fallback).toContain('WhatsApp');
  });
});
