-- CREA TABLA GRUPOS
create table groups (
  id integer primary key,
  name text not null
);

--  CREA TABLA EQUIPOS
create table teams (
  id integer primary key,
  name text not null,
  code text not null,
  flag_code text not null,
  group_id integer references groups(id) on delete cascade
);

-- DATOS DE GRUPOS
insert into groups (id, name) values
(1, 'A'),
(2, 'B'),
(3, 'C'),
(4, 'D'),
(5, 'E'),
(6, 'F'),
(7, 'G'),
(8, 'H'),
(9, 'I'),
(10, 'J'),
(11, 'K'),
(12, 'L');

-- DATOS DE EQUIPOS
insert into teams (id, name, code, flag_code, group_id) values
(4, 'Czechia', 'CZE', 'cz', 1),
(2, 'Korea Republic', 'KOR', 'kr', 1),
(1, 'Mexico', 'MEX', 'mx', 1),
(3, 'South Africa', 'RSA', 'za', 1),

(8, 'Bosnia-Herzegovina', 'BIH', 'ba', 2),
(5, 'Canada', 'CAN', 'ca', 2),
(6, 'Qatar', 'QAT', 'qa', 2),
(7, 'Switzerland', 'SUI', 'ch', 2),

(9, 'Brazil', 'BRA', 'br', 3),
(10, 'Haiti', 'HAI', 'ht', 3),
(12, 'Morocco', 'MAR', 'ma', 3),
(11, 'Scotland', 'SCO', 'gb-sct', 3),

(14, 'Australia', 'AUS', 'au', 4),
(15, 'Paraguay', 'PAR', 'py', 4),
(16, 'Turkey', 'TUR', 'tr', 4),
(13, 'USA', 'USA', 'us', 4),

(17, 'Côte d''Ivoire', 'CIV', 'ci', 5),
(20, 'Curaçao', 'CUW', 'cw', 5),
(18, 'Ecuador', 'ECU', 'ec', 5),
(19, 'Germany', 'GER', 'de', 5),

(22, 'Japan', 'JPN', 'jp', 6),
(21, 'Netherlands', 'NED', 'nl', 6),
(24, 'Sweden', 'SWE', 'se', 6),
(23, 'Tunisia', 'TUN', 'tn', 6),

(25, 'Belgium', 'BEL', 'be', 7),
(26, 'Egypt', 'EGY', 'eg', 7),
(27, 'IR Iran', 'IRN', 'ir', 7),
(28, 'New Zealand', 'NZL', 'nz', 7),

(32, 'Cabo Verde', 'CPV', 'cv', 8),
(29, 'Saudi Arabia', 'KSA', 'sa', 8),
(30, 'Spain', 'ESP', 'es', 8),
(31, 'Uruguay', 'URU', 'uy', 8),

(33, 'France', 'FRA', 'fr', 9),
(36, 'Iraq', 'IRQ', 'iq', 9),
(35, 'Norway', 'NOR', 'no', 9),
(34, 'Senegal', 'SEN', 'sn', 9),

(38, 'Algeria', 'ALG', 'dz', 10),
(37, 'Argentina', 'ARG', 'ar', 10),
(39, 'Austria', 'AUT', 'at', 10),
(40, 'Jordan', 'JOR', 'jo', 10),

(43, 'Colombia', 'COL', 'co', 11),
(44, 'Congo DR', 'COD', 'cd', 11),
(41, 'Portugal', 'POR', 'pt', 11),
(42, 'Uzbekistan', 'UZB', 'uz', 11),

(48, 'Croatia', 'CRO', 'hr', 12),
(47, 'England', 'ENG', 'gb-eng', 12),
(45, 'Ghana', 'GHA', 'gh', 12),
(46, 'Panama', 'PAN', 'pa', 12);