-- Backfill illustration images onto the seeded doctor demo posts that were
-- created before posts carried an imageUrl. Matched by their exact content
-- prefix so genuine user posts (which may intentionally have no image) are
-- never touched. Idempotent: only updates rows where imageUrl is empty.

UPDATE "Post" SET "imageUrl" = '/images/feed/diabetes.jpg'
  WHERE ("imageUrl" IS NULL OR "imageUrl" = '') AND "content" LIKE 'Understanding Diabetes%';

UPDATE "Post" SET "imageUrl" = '/images/feed/mental-health.jpg'
  WHERE ("imageUrl" IS NULL OR "imageUrl" = '') AND "content" LIKE 'The Importance of Mental Health%';

UPDATE "Post" SET "imageUrl" = '/images/feed/hypertension.jpg'
  WHERE ("imageUrl" IS NULL OR "imageUrl" = '') AND "content" LIKE 'Hypertension%';

UPDATE "Post" SET "imageUrl" = '/images/feed/telemedicine.jpg'
  WHERE ("imageUrl" IS NULL OR "imageUrl" = '') AND "content" LIKE 'New Advances in Telemedicine%';

UPDATE "Post" SET "imageUrl" = '/images/feed/vaccination.jpg'
  WHERE ("imageUrl" IS NULL OR "imageUrl" = '') AND "content" LIKE 'Childhood Vaccinations%';

UPDATE "Post" SET "imageUrl" = '/images/feed/allergies.jpg'
  WHERE ("imageUrl" IS NULL OR "imageUrl" = '') AND "content" LIKE 'Managing Seasonal Allergies%';

UPDATE "Post" SET "imageUrl" = '/images/feed/case-study.jpg'
  WHERE ("imageUrl" IS NULL OR "imageUrl" = '') AND "content" LIKE 'Case Study%';

UPDATE "Post" SET "imageUrl" = '/images/feed/nutrition.jpg'
  WHERE ("imageUrl" IS NULL OR "imageUrl" = '') AND "content" LIKE 'Nutrition Tips%';
