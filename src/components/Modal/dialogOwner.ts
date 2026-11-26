import { createContext, useContext } from 'react';

/**
 * The id of the dialog a component is rendered in, or null outside any. A part that portals to the page body (a tooltip, a
 * popover) belongs to that dialog: it stays live with it, and is inert with everything else when another dialog is on top.
 */
export const DialogOwner = createContext<string | null>(null);

/**
 * The owner to give a portal of your own, as `data-syn-owner={useDialogOwner() ?? undefined}` on its outermost element, so that a
 * dialog does not make it inert.
 */
export const useDialogOwner = () => useContext(DialogOwner);
