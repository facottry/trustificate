'use strict';

const fc = require('fast-check');
const handlebars = require('handlebars');
const fs = require('fs');
const path = require('path');

// ---------------------------------------------------------------------------
// Mocks — must be declared before require() of the module under test
// ---------------------------------------------------------------------------
const mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test' });

jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: mockSendMail })),
}));

jest.mock('../../utils/logger', () => ({
  error: jest.fn(),
  info: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Module under test (loaded after mocks are in place)
// ---------------------------------------------------------------------------
const { compileTemplate, sendTransactional, sendPromotional } = require('../emailService');
const { AppError } = require('../../middlewares/error.middleware');
const logger = require('../../utils/logger');

// ---------------------------------------------------------------------------
// Template data fixtures
// ---------------------------------------------------------------------------
const VALID_DATA = {
  'welcome': { userName: 'Alice', dashboardLink: 'https://example.com/dashboard' },
  'forgot-password': { userName: 'Alice', otp: '123456', resetLink: 'https://example.com/reset' },
  'certificate-receiver': { recipientName: 'Bob', issuerName: 'Acme Corp', certificateTitle: 'Excellence Award', certificateLink: 'https://example.com/cert/abc' },
  'certificate-issuer': { issuerName: 'Alice', recipientName: 'Bob', certificateTitle: 'Excellence Award', issuanceLogLink: 'https://example.com/documents' },
  'certificate-revoked': { recipientName: 'Bob', certificateTitle: 'Excellence Award', supportLink: 'https://example.com/support' },
  'password-changed': { userName: 'Alice', timestamp: '2025-01-01 12:00:00', supportLink: 'https://example.com/support' },
  'team-invite': { orgName: 'Acme Corp', inviterName: 'Alice', joinLink: 'https://example.com/accept-invite?token=abc' },
  'email-verification-otp': { userName: 'Alice', otp: '654321' },
  'email-verification-link': { userName: 'Alice', verificationLink: 'https://example.com/confirm-email?token=abc' },
  'feature-announcement': { recipientName: 'Alice', featureTitle: 'New Feature', featureDescription: 'We launched something great.', ctaLink: 'https://example.com/feature', ctaLabel: 'Learn More', unsubscribeLink: 'https://example.com/unsubscribe?token=abc' },
  'plan-upsell': { recipientName: 'Alice', currentPlan: 'Free', targetPlan: 'Pro', benefitsList: ['Unlimited certificates', 'Priority support'], upgradeLink: 'https://example.com/upgrade', unsubscribeLink: 'https://example.com/unsubscribe?token=abc' },
};

const ALL_TEMPLATE_NAMES = Object.keys(VALID_DATA);
const TRANSACTIONAL_NAMES = ALL_TEMPLATE_NAMES.filter(n => !['feature-announcement', 'plan-upsell'].includes(n));
const PROMOTIONAL_NAMES = ['feature-announcement', 'plan-upsell'];
const PARTIAL_NAMES = ['email-header', 'brand-tokens', 'transactional-footer', 'promotional-footer'];

const PARTIALS_DIR = path.join(__dirname, '../../templates/emails/partials');

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
beforeEach(() => {
  jest.clearAllMocks();
  mockSendMail.mockResolvedValue({ messageId: 'test' });
});

// ---------------------------------------------------------------------------
// Property-Based Tests
// ---------------------------------------------------------------------------

describe('Property-Based Tests — email-infrastructure', () => {

  // P1 — All templates compile without unresolved partials
  test('P1: All templates compile without unresolved partials', async () => {
    // Feature: email-infrastructure, Property 1: All templates compile without unresolved partials
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...ALL_TEMPLATE_NAMES), async (name) => {
        const html = compileTemplate(name, VALID_DATA[name]);
        expect(typeof html).toBe('string');
        expect(html.length).toBeGreaterThan(0);
        expect(html).not.toContain('{{>');
      }),
      { numRuns: 100 }
    );
  });

  // P2 — Missing partial throws descriptive error, no HTML returned
  test('P2: Missing partial throws a descriptive error and no HTML is returned', async () => {
    // Feature: email-infrastructure, Property 2: Missing partial throws a descriptive error and no HTML is returned
    //
    // Map each partial to a template that actually references it.
    // brand-tokens is comment-only (no rendered output), so it cannot be tested
    // via compile failure — we test the three structural partials instead.
    const TESTABLE_PARTIALS = {
      'email-header': 'welcome',
      'transactional-footer': 'welcome',
      'promotional-footer': 'feature-announcement',
    };

    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...Object.keys(TESTABLE_PARTIALS)), async (partialName) => {
        const templateName = TESTABLE_PARTIALS[partialName];
        const partialFilePath = path.join(PARTIALS_DIR, `${partialName}.hbs`);
        const source = fs.readFileSync(partialFilePath, 'utf8');

        try {
          handlebars.unregisterPartial(partialName);

          let thrownError = null;
          let result = null;
          try {
            result = compileTemplate(templateName, VALID_DATA[templateName]);
          } catch (err) {
            thrownError = err;
          }

          expect(result).toBeNull();
          expect(thrownError).not.toBeNull();
          expect(thrownError.message).toContain(partialName);
        } finally {
          handlebars.registerPartial(partialName, source);
        }
      }),
      { numRuns: 100 }
    );
  });

  // P3 — Missing template name throws descriptive error
  test('P3: Missing template name throws a descriptive error and no HTML is returned', async () => {
    // Feature: email-infrastructure, Property 3: Missing template name throws a descriptive error and no HTML is returned
    await fc.assert(
      fc.asyncProperty(
        fc.string().filter(s =>
          !ALL_TEMPLATE_NAMES.includes(s) &&
          s.length > 0 &&
          !s.includes('/') &&
          !s.includes('\\')
        ),
        async (name) => {
          let thrownError = null;
          let result = null;
          try {
            result = compileTemplate(name, {});
          } catch (err) {
            thrownError = err;
          }

          expect(result).toBeNull();
          expect(thrownError).not.toBeNull();
          expect(thrownError.message).toContain(name);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P4 — Brand tokens applied as inline styles in all templates
  test('P4: All compiled templates apply brand tokens as inline styles', async () => {
    // Feature: email-infrastructure, Property 4: All compiled templates apply brand tokens as inline styles
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...ALL_TEMPLATE_NAMES), async (name) => {
        const html = compileTemplate(name, VALID_DATA[name]);

        expect(html).not.toContain('<style');
        expect(html).toContain('font-family');
        expect(html).toContain('#1F3A5F');
        expect(html).toContain('#f8f9fa');
        expect(html).toContain('#ffffff');
        expect(html).toContain('border-radius: 8px');
      }),
      { numRuns: 100 }
    );
  });

  // P5 — Footer present in all compiled templates
  test('P5: All compiled templates contain a footer section', async () => {
    // Feature: email-infrastructure, Property 5: All compiled templates contain a footer section
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...ALL_TEMPLATE_NAMES), async (name) => {
        const html = compileTemplate(name, VALID_DATA[name]);

        expect(html).toContain('trustificate.com');
        expect(html).toContain('All rights reserved');
      }),
      { numRuns: 100 }
    );
  });

  // P6 — Transactional templates contain no unsubscribe content
  test('P6: Transactional templates contain no unsubscribe content', async () => {
    // Feature: email-infrastructure, Property 6: Transactional templates contain no unsubscribe link
    await fc.assert(
      fc.asyncProperty(fc.constantFrom(...TRANSACTIONAL_NAMES), async (name) => {
        const html = compileTemplate(name, VALID_DATA[name]);

        expect(html.toLowerCase()).not.toContain('unsubscribe');
      }),
      { numRuns: 100 }
    );
  });

  // P7 — Promotional templates contain exactly one unsubscribeLink anchor
  test('P7: Promotional templates contain exactly one unsubscribeLink anchor', async () => {
    // Feature: email-infrastructure, Property 7: Promotional templates contain exactly one unsubscribeLink anchor
    //
    // Handlebars HTML-encodes special characters (=, &, ?, #) when interpolating
    // {{unsubscribeLink}} inside an href attribute. To reliably count occurrences
    // of the URL in the rendered output we use a URL composed only of characters
    // that Handlebars does not encode: letters, digits, hyphens, slashes, dots,
    // and colons (the scheme separator).
    const safeSegment = fc.stringOf(
      fc.mapToConstant(
        { num: 26, build: i => String.fromCharCode(97 + i) },  // a-z
        { num: 10, build: i => String.fromCharCode(48 + i) },  // 0-9
        { num: 1,  build: () => '-' },
      ),
      { minLength: 1, maxLength: 8 }
    );

    const safeUrl = safeSegment.map(seg => `https://example.com/unsub/${seg}`);

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...PROMOTIONAL_NAMES),
        safeUrl,
        async (name, unsubscribeLink) => {
          const data = { ...VALID_DATA[name], unsubscribeLink };
          const html = compileTemplate(name, data);

          // The URL should appear exactly once as the href of the unsubscribe anchor
          const occurrences = html.split(unsubscribeLink).length - 1;
          expect(occurrences).toBe(1);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P8 — Promotional sender rejects missing/empty unsubscribeLink before compilation
  test('P8: Promotional sender rejects missing or empty unsubscribeLink before compilation', async () => {
    // Feature: email-infrastructure, Property 8: Promotional sender rejects missing or empty unsubscribeLink before compilation
    await fc.assert(
      fc.asyncProperty(
        fc.oneof(
          fc.constant(undefined),
          fc.constant(null),
          fc.constant(''),
          fc.constant('   ')
        ),
        async (badLink) => {
          const data = { ...VALID_DATA['feature-announcement'], unsubscribeLink: badLink };

          let thrownError = null;
          try {
            await sendPromotional(['test@example.com'], 'feature-announcement', data, 'Test');
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).not.toBeNull();
          expect(thrownError instanceof AppError || thrownError.statusCode === 400 || thrownError.status === 400).toBe(true);
          expect(mockSendMail).not.toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  // P9 — Promotional sender calls sendMail N times for N recipients
  test('P9: Promotional sender dispatches to every recipient exactly once', async () => {
    // Feature: email-infrastructure, Property 9: Promotional sender dispatches to every recipient exactly once
    await fc.assert(
      fc.asyncProperty(
        fc.array(fc.emailAddress(), { minLength: 1, maxLength: 10 }),
        async (recipients) => {
          mockSendMail.mockClear();
          mockSendMail.mockResolvedValue({ messageId: 'test' });

          await sendPromotional(recipients, 'feature-announcement', VALID_DATA['feature-announcement'], 'Test');

          expect(mockSendMail).toHaveBeenCalledTimes(recipients.length);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P10 — Transactional sender calls sendMail exactly once
  test('P10: Transactional sender dispatches exactly once per call', async () => {
    // Feature: email-infrastructure, Property 10: Transactional sender dispatches exactly once per call
    await fc.assert(
      fc.asyncProperty(
        fc.emailAddress(),
        fc.constantFrom(...TRANSACTIONAL_NAMES),
        async (email, name) => {
          mockSendMail.mockClear();
          mockSendMail.mockResolvedValue({ messageId: 'test' });

          await sendTransactional(email, name, VALID_DATA[name], 'Test Subject');

          expect(mockSendMail).toHaveBeenCalledTimes(1);
          expect(mockSendMail.mock.calls[0][0].to).toBe(email);
        }
      ),
      { numRuns: 100 }
    );
  });

  // P11 — Dispatch errors are caught, logged, and re-thrown as AppError
  test('P11: Nodemailer dispatch errors are caught, logged, and re-thrown as AppError', async () => {
    // Feature: email-infrastructure, Property 11: Nodemailer dispatch errors are caught, logged, and re-thrown as AppError
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALL_TEMPLATE_NAMES),
        async (name) => {
          mockSendMail.mockClear();
          logger.error.mockClear();
          mockSendMail.mockRejectedValue(new Error('SMTP failure'));

          let thrownError = null;
          try {
            if (PROMOTIONAL_NAMES.includes(name)) {
              await sendPromotional(['test@example.com'], name, VALID_DATA[name], 'Test');
            } else {
              await sendTransactional('test@example.com', name, VALID_DATA[name], 'Test Subject');
            }
          } catch (err) {
            thrownError = err;
          }

          expect(thrownError).not.toBeNull();
          expect(thrownError instanceof AppError || thrownError.status === 500 || thrownError.statusCode === 500).toBe(true);
          expect(logger.error).toHaveBeenCalled();
        }
      ),
      { numRuns: 100 }
    );
  });

  // P12 — Repeated compileTemplate calls succeed without re-registration errors
  test('P12: Repeated compileTemplate calls do not cause partial re-registration errors', async () => {
    // Feature: email-infrastructure, Property 12: Repeated compileTemplate calls do not cause partial re-registration errors
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...ALL_TEMPLATE_NAMES),
        fc.integer({ min: 2, max: 5 }),
        async (name, count) => {
          const results = [];
          for (let i = 0; i < count; i++) {
            const html = compileTemplate(name, VALID_DATA[name]);
            results.push(html);
          }

          expect(results).toHaveLength(count);
          results.forEach(html => {
            expect(typeof html).toBe('string');
            expect(html.length).toBeGreaterThan(0);
          });
        }
      ),
      { numRuns: 100 }
    );
  });

});

// ---------------------------------------------------------------------------
// Unit Tests
// ---------------------------------------------------------------------------

describe('Unit Tests — email-infrastructure', () => {
  const fs = require('fs');
  const path = require('path');
  const PARTIALS_DIR = path.join(__dirname, '../../templates/emails/partials');

  // 9.1 — Partial registration at module load
  test('9.1: All four partials are registered in the Handlebars instance after require', () => {
    // _Requirements: 7.1_
    const handlebars = require('handlebars');
    const registered = handlebars.partials;
    expect(registered['email-header']).toBeDefined();
    expect(registered['brand-tokens']).toBeDefined();
    expect(registered['transactional-footer']).toBeDefined();
    expect(registered['promotional-footer']).toBeDefined();
  });

  // 9.2 — Specific variable rendering
  test('9.2: welcome template renders userName correctly', () => {
    // _Requirements: 3.1_
    const html = compileTemplate('welcome', { userName: 'Alice', dashboardLink: 'https://example.com/dashboard' });
    expect(html).toContain('Alice');
  });

  // 9.3 — from address fallback
  test('9.3: sendTransactional uses noreply fallback when FROM_EMAIL is not set', async () => {
    // _Requirements: 5.5, 6.7_
    const original = process.env.FROM_EMAIL;
    delete process.env.FROM_EMAIL;
    mockSendMail.mockResolvedValue({ messageId: 'test' });

    await sendTransactional('user@example.com', 'welcome', VALID_DATA['welcome'], 'Test');

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'noreply@trustificate.com' })
    );

    if (original !== undefined) process.env.FROM_EMAIL = original;
  });

  // 9.4 — from address from env
  test('9.4: sendTransactional uses FROM_EMAIL env var when set', async () => {
    // _Requirements: 5.5, 6.7_
    process.env.FROM_EMAIL = 'custom@trustificate.com';
    mockSendMail.mockResolvedValue({ messageId: 'test' });

    await sendTransactional('user@example.com', 'welcome', VALID_DATA['welcome'], 'Test');

    expect(mockSendMail).toHaveBeenCalledWith(
      expect.objectContaining({ from: 'custom@trustificate.com' })
    );

    delete process.env.FROM_EMAIL;
  });

  // 9.5 — Transactional footer has no unsubscribe
  test('9.5: transactional-footer.hbs source does not contain "unsubscribe"', () => {
    // _Requirements: 9.4_
    const source = fs.readFileSync(path.join(PARTIALS_DIR, 'transactional-footer.hbs'), 'utf8');
    expect(source.toLowerCase()).not.toContain('unsubscribe');
  });

  // 9.6 — Promotional footer has unsubscribeLink
  test('9.6: promotional-footer.hbs source contains {{unsubscribeLink}}', () => {
    // _Requirements: 9.5_
    const source = fs.readFileSync(path.join(PARTIALS_DIR, 'promotional-footer.hbs'), 'utf8');
    expect(source).toContain('{{unsubscribeLink}}');
  });

  // 9.7 — benefitsList rendering
  test('9.7: plan-upsell template renders each benefitsList item as an <li>', () => {
    // _Requirements: 4.2_
    const data = {
      ...VALID_DATA['plan-upsell'],
      benefitsList: ['Unlimited certificates', 'Priority support', 'Custom branding'],
    };
    const html = compileTemplate('plan-upsell', data);
    expect(html).toContain('<li');
    expect(html).toContain('Unlimited certificates');
    expect(html).toContain('Priority support');
    expect(html).toContain('Custom branding');
  });
});
