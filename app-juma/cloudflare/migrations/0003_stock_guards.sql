CREATE TRIGGER products_stock_nonnegative
BEFORE UPDATE OF stock ON products
WHEN NEW.stock < 0
BEGIN
 SELECT RAISE(ABORT,'insufficient_product_stock');
END;

CREATE TRIGGER product_sizes_stock_nonnegative
BEFORE UPDATE OF stock ON product_sizes
WHEN NEW.stock < 0
BEGIN
 SELECT RAISE(ABORT,'insufficient_size_stock');
END;

CREATE TRIGGER order_item_size_exists
BEFORE INSERT ON order_items
WHEN NEW.size IS NOT NULL AND NOT EXISTS(
 SELECT 1 FROM product_sizes WHERE product_id=NEW.product_id AND size=NEW.size
)
BEGIN
 SELECT RAISE(ABORT,'invalid_product_size');
END;
