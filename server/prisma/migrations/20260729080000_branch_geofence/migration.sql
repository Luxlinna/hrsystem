-- Geofenced attendance check-in: employees must be within a configurable
-- radius (default 100m) of their branch's coordinates to clock in from the
-- self-service portal. `location` stays as the free-text display string;
-- these new columns are the actual geofence center + radius.

alter table branches add column if not exists latitude numeric(9,6);
alter table branches add column if not exists longitude numeric(9,6);
alter table branches add column if not exists geofence_radius_m int not null default 100;

update branches set latitude = 11.556400, longitude = 104.928200 where name = 'Phnom Penh HQ';
update branches set latitude = 13.367100, longitude = 103.844800 where name = 'Siem Reap Branch';
update branches set latitude = 13.095700, longitude = 103.202200 where name = 'Battambang Branch';
update branches set latitude = 10.610400, longitude = 103.528200 where name = 'Sihanoukville Branch';
update branches set latitude = 12.000000, longitude = 105.450000 where name = 'Kampong Cham Branch';
update branches set latitude = 10.610400, longitude = 104.181000 where name = 'Kampot Branch';
update branches set latitude = 10.479000, longitude = 104.318800 where name = 'Kep Branch';
update branches set latitude = 12.488100, longitude = 106.019000 where name = 'Kratie Branch';
update branches set latitude = 13.659100, longitude = 102.565800 where name = 'Poipet Branch';
update branches set latitude = 12.538800, longitude = 103.919900 where name = 'Pursat Branch';
update branches set latitude = 10.990800, longitude = 104.785200 where name = 'Takeo Branch';
update branches set latitude = 11.562500, longitude = 104.888900 where latitude is null;
