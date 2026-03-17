import { Response } from "express";
import { AuthRequest } from "../middleware/auth";
import pool from "../db/connection";
import { emitNewEvent, emitEventUpdate } from "../socket/handlers";
import { getIO } from "../socket/io";
import { getMason360Events } from "../mcp";

const OUTDOOR_KEYWORDS = [
  "outdoor", "outside", "lawn", "quad", "field", "amphitheater",
  "plaza", "courtyard", "stadium", "track", "garden", "rec fields",
];

function tagOutdoor(location: string, description: string): boolean {
  const text = (location + " " + description).toLowerCase();
  return OUTDOOR_KEYWORDS.some(k => text.includes(k));
}

export async function getEvents(req: AuthRequest, res: Response) {
  try {
    const { type, startDate, endDate } = req.query;
    const params: any[] = [];
    let paramCount = 1;
    let query = "SELECT e.*, u.full_name as organizer_name FROM events e LEFT JOIN users u ON e.organizer_id = u.id WHERE 1=1";
    if (type) { query += " AND e.event_type = $" + paramCount++; params.push(type); }
    if (startDate) { query += " AND e.start_time >= $" + paramCount++; params.push(startDate); }
    if (endDate) { query += " AND e.start_time <= $" + paramCount++; params.push(endDate); }
    query += " ORDER BY e.start_time ASC";
    const result = await pool.query(query, params);
    const localEvents = result.rows.map((e: any) => ({
      ...e, source: "local", is_outdoor: tagOutdoor(e.location || "", e.description || ""),
    }));
    let mason360Events: any[] = [];
    try { mason360Events = await getMason360Events(); } catch {}
    res.json([...localEvents, ...mason360Events]);
  } catch (error) {
    console.error("Error fetching events:", error);
    res.status(500).json({ error: "Failed to fetch events" });
  }
}

export async function getEventById(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      "SELECT e.*, u.full_name as organizer_name, (SELECT COUNT(*) FROM rsvps WHERE event_id = e.id AND status = 'attending') as attendee_count FROM events e LEFT JOIN users u ON e.organizer_id = u.id WHERE e.id = $1",
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Event not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch event" });
  }
}

export async function createEvent(req: AuthRequest, res: Response) {
  try {
    const { title, description, event_type, location, start_time, end_time, max_attendees, tags, image_url } = req.body;
    const result = await pool.query(
      "INSERT INTO events (title, description, event_type, location, start_time, end_time, organizer_id, max_attendees, tags, image_url) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *",
      [title, description, event_type, location, start_time, end_time, req.userId, max_attendees, tags, image_url]
    );
    const newEvent = result.rows[0];
    emitNewEvent(getIO(), newEvent);
    res.status(201).json(newEvent);
  } catch (error) {
    res.status(500).json({ error: "Failed to create event" });
  }
}

export async function updateEvent(req: AuthRequest, res: Response) {
  try {
    const { title, description, event_type, location, start_time, end_time, max_attendees, tags, image_url } = req.body;
    const result = await pool.query(
      "UPDATE events SET title=$1, description=$2, event_type=$3, location=$4, start_time=$5, end_time=$6, max_attendees=$7, tags=$8, image_url=$9 WHERE id=$10 AND organizer_id=$11 RETURNING *",
      [title, description, event_type, location, start_time, end_time, max_attendees, tags, image_url, req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Event not found or unauthorized" });
    emitEventUpdate(getIO(), req.params.id, result.rows[0]);
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to update event" });
  }
}

export async function deleteEvent(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      "DELETE FROM events WHERE id=$1 AND organizer_id=$2 RETURNING id",
      [req.params.id, req.userId]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Event not found or unauthorized" });
    res.json({ message: "Event deleted" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete event" });
  }
}

export async function rsvpEvent(req: AuthRequest, res: Response) {
  try {
    const { status = "attending" } = req.body;
    const result = await pool.query(
      "INSERT INTO rsvps (event_id, user_id, status) VALUES ($1,$2,$3) ON CONFLICT (event_id, user_id) DO UPDATE SET status=$3 RETURNING *",
      [req.params.id, req.userId, status]
    );
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: "Failed to RSVP" });
  }
}

export async function cancelRsvp(req: AuthRequest, res: Response) {
  try {
    await pool.query("DELETE FROM rsvps WHERE event_id=$1 AND user_id=$2", [req.params.id, req.userId]);
    res.json({ message: "RSVP cancelled" });
  } catch (error) {
    res.status(500).json({ error: "Failed to cancel RSVP" });
  }
}

export async function getUserRsvps(req: AuthRequest, res: Response) {
  try {
    const result = await pool.query(
      "SELECT event_id FROM rsvps WHERE user_id = $1 AND status = 'attending'",
      [req.userId]
    );
    res.json(result.rows.map((r: any) => r.event_id));
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch RSVPs" });
  }
}

export async function getRecommendations(req: AuthRequest, res: Response) {
  try {
    const userResult = await pool.query("SELECT interests, major FROM users WHERE id=$1", [req.userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "User not found" });
    const { interests, major } = userResult.rows[0];
    const result = await pool.query(
      "SELECT e.*, u.full_name as organizer_name FROM events e LEFT JOIN users u ON e.organizer_id = u.id WHERE e.start_time > NOW() AND (e.tags && $1 OR e.event_type ILIKE $2) ORDER BY e.start_time ASC LIMIT 10",
      [interests || [], "%" + (major || "") + "%"]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: "Failed to get recommendations" });
  }
}
