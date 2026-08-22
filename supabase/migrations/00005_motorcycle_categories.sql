
CREATE TABLE motorcycle_categories (
  motorcycle_id uuid REFERENCES motorcycles(id) ON DELETE CASCADE,
  category_id uuid REFERENCES categories(id) ON DELETE CASCADE,
  PRIMARY KEY (motorcycle_id, category_id)
);
