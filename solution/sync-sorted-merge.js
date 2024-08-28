"use strict";
const { MinPriorityQueue } = require('@datastructures-js/priority-queue');

// This solution uses a heap to merge the logs. Overall, time complexity is O(N log k) where N is the 
// number of entries across all sources and k is the number of sources that are active.

// Reason for using min heap:
// Get the smallest log entry at any given time and efficiently.
// Add new log entries to the heap efficiently.
// Remove the smallest log entry from the heap efficiently.
module.exports = (logSources, printer) => {
  const heap = new MinPriorityQueue(entry => entry.log.date.getTime());

  // Initialize the heap with the first log entry from each source
  logSources.forEach((source, index) => {
    const log = source.pop();
    if (log) heap.enqueue({ log, sourceIndex: index });
  });

  // Process logs until the heap is empty
  while (!heap.isEmpty()) {
    const { log, sourceIndex } = heap.dequeue();
    printer.print(log);

    // Fetch and process logs from the same source in a batch if possible
    let nextLog = logSources[sourceIndex].pop();
    while (nextLog && (heap.isEmpty() || nextLog.date.getTime() <= heap.front().log.date.getTime())) {
      printer.print(nextLog);
      nextLog = logSources[sourceIndex].pop();
    }

    // Enqueue the next log if it exists and didn't fit into the batch
    if (nextLog) {
      heap.enqueue({ log: nextLog, sourceIndex });
    }
  }

  printer.done();
};
