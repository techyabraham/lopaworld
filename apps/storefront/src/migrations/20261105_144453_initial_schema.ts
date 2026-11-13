import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  // Reviewed addition: Payload only creates its schema when it creates the whole database. In the
  // shared Medusa database the database already exists, so the "payload" schema must be created here.
  // down() intentionally leaves the schema in place.
  await db.execute(sql`CREATE SCHEMA IF NOT EXISTS "payload";`);
  await db.execute(sql`
   CREATE TYPE "payload"."enum_labels_slug" AS ENUM('next', 'trybe', 'prime', 'men', 'fashion', 'bridal', 'lopaworld');
  CREATE TYPE "payload"."enum_labels_accent_token" AS ENUM('next', 'trybe', 'prime', 'men', 'fashion', 'bridal', 'lopaworld');
  CREATE TYPE "payload"."enum_labels_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__labels_v_version_slug" AS ENUM('next', 'trybe', 'prime', 'men', 'fashion', 'bridal', 'lopaworld');
  CREATE TYPE "payload"."enum__labels_v_version_accent_token" AS ENUM('next', 'trybe', 'prime', 'men', 'fashion', 'bridal', 'lopaworld');
  CREATE TYPE "payload"."enum__labels_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_campaigns_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__campaigns_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_stories_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__stories_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_size_guides_measurement_basis" AS ENUM('body', 'garment');
  CREATE TYPE "payload"."enum_size_guides_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__size_guides_v_version_measurement_basis" AS ENUM('body', 'garment');
  CREATE TYPE "payload"."enum__size_guides_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_pages_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__pages_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_homepage_layout_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__homepage_layout_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_navigation_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__navigation_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_announcement_bar_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__announcement_bar_v_version_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum_seo_defaults_status" AS ENUM('draft', 'published');
  CREATE TYPE "payload"."enum__seo_defaults_v_version_status" AS ENUM('draft', 'published');
  CREATE TABLE "payload"."users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "payload"."users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"reset_password_requested_at" timestamp(3) with time zone,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"rights_confirmed" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric,
  	"focal_x" numeric,
  	"focal_y" numeric,
  	"sizes_thumbnail_url" varchar,
  	"sizes_thumbnail_width" numeric,
  	"sizes_thumbnail_height" numeric,
  	"sizes_thumbnail_mime_type" varchar,
  	"sizes_thumbnail_filesize" numeric,
  	"sizes_thumbnail_filename" varchar,
  	"sizes_card_url" varchar,
  	"sizes_card_width" numeric,
  	"sizes_card_height" numeric,
  	"sizes_card_mime_type" varchar,
  	"sizes_card_filesize" numeric,
  	"sizes_card_filename" varchar,
  	"sizes_hero_url" varchar,
  	"sizes_hero_width" numeric,
  	"sizes_hero_height" numeric,
  	"sizes_hero_mime_type" varchar,
  	"sizes_hero_filesize" numeric,
  	"sizes_hero_filename" varchar
  );
  
  CREATE TABLE "payload"."labels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"slug" "payload"."enum_labels_slug",
  	"intro_summary" varchar,
  	"intro" jsonb,
  	"accent_token" "payload"."enum_labels_accent_token",
  	"hero_media_id" integer,
  	"instagram_url" varchar,
  	"featured_collection_handle" varchar,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_share_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_labels_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_labels_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_name" varchar,
  	"version_slug" "payload"."enum__labels_v_version_slug",
  	"version_intro_summary" varchar,
  	"version_intro" jsonb,
  	"version_accent_token" "payload"."enum__labels_v_version_accent_token",
  	"version_hero_media_id" integer,
  	"version_instagram_url" varchar,
  	"version_featured_collection_handle" varchar,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_share_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__labels_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."campaigns" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"status" "payload"."enum_campaigns_status" DEFAULT 'draft',
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"campaign_line" varchar,
  	"body" jsonb,
  	"hero_media_id" integer,
  	"hero_alt" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_campaigns_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."campaigns_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"labels_id" integer
  );
  
  CREATE TABLE "payload"."_campaigns_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_status" "payload"."enum__campaigns_v_version_status" DEFAULT 'draft',
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version_campaign_line" varchar,
  	"version_body" jsonb,
  	"version_hero_media_id" integer,
  	"version_hero_alt" varchar,
  	"version_cta_label" varchar,
  	"version_cta_url" varchar,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__campaigns_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_campaigns_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"labels_id" integer
  );
  
  CREATE TABLE "payload"."stories" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"excerpt" varchar,
  	"hero_media_id" integer,
  	"hero_alt" varchar,
  	"content" jsonb,
  	"published_at" timestamp(3) with time zone,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_share_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_stories_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."stories_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"labels_id" integer
  );
  
  CREATE TABLE "payload"."_stories_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_excerpt" varchar,
  	"version_hero_media_id" integer,
  	"version_hero_alt" varchar,
  	"version_content" jsonb,
  	"version_published_at" timestamp(3) with time zone,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_share_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__stories_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_stories_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"labels_id" integer
  );
  
  CREATE TABLE "payload"."size_guides_measurements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"size" varchar,
  	"measurement" varchar,
  	"centimetres" numeric,
  	"inches" numeric,
  	"fit_note" varchar
  );
  
  CREATE TABLE "payload"."size_guides" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"category" varchar,
  	"label_id" integer,
  	"measurement_basis" "payload"."enum_size_guides_measurement_basis",
  	"how_to_measure" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_size_guides_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_size_guides_v_version_measurements" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"size" varchar,
  	"measurement" varchar,
  	"centimetres" numeric,
  	"inches" numeric,
  	"fit_note" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_size_guides_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_category" varchar,
  	"version_label_id" integer,
  	"version_measurement_basis" "payload"."enum__size_guides_v_version_measurement_basis",
  	"version_how_to_measure" jsonb,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__size_guides_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."pages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"title" varchar,
  	"slug" varchar,
  	"body" jsonb,
  	"seo_title" varchar,
  	"seo_description" varchar,
  	"seo_share_image_id" integer,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"_status" "payload"."enum_pages_status" DEFAULT 'draft'
  );
  
  CREATE TABLE "payload"."_pages_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"parent_id" integer,
  	"version_title" varchar,
  	"version_slug" varchar,
  	"version_body" jsonb,
  	"version_seo_title" varchar,
  	"version_seo_description" varchar,
  	"version_seo_share_image_id" integer,
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__pages_v_version_status" DEFAULT 'draft',
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"labels_id" integer,
  	"campaigns_id" integer,
  	"stories_id" integer,
  	"size_guides_id" integer,
  	"pages_id" integer
  );
  
  CREATE TABLE "payload"."payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload"."payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload"."homepage_layout_blocks_campaign_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"campaign_id" integer,
  	"headline" varchar,
  	"supporting_copy" varchar,
  	"image_id" integer,
  	"image_alt" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_layout_blocks_label_entrances" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_layout_blocks_featured_collection" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"medusa_collection_handle" varchar,
  	"label_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_layout_blocks_new_arrivals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_layout_blocks_story_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"story_id" integer,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_layout_blocks_occasion_links_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" varchar NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "payload"."homepage_layout_blocks_occasion_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_layout_blocks_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"consent_text" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."homepage_layout" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "payload"."enum_homepage_layout_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."homepage_layout_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"labels_id" integer
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_blocks_campaign_hero" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"campaign_id" integer,
  	"headline" varchar,
  	"supporting_copy" varchar,
  	"image_id" integer,
  	"image_alt" varchar,
  	"cta_label" varchar,
  	"cta_url" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_blocks_label_entrances" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_blocks_featured_collection" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"medusa_collection_handle" varchar,
  	"label_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_blocks_new_arrivals" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_blocks_story_feature" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"story_id" integer,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_blocks_occasion_links_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_blocks_occasion_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_blocks_newsletter" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"_path" text NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"heading" varchar,
  	"description" varchar,
  	"consent_text" varchar,
  	"_uuid" varchar,
  	"block_name" varchar
  );
  
  CREATE TABLE "payload"."_homepage_layout_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "payload"."enum__homepage_layout_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."_homepage_layout_v_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"labels_id" integer
  );
  
  CREATE TABLE "payload"."navigation_primary_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"label_reference_id" integer
  );
  
  CREATE TABLE "payload"."navigation_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar
  );
  
  CREATE TABLE "payload"."navigation" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"_status" "payload"."enum_navigation_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_navigation_v_version_primary_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"label_reference_id" integer,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_navigation_v_version_footer_links" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" serial PRIMARY KEY NOT NULL,
  	"label" varchar,
  	"url" varchar,
  	"_uuid" varchar
  );
  
  CREATE TABLE "payload"."_navigation_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version__status" "payload"."enum__navigation_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."announcement_bar" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT false,
  	"message" varchar,
  	"url" varchar,
  	"starts_at" timestamp(3) with time zone,
  	"ends_at" timestamp(3) with time zone,
  	"_status" "payload"."enum_announcement_bar_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_announcement_bar_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_enabled" boolean DEFAULT false,
  	"version_message" varchar,
  	"version_url" varchar,
  	"version_starts_at" timestamp(3) with time zone,
  	"version_ends_at" timestamp(3) with time zone,
  	"version__status" "payload"."enum__announcement_bar_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  CREATE TABLE "payload"."seo_defaults" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"site_title" varchar,
  	"default_description" varchar,
  	"default_share_image_id" integer,
  	"organization_name" varchar,
  	"_status" "payload"."enum_seo_defaults_status" DEFAULT 'draft',
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  CREATE TABLE "payload"."_seo_defaults_v" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"version_site_title" varchar,
  	"version_default_description" varchar,
  	"version_default_share_image_id" integer,
  	"version_organization_name" varchar,
  	"version__status" "payload"."enum__seo_defaults_v_version_status" DEFAULT 'draft',
  	"version_updated_at" timestamp(3) with time zone,
  	"version_created_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"latest" boolean
  );
  
  ALTER TABLE "payload"."users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."labels" ADD CONSTRAINT "labels_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."labels" ADD CONSTRAINT "labels_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_labels_v" ADD CONSTRAINT "_labels_v_parent_id_labels_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_labels_v" ADD CONSTRAINT "_labels_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_labels_v" ADD CONSTRAINT "_labels_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."campaigns" ADD CONSTRAINT "campaigns_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."campaigns_rels" ADD CONSTRAINT "campaigns_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."campaigns_rels" ADD CONSTRAINT "campaigns_rels_labels_fk" FOREIGN KEY ("labels_id") REFERENCES "payload"."labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_campaigns_v" ADD CONSTRAINT "_campaigns_v_parent_id_campaigns_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_campaigns_v" ADD CONSTRAINT "_campaigns_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_campaigns_v_rels" ADD CONSTRAINT "_campaigns_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_campaigns_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_campaigns_v_rels" ADD CONSTRAINT "_campaigns_v_rels_labels_fk" FOREIGN KEY ("labels_id") REFERENCES "payload"."labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories" ADD CONSTRAINT "stories_hero_media_id_media_id_fk" FOREIGN KEY ("hero_media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories" ADD CONSTRAINT "stories_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."stories_rels" ADD CONSTRAINT "stories_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."stories_rels" ADD CONSTRAINT "stories_rels_labels_fk" FOREIGN KEY ("labels_id") REFERENCES "payload"."labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_stories_v" ADD CONSTRAINT "_stories_v_parent_id_stories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."stories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_stories_v" ADD CONSTRAINT "_stories_v_version_hero_media_id_media_id_fk" FOREIGN KEY ("version_hero_media_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_stories_v" ADD CONSTRAINT "_stories_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_stories_v_rels" ADD CONSTRAINT "_stories_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_stories_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_stories_v_rels" ADD CONSTRAINT "_stories_v_rels_labels_fk" FOREIGN KEY ("labels_id") REFERENCES "payload"."labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."size_guides_measurements" ADD CONSTRAINT "size_guides_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."size_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."size_guides" ADD CONSTRAINT "size_guides_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "payload"."labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_size_guides_v_version_measurements" ADD CONSTRAINT "_size_guides_v_version_measurements_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_size_guides_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_size_guides_v" ADD CONSTRAINT "_size_guides_v_parent_id_size_guides_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."size_guides"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_size_guides_v" ADD CONSTRAINT "_size_guides_v_version_label_id_labels_id_fk" FOREIGN KEY ("version_label_id") REFERENCES "payload"."labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."pages" ADD CONSTRAINT "pages_seo_share_image_id_media_id_fk" FOREIGN KEY ("seo_share_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_parent_id_pages_id_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."pages"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_pages_v" ADD CONSTRAINT "_pages_v_version_seo_share_image_id_media_id_fk" FOREIGN KEY ("version_seo_share_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "payload"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_labels_fk" FOREIGN KEY ("labels_id") REFERENCES "payload"."labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_campaigns_fk" FOREIGN KEY ("campaigns_id") REFERENCES "payload"."campaigns"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_stories_fk" FOREIGN KEY ("stories_id") REFERENCES "payload"."stories"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_size_guides_fk" FOREIGN KEY ("size_guides_id") REFERENCES "payload"."size_guides"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_pages_fk" FOREIGN KEY ("pages_id") REFERENCES "payload"."pages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "payload"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_campaign_hero" ADD CONSTRAINT "homepage_layout_blocks_campaign_hero_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "payload"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_campaign_hero" ADD CONSTRAINT "homepage_layout_blocks_campaign_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_campaign_hero" ADD CONSTRAINT "homepage_layout_blocks_campaign_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_label_entrances" ADD CONSTRAINT "homepage_layout_blocks_label_entrances_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_featured_collection" ADD CONSTRAINT "homepage_layout_blocks_featured_collection_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "payload"."labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_featured_collection" ADD CONSTRAINT "homepage_layout_blocks_featured_collection_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_new_arrivals" ADD CONSTRAINT "homepage_layout_blocks_new_arrivals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_story_feature" ADD CONSTRAINT "homepage_layout_blocks_story_feature_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "payload"."stories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_story_feature" ADD CONSTRAINT "homepage_layout_blocks_story_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_occasion_links_links" ADD CONSTRAINT "homepage_layout_blocks_occasion_links_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_layout_blocks_occasion_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_occasion_links" ADD CONSTRAINT "homepage_layout_blocks_occasion_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_blocks_newsletter" ADD CONSTRAINT "homepage_layout_blocks_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."homepage_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_rels" ADD CONSTRAINT "homepage_layout_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."homepage_layout"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."homepage_layout_rels" ADD CONSTRAINT "homepage_layout_rels_labels_fk" FOREIGN KEY ("labels_id") REFERENCES "payload"."labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_campaign_hero" ADD CONSTRAINT "_homepage_layout_v_blocks_campaign_hero_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "payload"."campaigns"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_campaign_hero" ADD CONSTRAINT "_homepage_layout_v_blocks_campaign_hero_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_campaign_hero" ADD CONSTRAINT "_homepage_layout_v_blocks_campaign_hero_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_homepage_layout_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_label_entrances" ADD CONSTRAINT "_homepage_layout_v_blocks_label_entrances_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_homepage_layout_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_featured_collection" ADD CONSTRAINT "_homepage_layout_v_blocks_featured_collection_label_id_labels_id_fk" FOREIGN KEY ("label_id") REFERENCES "payload"."labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_featured_collection" ADD CONSTRAINT "_homepage_layout_v_blocks_featured_collection_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_homepage_layout_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_new_arrivals" ADD CONSTRAINT "_homepage_layout_v_blocks_new_arrivals_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_homepage_layout_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_story_feature" ADD CONSTRAINT "_homepage_layout_v_blocks_story_feature_story_id_stories_id_fk" FOREIGN KEY ("story_id") REFERENCES "payload"."stories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_story_feature" ADD CONSTRAINT "_homepage_layout_v_blocks_story_feature_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_homepage_layout_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_occasion_links_links" ADD CONSTRAINT "_homepage_layout_v_blocks_occasion_links_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_homepage_layout_v_blocks_occasion_links"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_occasion_links" ADD CONSTRAINT "_homepage_layout_v_blocks_occasion_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_homepage_layout_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_blocks_newsletter" ADD CONSTRAINT "_homepage_layout_v_blocks_newsletter_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_homepage_layout_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_rels" ADD CONSTRAINT "_homepage_layout_v_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "payload"."_homepage_layout_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_homepage_layout_v_rels" ADD CONSTRAINT "_homepage_layout_v_rels_labels_fk" FOREIGN KEY ("labels_id") REFERENCES "payload"."labels"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_primary_links" ADD CONSTRAINT "navigation_primary_links_label_reference_id_labels_id_fk" FOREIGN KEY ("label_reference_id") REFERENCES "payload"."labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."navigation_primary_links" ADD CONSTRAINT "navigation_primary_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."navigation_footer_links" ADD CONSTRAINT "navigation_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."navigation"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_navigation_v_version_primary_links" ADD CONSTRAINT "_navigation_v_version_primary_links_label_reference_id_labels_id_fk" FOREIGN KEY ("label_reference_id") REFERENCES "payload"."labels"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_navigation_v_version_primary_links" ADD CONSTRAINT "_navigation_v_version_primary_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."_navigation_v_version_footer_links" ADD CONSTRAINT "_navigation_v_version_footer_links_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "payload"."_navigation_v"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload"."seo_defaults" ADD CONSTRAINT "seo_defaults_default_share_image_id_media_id_fk" FOREIGN KEY ("default_share_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload"."_seo_defaults_v" ADD CONSTRAINT "_seo_defaults_v_version_default_share_image_id_media_id_fk" FOREIGN KEY ("version_default_share_image_id") REFERENCES "payload"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "payload"."users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "payload"."users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "payload"."users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "payload"."users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "payload"."users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "payload"."media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "payload"."media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "payload"."media" USING btree ("filename");
  CREATE INDEX "media_sizes_thumbnail_sizes_thumbnail_filename_idx" ON "payload"."media" USING btree ("sizes_thumbnail_filename");
  CREATE INDEX "media_sizes_card_sizes_card_filename_idx" ON "payload"."media" USING btree ("sizes_card_filename");
  CREATE INDEX "media_sizes_hero_sizes_hero_filename_idx" ON "payload"."media" USING btree ("sizes_hero_filename");
  CREATE UNIQUE INDEX "labels_slug_idx" ON "payload"."labels" USING btree ("slug");
  CREATE INDEX "labels_hero_media_idx" ON "payload"."labels" USING btree ("hero_media_id");
  CREATE INDEX "labels_seo_seo_share_image_idx" ON "payload"."labels" USING btree ("seo_share_image_id");
  CREATE INDEX "labels_updated_at_idx" ON "payload"."labels" USING btree ("updated_at");
  CREATE INDEX "labels_created_at_idx" ON "payload"."labels" USING btree ("created_at");
  CREATE INDEX "labels__status_idx" ON "payload"."labels" USING btree ("_status");
  CREATE INDEX "_labels_v_parent_idx" ON "payload"."_labels_v" USING btree ("parent_id");
  CREATE INDEX "_labels_v_version_version_slug_idx" ON "payload"."_labels_v" USING btree ("version_slug");
  CREATE INDEX "_labels_v_version_version_hero_media_idx" ON "payload"."_labels_v" USING btree ("version_hero_media_id");
  CREATE INDEX "_labels_v_version_seo_version_seo_share_image_idx" ON "payload"."_labels_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_labels_v_version_version_updated_at_idx" ON "payload"."_labels_v" USING btree ("version_updated_at");
  CREATE INDEX "_labels_v_version_version_created_at_idx" ON "payload"."_labels_v" USING btree ("version_created_at");
  CREATE INDEX "_labels_v_version_version__status_idx" ON "payload"."_labels_v" USING btree ("version__status");
  CREATE INDEX "_labels_v_created_at_idx" ON "payload"."_labels_v" USING btree ("created_at");
  CREATE INDEX "_labels_v_updated_at_idx" ON "payload"."_labels_v" USING btree ("updated_at");
  CREATE INDEX "_labels_v_latest_idx" ON "payload"."_labels_v" USING btree ("latest");
  CREATE UNIQUE INDEX "campaigns_slug_idx" ON "payload"."campaigns" USING btree ("slug");
  CREATE INDEX "campaigns_hero_media_idx" ON "payload"."campaigns" USING btree ("hero_media_id");
  CREATE INDEX "campaigns_updated_at_idx" ON "payload"."campaigns" USING btree ("updated_at");
  CREATE INDEX "campaigns_created_at_idx" ON "payload"."campaigns" USING btree ("created_at");
  CREATE INDEX "campaigns__status_idx" ON "payload"."campaigns" USING btree ("_status");
  CREATE INDEX "campaigns_rels_order_idx" ON "payload"."campaigns_rels" USING btree ("order");
  CREATE INDEX "campaigns_rels_parent_idx" ON "payload"."campaigns_rels" USING btree ("parent_id");
  CREATE INDEX "campaigns_rels_path_idx" ON "payload"."campaigns_rels" USING btree ("path");
  CREATE INDEX "campaigns_rels_labels_id_idx" ON "payload"."campaigns_rels" USING btree ("labels_id");
  CREATE INDEX "_campaigns_v_parent_idx" ON "payload"."_campaigns_v" USING btree ("parent_id");
  CREATE INDEX "_campaigns_v_version_version_slug_idx" ON "payload"."_campaigns_v" USING btree ("version_slug");
  CREATE INDEX "_campaigns_v_version_version_hero_media_idx" ON "payload"."_campaigns_v" USING btree ("version_hero_media_id");
  CREATE INDEX "_campaigns_v_version_version_updated_at_idx" ON "payload"."_campaigns_v" USING btree ("version_updated_at");
  CREATE INDEX "_campaigns_v_version_version_created_at_idx" ON "payload"."_campaigns_v" USING btree ("version_created_at");
  CREATE INDEX "_campaigns_v_version_version__status_idx" ON "payload"."_campaigns_v" USING btree ("version__status");
  CREATE INDEX "_campaigns_v_created_at_idx" ON "payload"."_campaigns_v" USING btree ("created_at");
  CREATE INDEX "_campaigns_v_updated_at_idx" ON "payload"."_campaigns_v" USING btree ("updated_at");
  CREATE INDEX "_campaigns_v_latest_idx" ON "payload"."_campaigns_v" USING btree ("latest");
  CREATE INDEX "_campaigns_v_rels_order_idx" ON "payload"."_campaigns_v_rels" USING btree ("order");
  CREATE INDEX "_campaigns_v_rels_parent_idx" ON "payload"."_campaigns_v_rels" USING btree ("parent_id");
  CREATE INDEX "_campaigns_v_rels_path_idx" ON "payload"."_campaigns_v_rels" USING btree ("path");
  CREATE INDEX "_campaigns_v_rels_labels_id_idx" ON "payload"."_campaigns_v_rels" USING btree ("labels_id");
  CREATE UNIQUE INDEX "stories_slug_idx" ON "payload"."stories" USING btree ("slug");
  CREATE INDEX "stories_hero_media_idx" ON "payload"."stories" USING btree ("hero_media_id");
  CREATE INDEX "stories_seo_seo_share_image_idx" ON "payload"."stories" USING btree ("seo_share_image_id");
  CREATE INDEX "stories_updated_at_idx" ON "payload"."stories" USING btree ("updated_at");
  CREATE INDEX "stories_created_at_idx" ON "payload"."stories" USING btree ("created_at");
  CREATE INDEX "stories__status_idx" ON "payload"."stories" USING btree ("_status");
  CREATE INDEX "stories_rels_order_idx" ON "payload"."stories_rels" USING btree ("order");
  CREATE INDEX "stories_rels_parent_idx" ON "payload"."stories_rels" USING btree ("parent_id");
  CREATE INDEX "stories_rels_path_idx" ON "payload"."stories_rels" USING btree ("path");
  CREATE INDEX "stories_rels_labels_id_idx" ON "payload"."stories_rels" USING btree ("labels_id");
  CREATE INDEX "_stories_v_parent_idx" ON "payload"."_stories_v" USING btree ("parent_id");
  CREATE INDEX "_stories_v_version_version_slug_idx" ON "payload"."_stories_v" USING btree ("version_slug");
  CREATE INDEX "_stories_v_version_version_hero_media_idx" ON "payload"."_stories_v" USING btree ("version_hero_media_id");
  CREATE INDEX "_stories_v_version_seo_version_seo_share_image_idx" ON "payload"."_stories_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_stories_v_version_version_updated_at_idx" ON "payload"."_stories_v" USING btree ("version_updated_at");
  CREATE INDEX "_stories_v_version_version_created_at_idx" ON "payload"."_stories_v" USING btree ("version_created_at");
  CREATE INDEX "_stories_v_version_version__status_idx" ON "payload"."_stories_v" USING btree ("version__status");
  CREATE INDEX "_stories_v_created_at_idx" ON "payload"."_stories_v" USING btree ("created_at");
  CREATE INDEX "_stories_v_updated_at_idx" ON "payload"."_stories_v" USING btree ("updated_at");
  CREATE INDEX "_stories_v_latest_idx" ON "payload"."_stories_v" USING btree ("latest");
  CREATE INDEX "_stories_v_rels_order_idx" ON "payload"."_stories_v_rels" USING btree ("order");
  CREATE INDEX "_stories_v_rels_parent_idx" ON "payload"."_stories_v_rels" USING btree ("parent_id");
  CREATE INDEX "_stories_v_rels_path_idx" ON "payload"."_stories_v_rels" USING btree ("path");
  CREATE INDEX "_stories_v_rels_labels_id_idx" ON "payload"."_stories_v_rels" USING btree ("labels_id");
  CREATE INDEX "size_guides_measurements_order_idx" ON "payload"."size_guides_measurements" USING btree ("_order");
  CREATE INDEX "size_guides_measurements_parent_id_idx" ON "payload"."size_guides_measurements" USING btree ("_parent_id");
  CREATE INDEX "size_guides_category_idx" ON "payload"."size_guides" USING btree ("category");
  CREATE INDEX "size_guides_label_idx" ON "payload"."size_guides" USING btree ("label_id");
  CREATE INDEX "size_guides_updated_at_idx" ON "payload"."size_guides" USING btree ("updated_at");
  CREATE INDEX "size_guides_created_at_idx" ON "payload"."size_guides" USING btree ("created_at");
  CREATE INDEX "size_guides__status_idx" ON "payload"."size_guides" USING btree ("_status");
  CREATE INDEX "_size_guides_v_version_measurements_order_idx" ON "payload"."_size_guides_v_version_measurements" USING btree ("_order");
  CREATE INDEX "_size_guides_v_version_measurements_parent_id_idx" ON "payload"."_size_guides_v_version_measurements" USING btree ("_parent_id");
  CREATE INDEX "_size_guides_v_parent_idx" ON "payload"."_size_guides_v" USING btree ("parent_id");
  CREATE INDEX "_size_guides_v_version_version_category_idx" ON "payload"."_size_guides_v" USING btree ("version_category");
  CREATE INDEX "_size_guides_v_version_version_label_idx" ON "payload"."_size_guides_v" USING btree ("version_label_id");
  CREATE INDEX "_size_guides_v_version_version_updated_at_idx" ON "payload"."_size_guides_v" USING btree ("version_updated_at");
  CREATE INDEX "_size_guides_v_version_version_created_at_idx" ON "payload"."_size_guides_v" USING btree ("version_created_at");
  CREATE INDEX "_size_guides_v_version_version__status_idx" ON "payload"."_size_guides_v" USING btree ("version__status");
  CREATE INDEX "_size_guides_v_created_at_idx" ON "payload"."_size_guides_v" USING btree ("created_at");
  CREATE INDEX "_size_guides_v_updated_at_idx" ON "payload"."_size_guides_v" USING btree ("updated_at");
  CREATE INDEX "_size_guides_v_latest_idx" ON "payload"."_size_guides_v" USING btree ("latest");
  CREATE UNIQUE INDEX "pages_slug_idx" ON "payload"."pages" USING btree ("slug");
  CREATE INDEX "pages_seo_seo_share_image_idx" ON "payload"."pages" USING btree ("seo_share_image_id");
  CREATE INDEX "pages_updated_at_idx" ON "payload"."pages" USING btree ("updated_at");
  CREATE INDEX "pages_created_at_idx" ON "payload"."pages" USING btree ("created_at");
  CREATE INDEX "pages__status_idx" ON "payload"."pages" USING btree ("_status");
  CREATE INDEX "_pages_v_parent_idx" ON "payload"."_pages_v" USING btree ("parent_id");
  CREATE INDEX "_pages_v_version_version_slug_idx" ON "payload"."_pages_v" USING btree ("version_slug");
  CREATE INDEX "_pages_v_version_seo_version_seo_share_image_idx" ON "payload"."_pages_v" USING btree ("version_seo_share_image_id");
  CREATE INDEX "_pages_v_version_version_updated_at_idx" ON "payload"."_pages_v" USING btree ("version_updated_at");
  CREATE INDEX "_pages_v_version_version_created_at_idx" ON "payload"."_pages_v" USING btree ("version_created_at");
  CREATE INDEX "_pages_v_version_version__status_idx" ON "payload"."_pages_v" USING btree ("version__status");
  CREATE INDEX "_pages_v_created_at_idx" ON "payload"."_pages_v" USING btree ("created_at");
  CREATE INDEX "_pages_v_updated_at_idx" ON "payload"."_pages_v" USING btree ("updated_at");
  CREATE INDEX "_pages_v_latest_idx" ON "payload"."_pages_v" USING btree ("latest");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload"."payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload"."payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload"."payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload"."payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload"."payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload"."payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload"."payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_labels_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("labels_id");
  CREATE INDEX "payload_locked_documents_rels_campaigns_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("campaigns_id");
  CREATE INDEX "payload_locked_documents_rels_stories_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("stories_id");
  CREATE INDEX "payload_locked_documents_rels_size_guides_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("size_guides_id");
  CREATE INDEX "payload_locked_documents_rels_pages_id_idx" ON "payload"."payload_locked_documents_rels" USING btree ("pages_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload"."payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload"."payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload"."payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload"."payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload"."payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload"."payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload"."payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload"."payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload"."payload_migrations" USING btree ("created_at");
  CREATE INDEX "homepage_layout_blocks_campaign_hero_order_idx" ON "payload"."homepage_layout_blocks_campaign_hero" USING btree ("_order");
  CREATE INDEX "homepage_layout_blocks_campaign_hero_parent_id_idx" ON "payload"."homepage_layout_blocks_campaign_hero" USING btree ("_parent_id");
  CREATE INDEX "homepage_layout_blocks_campaign_hero_path_idx" ON "payload"."homepage_layout_blocks_campaign_hero" USING btree ("_path");
  CREATE INDEX "homepage_layout_blocks_campaign_hero_campaign_idx" ON "payload"."homepage_layout_blocks_campaign_hero" USING btree ("campaign_id");
  CREATE INDEX "homepage_layout_blocks_campaign_hero_image_idx" ON "payload"."homepage_layout_blocks_campaign_hero" USING btree ("image_id");
  CREATE INDEX "homepage_layout_blocks_label_entrances_order_idx" ON "payload"."homepage_layout_blocks_label_entrances" USING btree ("_order");
  CREATE INDEX "homepage_layout_blocks_label_entrances_parent_id_idx" ON "payload"."homepage_layout_blocks_label_entrances" USING btree ("_parent_id");
  CREATE INDEX "homepage_layout_blocks_label_entrances_path_idx" ON "payload"."homepage_layout_blocks_label_entrances" USING btree ("_path");
  CREATE INDEX "homepage_layout_blocks_featured_collection_order_idx" ON "payload"."homepage_layout_blocks_featured_collection" USING btree ("_order");
  CREATE INDEX "homepage_layout_blocks_featured_collection_parent_id_idx" ON "payload"."homepage_layout_blocks_featured_collection" USING btree ("_parent_id");
  CREATE INDEX "homepage_layout_blocks_featured_collection_path_idx" ON "payload"."homepage_layout_blocks_featured_collection" USING btree ("_path");
  CREATE INDEX "homepage_layout_blocks_featured_collection_label_idx" ON "payload"."homepage_layout_blocks_featured_collection" USING btree ("label_id");
  CREATE INDEX "homepage_layout_blocks_new_arrivals_order_idx" ON "payload"."homepage_layout_blocks_new_arrivals" USING btree ("_order");
  CREATE INDEX "homepage_layout_blocks_new_arrivals_parent_id_idx" ON "payload"."homepage_layout_blocks_new_arrivals" USING btree ("_parent_id");
  CREATE INDEX "homepage_layout_blocks_new_arrivals_path_idx" ON "payload"."homepage_layout_blocks_new_arrivals" USING btree ("_path");
  CREATE INDEX "homepage_layout_blocks_story_feature_order_idx" ON "payload"."homepage_layout_blocks_story_feature" USING btree ("_order");
  CREATE INDEX "homepage_layout_blocks_story_feature_parent_id_idx" ON "payload"."homepage_layout_blocks_story_feature" USING btree ("_parent_id");
  CREATE INDEX "homepage_layout_blocks_story_feature_path_idx" ON "payload"."homepage_layout_blocks_story_feature" USING btree ("_path");
  CREATE INDEX "homepage_layout_blocks_story_feature_story_idx" ON "payload"."homepage_layout_blocks_story_feature" USING btree ("story_id");
  CREATE INDEX "homepage_layout_blocks_occasion_links_links_order_idx" ON "payload"."homepage_layout_blocks_occasion_links_links" USING btree ("_order");
  CREATE INDEX "homepage_layout_blocks_occasion_links_links_parent_id_idx" ON "payload"."homepage_layout_blocks_occasion_links_links" USING btree ("_parent_id");
  CREATE INDEX "homepage_layout_blocks_occasion_links_order_idx" ON "payload"."homepage_layout_blocks_occasion_links" USING btree ("_order");
  CREATE INDEX "homepage_layout_blocks_occasion_links_parent_id_idx" ON "payload"."homepage_layout_blocks_occasion_links" USING btree ("_parent_id");
  CREATE INDEX "homepage_layout_blocks_occasion_links_path_idx" ON "payload"."homepage_layout_blocks_occasion_links" USING btree ("_path");
  CREATE INDEX "homepage_layout_blocks_newsletter_order_idx" ON "payload"."homepage_layout_blocks_newsletter" USING btree ("_order");
  CREATE INDEX "homepage_layout_blocks_newsletter_parent_id_idx" ON "payload"."homepage_layout_blocks_newsletter" USING btree ("_parent_id");
  CREATE INDEX "homepage_layout_blocks_newsletter_path_idx" ON "payload"."homepage_layout_blocks_newsletter" USING btree ("_path");
  CREATE INDEX "homepage_layout__status_idx" ON "payload"."homepage_layout" USING btree ("_status");
  CREATE INDEX "homepage_layout_rels_order_idx" ON "payload"."homepage_layout_rels" USING btree ("order");
  CREATE INDEX "homepage_layout_rels_parent_idx" ON "payload"."homepage_layout_rels" USING btree ("parent_id");
  CREATE INDEX "homepage_layout_rels_path_idx" ON "payload"."homepage_layout_rels" USING btree ("path");
  CREATE INDEX "homepage_layout_rels_labels_id_idx" ON "payload"."homepage_layout_rels" USING btree ("labels_id");
  CREATE INDEX "_homepage_layout_v_blocks_campaign_hero_order_idx" ON "payload"."_homepage_layout_v_blocks_campaign_hero" USING btree ("_order");
  CREATE INDEX "_homepage_layout_v_blocks_campaign_hero_parent_id_idx" ON "payload"."_homepage_layout_v_blocks_campaign_hero" USING btree ("_parent_id");
  CREATE INDEX "_homepage_layout_v_blocks_campaign_hero_path_idx" ON "payload"."_homepage_layout_v_blocks_campaign_hero" USING btree ("_path");
  CREATE INDEX "_homepage_layout_v_blocks_campaign_hero_campaign_idx" ON "payload"."_homepage_layout_v_blocks_campaign_hero" USING btree ("campaign_id");
  CREATE INDEX "_homepage_layout_v_blocks_campaign_hero_image_idx" ON "payload"."_homepage_layout_v_blocks_campaign_hero" USING btree ("image_id");
  CREATE INDEX "_homepage_layout_v_blocks_label_entrances_order_idx" ON "payload"."_homepage_layout_v_blocks_label_entrances" USING btree ("_order");
  CREATE INDEX "_homepage_layout_v_blocks_label_entrances_parent_id_idx" ON "payload"."_homepage_layout_v_blocks_label_entrances" USING btree ("_parent_id");
  CREATE INDEX "_homepage_layout_v_blocks_label_entrances_path_idx" ON "payload"."_homepage_layout_v_blocks_label_entrances" USING btree ("_path");
  CREATE INDEX "_homepage_layout_v_blocks_featured_collection_order_idx" ON "payload"."_homepage_layout_v_blocks_featured_collection" USING btree ("_order");
  CREATE INDEX "_homepage_layout_v_blocks_featured_collection_parent_id_idx" ON "payload"."_homepage_layout_v_blocks_featured_collection" USING btree ("_parent_id");
  CREATE INDEX "_homepage_layout_v_blocks_featured_collection_path_idx" ON "payload"."_homepage_layout_v_blocks_featured_collection" USING btree ("_path");
  CREATE INDEX "_homepage_layout_v_blocks_featured_collection_label_idx" ON "payload"."_homepage_layout_v_blocks_featured_collection" USING btree ("label_id");
  CREATE INDEX "_homepage_layout_v_blocks_new_arrivals_order_idx" ON "payload"."_homepage_layout_v_blocks_new_arrivals" USING btree ("_order");
  CREATE INDEX "_homepage_layout_v_blocks_new_arrivals_parent_id_idx" ON "payload"."_homepage_layout_v_blocks_new_arrivals" USING btree ("_parent_id");
  CREATE INDEX "_homepage_layout_v_blocks_new_arrivals_path_idx" ON "payload"."_homepage_layout_v_blocks_new_arrivals" USING btree ("_path");
  CREATE INDEX "_homepage_layout_v_blocks_story_feature_order_idx" ON "payload"."_homepage_layout_v_blocks_story_feature" USING btree ("_order");
  CREATE INDEX "_homepage_layout_v_blocks_story_feature_parent_id_idx" ON "payload"."_homepage_layout_v_blocks_story_feature" USING btree ("_parent_id");
  CREATE INDEX "_homepage_layout_v_blocks_story_feature_path_idx" ON "payload"."_homepage_layout_v_blocks_story_feature" USING btree ("_path");
  CREATE INDEX "_homepage_layout_v_blocks_story_feature_story_idx" ON "payload"."_homepage_layout_v_blocks_story_feature" USING btree ("story_id");
  CREATE INDEX "_homepage_layout_v_blocks_occasion_links_links_order_idx" ON "payload"."_homepage_layout_v_blocks_occasion_links_links" USING btree ("_order");
  CREATE INDEX "_homepage_layout_v_blocks_occasion_links_links_parent_id_idx" ON "payload"."_homepage_layout_v_blocks_occasion_links_links" USING btree ("_parent_id");
  CREATE INDEX "_homepage_layout_v_blocks_occasion_links_order_idx" ON "payload"."_homepage_layout_v_blocks_occasion_links" USING btree ("_order");
  CREATE INDEX "_homepage_layout_v_blocks_occasion_links_parent_id_idx" ON "payload"."_homepage_layout_v_blocks_occasion_links" USING btree ("_parent_id");
  CREATE INDEX "_homepage_layout_v_blocks_occasion_links_path_idx" ON "payload"."_homepage_layout_v_blocks_occasion_links" USING btree ("_path");
  CREATE INDEX "_homepage_layout_v_blocks_newsletter_order_idx" ON "payload"."_homepage_layout_v_blocks_newsletter" USING btree ("_order");
  CREATE INDEX "_homepage_layout_v_blocks_newsletter_parent_id_idx" ON "payload"."_homepage_layout_v_blocks_newsletter" USING btree ("_parent_id");
  CREATE INDEX "_homepage_layout_v_blocks_newsletter_path_idx" ON "payload"."_homepage_layout_v_blocks_newsletter" USING btree ("_path");
  CREATE INDEX "_homepage_layout_v_version_version__status_idx" ON "payload"."_homepage_layout_v" USING btree ("version__status");
  CREATE INDEX "_homepage_layout_v_created_at_idx" ON "payload"."_homepage_layout_v" USING btree ("created_at");
  CREATE INDEX "_homepage_layout_v_updated_at_idx" ON "payload"."_homepage_layout_v" USING btree ("updated_at");
  CREATE INDEX "_homepage_layout_v_latest_idx" ON "payload"."_homepage_layout_v" USING btree ("latest");
  CREATE INDEX "_homepage_layout_v_rels_order_idx" ON "payload"."_homepage_layout_v_rels" USING btree ("order");
  CREATE INDEX "_homepage_layout_v_rels_parent_idx" ON "payload"."_homepage_layout_v_rels" USING btree ("parent_id");
  CREATE INDEX "_homepage_layout_v_rels_path_idx" ON "payload"."_homepage_layout_v_rels" USING btree ("path");
  CREATE INDEX "_homepage_layout_v_rels_labels_id_idx" ON "payload"."_homepage_layout_v_rels" USING btree ("labels_id");
  CREATE INDEX "navigation_primary_links_order_idx" ON "payload"."navigation_primary_links" USING btree ("_order");
  CREATE INDEX "navigation_primary_links_parent_id_idx" ON "payload"."navigation_primary_links" USING btree ("_parent_id");
  CREATE INDEX "navigation_primary_links_label_reference_idx" ON "payload"."navigation_primary_links" USING btree ("label_reference_id");
  CREATE INDEX "navigation_footer_links_order_idx" ON "payload"."navigation_footer_links" USING btree ("_order");
  CREATE INDEX "navigation_footer_links_parent_id_idx" ON "payload"."navigation_footer_links" USING btree ("_parent_id");
  CREATE INDEX "navigation__status_idx" ON "payload"."navigation" USING btree ("_status");
  CREATE INDEX "_navigation_v_version_primary_links_order_idx" ON "payload"."_navigation_v_version_primary_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_primary_links_parent_id_idx" ON "payload"."_navigation_v_version_primary_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_primary_links_label_reference_idx" ON "payload"."_navigation_v_version_primary_links" USING btree ("label_reference_id");
  CREATE INDEX "_navigation_v_version_footer_links_order_idx" ON "payload"."_navigation_v_version_footer_links" USING btree ("_order");
  CREATE INDEX "_navigation_v_version_footer_links_parent_id_idx" ON "payload"."_navigation_v_version_footer_links" USING btree ("_parent_id");
  CREATE INDEX "_navigation_v_version_version__status_idx" ON "payload"."_navigation_v" USING btree ("version__status");
  CREATE INDEX "_navigation_v_created_at_idx" ON "payload"."_navigation_v" USING btree ("created_at");
  CREATE INDEX "_navigation_v_updated_at_idx" ON "payload"."_navigation_v" USING btree ("updated_at");
  CREATE INDEX "_navigation_v_latest_idx" ON "payload"."_navigation_v" USING btree ("latest");
  CREATE INDEX "announcement_bar__status_idx" ON "payload"."announcement_bar" USING btree ("_status");
  CREATE INDEX "_announcement_bar_v_version_version__status_idx" ON "payload"."_announcement_bar_v" USING btree ("version__status");
  CREATE INDEX "_announcement_bar_v_created_at_idx" ON "payload"."_announcement_bar_v" USING btree ("created_at");
  CREATE INDEX "_announcement_bar_v_updated_at_idx" ON "payload"."_announcement_bar_v" USING btree ("updated_at");
  CREATE INDEX "_announcement_bar_v_latest_idx" ON "payload"."_announcement_bar_v" USING btree ("latest");
  CREATE INDEX "seo_defaults_default_share_image_idx" ON "payload"."seo_defaults" USING btree ("default_share_image_id");
  CREATE INDEX "seo_defaults__status_idx" ON "payload"."seo_defaults" USING btree ("_status");
  CREATE INDEX "_seo_defaults_v_version_version_default_share_image_idx" ON "payload"."_seo_defaults_v" USING btree ("version_default_share_image_id");
  CREATE INDEX "_seo_defaults_v_version_version__status_idx" ON "payload"."_seo_defaults_v" USING btree ("version__status");
  CREATE INDEX "_seo_defaults_v_created_at_idx" ON "payload"."_seo_defaults_v" USING btree ("created_at");
  CREATE INDEX "_seo_defaults_v_updated_at_idx" ON "payload"."_seo_defaults_v" USING btree ("updated_at");
  CREATE INDEX "_seo_defaults_v_latest_idx" ON "payload"."_seo_defaults_v" USING btree ("latest");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "payload"."users_sessions" CASCADE;
  DROP TABLE "payload"."users" CASCADE;
  DROP TABLE "payload"."media" CASCADE;
  DROP TABLE "payload"."labels" CASCADE;
  DROP TABLE "payload"."_labels_v" CASCADE;
  DROP TABLE "payload"."campaigns" CASCADE;
  DROP TABLE "payload"."campaigns_rels" CASCADE;
  DROP TABLE "payload"."_campaigns_v" CASCADE;
  DROP TABLE "payload"."_campaigns_v_rels" CASCADE;
  DROP TABLE "payload"."stories" CASCADE;
  DROP TABLE "payload"."stories_rels" CASCADE;
  DROP TABLE "payload"."_stories_v" CASCADE;
  DROP TABLE "payload"."_stories_v_rels" CASCADE;
  DROP TABLE "payload"."size_guides_measurements" CASCADE;
  DROP TABLE "payload"."size_guides" CASCADE;
  DROP TABLE "payload"."_size_guides_v_version_measurements" CASCADE;
  DROP TABLE "payload"."_size_guides_v" CASCADE;
  DROP TABLE "payload"."pages" CASCADE;
  DROP TABLE "payload"."_pages_v" CASCADE;
  DROP TABLE "payload"."payload_kv" CASCADE;
  DROP TABLE "payload"."payload_locked_documents" CASCADE;
  DROP TABLE "payload"."payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload"."payload_preferences" CASCADE;
  DROP TABLE "payload"."payload_preferences_rels" CASCADE;
  DROP TABLE "payload"."payload_migrations" CASCADE;
  DROP TABLE "payload"."homepage_layout_blocks_campaign_hero" CASCADE;
  DROP TABLE "payload"."homepage_layout_blocks_label_entrances" CASCADE;
  DROP TABLE "payload"."homepage_layout_blocks_featured_collection" CASCADE;
  DROP TABLE "payload"."homepage_layout_blocks_new_arrivals" CASCADE;
  DROP TABLE "payload"."homepage_layout_blocks_story_feature" CASCADE;
  DROP TABLE "payload"."homepage_layout_blocks_occasion_links_links" CASCADE;
  DROP TABLE "payload"."homepage_layout_blocks_occasion_links" CASCADE;
  DROP TABLE "payload"."homepage_layout_blocks_newsletter" CASCADE;
  DROP TABLE "payload"."homepage_layout" CASCADE;
  DROP TABLE "payload"."homepage_layout_rels" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_blocks_campaign_hero" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_blocks_label_entrances" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_blocks_featured_collection" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_blocks_new_arrivals" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_blocks_story_feature" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_blocks_occasion_links_links" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_blocks_occasion_links" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_blocks_newsletter" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v" CASCADE;
  DROP TABLE "payload"."_homepage_layout_v_rels" CASCADE;
  DROP TABLE "payload"."navigation_primary_links" CASCADE;
  DROP TABLE "payload"."navigation_footer_links" CASCADE;
  DROP TABLE "payload"."navigation" CASCADE;
  DROP TABLE "payload"."_navigation_v_version_primary_links" CASCADE;
  DROP TABLE "payload"."_navigation_v_version_footer_links" CASCADE;
  DROP TABLE "payload"."_navigation_v" CASCADE;
  DROP TABLE "payload"."announcement_bar" CASCADE;
  DROP TABLE "payload"."_announcement_bar_v" CASCADE;
  DROP TABLE "payload"."seo_defaults" CASCADE;
  DROP TABLE "payload"."_seo_defaults_v" CASCADE;
  DROP TYPE "payload"."enum_labels_slug";
  DROP TYPE "payload"."enum_labels_accent_token";
  DROP TYPE "payload"."enum_labels_status";
  DROP TYPE "payload"."enum__labels_v_version_slug";
  DROP TYPE "payload"."enum__labels_v_version_accent_token";
  DROP TYPE "payload"."enum__labels_v_version_status";
  DROP TYPE "payload"."enum_campaigns_status";
  DROP TYPE "payload"."enum__campaigns_v_version_status";
  DROP TYPE "payload"."enum_stories_status";
  DROP TYPE "payload"."enum__stories_v_version_status";
  DROP TYPE "payload"."enum_size_guides_measurement_basis";
  DROP TYPE "payload"."enum_size_guides_status";
  DROP TYPE "payload"."enum__size_guides_v_version_measurement_basis";
  DROP TYPE "payload"."enum__size_guides_v_version_status";
  DROP TYPE "payload"."enum_pages_status";
  DROP TYPE "payload"."enum__pages_v_version_status";
  DROP TYPE "payload"."enum_homepage_layout_status";
  DROP TYPE "payload"."enum__homepage_layout_v_version_status";
  DROP TYPE "payload"."enum_navigation_status";
  DROP TYPE "payload"."enum__navigation_v_version_status";
  DROP TYPE "payload"."enum_announcement_bar_status";
  DROP TYPE "payload"."enum__announcement_bar_v_version_status";
  DROP TYPE "payload"."enum_seo_defaults_status";
  DROP TYPE "payload"."enum__seo_defaults_v_version_status";`)
}
