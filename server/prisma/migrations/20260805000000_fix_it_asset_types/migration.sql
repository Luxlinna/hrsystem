-- Seed data picked each asset's name and type independently at random,
-- so devices ended up mislabeled (e.g. a "MacBook Pro 14"" shown as
-- type "Display", an "iPhone 13" shown as type "Laptop"). Backfill the
-- correct type for every existing row based on its name.

update it_assets set type = 'Laptop' where name in ('Dell Latitude 5440', 'MacBook Pro 14"', 'Lenovo ThinkPad T14') and type <> 'Laptop';
update it_assets set type = 'Mobile' where name in ('iPhone 13', 'Samsung Galaxy S22') and type <> 'Mobile';
update it_assets set type = 'Display' where name = 'Dell 24" Monitor' and type <> 'Display';
update it_assets set type = 'Peripheral' where name = 'Logitech MX Keys' and type <> 'Peripheral';
