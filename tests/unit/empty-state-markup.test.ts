import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { EmptyState } from '../../src/components/EmptyState/EmptyState';

describe('EmptyState markup on the server', () => {
  it('holds a block message without nesting paragraphs, which a browser would reparse', () => {
    const html = renderToString(createElement(EmptyState, { title: 'Nothing here', message: createElement('p', null, 'Change your filters.') }));
    expect(html).toContain('Change your filters.');
    expect(html).not.toMatch(/<p[^>]*>(?:(?!<\/p>).)*<p[ >]/s);
  });

  it('renders a plain string message too', () => {
    expect(renderToString(createElement(EmptyState, { title: 'Nothing here', message: 'Try again later.' }))).toContain('Try again later.');
  });
});
