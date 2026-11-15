-- 企鹅汽车官网展示数据。REPLACE INTO 保证品牌切换后旧数据被覆盖，可重复执行。
REPLACE INTO `Vehicle`
(`id`,`slug`,`name`,`series`,`tagline`,`priceMin`,`priceMax`,`rangeKm`,`batteryKwh`,`zeroToHundred`,`seats`,`driveType`,`imageKey`,`badge`,`sortOrder`,`status`,`createdAt`,`updatedAt`) VALUES
('pm-vehicle-001','penguin-p1','企鹅 P1','PM-S','向前的每一步，都更从容',188800,258800,600,75,5.8,5,'RWD','/brand/vehicle-a.jpg','长续航',1,'PUBLISHED',NOW(3),NOW(3)),
('pm-vehicle-002','penguin-p2','企鹅 P2','PM-X','为全家，留更多空间',228800,298800,560,86,4.9,5,'AWD','/brand/vehicle-b.jpg','大空间',2,'PUBLISHED',NOW(3),NOW(3)),
('pm-vehicle-003','penguin-p3','企鹅 P3','PM-S','性能的另一种表达',268800,338800,650,100,3.8,4,'AWD','/brand/vehicle-c.jpg','高性能',3,'PUBLISHED',NOW(3),NOW(3)),
('pm-vehicle-004','penguin-p5','企鹅 P5','PM-X','把远方，装进日常',208800,278800,620,86,6.2,5,'RWD','/brand/vehicle-d.jpg','旅行版',4,'PUBLISHED',NOW(3),NOW(3)),
('pm-vehicle-005','penguin-concept','企鹅 概念款','PM-S','未发布车型（用于验证状态过滤）',150000,150000,400,60,8.0,5,'RWD','/brand/vehicle-a.jpg','未发布',9,'DRAFT',NOW(3),NOW(3));

REPLACE INTO `Store`
(`id`,`name`,`city`,`district`,`address`,`phone`,`businessHours`,`latitude`,`longitude`,`createdAt`) VALUES
('pm-store-001','企鹅汽车上海体验中心','上海','浦东新区','世纪大道 100 号','400-000-0001','10:00-18:00',31.230400,121.473700,NOW(3)),
('pm-store-002','企鹅汽车北京体验中心','北京','朝阳区','建国路 88 号','400-000-0002','10:00-19:00',39.904200,116.407400,NOW(3)),
('pm-store-003','企鹅汽车深圳体验中心','深圳','南山区','深南大道 200 号','400-000-0003','10:00-18:00',22.543100,114.057900,NOW(3));

REPLACE INTO `NewsArticle`
(`id`,`slug`,`title`,`summary`,`body`,`coverKey`,`tag`,`status`,`publishedAt`,`createdAt`) VALUES
('pm-news-001','penguin-launch','企鹅汽车全新纯电系列正式发布','四款纯电车型同步亮相，覆盖城市通勤与家庭远行。','企鹅汽车发布 P1、P2、P3、P5 四款纯电车型，以设计、续航与安全重新定义日常出行。','/brand/news-01.jpg','BRAND','PUBLISHED',NOW(3),NOW(3)),
('pm-news-002','penguin-technology','新一代补能技术与电池安全架构','一体化电池底盘与热管理系统，构成全系安全底座。','从电芯到整车，每一层都经过严苛验证；全新补能架构兼顾效率与耐久。','/brand/news-02.jpg','TECH','PUBLISHED',NOW(3),NOW(3)),
('pm-news-003','penguin-showroom','全国品牌体验中心陆续开放','上海、北京、深圳体验中心同步开放预约试驾。','欢迎前往体验中心，亲自感受企鹅汽车的驾驶质感。','/brand/news-03.jpg','EVENT','PUBLISHED',NOW(3),NOW(3));
