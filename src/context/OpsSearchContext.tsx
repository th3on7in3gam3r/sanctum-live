import React, { createContext, useContext, useState } from 'react';

/** Search box in the moderator top bar; the Control Room filters its rooms with it. */
const OpsSearchContext = createContext<{ query: string; setQuery: (q: string) => void }>({ query: '', setQuery: () => {} });

export function OpsSearchProvider({ children }: { children: React.ReactNode }) {
  const [query, setQuery] = useState('');
  return <OpsSearchContext.Provider value={{ query, setQuery }}>{children}</OpsSearchContext.Provider>;
}

export const useOpsSearch = () => useContext(OpsSearchContext);
