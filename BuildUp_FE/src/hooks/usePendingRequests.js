import { useReducer } from 'react';

// A completed request must not hide the loading indicator of another request.
export function usePendingRequests() {
  const [pending, trackRequest] = useReducer(
    (count, started) => Math.max(0, count + (started ? 1 : -1)),
    0,
  );
  return [pending > 0, trackRequest];
}
