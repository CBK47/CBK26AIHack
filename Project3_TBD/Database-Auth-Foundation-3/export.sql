-- Just Juggle database export
-- Generated: 2026-03-07T00:37:43.768Z

BEGIN;

-- users (8 rows)
DELETE FROM "users";
INSERT INTO "users" ("id", "username", "email", "password", "xp", "level", "current_streak", "preferred_theme", "created_at", "coins", "display_name", "preferred_style", "skill_level", "notifications_enabled", "reminder_time", "reminder_message") VALUES ('fdd3e180-44ba-40a7-bb7d-af52ee851db4', 'juggler_rVbs8270dLZd-', 'juggler_rVbs8270dLZd-@test.com', 'testpass123', 0, 1, 0, 'dark', '2026-03-06T21:41:03.992Z', 0, NULL, NULL, NULL, TRUE, NULL, NULL);
INSERT INTO "users" ("id", "username", "email", "password", "xp", "level", "current_streak", "preferred_theme", "created_at", "coins", "display_name", "preferred_style", "skill_level", "notifications_enabled", "reminder_time", "reminder_message") VALUES ('63858b23-4787-416a-8280-e7854137f651', 'tester_1772834925417', 'tester_1772834925417@test.com', 'testpass123', 175, 2, 1, 'dark', '2026-03-06T22:09:06.617Z', 17, NULL, NULL, NULL, TRUE, NULL, NULL);
INSERT INTO "users" ("id", "username", "email", "password", "xp", "level", "current_streak", "preferred_theme", "created_at", "coins", "display_name", "preferred_style", "skill_level", "notifications_enabled", "reminder_time", "reminder_message") VALUES ('8e876372-4690-4d2d-ae73-4635f39adaf0', 'gamer_1772835749610', 'gamer_1772835749610@test.com', 'testpass123', 0, 1, 0, 'Blue', '2026-03-06T22:22:45.151Z', 0, 'Test Juggler', '', '', TRUE, NULL, NULL);
INSERT INTO "users" ("id", "username", "email", "password", "xp", "level", "current_streak", "preferred_theme", "created_at", "coins", "display_name", "preferred_style", "skill_level", "notifications_enabled", "reminder_time", "reminder_message") VALUES ('ebda74ad-05f9-4353-b4c0-dffff0bcead9', 'testforum_1772836962644', 'testforum_1772836962644@example.com', 'test123', 0, 1, 0, 'dark', '2026-03-06T22:43:09.741Z', 0, NULL, NULL, NULL, TRUE, NULL, NULL);
INSERT INTO "users" ("id", "username", "email", "password", "xp", "level", "current_streak", "preferred_theme", "created_at", "coins", "display_name", "preferred_style", "skill_level", "notifications_enabled", "reminder_time", "reminder_message") VALUES ('be16aefd-210f-4fc0-8549-feb8db28c989', 'testshop_1772837568130', 'testshop_1772837568130@example.com', 'test123', 0, 1, 0, 'dark', '2026-03-06T22:53:17.171Z', 0, NULL, NULL, NULL, TRUE, NULL, NULL);
INSERT INTO "users" ("id", "username", "email", "password", "xp", "level", "current_streak", "preferred_theme", "created_at", "coins", "display_name", "preferred_style", "skill_level", "notifications_enabled", "reminder_time", "reminder_message") VALUES ('17350841-698f-4059-aab2-24d182a44f5b', 'Juggler123', 'code.anonymynx@gmail.com', 'Juggler1', 605, 7, 1, 'Purple', '2026-03-06T21:48:15.416Z', 60, NULL, NULL, NULL, TRUE, NULL, NULL);
INSERT INTO "users" ("id", "username", "email", "password", "xp", "level", "current_streak", "preferred_theme", "created_at", "coins", "display_name", "preferred_style", "skill_level", "notifications_enabled", "reminder_time", "reminder_message") VALUES ('cb1ca3a5-8402-4ae6-816c-9bac77b007a8', 'gtest_1772839654078', 'gtest_1772839654078@test.com', 'TestPass123', 0, 1, 0, 'dark', '2026-03-06T23:27:34.118Z', 0, NULL, NULL, NULL, TRUE, NULL, NULL);
INSERT INTO "users" ("id", "username", "email", "password", "xp", "level", "current_streak", "preferred_theme", "created_at", "coins", "display_name", "preferred_style", "skill_level", "notifications_enabled", "reminder_time", "reminder_message") VALUES ('68553d2c-0367-44a2-9a31-f8ce090da982', 'kevin', 'kevin@example.com', 'password', 0, 1, 0, 'dark', '2026-03-06T23:43:19.837Z', 0, NULL, NULL, NULL, TRUE, NULL, NULL);

-- tricks (41 rows)
DELETE FROM "tricks";
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (31, 'Cascade', 'The basic 3-ball pattern where balls cross in a figure-eight.', '3', 1, 3, 'balls', NULL, 'Focus on a consistent peak height at eye level.', NULL, FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (32, 'Reverse Cascade', 'Similar to Cascade, but balls are thrown over the top from the outside.', '3', 2, 3, 'balls', NULL, 'Think "outside-in" for your throws.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (33, 'Columns', 'Two balls thrown together on the outside, one in the middle.', '3', 2, 3, 'balls', NULL, 'Keep the middle ball perfectly vertical.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (34, 'Tennis', 'One ball (the tennis ball) passes back and forth over a cascade.', '3', 2, 3, 'balls', NULL, 'Follow the tennis ball with your eyes slightly.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (35, 'Over the Top', 'A single ball is thrown over the rest of the cascade.', '3', 2, 3, 'balls', NULL, 'Make the "over" throw a bit higher than the rest.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (36, 'Juggle to the Edge', 'Wide throws that push the boundaries of your reach.', '3', 2, 3, 'balls', NULL, 'Great for training recovery from bad throws.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (37, 'Two in One Hand', 'Juggling two balls in just the right or left hand.', '4', 2, 2, 'balls', NULL, 'Throw in a circular motion (inside-out).', NULL, FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (38, 'Half-Shower', 'One hand throws high arcs, the other throws lower arcs.', '3', 2, 3, 'balls', NULL, 'The hands follow two different circular paths.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (39, 'Windmill', 'All throws cross in one direction, mimicking a rotating blade.', '3', 3, 3, 'balls', NULL, 'Keep your arms crossed and fluid.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (40, 'The Claw', 'Catching the balls from above with a downward snatching motion.', '3', 3, 3, 'balls', NULL, 'Snap your wrist down quickly.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (41, 'Mills Mess', 'A famous cross-armed pattern that looks like a tangled mess.', '3', 3, 3, 'balls', NULL, 'Focus on the "scooping" motion of the hands.', '31,32', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (42, 'The Box', 'A synchronous pattern where balls form a square shape.', '(4,2x)(2x,4)', 4, 3, 'balls', NULL, 'The horizontal "zip" pass must be very fast.', '33', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (43, '4-Ball Fountain', 'The standard 4-ball pattern where hands juggle independently.', '4', 3, 4, 'balls', NULL, 'Practice 2-in-1-hand until solid first.', '37', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (44, 'Fake Columns', 'A 2-ball trick that looks like 3 balls using a "fake" hand movement.', '3', 3, 2, 'balls', NULL, 'Move your empty hand as if it has a ball.', '33', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (45, 'Shower', 'Balls follow a circular path: high arc from one hand, fast pass from the other.', '51', 3, 3, 'balls', NULL, 'The "1" pass (the zip) is the most important part.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (46, 'Burkes Barrage', 'An advanced version of the Mills Mess with extra arm movement.', '3', 3, 3, 'balls', NULL, 'Lead with your elbow on the crossing throw.', '41', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (47, '441', 'A fast 3-ball pattern with two high throws and one fast pass.', '441', 3, 3, 'balls', NULL, 'The "1" happens right after the second "4".', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (48, '531', 'A rhythmic trick with a high, medium, and low throw.', '531', 3, 3, 'balls', NULL, 'The "5" is the peak, the "1" is the floor.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (49, 'The Machine', 'A mechanical looking trick where one ball is carried by the hand.', '3', 3, 3, 'balls', NULL, 'Keep the carried ball moving in a straight vertical line.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (50, 'Robot', 'Similar to the machine but with jerky, robotic movements.', '3', 3, 3, 'balls', NULL, 'Exaggerate the stops and starts.', '49', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (51, '5-Ball Cascade', 'The ultimate milestone for most jugglers.', '5', 4, 5, 'balls', NULL, 'Lower your 3-ball height to speed up your hands.', '31,37', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (52, 'Rubensteins Revenge', 'A complex flourish-filled pattern with many arm crosses.', '3', 4, 3, 'balls', NULL, 'Master Mills Mess perfectly before trying this.', '41', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (53, '4-Ball Half-Shower', '4 balls in a circular path but with staggered heights.', '53', 4, 4, 'balls', NULL, 'Requires very high accuracy.', '43', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (54, '744', 'A 5-ball siteswap done with only 3 balls and two "holes".', '744', 4, 5, 'balls', NULL, 'The "7" is a very high throw.', '51', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (55, 'Boston Mess', 'A version of Mills Mess where the balls stay in columns.', '3', 4, 3, 'balls', NULL, 'Keep the hand swaps fast and tight.', '41', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (56, 'Inverted Box', 'The box pattern but with the vertical throws crossing over.', '3', 4, 3, 'balls', NULL, 'Extremely difficult hand-eye coordination.', '42', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (57, 'Backcrosses (3B)', 'Throwing every ball behind your back.', '3', 4, 3, 'balls', NULL, 'Aim for your opposite shoulder.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (58, 'Under the Leg', 'Throwing a ball under your leg while maintaining the pattern.', '3', 4, 3, 'balls', NULL, 'Lift your knee high and lean slightly.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (59, 'Neck Catch', 'Catching a high throw on the back of your neck.', '3', 4, 3, 'balls', NULL, 'Lean forward and create a "pocket" with your shoulders.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (60, 'Penguin Catches', 'Catching with your palms facing outward.', '3', 4, 3, 'balls', NULL, 'Requires flexible wrists.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (61, '6-Ball Fountain', 'Independent 3-ball fountains in each hand.', '6', 5, 6, 'balls', NULL, 'Sync the beats to keep it stable.', '43', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (62, '7-Ball Cascade', 'The gold standard for professional numbers jugglers.', '7', 5, 7, 'balls', NULL, 'Requires immense physical endurance.', '51', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (63, '97531', 'A 5-ball tower where all balls land in order.', '97531', 5, 5, 'balls', NULL, 'The "9" must be thrown very high and straight.', '51', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (64, '5551', 'A 4-ball pattern with three high throws and one zip.', '5551', 5, 4, 'balls', NULL, 'The "1" pass is very fast.', '43', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (65, '55550', '4 balls in a 5-ball rhythm with one empty spot.', '55550', 4, 4, 'balls', NULL, 'Great for practicing 5-ball timing.', '43', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (66, 'The Library', 'A complex 3-ball pattern involving many carry movements.', '3', 5, 3, 'balls', NULL, 'Named after the Library of Juggling.', '41,46', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (67, 'Chops', 'Fast, downward movements that "chop" the ball out of the air.', '3', 4, 3, 'balls', NULL, 'Use your whole arm for the chopping motion.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (68, 'Pirouette', 'Throwing all balls up and spinning 360 degrees.', '3', 5, 3, 'balls', NULL, 'Spot a point on the wall to stay balanced.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (69, 'Blind Catches', 'Catching balls behind your head without looking.', '3', 5, 3, 'balls', NULL, 'Trust your muscle memory for the throw.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (70, 'Foot Catch', 'Stalling a ball on your foot and kicking it back up.', '3', 4, 3, 'balls', NULL, 'Keep your foot flat like a platform.', '31', FALSE);
INSERT INTO "tricks" ("id", "name", "description", "siteswap", "difficulty", "objects_count", "prop_type", "video_url", "tip", "prerequisites", "is_custom") VALUES (71, 'Test Custom Trick', 'A test trick for the custom contribution feature', '423', 3, 3, 'balls', NULL, 'Practice with scarves first', NULL, TRUE);
SELECT setval(pg_get_serial_sequence('"tricks"', 'id'), COALESCE((SELECT MAX("id") FROM "tricks"), 1));

-- sessions (5 rows)
DELETE FROM "sessions";
INSERT INTO "sessions" ("id", "user_id", "duration_minutes", "energy_level", "focus_point", "total_drops", "mood_rating", "notes", "created_at") VALUES (1, '17350841-698f-4059-aab2-24d182a44f5b', 2, 'Moderate', 'Variety & Flow', 11, 'Good', '', '2026-03-06T21:48:40.518Z');
INSERT INTO "sessions" ("id", "user_id", "duration_minutes", "energy_level", "focus_point", "total_drops", "mood_rating", "notes", "created_at") VALUES (2, '17350841-698f-4059-aab2-24d182a44f5b', 1, 'Moderate', 'Endurance Building', 17, 'Great', '', '2026-03-06T22:07:24.727Z');
INSERT INTO "sessions" ("id", "user_id", "duration_minutes", "energy_level", "focus_point", "total_drops", "mood_rating", "notes", "created_at") VALUES (3, '63858b23-4787-416a-8280-e7854137f651', 1, 'Moderate', 'Variety & Flow', 0, 'Great', '', '2026-03-06T22:09:52.278Z');
INSERT INTO "sessions" ("id", "user_id", "duration_minutes", "energy_level", "focus_point", "total_drops", "mood_rating", "notes", "created_at") VALUES (4, 'be16aefd-210f-4fc0-8549-feb8db28c989', 20, 'Moderate', 'Variety & Flow', 0, NULL, NULL, '2026-03-06T22:54:08.488Z');
INSERT INTO "sessions" ("id", "user_id", "duration_minutes", "energy_level", "focus_point", "total_drops", "mood_rating", "notes", "created_at") VALUES (5, '17350841-698f-4059-aab2-24d182a44f5b', 1, 'Just want to chill', 'Endurance Building', 8, 'Great', '', '2026-03-06T22:56:27.675Z');
SELECT setval(pg_get_serial_sequence('"sessions"', 'id'), COALESCE((SELECT MAX("id") FROM "sessions"), 1));

-- Table "session_tricks" is empty.

-- Table "user_tricks" is empty.

-- achievements (13 rows)
DELETE FROM "achievements";
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (1, '17350841-698f-4059-aab2-24d182a44f5b', 'First Steps', '2026-03-06T22:07:59.183Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (2, '17350841-698f-4059-aab2-24d182a44f5b', 'Century Club', '2026-03-06T22:07:59.186Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (3, '17350841-698f-4059-aab2-24d182a44f5b', 'Variety Show', '2026-03-06T22:07:59.190Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (4, '17350841-698f-4059-aab2-24d182a44f5b', 'Night Owl', '2026-03-06T22:07:59.193Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (5, '63858b23-4787-416a-8280-e7854137f651', 'First Steps', '2026-03-06T22:10:15.695Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (6, '63858b23-4787-416a-8280-e7854137f651', 'Century Club', '2026-03-06T22:10:15.698Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (7, '63858b23-4787-416a-8280-e7854137f651', 'Perfect Run', '2026-03-06T22:10:15.702Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (8, '63858b23-4787-416a-8280-e7854137f651', 'Variety Show', '2026-03-06T22:10:15.704Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (9, '63858b23-4787-416a-8280-e7854137f651', 'Night Owl', '2026-03-06T22:10:15.707Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (10, '17350841-698f-4059-aab2-24d182a44f5b', 'Mastered: Cascade', '2026-03-06T22:57:16.976Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (11, '17350841-698f-4059-aab2-24d182a44f5b', 'Catch Machine', '2026-03-06T22:57:17.019Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (12, '17350841-698f-4059-aab2-24d182a44f5b', 'The Master', '2026-03-06T22:57:17.021Z');
INSERT INTO "achievements" ("id", "user_id", "badge_name", "unlocked_at") VALUES (13, '17350841-698f-4059-aab2-24d182a44f5b', 'Rising Star', '2026-03-06T22:57:17.025Z');
SELECT setval(pg_get_serial_sequence('"achievements"', 'id'), COALESCE((SELECT MAX("id") FROM "achievements"), 1));

-- game_results (1 rows)
DELETE FROM "game_results";
INSERT INTO "game_results" ("id", "user_id", "game_type", "score", "time_seconds", "drops", "metadata", "created_at") VALUES (1, '8e876372-4690-4d2d-ae73-4635f39adaf0', 'cascade_count', 98, 12, 2, '{"target":100}', '2026-03-06T22:23:36.694Z');
SELECT setval(pg_get_serial_sequence('"game_results"', 'id'), COALESCE((SELECT MAX("id") FROM "game_results"), 1));

-- training_goals (1 rows)
DELETE FROM "training_goals";
INSERT INTO "training_goals" ("id", "user_id", "title", "description", "target_date", "is_completed", "created_at") VALUES (1, '8e876372-4690-4d2d-ae73-4635f39adaf0', 'Learn 4-ball cascade', NULL, NULL, FALSE, '2026-03-06T22:24:26.274Z');
SELECT setval(pg_get_serial_sequence('"training_goals"', 'id'), COALESCE((SELECT MAX("id") FROM "training_goals"), 1));

-- shop_items (4 rows)
DELETE FROM "shop_items";
INSERT INTO "shop_items" ("id", "name", "type", "description", "price", "requirement", "data") VALUES (1, 'Midnight Purple', 'theme', 'A deep, rich purple theme for night-time practice sessions.', 50, NULL, '{"hue":280}');
INSERT INTO "shop_items" ("id", "name", "type", "description", "price", "requirement", "data") VALUES (2, 'Electric Lime', 'theme', 'A bold, energizing lime green theme to power up your juggling.', 50, NULL, '{"hue":80}');
INSERT INTO "shop_items" ("id", "name", "type", "description", "price", "requirement", "data") VALUES (3, 'Pro Metronome', 'feature', 'An adjustable BPM metronome with audio beats to perfect your rhythm and timing.', 100, NULL, NULL);
INSERT INTO "shop_items" ("id", "name", "type", "description", "price", "requirement", "data") VALUES (4, 'Mills Mess', 'trick', 'A legendary advanced pattern where arms cross and uncross while balls weave in a complex figure-eight motion.', 200, 'Level 5', '{"siteswap":"3","difficulty":4,"objectsCount":3,"propType":"balls","tip":"Focus on the arm crossing pattern first without balls.","prereqNames":["Reverse Cascade","The Claw"]}');
SELECT setval(pg_get_serial_sequence('"shop_items"', 'id'), COALESCE((SELECT MAX("id") FROM "shop_items"), 1));

-- Table "user_purchases" is empty.

-- Table "friendships" is empty.

-- Table "challenges" is empty.

-- forum_posts (2 rows)
DELETE FROM "forum_posts";
INSERT INTO "forum_posts" ("id", "user_id", "title", "content", "category", "created_at") VALUES (1, 'ebda74ad-05f9-4353-b4c0-dffff0bcead9', 'Test Forum Post', 'This is a test post content', 'general', '2026-03-06T22:44:01.849Z');
INSERT INTO "forum_posts" ("id", "user_id", "title", "content", "category", "created_at") VALUES (3, '17350841-698f-4059-aab2-24d182a44f5b', 'Shower request', 'Any advice?', 'questions', '2026-03-06T23:00:35.169Z');
SELECT setval(pg_get_serial_sequence('"forum_posts"', 'id'), COALESCE((SELECT MAX("id") FROM "forum_posts"), 1));

-- forum_comments (1 rows)
DELETE FROM "forum_comments";
INSERT INTO "forum_comments" ("id", "post_id", "user_id", "content", "created_at") VALUES (1, 1, 'ebda74ad-05f9-4353-b4c0-dffff0bcead9', 'Great test comment!', '2026-03-06T22:44:16.402Z');
SELECT setval(pg_get_serial_sequence('"forum_comments"', 'id'), COALESCE((SELECT MAX("id") FROM "forum_comments"), 1));

COMMIT;
