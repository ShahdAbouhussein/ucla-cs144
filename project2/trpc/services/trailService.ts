import { BatchType, ObjectType } from '../../models/Enum.js';
import { getLatestBatch } from '../../utils/mongodb.js';
import { Trail, TrailStatusType } from '../types/trail.js';
import { fetchFromCache, cacheResult } from '../../utils/redis.js';

type TrailBatch = { trails: Trail[] } & Record<string, unknown>;

async function getTrailBatchWithCache() {
  let batch = (await fetchFromCache(ObjectType.trail)) as TrailBatch | null;

  if (!batch) {
    console.log("Fetching data from MongoDB");
    batch = (await getLatestBatch(BatchType.TrailBatch)) as TrailBatch | null;
    if (batch) {
      await cacheResult(ObjectType.trail, batch);
    }
  }

  return batch;
}

export const TrailService = {
  // TODO: Implement a method that returns the latest trail array.
  // This should fetch the latest TrailBatch and return its `trails` field,
  // or [] if no batch exists.
  async getLatestTrails(): Promise<Trail[]> {
    const batch = await getTrailBatchWithCache();
    if (!batch) return [];
    return batch.trails || [];
  },

  // TODO: Implement a method that returns a single trail by name.
  // Search the latest batch for a matching name. Return null if not found.
  async getTrailByName(name: string): Promise<Trail | null> {
    const batch = await getTrailBatchWithCache();
    if (!batch) return null;

    const trail = batch.trails.find((trail: Trail) => trail.name === name);
    if (!trail) return null;
    return trail;
  },

  // TODO: Implement a method that updates a trail's status in the cache.
  //
  // The pattern is read–mutate–write against the cached batch:
  //   1. fetchFromCache for the trail batch
  //   2. find the matching trail (return failure if missing)
  //   3. update its status
  //   4. cacheResult to write the batch back
  async updateTrailStatus(name: string, status: string): Promise<{ success: boolean, message: string }> {
    let batch = (await fetchFromCache(ObjectType.trail)) as TrailBatch | null;

    if (!batch) {
      console.log("Fetching data from MongoDB");
      batch = (await getLatestBatch(BatchType.TrailBatch)) as TrailBatch | null;
    }

    if (!batch) {
      return { success: false, message: "Trail batch was not available" };
    }

    const trail = batch.trails.find((trail: Trail) => trail.name === name);
    if (!trail) {
      return { success: false, message: "Trail was not found" };
    }

    trail.status = status as unknown as TrailStatusType;
    await cacheResult(ObjectType.trail, batch);

    return { success: true, message: "Trail status was updated" };
  }
};
