import {
  type ReactNode,
  useEffect,
  useState,
  createContext,
  useContext,
} from "react";
import { type Event, relayInit } from "nostr-tools";

const NostrEventsContext = createContext<Event[]>([]);

export const useNostrEvents = () => useContext(NostrEventsContext);

export const NostrEventsProvider = ({ children }: { children: ReactNode }) => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const relay = relayInit("wss://nostr.milou.lol");
    const cowdlePubKey =
      "8ebf24a6d1a0bb69f7bce5863fec286ff3a0ebafdff0e89e2ed219d83f219238";
    const initialEvents: Event[] = [];
    const sub = relay.sub([
      {
        kinds: [1],
        authors: [cowdlePubKey],
      },
    ]);
    let hasReachedEndOfStoredEvents = false;

    relay.on("connect", () => {
      console.log(`connected to ${relay.url}`);
    });
    relay.on("error", () => {
      console.log(`failed to connect to ${relay.url}`);
    });

    sub.on("event", (event: Event) => {
      if (hasReachedEndOfStoredEvents) {
        setEvents((events) => [event, ...events]);
      } else {
        initialEvents.push(event);
      }
    });
    sub.on("eose", () => {
      setEvents(initialEvents.reverse());
      hasReachedEndOfStoredEvents = true;
    });

    relay.connect();

    return () => {
      relay.close();
    };
  }, []);

  return (
    <NostrEventsContext.Provider value={events}>
      {children}
    </NostrEventsContext.Provider>
  );
};
