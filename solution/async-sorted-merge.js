"use strict";

// This is potentially scale better to a large number of sources. I was considering using a heap similiar to sync operation, but 
// this is a bit more efficient. Overall, time complexity is O(N(k + b)) where N is the number of 
// entries across all sources, k is the number of sources that are active, and b is the batch size.
// k and b are almost constant, so time complexity is O(N).
module.exports = async (logSources, printer) => {
  const ActiveSources = new Map();

  // Initialize with only a subset of sources
  const INITIAL_ACTIVE_SOURCES = 1000;
  for (let i = 0; i < Math.min(INITIAL_ACTIVE_SOURCES, logSources.length); i++) {
    const log = await logSources[i].popAsync();
    if (log) ActiveSources.set(i, { log, sourceIndex: i });
  }

  // Add sources in batches
  let nextSourceToAdd = INITIAL_ACTIVE_SOURCES;

  // Process logs until all sources are empty
  while (ActiveSources.size > 0) {
    // Find earliest log
    let earliestEntry = null;
    let earliestSourceIndex = null;

    for (const [sourceIndex, entry] of ActiveSources) {
      if (!earliestEntry || entry.log.date < earliestEntry.log.date) {
        earliestEntry = entry;
        earliestSourceIndex = sourceIndex;
      }
    }

    // Print earliest log
    printer.print(earliestEntry.log);

    // Get next log from this source
    const nextLog = await logSources[earliestSourceIndex].popAsync();
    if (nextLog) {
      ActiveSources.set(earliestSourceIndex, { log: nextLog, sourceIndex: earliestSourceIndex });
    } else {
      ActiveSources.delete(earliestSourceIndex);
      
      // Add a new source if available
      if (nextSourceToAdd < logSources.length) {
        const log = await logSources[nextSourceToAdd].popAsync();
        if (log) ActiveSources.set(nextSourceToAdd, { log, sourceIndex: nextSourceToAdd });
        nextSourceToAdd++;
      }
    }
  }

  printer.done();
};
