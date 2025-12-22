export const TICKET_DELETED_EVENT = "ticket:deleted";

export const emitTicketDeleted = (ticketId: string) => {
  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent(TICKET_DELETED_EVENT, { detail: { ticketId } })
  );
};

export const addTicketDeletedListener = (
  callback: (ticketId: string) => void
) => {
  if (typeof window === "undefined") return () => undefined;
  const handler = (event: Event) => {
    const customEvent = event as CustomEvent<{ ticketId: string }>;
    if (customEvent?.detail?.ticketId) {
      callback(customEvent.detail.ticketId);
    }
  };
  window.addEventListener(TICKET_DELETED_EVENT, handler);
  return () => window.removeEventListener(TICKET_DELETED_EVENT, handler);
};
