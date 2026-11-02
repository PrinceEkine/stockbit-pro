/**
 * User-friendly notices for AI gateway failure codes, shared by the
 * landing-page chatbot and the in-app AI Insights page so both surfaces
 * explain the same failure the same way.
 */

export const chatNoticeFor = (code?: string): string => {
  switch (code) {
    case 'NOT_CONFIGURED':
    case 'FUNCTION_NOT_DEPLOYED':
      return 'Live AI is being set up — answering from local help for now. Call 07010698264 for urgent issues.';
    case 'MESSAGE_TOO_LONG':
      return 'That message was too long — please keep it to a few sentences and try again.';
    case 'RATE_LIMITED':
      return 'Too many messages at once — please wait a moment and try again.';
    default:
      return 'Live AI is unreachable — answering from local help. Call 07010698264 for urgent issues.';
  }
};

export const insightsNoticeFor = (code?: string): string => {
  switch (code) {
    case 'NOT_CONFIGURED':
    case 'FUNCTION_NOT_DEPLOYED':
      return 'AI analysis is not set up on the server yet. Ask your administrator to configure the AI key, then try again.';
    case 'UNAUTHORIZED':
      return 'Sign in to use AI analysis.';
    case 'RATE_LIMITED':
      return 'Too many analysis requests at once — please wait a moment and retry.';
    case 'REQUEST_TOO_LARGE':
      return 'Your inventory snapshot is too large to analyse in one go. Try again with fewer products.';
    default:
      return 'AI analysis is temporarily unreachable. Check your connection and retry.';
  }
};
