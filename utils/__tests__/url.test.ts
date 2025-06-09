import { describe, it, expect } from 'vitest';
import { extractDomainFromUrl } from '../url';

describe('extractDomainFromUrl', () => {
  it('handles subdomains', () => {
    expect(extractDomainFromUrl('https://www.example.com/path')).toBe('example.com');
  });

  it('handles nested subdomains', () => {
    expect(extractDomainFromUrl('https://space.bilibili.com/123')).toBe('bilibili.com');
  });

  it('returns hostname when no subdomain', () => {
    expect(extractDomainFromUrl('https://localhost:3000')).toBe('localhost');
  });

  it('supports domains with multi-part tld', () => {
    expect(extractDomainFromUrl('https://docs.example.co.uk/page')).toBe('co.uk');
  });
});
