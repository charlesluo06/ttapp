-- The first admin. Everyone else is added through the app by an officer or admin.
INSERT INTO "members" ("email") VALUES ('charlesluo06@gmail.com') ON CONFLICT ("email") DO NOTHING;
--> statement-breakpoint
INSERT INTO "member_roles" ("member_id", "role_id")
SELECT m."id", r."id"
FROM "members" m, "roles" r
WHERE m."email" = 'charlesluo06@gmail.com' AND r."name" = 'admin'
ON CONFLICT ON CONSTRAINT "member_roles_once" DO NOTHING;
