
CREATE TABLE motorcycle_features_map (
  motorcycle_id uuid REFERENCES motorcycles(id) ON DELETE CASCADE,
  feature_id uuid REFERENCES features(id) ON DELETE CASCADE,
  PRIMARY KEY (motorcycle_id, feature_id)
);
