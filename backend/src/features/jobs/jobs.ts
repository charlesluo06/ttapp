import { db } from "../../common/db/client.ts";
import { roles } from "../../common/db/schema.ts";
import { deleteExpiredSessions } from "../../common/sessions.ts";

// Each scheduled job is one entry: its name and the function that does the work.
// The run endpoint loops over this object, so a new job only needs a new entry here.
export const jobs = {
  // A real query against a real table, so Supabase sees activity and doesn't pause the project.
  keepAlive: async () => {
    await db.select().from(roles).limit(1);
  },
  // Returns how many expired sessions were deleted.
  deleteExpiredSessions: async () => {
    return await deleteExpiredSessions();
  },
};
