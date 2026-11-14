-- 示意数据（工程演示，非官方）。固定 id + INSERT IGNORE 保证可重复执行。
INSERT IGNORE INTO `Vehicle`
(`id`,`slug`,`name`,`series`,`tagline`,`priceMin`,`priceMax`,`rangeKm`,`batteryKwh`,`zeroToHundred`,`seats`,`driveType`,`imageKey`,`badge`,`sortOrder`,`status`,`createdAt`,`updatedAt`) VALUES
('demo-vehicle-001','demo-sedan-01','示意车型 A','DEMO-S','工程示意文案，非官方宣传语',188800,258800,600,75,5.8,5,'RWD','placeholder/vehicle-a.svg','续航示意',1,'PUBLISHED',NOW(3),NOW(3)),
('demo-vehicle-002','demo-suv-02','示意车型 B','DEMO-X','工程示意文案，非官方宣传语',228800,298800,560,86,4.9,5,'AWD','placeholder/vehicle-b.svg','空间示意',2,'PUBLISHED',NOW(3),NOW(3)),
('demo-vehicle-003','demo-coupe-03','示意车型 C','DEMO-S','工程示意文案，非官方宣传语',268800,338800,650,100,3.8,4,'AWD','placeholder/vehicle-c.svg','性能示意',3,'PUBLISHED',NOW(3),NOW(3)),
('demo-vehicle-004','demo-wagon-04','示意车型 D','DEMO-X','工程示意文案，非官方宣传语',208800,278800,620,86,6.2,5,'RWD','placeholder/vehicle-d.svg','家用示意',4,'PUBLISHED',NOW(3),NOW(3)),
('demo-vehicle-005','demo-draft-05','示意车型（草稿）','DEMO-S','仅用于验证过滤逻辑',150000,150000,400,60,8.0,5,'RWD','placeholder/vehicle-a.svg','草稿',9,'DRAFT',NOW(3),NOW(3));

INSERT IGNORE INTO `Store`
(`id`,`name`,`city`,`district`,`address`,`phone`,`businessHours`,`latitude`,`longitude`,`createdAt`) VALUES
('demo-store-001','示意体验中心 A','上海','浦东新区','示意地址 1 号','0000-0000001','10:00-18:00',31.230400,121.473700,NOW(3)),
('demo-store-002','示意体验中心 B','北京','朝阳区','示意地址 2 号','0000-0000002','10:00-19:00',39.904200,116.407400,NOW(3)),
('demo-store-003','示意体验中心 C','深圳','南山区','示意地址 3 号','0000-0000003','10:00-18:00',22.543100,114.057900,NOW(3));

INSERT IGNORE INTO `NewsArticle`
(`id`,`slug`,`title`,`summary`,`body`,`coverKey`,`tag`,`status`,`publishedAt`,`createdAt`) VALUES
('demo-news-001','demo-notice-01','工程演示站点上线','本页为技术演示内容，非官方发布。','本工程用于验证全链路交付流程，所有车型、门店、资讯均为示意数据。','placeholder/news-01.svg','BRAND','PUBLISHED',NOW(3),NOW(3)),
('demo-news-002','demo-notice-02','参数说明（示意）','页面中的价格、续航等数值均为示意值。','请勿将演示参数用于任何真实决策。','placeholder/news-02.svg','TECH','PUBLISHED',NOW(3),NOW(3)),
('demo-news-003','demo-notice-03','占位素材说明','所有图片均为工程占位资源。','未使用任何官方标识、官方车型图或官方文案。','placeholder/news-03.svg','EVENT','PUBLISHED',NOW(3),NOW(3));
