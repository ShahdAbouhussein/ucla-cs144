import express from 'express';
import { getLatestBatch, getNearestBatch } from '../../utils/mongodb.js';
import { cacheResult, fetchFromCache } from '../../utils/redis.js';
import { BatchType } from '../../models/Enum.js';
import { ObjectType } from '../../models/Enum.js';
import { TrailStatus } from '../../models/Enum.js';

const router = express.Router();

// TODO: The routes in this file are not in the correct order.
// All endpoints below are mounted at /api/trails.
//
// CACHING REQUIREMENTS (apply to every READ endpoint EXCEPT /at/:timestamp):
//   1. Check the cache first.
//      - On HIT: return the cached data. Do not query MongoDB.
//      - On MISS: query MongoDB, then WRITE THE RESULT BACK TO THE CACHE
//        before returning it. The next request must hit the cache.
//   2. Cache TTL is 5 minutes.
//   3. You MUST log these exact strings so the grader can verify your flow:
//        "Attempting to fetch data from cache"
//        "Data found in cache"      (on hit)
//        "Data not found in cache"  (on miss)
//        "Fetching data from MongoDB"
//        "Writing data to cache"
//
// MISSING RESOURCES: if a requested trail or field does not exist,
// return HTTP 404 with a JSON error body. Do not return 200 with empty data.
//
// ⚠ ROUTE ORDER WARNING ⚠
// The routes below are NOT in the correct order. Express matches routes in
// the order they are declared. As written, one of these endpoints will never
// be reached — its requests will be matched (and handled incorrectly) by an
// earlier route. Test each endpoint before assuming it works, and reorder
// the route definitions in this file so every endpoint is reachable.

async function getTrailBatchWithCache() {
  let batch = await fetchFromCache(ObjectType.trail);

  if (!batch) {
    console.log("Fetching data from MongoDB");
    batch = await getLatestBatch(BatchType.TrailBatch);
    await cacheResult(ObjectType.trail, batch);
  }

  return batch;
}

// GET /api/trails — latest batch
router.get('/', async (req, res) => {
  try {
    // TODO: fetch the latest TrailBatch.
    // Look up cache → on miss, query MongoDB → write the result back to cache → return.
    const batch = await getTrailBatchWithCache();
    res.json(batch);
  } catch (error) {
    console.error("Error in GET /api/trails:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


// GET /api/trails/at/:timestamp — historical batch (NOT CACHED)
router.get('/at/:timestamp', async (req, res) => {
  try {
    // TODO: return the most recent TrailBatch with timestamp <= :timestamp.
    // Validate the timestamp format (e.g. 2025-05-01T14:25:00). Return 400 if invalid.
    // If no batch exists at or before the given timestamp, return 404.
    // DO NOT cache this endpoint.
    const timestamp = req.params.timestamp;
    if (Number.isNaN(Date.parse(timestamp))) {
      return res.status(400).json({ error: "Invalid timestamp" });
    }
    const batch = await getNearestBatch(BatchType.TrailBatch, timestamp);

    if (!batch) {
      return res.status(404).json({ error: "No batch found" });
    }

    res.json(batch);
  } catch (error) {
    console.error("Error in GET /api/trails/at/:timestamp:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/trails/:name/:field — single field of a specific trail
router.get('/:name/:field', async (req, res) => {
  try {
    // TODO: return only the requested field of the named trail.
    // Look up cache → on miss, query MongoDB → write the result back to cache → return.
    // If the trail does not exist, return 404 with { error: "Trail not found" }.
    // If the field does not exist on the trail, return 404 with { error: "Field not found" }.
    const batch = await getTrailBatchWithCache();
    const trail = batch.trails.find(trail => trail.name === req.params.name);
    const field = req.params.field;

    if (!trail) {
      return res.status(404).json({ error: "Trail not found" });
    }
    if (!(field in trail)) {
      return res.status(404).json({ error: "Field not found" });
    }

    res.json({ name: trail.name, [field]: trail[field] });
  } catch (error) {
    console.error("Error in GET /api/trails/:name/:field:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET /api/trails/:name — specific trail
router.get('/:name', async (req, res) => {
  try {
    // TODO: return the named trail from the latest batch.
    // Look up cache → on miss, query MongoDB → write the result back to cache → return.
    // If the trail does not exist, return 404 with { error: "Trail not found" }.
    const batch = await getTrailBatchWithCache();
    const trail = batch.trails.find(trail => trail.name === req.params.name)
    
    if(!trail){
      return res.status(404).json({error: "Trail not found"})
    }

    res.json(trail);
  } catch (error) {
    console.error("Error in GET /api/trails/:name:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


/*
 * TODO: Implement an endpoint to update the status of a specific trail.
 *
 * The webpage's status form will call this endpoint. The handler should:
 *   - validate the incoming status against the TrailStatus enum.
 *     Return HTTP 400 with a JSON error body if the status is not a valid value.
 *   - return 404 if the named trail does not exist
 *   - update the trail's status in the cache
 *   - return the updated trail, or a success/failure indication
 *
 * You must choose the correct HTTP method for this operation. Consider:
 *   - Are you replacing the whole resource, or modifying part of it?
 *   - Is the operation idempotent?
 *   - What does REST convention suggest for partial updates?
 *
 * The route path should clearly identify both the resource and what's being changed.
 */

router.patch('/:name/status', async (req, res) => {
  try {
    const name = req.params.name;
    const { status } = req.body;
    if (!Object.values(TrailStatus).includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }

    let batch = await fetchFromCache(ObjectType.trail);
    if (!batch) {
      console.log("Fetching data from MongoDB");
      batch = await getLatestBatch(BatchType.TrailBatch);
    }

    const trail = batch.trails.find(trail => trail.name === name);
    if (!trail) {
      return res.status(404).json({ error: "Trail not found" });
    }

    trail.status = status;
    await cacheResult(ObjectType.trail, batch)
    res.json(trail);
  } catch (error) {
    console.error("Error in PATCH /api/trails/:name/status:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});


export default router;
