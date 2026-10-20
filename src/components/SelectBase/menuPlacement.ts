import { createContext } from 'react';

/**
 * Where a select's list opens. `floating` (the default) lays it over the page beneath its field. `inline` puts it in the flow, under the field,
 * so what follows moves down: for a field inside a panel that scrolls (the controls sheet), where a floating list would be cut off by the panel.
 */
export const MenuPlacement = createContext<'floating' | 'inline'>('floating');
