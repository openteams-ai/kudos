/**
 * Escape user-influenced text before interpolating it into Slack message
 * `text`. Slack mrkdwn treats `&`, `<`, and `>` specially (e.g. `<!channel>`
 * pings everyone, `<http://…>` becomes a link), so any free-text value coming
 * from a user must be escaped. Order matters: `&` first, then `<`, then `>`.
 *
 * Only escape user-supplied strings — never the mention markup (`<@U123>`) that
 * we construct ourselves.
 */
export function escapeSlackText(input: string): string {
  return input.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
