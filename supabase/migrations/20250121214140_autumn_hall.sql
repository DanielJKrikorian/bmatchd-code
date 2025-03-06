/*
  # Add vendor website and social media links

  1. Changes
    - Add website and social media columns to vendors table
      - website_url (text)
      - facebook_url (text)
      - instagram_url (text)
      - tiktok_url (text)
      - youtube_url (text)
*/

ALTER TABLE vendors
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS facebook_url text,
ADD COLUMN IF NOT EXISTS instagram_url text,
ADD COLUMN IF NOT EXISTS tiktok_url text,
ADD COLUMN IF NOT EXISTS youtube_url text;