import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MultiSelect } from './MultiSelect/MultiSelect';
import { PromptBar } from './PromptBar/PromptBar';
import { Select } from './Select/Select';
import { ThemeSwitch } from '../theme/ThemeSwitch';

const options = Array.from({ length: 12 }, (_, i) => ({ value: `option-${i + 1}`, label: `Option ${i + 1}` }));

function Fields() {
  const [one, setOne] = useState('option-1');
  const [many, setMany] = useState<string[]>(['option-1']);
  const [prompt, setPrompt] = useState('');
  return (
    <div style={{ padding: 'var(--syn-space-5)', width: 'min(100%, 24rem)', display: 'grid', gap: 'var(--syn-space-4)' }}>
      <Select label="Country" options={options} value={one} onChange={setOne} />
      <MultiSelect label="Scenarios" options={options} value={many} onChange={setMany} />
      <PromptBar ariaLabel="Ask a question" placeholder="Ask about emissions" onSubmit={fn()} value={prompt} onChange={setPrompt} />
      <ThemeSwitch />
    </div>
  );
}

const meta: Meta = { title: 'Controls/Text entry on touch', render: () => <Fields /> };
export default meta;
type Story = StoryObj;

/** Every field that takes typing: an input of a text kind, a text area or a native select. */
const FIELDS = 'input:not([type=radio]):not([type=checkbox]):not([type=range]):not([type=button]):not([type=submit]), textarea, select';

const sizeOf = (css: string, context: HTMLElement) => {
  const probe = document.createElement('span');
  probe.style.fontSize = css;
  context.appendChild(probe);
  const px = parseFloat(getComputedStyle(probe).fontSize);
  probe.remove();
  return px;
};

/**
 * The font size a field has on a touch screen, in pixels: its own, or the one a `(pointer: coarse)` rule gives it. A touch browser that
 * zooms the page when a field under sixteen pixels takes focus does not zoom back out, so no field on a phone may be under it.
 */
const touchSizeOf = (field: HTMLElement) => {
  let size = parseFloat(getComputedStyle(field).fontSize);
  for (const sheet of [...document.styleSheets]) {
    let rules: CSSRuleList;
    try { rules = sheet.cssRules; } catch { continue; }
    for (const rule of [...rules]) {
      if (!(rule instanceof CSSMediaRule) || !/pointer:\s*coarse/.test(rule.conditionText)) continue;
      for (const inner of [...rule.cssRules]) {
        if (inner instanceof CSSStyleRule && field.matches(inner.selectorText) && inner.style.getPropertyValue('font-size')) {
          size = sizeOf(inner.style.getPropertyValue('font-size'), field.parentElement ?? document.body);
        }
      }
    }
  }
  return size;
};

const expectSixteen = (root: HTMLElement) => {
  const fields = [...root.querySelectorAll<HTMLElement>(FIELDS)];
  expect(fields.length).toBeGreaterThan(0);
  for (const field of fields) expect(`${field.tagName} ${field.getAttribute('aria-label') ?? ''} ${touchSizeOf(field) >= 16}`).toMatch(/true$/);
  return fields.length;
};

export const NoTextEntryFieldIsUnderSixteenPixelsOnATouchScreen: Story = {
  play: async ({ canvasElement }) => {
    const screen = within(canvasElement);
    // The prompt bar's text area and the theme switch's select are always there.
    await expect(expectSixteen(canvasElement)).toBeGreaterThanOrEqual(2);
    // Each list's search field is there once its list is open.
    for (const name of [/^Country/, /^Scenarios/]) {
      await userEvent.click(screen.getByRole('combobox', { name }));
      await waitFor(() => expect(canvasElement.querySelector('input[type=search]')).not.toBeNull());
      expectSixteen(canvasElement);
      await userEvent.keyboard('{Escape}');
      await waitFor(() => expect(canvasElement.querySelector('input[type=search]')).toBeNull());
    }
  },
};
