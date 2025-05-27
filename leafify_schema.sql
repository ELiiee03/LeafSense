-- =====================================================
-- Leafify Plant Identification Database Schema
-- =====================================================
-- This schema supports the Leafify mobile application for plant identification
-- and leaf analysis using SQLite database structure.
-- 
-- Created based on the existing Ionic Vue.js application structure
-- and data models used throughout the codebase.
-- =====================================================

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =====================================================
-- SCHEMA VERSION MANAGEMENT
-- =====================================================
CREATE TABLE IF NOT EXISTS schema_version (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    version INTEGER NOT NULL DEFAULT 1,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize schema version
INSERT OR IGNORE INTO schema_version (id, version) VALUES (1, 1);

-- =====================================================
-- USER MANAGEMENT (for multi-user support)
-- =====================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,  -- UUID from Supabase auth
    email TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- INFERENCE RESULTS (Main plant identification data)
-- =====================================================
CREATE TABLE IF NOT EXISTS inference_results (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,  -- References users.id, nullable for anonymous usage
    image_path TEXT NOT NULL,  -- Path to the analyzed leaf image
    result TEXT NOT NULL,      -- Common/predicted plant name
    scientific_name TEXT NOT NULL,
    family_name TEXT NOT NULL,
    description TEXT NOT NULL,
    habitat TEXT NOT NULL,
    growth_habits TEXT,        -- Tree, shrub, herb, etc.
    confidence REAL,          -- AI confidence score (0.0-1.0)
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    synced INTEGER DEFAULT 0, -- 0 = not synced, 1 = synced to cloud
    sync_origin TEXT DEFAULT 'local', -- 'local', 'offline', 'cloud'
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- UNSYNCED INFERENCES (Local-only storage for offline mode)
-- =====================================================
CREATE TABLE IF NOT EXISTS unsynced_inferences (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    image_path TEXT NOT NULL,
    predicted_class TEXT NOT NULL,
    scientific_name TEXT NOT NULL,
    family_name TEXT NOT NULL,
    description TEXT NOT NULL,
    habitat TEXT NOT NULL,
    color TEXT,
    growth_habits TEXT,
    confidence REAL,
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    synced BOOLEAN DEFAULT 0,
    sync_origin TEXT DEFAULT 'offline',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- =====================================================
-- PLANT DETAILS (Comprehensive botanical information)
-- =====================================================
CREATE TABLE IF NOT EXISTS plant_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inference_result_id INTEGER NOT NULL,
    
    -- Basic identification
    aliases TEXT,              -- JSON array of common names
    color TEXT,               -- Overall color description
    
    -- Physical characteristics
    foliage TEXT,             -- Foliage description
    bark TEXT,                -- Bark characteristics
    fruit TEXT,               -- Fruit description
    flowers TEXT,             -- Flower characteristics
    crown TEXT,               -- Crown/canopy shape
    trunk TEXT,               -- Trunk characteristics
    leaves TEXT,              -- Leaf shape and structure
    
    -- Leaf-specific characteristics
    retention TEXT,           -- Evergreen, deciduous, etc.
    texture TEXT,             -- Leaf texture (leathery, thin, etc.)
    venation TEXT,            -- Foliar venation pattern
    behavior TEXT,            -- Unique leaf behaviors
    
    -- Ethnobotanical uses
    edible_uses TEXT,         -- Edible applications
    med_uses TEXT,            -- Medicinal uses
    timber_uses TEXT,         -- Timber and wood uses
    other_uses TEXT,          -- Other commercial/cultural uses
    
    -- Ecological requirements
    climate TEXT,             -- Climate preferences
    lifespan TEXT,            -- Annual, perennial, etc.
    light_needs TEXT,         -- Light requirements
    water_needs TEXT,         -- Water requirements
    soil_req TEXT,            -- Soil requirements
    
    -- Metadata
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inference_result_id) REFERENCES inference_results(id) ON DELETE CASCADE
);

-- =====================================================
-- OFFLINE PLANT DETAILS (For offline mode support)
-- =====================================================
CREATE TABLE IF NOT EXISTS offline_plant_details (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inference_result_id INTEGER NOT NULL,
    
    -- Same structure as plant_details but references unsynced_inferences
    aliases TEXT,
    color TEXT,
    foliage TEXT,
    bark TEXT,
    fruit TEXT,
    crown TEXT,
    trunk TEXT,
    leaves TEXT,
    retention TEXT,
    texture TEXT,
    venation TEXT,
    behavior TEXT,
    edible_uses TEXT,
    med_uses TEXT,
    timber_uses TEXT,
    other_uses TEXT,
    climate TEXT,
    lifespan TEXT,
    light_needs TEXT,
    water_needs TEXT,
    soil_req TEXT,
    
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inference_result_id) REFERENCES unsynced_inferences(id) ON DELETE CASCADE
);

-- =====================================================
-- SAVED LEAVES (User bookmarks/favorites)
-- =====================================================
CREATE TABLE IF NOT EXISTS saved_leaves (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    image_path TEXT NOT NULL,
    leaf_info TEXT NOT NULL,   -- JSON data structure
    notes TEXT,                -- User notes
    timestamp INTEGER NOT NULL DEFAULT (strftime('%s', 'now')),
    synced INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- =====================================================
-- GEOLOCATION DATA (Location where plants were found)
-- =====================================================
CREATE TABLE IF NOT EXISTS plant_locations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    inference_result_id INTEGER,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    address TEXT,
    title TEXT,
    note TEXT,
    is_pinned BOOLEAN DEFAULT 0,
    accuracy REAL,             -- GPS accuracy in meters
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (inference_result_id) REFERENCES inference_results(id) ON DELETE CASCADE
);

-- =====================================================
-- APP SETTINGS AND PREFERENCES
-- =====================================================
CREATE TABLE IF NOT EXISTS app_settings (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    auto_sync BOOLEAN DEFAULT 1,
    offline_mode BOOLEAN DEFAULT 0,
    max_cache_size INTEGER DEFAULT 100,  -- Maximum cached images
    confidence_threshold REAL DEFAULT 0.5,
    gps_enabled BOOLEAN DEFAULT 1,
    settings_json TEXT,        -- Additional settings as JSON
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize default settings
INSERT OR IGNORE INTO app_settings (id) VALUES (1);

-- =====================================================
-- SYNC TRACKING (Track synchronization status)
-- =====================================================
CREATE TABLE IF NOT EXISTS sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sync_type TEXT NOT NULL,   -- 'inference', 'plant_details', 'full'
    records_synced INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    sync_status TEXT DEFAULT 'pending', -- 'pending', 'success', 'failed'
    error_message TEXT,
    started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME,
    duration_ms INTEGER
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- Inference results indexes
CREATE INDEX IF NOT EXISTS idx_inference_results_user_id ON inference_results(user_id);
CREATE INDEX IF NOT EXISTS idx_inference_results_timestamp ON inference_results(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_inference_results_synced ON inference_results(synced);
CREATE INDEX IF NOT EXISTS idx_inference_results_scientific_name ON inference_results(scientific_name);
CREATE INDEX IF NOT EXISTS idx_inference_results_family_name ON inference_results(family_name);

-- Unsynced inferences indexes
CREATE INDEX IF NOT EXISTS idx_unsynced_inferences_timestamp ON unsynced_inferences(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_unsynced_inferences_synced ON unsynced_inferences(synced);

-- Plant details indexes
CREATE INDEX IF NOT EXISTS idx_plant_details_inference_id ON plant_details(inference_result_id);
CREATE INDEX IF NOT EXISTS idx_offline_plant_details_inference_id ON offline_plant_details(inference_result_id);

-- Saved leaves indexes
CREATE INDEX IF NOT EXISTS idx_saved_leaves_user_id ON saved_leaves(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_leaves_timestamp ON saved_leaves(timestamp DESC);

-- Location indexes
CREATE INDEX IF NOT EXISTS idx_plant_locations_inference_id ON plant_locations(inference_result_id);
CREATE INDEX IF NOT EXISTS idx_plant_locations_coords ON plant_locations(lat, lng);

-- Sync log indexes
CREATE INDEX IF NOT EXISTS idx_sync_log_started_at ON sync_log(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(sync_status);

-- =====================================================
-- SAMPLE DATA (Based on the application's data.json)
-- =====================================================

-- Sample user (for testing)
INSERT OR IGNORE INTO users (id, email, display_name) VALUES 
('sample-user-123', 'user@example.com', 'Sample User');

-- Sample plant data (Jackfruit - from data.json)
INSERT OR IGNORE INTO inference_results (
    id, user_id, image_path, result, scientific_name, family_name, 
    description, habitat, growth_habits, confidence, timestamp
) VALUES (
    1,
    'sample-user-123',
    'images/jackfruit.jpg',
    'Jackfruit',
    'Artocarpus heterophyllus',
    'Moraceae',
    'Artocarpus heterophyllus, also known as Jackfruit, is a tree which can reach up to 30 m tall. It produces a large composite fruit which is covered with conical warts. The aril is juicy and sweet-tasting. The seeds can be eaten after roasting or boiling.',
    'Tropical Asia',
    'tree',
    0.95,
    strftime('%s', 'now')
);

-- Detailed plant information for Jackfruit
INSERT OR IGNORE INTO plant_details (
    inference_result_id, aliases, color, foliage, bark, fruit, crown, trunk, leaves,
    retention, texture, venation, behavior, edible_uses, med_uses, timber_uses, other_uses,
    climate, lifespan, light_needs, water_needs, soil_req
) VALUES (
    1,
    '["Jackfruit", "Nangka", "Jack", "Jak", "Jake Tree"]',
    'Green foliage, dark grey to greyish brown bark',
    'Thin-leathery and obovate-elliptic to elliptic leaves, smooth on surface and rough on undersides',
    'Rough or scaly, dark grey to greyish brown in colour',
    'Large composite fruit covered with conical warts, juicy and sweet-tasting aril',
    'Dense and spreading',
    'Straight with rough bark',
    'Obovate-elliptic to elliptic',
    'Evergreen',
    'Leathery, Thin',
    'Pinnate',
    'Leaves show variation in shape on the same plant',
    'Young fruit cooked as vegetable; ripe fruit eaten fresh or made into delicacies; seeds edible after boiling/roasting or ground into flour',
    'Pulp and seeds as cooling tonic; latex treats abscesses and snakebites; root treats skin diseases and asthma; extract for fever and diarrhea; leaves for wounds',
    'Superior hardwood resistant to termites and decay; used for furniture, construction, musical instruments; takes polish well',
    'Wood particles yield yellow dye for silk and cotton',
    'Tropical',
    'Perennial',
    'Full Sun',
    'Moderate Water',
    'Deep, well-drained, alluvial and sandy or loamy soils, pH 6.0-7.5'
);

-- Sample plant data (Paper Mulberry - from data.json)
INSERT OR IGNORE INTO inference_results (
    id, user_id, image_path, result, scientific_name, family_name, 
    description, habitat, growth_habits, confidence, timestamp
) VALUES (
    2,
    'sample-user-123',
    'images/paper_mulberry.jpg',
    'Paper Mulberry',
    'Broussonetia papyrifera',
    'Moraceae',
    'A deciduous tree or shrub native to eastern Asia that can grow up to 15m tall. Named for its bark which has been used traditionally to make paper.',
    'Native to eastern Asia, including Japan, China, Korea, and Taiwan. Naturalized in many parts of the world.',
    'tree',
    0.87,
    strftime('%s', 'now')
);

-- Detailed plant information for Paper Mulberry
INSERT OR IGNORE INTO plant_details (
    inference_result_id, aliases, color, foliage, bark, fruit, leaves,
    retention, texture, climate, lifespan, light_needs, water_needs
) VALUES (
    2,
    '["Paper Mulberry", "Mulberry Paper Tree"]',
    'Green to dark green foliage, grayish-brown bark, greenish flowers, orange-red fruit',
    'Large, rough-textured leaves with varying shapes - heart-shaped, oval, or deeply lobed',
    'Grayish-brown, fibrous bark with excellent papermaking qualities',
    'Orange-red, spherical, composite fruits',
    'Palmate, lobed',
    'Deciduous',
    'Rough-textured',
    'Temperate to subtropical',
    'Perennial',
    'Full Sun to Partial Shade',
    'Moderate Water'
);

-- Sample location data
INSERT OR IGNORE INTO plant_locations (
    inference_result_id, lat, lng, address, title, note, is_pinned
) VALUES (
    1, 14.5995, 120.9842, 'Metro Manila, Philippines', 'Jackfruit Location', 'Found in urban garden', 1
);

-- =====================================================
-- UTILITY VIEWS (For easier data access)
-- =====================================================

-- Complete plant information view
CREATE VIEW IF NOT EXISTS v_complete_plant_info AS
SELECT 
    ir.id,
    ir.user_id,
    ir.result as plant_name,
    ir.scientific_name,
    ir.family_name,
    ir.description,
    ir.habitat,
    ir.growth_habits,
    ir.confidence,
    ir.image_path,
    ir.timestamp,
    ir.synced,
    ir.created_at,
    
    -- Plant details
    pd.aliases,
    pd.color,
    pd.foliage,
    pd.bark,
    pd.fruit,
    pd.flowers,
    pd.crown,
    pd.trunk,
    pd.leaves,
    pd.retention,
    pd.texture,
    pd.venation,
    pd.behavior,
    pd.edible_uses,
    pd.med_uses,
    pd.timber_uses,
    pd.other_uses,
    pd.climate,
    pd.lifespan,
    pd.light_needs,
    pd.water_needs,
    pd.soil_req,
    
    -- Location info
    pl.lat,
    pl.lng,
    pl.address,
    pl.is_pinned as location_pinned
    
FROM inference_results ir
LEFT JOIN plant_details pd ON ir.id = pd.inference_result_id
LEFT JOIN plant_locations pl ON ir.id = pl.inference_result_id;

-- Recent identifications view (last 30 days)
CREATE VIEW IF NOT EXISTS v_recent_identifications AS
SELECT *
FROM v_complete_plant_info
WHERE datetime(created_at) >= datetime('now', '-30 days')
ORDER BY created_at DESC;

-- Unsynced data summary view
CREATE VIEW IF NOT EXISTS v_unsynced_summary AS
SELECT 
    'inference_results' as table_name,
    COUNT(*) as unsynced_count
FROM inference_results 
WHERE synced = 0
UNION ALL
SELECT 
    'unsynced_inferences' as table_name,
    COUNT(*) as unsynced_count
FROM unsynced_inferences 
WHERE synced = 0
UNION ALL
SELECT 
    'saved_leaves' as table_name,
    COUNT(*) as unsynced_count
FROM saved_leaves 
WHERE synced = 0;

-- =====================================================
-- TRIGGERS (For automatic timestamp updates)
-- =====================================================

-- Update timestamp on inference_results changes
CREATE TRIGGER IF NOT EXISTS tr_inference_results_updated_at
    AFTER UPDATE ON inference_results
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL
BEGIN
    UPDATE inference_results 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Update timestamp on plant_details changes
CREATE TRIGGER IF NOT EXISTS tr_plant_details_updated_at
    AFTER UPDATE ON plant_details
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL
BEGIN
    UPDATE plant_details 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- Update timestamp on saved_leaves changes
CREATE TRIGGER IF NOT EXISTS tr_saved_leaves_updated_at
    AFTER UPDATE ON saved_leaves
    FOR EACH ROW
    WHEN OLD.updated_at = NEW.updated_at OR OLD.updated_at IS NULL
BEGIN
    UPDATE saved_leaves 
    SET updated_at = CURRENT_TIMESTAMP 
    WHERE id = NEW.id;
END;

-- =====================================================
-- CLEANUP PROCEDURES (Housekeeping functions)
-- =====================================================

-- Note: SQLite doesn't support stored procedures, but these are example queries
-- that can be used in the application for maintenance tasks:

/*
-- Clean up old synced data (older than 90 days)
DELETE FROM inference_results 
WHERE synced = 1 
AND datetime(created_at) < datetime('now', '-90 days');

-- Clean up orphaned plant details
DELETE FROM plant_details 
WHERE inference_result_id NOT IN (
    SELECT id FROM inference_results
);

-- Clean up old sync logs (keep last 100 entries)
DELETE FROM sync_log 
WHERE id NOT IN (
    SELECT id FROM sync_log 
    ORDER BY started_at DESC 
    LIMIT 100
);

-- Vacuum database to reclaim space
VACUUM;

-- Analyze tables for query optimization
ANALYZE;
*/

-- =====================================================
-- DATABASE INTEGRITY CHECKS
-- =====================================================

-- Verify foreign key constraints
PRAGMA foreign_key_check;

-- Check database integrity
PRAGMA integrity_check;

-- =====================================================
-- SCHEMA INFORMATION QUERIES
-- =====================================================

/*
-- List all tables
SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;

-- Show table structure
PRAGMA table_info(inference_results);
PRAGMA table_info(plant_details);

-- Show indexes
SELECT name, tbl_name, sql FROM sqlite_master WHERE type='index';

-- Show foreign keys
PRAGMA foreign_key_list(plant_details);
PRAGMA foreign_key_list(offline_plant_details);
*/

-- =====================================================
-- END OF SCHEMA
-- =====================================================

-- Update schema version
UPDATE schema_version SET version = 1, updated_at = CURRENT_TIMESTAMP WHERE id = 1;

-- Success message
SELECT 'Leafify database schema created successfully!' as message,
       'Version: 1.0' as version,
       datetime('now') as created_at;
