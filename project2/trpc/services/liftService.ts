import { getLatestBatch } from '../../utils/mongodb.js';
import { Lift, LiftStatusType } from '../types/lift.js';
import { fetchFromCache, cacheResult } from '../../utils/redis.js';
import { BatchType, ObjectType } from '../../models/Enum.js';

type LiftBatch = { lifts: Lift[] } & Record<string, unknown>;

async function getLiftBatchWithCache() {
  let batch = (await fetchFromCache(ObjectType.lift)) as LiftBatch | null;

  if (!batch) {
    console.log("Fetching data from MongoDB");
    batch = (await getLatestBatch(BatchType.LiftBatch)) as LiftBatch | null;
    if (batch) {
      await cacheResult(ObjectType.lift, batch);
    }
  }

  return batch;
}

export const LiftService = {
  // TODO: Implement a method that returns the latest lift array.
  // This should fetch the latest LiftBatch and return its `lifts` field,
  // or [] if no batch exists.
  async getLatestLifts(): Promise<Lift[]> {
    const batch = await getLiftBatchWithCache();
    if (!batch) return [];
    return batch.lifts || [];
  },

  // TODO: Implement a method that returns a single lift by name.
  // Search the latest batch for a matching name. Return null if not found.
  async getLiftByName(name: string): Promise<Lift | null> {
    const batch = await getLiftBatchWithCache();
    if (!batch) return null;

    const lift = batch.lifts.find((lift: Lift) => lift.name === name);

    if (!lift) {
      return null;
    }

    return lift;
  },

  // TODO: Implement a method that updates a lift's status in the cache.
  //
  // The pattern is read–mutate–write against the cached batch:
  //   1. fetchFromCache for the lift batch
  //   2. find the matching lift (return failure if missing)
  //   3. update its status and lastUpdated timestamp
  //   4. cacheResult to write the batch back
  //
  // Hint: you'll need a helper to produce a current timestamp string.
  // Check utils/ for something useful — you may need to add an import.
  async updateLiftStatus(name: string, status: string): Promise<{ success: boolean, message: string }> {
    let batch = (await fetchFromCache(ObjectType.lift)) as LiftBatch | null;

    if (!batch) {
      console.log("Fetching data from MongoDB");
      batch = (await getLatestBatch(BatchType.LiftBatch)) as LiftBatch | null;
    }

    if (!batch) {
      return { success: false, message: "Lift batch was not available" };
    }

    const lift = batch.lifts.find((lift: Lift) => lift.name === name);

    if (!lift) {
      return { success: false, message: "Lift was not found" };
    }

    lift.status = status as unknown as LiftStatusType;
    lift.lastUpdated = new Date();

    await cacheResult(ObjectType.lift, batch);

    return { success: true, message: "Lift status was updated" };
  }
};
