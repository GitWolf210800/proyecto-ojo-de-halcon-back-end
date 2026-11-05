// Process-wide lease. Only SQL completion releases it, never HTTP disconnection.
let busy = false;

export function acquireHistoryQuery(BusyError) {
  if (busy) throw new BusyError();
  busy = true;
  let released = false;
  return () => {
    if (!released) { released = true; busy = false; }
  };
}
